export const FAMILIES = [
  { id: "crate", label: "Crate", hint: "Boxes, lids, straps" },
  { id: "barrel", label: "Barrel", hint: "Drums, tanks, casks" },
  { id: "weapon", label: "Weapon", hint: "Blades, tools, guns" },
  { id: "module", label: "Module", hint: "Sci-fi hard-surface" },
  { id: "furniture", label: "Furniture", hint: "Chairs, tables, stools" },
  { id: "environment", label: "Environment", hint: "Walls, floors, kits" },
  { id: "organic", label: "Organic", hint: "Rocks, trees, debris" },
  { id: "machine", label: "Machine", hint: "Valves, pumps, gears" },
] as const;

export type Family = (typeof FAMILIES)[number]["id"];

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
  { id: "unreal", label: "Unreal", format: "FBX", note: "cm, SM_ prefix" },
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
  jobs: Array<{
    prompt: string;
    family: Family;
    style: Style;
    polyTarget?: number;
  }>;
};
