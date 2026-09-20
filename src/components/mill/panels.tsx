import { Download, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { buildBpy, downloadText } from "@/lib/factory/bpy";
import { kitsFor, POLY_DEFAULT } from "@/lib/factory/spec";
import { useFactory } from "@/lib/factory/store";
import {
  BINDS,
  ENGINES,
  FAMILIES,
  LINES,
  RIGS,
  STAGES,
  STYLES,
  isWardrobe,
  type Bind,
  type Family,
  type Job,
  type Rig,
  type Stage,
} from "@/lib/factory/types";
import { cn } from "@/lib/utils";

export function IntakePanel() {
  const intake = useFactory((s) => s.intake);
  const setIntake = useFactory((s) => s.setIntake);
  const queueJob = useFactory((s) => s.queueJob);
  const queueKit = useFactory((s) => s.queueKit);
  const busy = useFactory((s) => s.busy);
  const useGrok = useFactory((s) => s.useGrok);
  const setUseGrok = useFactory((s) => s.setUseGrok);
  const grokAvailable = useFactory((s) => s.grokAvailable);

  const line = isWardrobe(intake.family) ? "wardrobe" : "prop";
  const families = FAMILIES.filter((f) => f.line === line);
  const kits = kitsFor(line);

  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Ticket</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-fg">Brief the mill</h2>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-xs font-medium text-muted">Line</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {LINES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                if (l.id === line) return;
                const next = FAMILIES.find((f) => f.line === l.id)!.id;
                setIntake({ family: next, polyTarget: POLY_DEFAULT[next] });
              }}
              className={cn(
                "rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-150",
                line === l.id ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-surface",
              )}
            >
              <span className="block font-medium leading-tight">{l.label}</span>
              <span className={cn("block text-[11px] leading-tight", line === l.id ? "text-primary-fg/70" : "text-muted")}>
                {l.hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted">What to mill</span>
        <Textarea
          value={intake.prompt}
          onChange={(e) => setIntake({ prompt: e.target.value })}
          rows={3}
          placeholder={
            line === "wardrobe"
              ? "Wool travel cloak with a brass clasp"
              : "Armored crate, latches, corner feet"
          }
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-xs font-medium text-muted">Family</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {families.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setIntake({ family: f.id as Family, polyTarget: POLY_DEFAULT[f.id] })}
              className={cn(
                "rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-150",
                intake.family === f.id ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-surface",
              )}
            >
              <span className="block font-medium leading-tight">{f.label}</span>
              <span className={cn("block text-[11px] leading-tight", intake.family === f.id ? "text-primary-fg/70" : "text-muted")}>
                {f.hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted">Style</span>
        <select
          value={intake.style}
          onChange={(e) => setIntake({ style: e.target.value as typeof intake.style })}
          className="h-11 rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
        >
          {STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-muted">Engine packet</span>
        <select
          value={intake.engine}
          onChange={(e) => setIntake({ engine: e.target.value as typeof intake.engine })}
          className="h-11 rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
        >
          {ENGINES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} · {s.format}
            </option>
          ))}
        </select>
      </label>

      {line === "wardrobe" && (
        <>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted">Animator rig</span>
            <select
              value={intake.rig}
              onChange={(e) => setIntake({ rig: e.target.value as Rig })}
              className="h-11 rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
            >
              {RIGS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} · {s.hint}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-xs font-medium text-muted">Bind</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {BINDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setIntake({ bind: b.id as Bind })}
                  className={cn(
                    "rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-150",
                    intake.bind === b.id ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-surface",
                  )}
                >
                  <span className="block font-medium leading-tight">{b.label}</span>
                  <span className={cn("block text-[11px] leading-tight", intake.bind === b.id ? "text-primary-fg/70" : "text-muted")}>
                    {b.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <label className="grid gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span>Poly target</span>
          <span className="font-mono tabular-nums text-fg">{intake.polyTarget.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={400}
          max={8000}
          step={100}
          value={intake.polyTarget}
          onChange={(e) => setIntake({ polyTarget: Number(e.target.value) })}
          className="w-full accent-fg"
        />
      </label>

      <label className="flex items-center justify-between gap-3 rounded-md bg-raised px-3 py-2.5">
        <span className="text-sm">
          Grok brief mill
          <span className="mt-0.5 block text-[11px] text-muted">
            {grokAvailable ? "Locks name, scale, materials" : "Unavailable here — local mill still runs"}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={useGrok && grokAvailable}
          disabled={!grokAvailable}
          onClick={() => setUseGrok(!useGrok)}
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
            useGrok && grokAvailable ? "bg-primary" : "bg-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-bg transition-transform duration-150",
              useGrok && grokAvailable ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </label>

      <Button
        size="lg"
        className="w-full font-display text-lg tracking-wide"
        onClick={() => queueJob()}
        disabled={!intake.prompt.trim()}
      >
        <Play className="size-4" />
        {busy ? "Queued behind live job" : grokAvailable && useGrok ? "Mill with Grok" : "Mill locally"}
      </Button>

      <div className="grid gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Kits</p>
        {kits.map((kit) => (
          <button
            key={kit.id}
            type="button"
            onClick={() => queueKit(kit)}
            className="rounded-md bg-raised px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface"
          >
            <span className="block text-sm font-medium">{kit.name}</span>
            <span className="block text-[12px] text-muted">{kit.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PipelineStrip({ job }: { job: Job | null }) {
  const stations = STAGES.filter((s) => !["queued", "failed"].includes(s.id));
  const current = job?.stage ?? "queued";

  return (
    <ol className="flex gap-1 overflow-x-auto px-3 py-2">
      {stations.map((s) => {
        const state = stationState(s.id, current);
        return (
          <li
            key={s.id}
            className={cn(
              "flex min-w-[4.6rem] flex-1 flex-col gap-1 rounded-sm px-2 py-1.5",
              state === "hot" && "bg-raised",
            )}
          >
            <span
              className={cn(
                "h-0.5 rounded-full",
                state === "hot" && "bg-fg",
                state === "done" && "bg-pass",
                state === "idle" && "bg-border",
              )}
            />
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.14em]",
                state === "hot" ? "text-fg" : "text-muted",
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function stationState(id: Stage, current: Stage): "idle" | "hot" | "done" {
  const order = ["queued", "brief", "blockout", "mesh", "material", "qc", "export", "done"];
  const a = order.indexOf(id);
  const b = order.indexOf(current);
  if (current === "failed") return "idle";
  if (id === current) return "hot";
  if (a < b) return "done";
  return "idle";
}

export function Dock({ job }: { job: Job | null }) {
  const catalog = useFactory((s) => s.catalog);
  const inspectCatalog = useFactory((s) => s.inspectCatalog);
  const spec = job?.spec ?? null;
  const wardrobe = spec ? isWardrobe(spec.family) : false;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Packet</p>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {spec?.objectName ?? "No live job"}
          </h2>
        </div>
        {job?.source === "grok" && <Badge tone="hot">Grok</Badge>}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {spec ? (
          <>
            <p className="text-sm text-muted">{spec.displayName}</p>
            <p className="text-sm">{spec.notes}</p>
            {wardrobe && (
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                {spec.bind === "cache"
                  ? "Marvelous cache · Alembic · not skinned"
                  : `Fitted · T-pose · ${spec.rig ?? "mixamo"} · SK_`}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Tris" value={job?.stats?.tris ? job.stats.tris.toLocaleString() : "—"} />
              <Stat label="Verts" value={job?.stats?.verts ? job.stats.verts.toLocaleString() : "—"} />
              <Stat label="Mats" value={String(spec.materials.length)} />
            </div>

            <div className="grid gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">QC gate</p>
              {(job?.qc ?? []).map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>{c.label}</span>
                  <span className={cn("font-mono text-[11px]", c.pass ? "text-pass" : "text-fail")}>
                    {c.pass ? "PASS" : "FLAG"} · {c.detail}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Materials</p>
              {spec.materials.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-sm">
                  <span className="size-3 rounded-sm shadow-[var(--shadow-border)]" style={{ background: m.hex }} />
                  <span className="font-mono text-xs">{m.name}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted">
                    m{m.metal.toFixed(2)} r{m.rough.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  downloadText(`${spec.objectName}.py`, buildBpy(spec), "text/x-python");
                  toast("Blender Python downloaded");
                }}
              >
                <Download className="size-4" />
                Download .py
              </Button>
              <Button
                variant="quiet"
                onClick={async () => {
                  await navigator.clipboard.writeText(buildBpy(spec));
                  toast("Script copied");
                }}
              >
                Copy bpy
              </Button>
              <Button
                variant="quiet"
                onClick={async () => {
                  await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
                  toast("Spec JSON copied");
                }}
              >
                Copy spec
              </Button>
            </div>

            {job?.log[0] && (
              <p className="font-mono text-[11px] text-muted">
                {job.stage} · {job.log[0].message}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            Stamp a ticket on the left. Props sit on the floor. Wardrobe is fitted to the 180cm jig.
          </p>
        )}

        <div className="grid gap-2 pt-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Catalog</p>
          {catalog.length === 0 && <p className="text-sm text-muted">Empty floor.</p>}
          {catalog.slice(0, 12).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => inspectCatalog(item)}
              className="rounded-md bg-raised px-3 py-2 text-left transition-colors duration-150 hover:bg-surface"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{item.spec.objectName}</span>
                <Badge tone={item.qcPass ? "pass" : "warn"}>{item.qcPass ? "pass" : "flag"}</Badge>
              </span>
              <span className="mt-0.5 block text-[12px] text-muted">{item.spec.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-raised px-2.5 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="font-mono text-sm tabular-nums">{value}</p>
    </div>
  );
}

export function QueueRail() {
  const jobs = useFactory((s) => s.jobs);
  const activeId = useFactory((s) => s.activeId);
  const setActive = useFactory((s) => s.setActive);
  if (jobs.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
      {jobs.slice(0, 16).map((j) => (
        <button
          key={j.id}
          type="button"
          onClick={() => setActive(j.id)}
          className={cn(
            "shrink-0 rounded-sm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide",
            j.id === activeId ? "bg-primary text-primary-fg" : "bg-raised text-muted hover:text-fg",
          )}
        >
          {j.spec?.objectName ?? j.family} · {j.stage}
        </button>
      ))}
    </div>
  );
}
