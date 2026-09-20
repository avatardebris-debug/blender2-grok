import { create } from "zustand";
import { persist } from "zustand/middleware";
import { millBrief } from "./ai";
import { buildLocalSpec, estimateStats, mergeAiSpec, POLY_DEFAULT, runQc, starterCatalog } from "./spec";
import type { CatalogItem, Engine, Family, Job, KitTicket, MeshStats, Stage, Style } from "./types";

const STAGE_MS: Record<Exclude<Stage, "queued" | "done" | "failed">, number> = {
  brief: 280,
  blockout: 520,
  mesh: 740,
  material: 480,
  qc: 560,
  export: 420,
};

type Intake = {
  prompt: string;
  family: Family;
  style: Style;
  engine: Engine;
  polyTarget: number;
};

type FactoryState = {
  intake: Intake;
  useGrok: boolean;
  grokAvailable: boolean;
  jobs: Job[];
  catalog: CatalogItem[];
  activeId: string | null;
  busy: boolean;
  setIntake: (patch: Partial<Intake>) => void;
  setUseGrok: (v: boolean) => void;
  setGrokAvailable: (v: boolean) => void;
  setActive: (id: string | null) => void;
  queueJob: (override?: Partial<Intake>) => string;
  queueKit: (kit: KitTicket) => void;
  millNext: () => void;
  reportStats: (jobId: string, stats: MeshStats) => void;
  inspectCatalog: (item: CatalogItem) => void;
  removeCatalog: (id: string) => void;
};

function uid() {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const useFactory = create<FactoryState>()(
  persist(
    (set, get) => ({
      intake: {
        prompt: "Armored supply crate with latches and corner feet",
        family: "crate",
        style: "hard-surface",
        engine: "godot",
        polyTarget: 1800,
      },
      useGrok: true,
      grokAvailable: false,
      jobs: [],
      catalog: starterCatalog(),
      activeId: null,
      busy: false,

      setIntake: (patch) =>
        set((s) => {
          const intake = { ...s.intake, ...patch };
          if (patch.family && !patch.polyTarget) intake.polyTarget = POLY_DEFAULT[patch.family];
          return { intake };
        }),
      setUseGrok: (v) => set({ useGrok: v }),
      setGrokAvailable: (v) => set({ grokAvailable: v }),
      setActive: (id) => set({ activeId: id }),

      queueJob: (override) => {
        const intake = { ...get().intake, ...override };
        const job: Job = {
          id: uid(),
          prompt: intake.prompt.trim() || `Studio ${intake.family}`,
          family: intake.family,
          style: intake.style,
          engine: intake.engine,
          polyTarget: intake.polyTarget,
          createdAt: Date.now(),
          stage: "queued",
          log: [{ t: Date.now(), stage: "queued", message: "Ticket stamped" }],
          spec: null,
          stats: null,
          qc: [],
          source: "local",
        };
        set((s) => ({ jobs: [job, ...s.jobs], activeId: s.activeId ?? job.id }));
        queueMicrotask(() => get().millNext());
        return job.id;
      },

      queueKit: (kit) => {
        const engine = get().intake.engine;
        for (const j of kit.jobs) {
          get().queueJob({
            prompt: j.prompt,
            family: j.family,
            style: j.style,
            engine,
            polyTarget: j.polyTarget ?? POLY_DEFAULT[j.family],
          });
        }
      },

      millNext: () => {
        const { busy, jobs } = get();
        if (busy) return;
        const next = [...jobs].reverse().find((j) => j.stage === "queued");
        if (!next) return;
        void runMill(next.id, get, set);
      },

      reportStats: (jobId, stats) => {
        set((s) => {
          const current = s.jobs.find((j) => j.id === jobId);
          if (
            current?.stats &&
            current.stats.tris === stats.tris &&
            current.stats.verts === stats.verts &&
            current.stats.materials === stats.materials
          ) {
            return s;
          }
          return {
            jobs: s.jobs.map((j) => {
              if (j.id !== jobId || !j.spec) return j;
              return { ...j, stats, qc: runQc(j.spec, stats) };
            }),
            catalog: s.catalog.map((c) => (c.id === jobId ? { ...c, stats } : c)),
          };
        });
      },

      inspectCatalog: (item) => {
        const existing = get().jobs.find((j) => j.id === item.id);
        if (existing) {
          set({ activeId: item.id });
          return;
        }
        const job: Job = {
          id: item.id,
          prompt: item.prompt,
          family: item.spec.family,
          style: item.spec.style,
          engine: item.spec.engine,
          polyTarget: item.spec.polyTarget,
          createdAt: item.createdAt,
          stage: "done",
          log: [{ t: item.createdAt, stage: "done", message: "Loaded from catalog" }],
          spec: item.spec,
          stats: item.stats,
          qc: runQc(item.spec, item.stats),
          source: item.source,
        };
        set((s) => ({ jobs: [job, ...s.jobs.filter((j) => j.id !== item.id)], activeId: item.id }));
      },

      removeCatalog: (id) =>
        set((s) => ({
          catalog: s.catalog.filter((c) => c.id !== id),
          jobs: s.jobs.filter((j) => j.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),
    }),
    {
      name: "crucible-v1",
      skipHydration: true,
      partialize: (s) => ({
        catalog: s.catalog,
        useGrok: s.useGrok,
        intake: s.intake,
      }),
    },
  ),
);

async function runMill(
  id: string,
  get: () => FactoryState,
  set: (
    p: Partial<FactoryState> | ((s: FactoryState) => Partial<FactoryState>),
  ) => void,
) {
  set({ busy: true, activeId: id });
  const job = get().jobs.find((j) => j.id === id);
  if (!job) {
    set({ busy: false });
    return;
  }

  const advance = (stage: Stage, message: string) => {
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id
          ? { ...j, stage, log: [{ t: Date.now(), stage, message }, ...j.log].slice(0, 24) }
          : j,
      ),
    }));
  };

  try {
    advance("brief", "Locking spec");
    await sleep(STAGE_MS.brief);

    const local = buildLocalSpec({
      prompt: job.prompt,
      family: job.family,
      style: job.style,
      engine: job.engine,
      polyTarget: job.polyTarget,
    });

    let spec = local;
    let source: Job["source"] = "local";
    if (get().useGrok && get().grokAvailable) {
      try {
        const res = await millBrief({
          data: {
            prompt: job.prompt,
            family: job.family,
            style: job.style,
            engine: job.engine,
            polyTarget: job.polyTarget,
          },
        });
        if (res.ok) {
          spec = mergeAiSpec(local, res.spec);
          source = "grok";
        }
      } catch {
        /* local spec stands */
      }
    }

    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, spec, source, qc: runQc(spec, j.stats) } : j)),
    }));
    advance("brief", `${spec.objectName} · ${spec.scaleMeters.map((n) => n.toFixed(2)).join("×")} m`);

    for (const stage of ["blockout", "mesh", "material", "qc", "export"] as const) {
      await sleep(STAGE_MS[stage]);
      const messages: Record<typeof stage, string> = {
        blockout: `Hull ${spec.scaleMeters.map((n) => n.toFixed(2)).join(" × ")} m`,
        mesh: "Bevels, hardware, boolean details",
        material: spec.materials.map((m) => m.name).join(" / "),
        qc: "Origin · naming · poly · materials",
        export: "Packet ready · bpy + spec JSON",
      };
      advance(stage, messages[stage]);
    }

    const current = get().jobs.find((j) => j.id === id);
    const stats =
      current?.stats && current.stats.tris > 0
        ? current.stats
        : estimateStats(spec);
    const qc = spec ? runQc(spec, stats) : [];
    const qcPass = qc.length > 0 && qc.every((c) => c.pass);

    set((s) => {
      const j = s.jobs.find((x) => x.id === id);
      if (!j?.spec) return s;
      const item: CatalogItem = {
        id: j.id,
        spec: j.spec,
        stats,
        qcPass,
        createdAt: Date.now(),
        prompt: j.prompt,
        source: j.source,
      };
      return {
        jobs: s.jobs.map((x) =>
          x.id === id
            ? {
                ...x,
                stage: "done",
                stats,
                qc,
                log: [{ t: Date.now(), stage: "done", message: qcPass ? "Passed QC" : "Exported with flags" }, ...x.log],
              }
            : x,
        ),
        catalog: [item, ...s.catalog.filter((c) => c.id !== id)].slice(0, 48),
        busy: false,
      };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mill fault";
    set((s) => ({
      busy: false,
      jobs: s.jobs.map((j) =>
        j.id === id
          ? { ...j, stage: "failed", log: [{ t: Date.now(), stage: "failed", message }, ...j.log] }
          : j,
      ),
    }));
  }

  queueMicrotask(() => get().millNext());
}
