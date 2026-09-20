export const LINES = [
  { id: "prop", label: "Props", hint: "Floor objects" },
  { id: "wardrobe", label: "Wardrobe", hint: "Fitted to a body" },
] as const;

export type Line = (typeof LINES)[number]["id"];

export const FAMILIES = [
  { id: "crate", label: "Crate", hint: "Boxes, lids, straps", line: "prop" },
  { id: "barrel", label: "Barrel", hint: "Drums, tanks, casks", line: "prop" },
  { id: "weapon", label: "Weapon", hint: "Blades, tools, guns", line: "prop" },
  { id: "module", label: "Module", hint: "Sci-fi hard-surface", line: "prop" },
  { id: "furniture", label: "Furniture", hint: "Chairs, tables, stools", line: "prop" },
  { id: "environment", label: "Environment", hint: "Walls, floors, kits", line: "prop" },
  { id: "organic", label: "Organic", hint: "Rocks, trees, debris", line: "prop" },
  { id: "machine", label: "Machine", hint: "Valves, pumps, gears", line: "prop" },
  { id: "shirt", label: "Shirt", hint: "Tunics, jackets, vests", line: "wardrobe" },
  { id: "pants", label: "Pants", hint: "Trousers, hose, greaves", line: "wardrobe" },
  { id: "cloak", label: "Cloak", hint: "Capes, hoods, robes", line: "wardrobe" },
  { id: "armor", label: "Armor", hint: "Chest, helm, pauldrons", line: "wardrobe" },
  { id: "boots", label: "Boots", hint: "Shoes, sabatons, pair", line: "wardrobe" },
] as const;

export type Family = (typeof FAMILIES)[number]["id"];

export function familyMeta(id: Family) {
  return FAMILIES.find((f) => f.id === id)!;
}

export function isWardrobe(family: Family) {
  return familyMeta(family).line === "wardrobe";
}

export function namePrefix(family: Family) {
  return isWardrobe(family) ? "SK_" : "SM_";
}

export const RIGS = [
  { id: "mixamo", label: "Mixamo", hint: "mixamorig:* · T-pose" },
  { id: "ue5", label: "UE5 mannequin", hint: "pelvis / spine_01" },
  { id: "metahuman", label: "MetaHuman", hint: "EveryWear · Chaos" },
] as const;

export type Rig = (typeof RIGS)[number]["id"];

export const BINDS = [
  { id: "skinned", label: "Skinned", hint: "Game · SK_ weights" },
  { id: "cache", label: "Cache", hint: "Alembic · cinematic" },
] as const;

export type Bind = (typeof BINDS)[number]["id"];

export const STYLES = [
  { id: "hard-surface", label: "Hard surface" },
  { id: "stylized", label: "Stylized" },
  { id: "medieval", label: "Medieval" },
  { id: "industrial", label: "Industrial" },
  { id: "low-poly", label: "Low poly" },
] as const;

export type Style = (typeof STYLES)[number]["id"];

export const ENGINES = [
  { id: "godot", label: "Godot", format: "GLB", note: "meters, +Y up" },
  { id: "unity", label: "Unity", format: "FBX / GLB", note: "meters" },
  { id: "unreal", label: "Unreal", format: "FBX", note: "cm, SK_/SM_" },
  { id: "web", label: "Web / glTF", format: "GLB", note: "meters, Draco" },
] as const;

export type Engine = (typeof ENGINES)[number]["id"];

export const STAGES = [
  { id: "queued", label: "Queue" },
  { id: "brief", label: "Brief" },
  { id: "blockout", label: "Blockout" },
  { id: "mesh", label: "Mesh" },
  { id: "material", label: "Material" },
  { id: "qc", label: "QC" },
  { id: "export", label: "Export" },
  { id: "done", label: "Done" },
  { id: "failed", label: "Failed" },
] as const;

export type Stage = (typeof STAGES)[number]["id"];

export const ACTIVE_STAGES: Stage[] = [
  "brief",
  "blockout",
  "mesh",
  "material",
  "qc",
  "export",
];

/** 180cm bind-pose jig. Y-up landmarks in meters. */
export const MANNEQUIN = {
  height: 1.8,
  headY: 1.68,
  shoulderY: 1.42,
  chestY: 1.22,
  hipY: 0.94,
  kneeY: 0.48,
  ankleY: 0.1,
  shoulderX: 0.2,
  hipX: 0.09,
} as const;

export type MaterialSlot = {
  name: string;
  hex: string;
  metal: number;
  rough: number;
};

export type AssetSpec = {
  objectName: string;
  displayName: string;
  family: Family;
  style: Style;
  engine: Engine;
  seed: number;
  scaleMeters: [number, number, number];
  polyTarget: number;
  materials: MaterialSlot[];
  notes: string;
  qc: string[];
  rig?: Rig;
  bind?: Bind;
};

export type MeshStats = {
  tris: number;
  verts: number;
  materials: number;
};

export type QcCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

export type LogLine = {
  t: number;
  stage: Stage;
  message: string;
};

export type Job = {
  id: string;
  prompt: string;
  family: Family;
  style: Style;
  engine: Engine;
  polyTarget: number;
  createdAt: number;
  stage: Stage;
  log: LogLine[];
  spec: AssetSpec | null;
  stats: MeshStats | null;
  qc: QcCheck[];
  source: "local" | "grok";
  rig?: Rig;
  bind?: Bind;
};

export type CatalogItem = {
  id: string;
  spec: AssetSpec;
  stats: MeshStats;
  qcPass: boolean;
  createdAt: number;
  prompt: string;
  source: "local" | "grok";
};

export type KitTicket = {
  id: string;
  name: string;
  blurb: string;
  line: Line;
  jobs: Array<{
    prompt: string;
    family: Family;
    style: Style;
    polyTarget?: number;
  }>;
};
