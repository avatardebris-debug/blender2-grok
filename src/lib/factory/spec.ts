import type {
  AssetSpec,
  CatalogItem,
  Engine,
  Family,
  Job,
  KitTicket,
  MaterialSlot,
  MeshStats,
  QcCheck,
  Style,
} from "./types";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FAMILY_CODE: Record<Family, string> = {
  crate: "Crate",
  barrel: "Drum",
  weapon: "Blade",
  module: "Module",
  furniture: "Seat",
  environment: "Panel",
  organic: "Form",
  machine: "Valve",
};

const STYLE_CODE: Record<Style, string> = {
  "hard-surface": "Hard",
  stylized: "Styl",
  medieval: "Med",
  industrial: "Ind",
  "low-poly": "Low",
};

export const POLY_DEFAULT: Record<Family, number> = {
  crate: 1800,
  barrel: 1600,
  weapon: 2200,
  module: 2800,
  furniture: 2000,
  environment: 2400,
  organic: 3200,
  machine: 2600,
};

const PALETTES: Record<Style, MaterialSlot[][]> = {
  "hard-surface": [
    [
      { name: "Paint_Steel", hex: "#7a8088", metal: 0.62, rough: 0.38 },
      { name: "Trim_Dark", hex: "#2c2f34", metal: 0.4, rough: 0.5 },
    ],
    [
      { name: "Alloy_Bone", hex: "#c5c1b6", metal: 0.35, rough: 0.42 },
      { name: "Inset_Carbon", hex: "#1a1c1f", metal: 0.1, rough: 0.7 },
    ],
  ],
  stylized: [
    [
      { name: "Clay_Sage", hex: "#6b8f71", metal: 0.05, rough: 0.72 },
      { name: "Wash_Bone", hex: "#e4d7b8", metal: 0.0, rough: 0.65 },
    ],
    [
      { name: "Clay_Slate", hex: "#5d6f84", metal: 0.04, rough: 0.7 },
      { name: "Accent_Clay", hex: "#c48a6a", metal: 0.02, rough: 0.6 },
    ],
  ],
  medieval: [
    [
      { name: "Wood_Oak", hex: "#6b4a32", metal: 0.0, rough: 0.78 },
      { name: "Iron_Worn", hex: "#4a4e46", metal: 0.55, rough: 0.48 },
    ],
    [
      { name: "Leather_Dark", hex: "#3d2a22", metal: 0.0, rough: 0.82 },
      { name: "Bronze_Old", hex: "#8a6a3e", metal: 0.7, rough: 0.4 },
    ],
  ],
  industrial: [
    [
      { name: "Shop_Grey", hex: "#5c5854", metal: 0.25, rough: 0.55 },
      { name: "Hazard_Mark", hex: "#b9a27a", metal: 0.08, rough: 0.5 },
    ],
    [
      { name: "Cast_Iron", hex: "#3a3c40", metal: 0.5, rough: 0.45 },
      { name: "Pipe_Green", hex: "#4d6a58", metal: 0.2, rough: 0.52 },
    ],
  ],
  "low-poly": [
    [
      { name: "Flat_Fog", hex: "#8aa0b0", metal: 0.0, rough: 0.9 },
      { name: "Flat_Bone", hex: "#d9d2c5", metal: 0.0, rough: 0.88 },
    ],
    [
      { name: "Flat_Moss", hex: "#7a8a6e", metal: 0.0, rough: 0.92 },
      { name: "Flat_Stone", hex: "#9a948a", metal: 0.0, rough: 0.9 },
    ],
  ],
};

const SIZE: Record<Family, [number, number, number]> = {
  crate: [1.1, 0.85, 0.9],
  barrel: [0.7, 1.15, 0.7],
  weapon: [0.18, 1.15, 0.08],
  module: [1.4, 0.7, 0.9],
  furniture: [0.55, 0.95, 0.55],
  environment: [2.0, 2.4, 0.18],
  organic: [1.1, 0.7, 0.95],
  machine: [0.85, 0.9, 0.85],
};

export const KITS: KitTicket[] = [
  {
    id: "scifi-corridor",
    name: "Sci-fi corridor",
    blurb: "Wall panel, armored crate, fuel drum, ceiling valve.",
    jobs: [
      {
        prompt: "Corridor wall panel with conduit and a warning stripe",
        family: "environment",
        style: "hard-surface",
      },
      {
        prompt: "Armored supply crate with latches and corner feet",
        family: "crate",
        style: "hard-surface",
      },
      {
        prompt: "Cylindrical fuel drum with steel bands",
        family: "barrel",
        style: "industrial",
      },
      {
        prompt: "Ceiling pipe valve with a handwheel",
        family: "machine",
        style: "industrial",
      },
    ],
  },
  {
    id: "tavern",
    name: "Medieval tavern",
    blurb: "Cask, oak chair, wall panel, hanging blade.",
    jobs: [
      {
        prompt: "Iron-banded oak cask for a tavern cellar",
        family: "barrel",
        style: "medieval",
      },
      {
        prompt: "Simple oak chair with four legs and a slat back",
        family: "furniture",
        style: "medieval",
      },
      {
        prompt: "Timber wall panel with iron studs",
        family: "environment",
        style: "medieval",
      },
      {
        prompt: "Short arming sword on a stand",
        family: "weapon",
        style: "medieval",
      },
    ],
  },
  {
    id: "yard",
    name: "Industrial yard",
    blurb: "Shipping crate, valve, rock, pump module.",
    jobs: [
      {
        prompt: "Weathered shipping crate with strap bands",
        family: "crate",
        style: "industrial",
      },
      {
        prompt: "Yard hydrant valve on a short riser",
        family: "machine",
        style: "industrial",
      },
      {
        prompt: "Broken concrete rubble pile",
        family: "organic",
        style: "industrial",
      },
      {
        prompt: "Bolted pump housing with side tanks",
        family: "module",
        style: "hard-surface",
      },
    ],
  },
];

export function buildLocalSpec(input: {
  prompt: string;
  family: Family;
  style: Style;
  engine: Engine;
  polyTarget: number;
  seed?: number;
}): AssetSpec {
  const seed = input.seed ?? hashString(`${input.prompt}|${input.family}|${input.style}`);
  const rng = mulberry32(seed);
  const n = (seed % 87) + 12;
  const objectName = `SM_${STYLE_CODE[input.style]}${FAMILY_CODE[input.family]}_${String(n).padStart(2, "0")}`;
  const palettes = PALETTES[input.style];
  const materials = palettes[seed % palettes.length]!.map((m) => ({ ...m }));
  const base = SIZE[input.family];
  const jitter = 0.08 + rng() * 0.12;
  const scaleMeters: [number, number, number] = [
    round3(base[0] * (0.92 + rng() * jitter)),
    round3(base[1] * (0.92 + rng() * jitter)),
    round3(base[2] * (0.92 + rng() * jitter)),
  ];
  const displayName = titleFromPrompt(input.prompt, input.family);

  return {
    objectName,
    displayName,
    family: input.family,
    style: input.style,
    engine: input.engine,
    seed,
    scaleMeters,
    polyTarget: input.polyTarget,
    materials,
    notes: noteFor(input.family, input.style, input.engine),
    qc: [
      "Origin at bottom center",
      "1 blender unit = 1 meter",
      "Transforms applied before export",
      `${input.engine} packet · ${formatFor(input.engine)}`,
      "Material count ≤ 3",
    ],
  };
}

export function mergeAiSpec(
  local: AssetSpec,
  ai: Partial<AssetSpec> & { objectName?: string },
): AssetSpec {
  const materials =
    Array.isArray(ai.materials) && ai.materials.length
      ? ai.materials.slice(0, 3).map(sanitizeMat)
      : local.materials;
  const scale =
    Array.isArray(ai.scaleMeters) && ai.scaleMeters.length === 3
      ? (ai.scaleMeters.map((n) => clamp(Number(n) || 1, 0.05, 8)) as [number, number, number])
      : local.scaleMeters;
  const objectName =
    typeof ai.objectName === "string" && /^[A-Za-z][A-Za-z0-9_]{2,47}$/.test(ai.objectName)
      ? ai.objectName
      : local.objectName;

  return {
    ...local,
    objectName,
    displayName:
      typeof ai.displayName === "string" && ai.displayName.trim()
        ? ai.displayName.trim().slice(0, 64)
        : local.displayName,
    scaleMeters: scale,
    polyTarget:
      typeof ai.polyTarget === "number" && ai.polyTarget > 200
        ? Math.round(clamp(ai.polyTarget, 400, 20000))
        : local.polyTarget,
    materials,
    notes:
      typeof ai.notes === "string" && ai.notes.trim()
        ? ai.notes.trim().slice(0, 280)
        : local.notes,
    qc: Array.isArray(ai.qc) && ai.qc.length ? ai.qc.map(String).slice(0, 8) : local.qc,
  };
}

export function runQc(spec: AssetSpec, stats: MeshStats | null): QcCheck[] {
  const tris = stats?.tris ?? 0;
  const budget = spec.polyTarget;
  const over = tris > budget * 1.15;
  return [
    {
      id: "name",
      label: "Naming",
      pass: spec.objectName.startsWith("SM_"),
      detail: spec.objectName,
    },
    {
      id: "origin",
      label: "Origin",
      pass: true,
      detail: "Bottom center, applied",
    },
    {
      id: "scale",
      label: "Scale",
      pass: true,
      detail: `${spec.scaleMeters[0].toFixed(2)} × ${spec.scaleMeters[1].toFixed(2)} × ${spec.scaleMeters[2].toFixed(2)} m`,
    },
    {
      id: "poly",
      label: "Poly budget",
      pass: !over && tris > 0,
      detail: tris
        ? `${tris.toLocaleString()} tris / ${budget.toLocaleString()} target`
        : `Pending · ${budget.toLocaleString()} target`,
    },
    {
      id: "mats",
      label: "Materials",
      pass: spec.materials.length > 0 && spec.materials.length <= 3,
      detail: `${spec.materials.length} slots`,
    },
    {
      id: "engine",
      label: "Engine packet",
      pass: true,
      detail: formatFor(spec.engine),
    },
  ];
}

export function stageIndex(stage: Job["stage"]): number {
  const order = ["queued", "brief", "blockout", "mesh", "material", "qc", "export", "done"];
  const i = order.indexOf(stage);
  return i < 0 ? 0 : i;
}

export function starterCatalog(): CatalogItem[] {
  const seeds = [
    {
      prompt: "Armored supply crate with latches",
      family: "crate" as const,
      style: "hard-surface" as const,
    },
    {
      prompt: "Iron-banded oak cask",
      family: "barrel" as const,
      style: "medieval" as const,
    },
    {
      prompt: "Bolted pump housing",
      family: "module" as const,
      style: "hard-surface" as const,
    },
  ];
  return seeds.map((s, i) => {
    const spec = buildLocalSpec({
      ...s,
      engine: "godot",
      polyTarget: POLY_DEFAULT[s.family],
    });
    const stats = estimateStats(spec);
    return {
      id: `starter-${i}`,
      spec,
      stats,
      qcPass: runQc(spec, stats).every((c) => c.pass),
      createdAt: Date.now() - (3 - i) * 3600_000,
      prompt: s.prompt,
      source: "local" as const,
    };
  });
}

export function estimateStats(spec: AssetSpec): MeshStats {
  const vol = spec.scaleMeters[0] * spec.scaleMeters[1] * spec.scaleMeters[2];
  const familyBias: Record<Family, number> = {
    crate: 980,
    barrel: 1240,
    weapon: 860,
    module: 1680,
    furniture: 1100,
    environment: 720,
    organic: 2100,
    machine: 1540,
  };
  const tris = Math.round(familyBias[spec.family] * (0.75 + (spec.seed % 40) / 80) * (0.85 + vol * 0.08));
  return {
    tris: Math.min(tris, spec.polyTarget),
    verts: Math.round(tris * 0.62),
    materials: spec.materials.length,
  };
}

function sanitizeMat(m: MaterialSlot): MaterialSlot {
  const hex = typeof m.hex === "string" && /^#?[0-9a-fA-F]{6}$/.test(m.hex)
    ? m.hex.startsWith("#")
      ? m.hex
      : `#${m.hex}`
    : "#7a8088";
  return {
    name: (m.name || "Mat").replace(/[^A-Za-z0-9_]/g, "_").slice(0, 32),
    hex: hex.toLowerCase(),
    metal: clamp(Number(m.metal) || 0, 0, 1),
    rough: clamp(Number(m.rough) || 0.5, 0, 1),
  };
}

function titleFromPrompt(prompt: string, family: Family): string {
  const clean = prompt.trim().replace(/[.\s]+$/, "");
  if (clean.length > 8 && clean.length < 48) {
    return clean.replace(/^\w/, (c) => c.toUpperCase());
  }
  return `Studio ${FAMILY_CODE[family]}`;
}

function noteFor(family: Family, style: Style, engine: Engine): string {
  return `${style} ${family} milled for ${engine}. Keep origin at the contact patch; do not freeze scale until QC.`;
}

function formatFor(engine: Engine): string {
  if (engine === "unreal") return "FBX, cm, triangulate";
  if (engine === "unity") return "FBX + GLB, meters";
  if (engine === "web") return "GLB, Draco, WebP";
  return "GLB, meters, +Y up";
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
