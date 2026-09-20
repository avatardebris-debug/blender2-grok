import type { AssetSpec } from "./types";

function pyStr(s: string) {
  return JSON.stringify(s);
}

function rgba(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function buildBpy(spec: AssetSpec): string {
  const [sx, sy, sz] = spec.scaleMeters;
  const mats = spec.materials
    .map((m, i) => {
      const [r, g, b] = rgba(m.hex);
      return `    mats[${i}] = new_mat(${pyStr(m.name)}, (${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}), ${m.metal.toFixed(2)}, ${m.rough.toFixed(2)})`;
    })
    .join("\n");

  const body = FAMILY_BODY[spec.family](spec, sx, sy, sz);

  return `# CRUCIBLE mill packet — ${spec.objectName}
# ${spec.displayName}
# Family ${spec.family} · style ${spec.style} · engine ${spec.engine}
# Scale ${sx} x ${sy} x ${sz} m · seed ${spec.seed}
# Run: blender --background --python ${spec.objectName}.py
#   or paste into Blender's Scripting workspace and hit Run.

import bpy
from mathutils import Vector

C = bpy.context
D = bpy.data


def wipe():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (D.meshes, D.materials, D.cameras, D.lights):
        for item in list(block):
            block.remove(item)


def new_mat(name, color, metallic, roughness):
    mat = D.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def link_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_box(name, size, location, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    ob = C.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    link_mat(ob, mat)
    return ob


def add_cyl(name, radius, depth, location, mat, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, location=location, vertices=verts
    )
    ob = C.object
    ob.name = name
    link_mat(ob, mat)
    return ob


def join_under(root_name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objects:
        ob.select_set(True)
    C.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    mesh = C.object
    mesh.name = root_name + "_Mesh"
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    # Drop origin to the contact patch (bottom of bounds).
    min_z = min((mesh.matrix_world @ Vector(c)).z for c in mesh.bound_box)
    mesh.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = C.object
    root.name = root_name
    mesh.parent = root
    mesh.location = (0, 0, 0)
    return root


wipe()
mats = [None] * ${spec.materials.length}
${mats}

${body}

# Optional: export next to this script when run headless.
import os
out = os.path.splitext(bpy.data.filepath or ${pyStr(spec.objectName + ".blend")})[0]
# bpy.ops.export_scene.gltf(filepath=out + ".glb", export_format="GLB", export_apply=True)

print("CRUCIBLE milled", ${pyStr(spec.objectName)})
`;
}

type BodyFn = (spec: AssetSpec, sx: number, sy: number, sz: number) => string;

const FAMILY_BODY: Record<AssetSpec["family"], BodyFn> = {
  crate: (_s, sx, sy, sz) => `parts = []
parts.append(add_box("Body", (${n(sx / 2)}, ${n(sz / 2)}, ${n(sy / 2)}), (0, 0, ${n(sy / 2)}), mats[0]))
parts.append(add_box("Lid", (${n(sx / 2 + 0.01)}, ${n(sz / 2 + 0.01)}, 0.03), (0, 0, ${n(sy + 0.03)}), mats[0]))
parts.append(add_box("Strap_A", (${n(sx / 2 + 0.02)}, 0.04, ${n(sy / 2 + 0.01)}), (0, ${n(sz * 0.22)}, ${n(sy / 2)}), mats[1] if len(mats) > 1 else mats[0]))
parts.append(add_box("Strap_B", (${n(sx / 2 + 0.02)}, 0.04, ${n(sy / 2 + 0.01)}), (0, ${n(-sz * 0.22)}, ${n(sy / 2)}), mats[1] if len(mats) > 1 else mats[0]))
for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
    parts.append(add_box("Foot", (0.06, 0.06, 0.04), (dx * ${n(sx / 2 - 0.08)}, dy * ${n(sz / 2 - 0.08)}, 0.02), mats[1] if len(mats) > 1 else mats[0]))
join_under(${pyStr(_s.objectName)}, parts)`,

  barrel: (_s, sx, sy) => `parts = []
r = ${n(sx / 2)}
parts.append(add_cyl("Body", r, ${n(sy)}, (0, 0, ${n(sy / 2)}), mats[0], verts=28))
for z in (${n(sy * 0.18)}, ${n(sy * 0.5)}, ${n(sy * 0.82)}):
    parts.append(add_cyl("Ring", r + 0.02, 0.04, (0, 0, z), mats[1] if len(mats) > 1 else mats[0], verts=28))
parts.append(add_cyl("Lid", r - 0.02, 0.03, (0, 0, ${n(sy + 0.01)}), mats[0], verts=28))
join_under(${pyStr(_s.objectName)}, parts)`,

  weapon: (_s, sx, sy, sz) => `parts = []
parts.append(add_box("Blade", (${n(sx / 2)}, ${n(sz / 2)}, ${n(sy * 0.38)}), (0, 0, ${n(sy * 0.55)}), mats[0]))
parts.append(add_box("Guard", (${n(sx * 1.4)}, ${n(sz * 1.6)}, 0.03), (0, 0, ${n(sy * 0.18)}), mats[1] if len(mats) > 1 else mats[0]))
parts.append(add_cyl("Grip", ${n(sx * 0.35)}, ${n(sy * 0.18)}, (0, 0, ${n(sy * 0.09)}), mats[1] if len(mats) > 1 else mats[0], verts=16))
parts.append(add_cyl("Pommel", ${n(sx * 0.42)}, 0.05, (0, 0, 0.03), mats[0], verts=16))
join_under(${pyStr(_s.objectName)}, parts)`,

  module: (_s, sx, sy, sz) => `parts = []
parts.append(add_box("Hull", (${n(sx / 2)}, ${n(sz / 2)}, ${n(sy / 2)}), (0, 0, ${n(sy / 2)}), mats[0]))
parts.append(add_cyl("Tank_L", ${n(sz * 0.22)}, ${n(sy * 0.7)}, (${n(-sx / 2 - sz * 0.12)}, 0, ${n(sy * 0.4)}), mats[1] if len(mats) > 1 else mats[0], verts=20))
parts.append(add_cyl("Tank_R", ${n(sz * 0.22)}, ${n(sy * 0.7)}, (${n(sx / 2 + sz * 0.12)}, 0, ${n(sy * 0.4)}), mats[1] if len(mats) > 1 else mats[0], verts=20))
parts.append(add_cyl("Antenna", 0.03, ${n(sy * 0.55)}, (0, ${n(sz * 0.2)}, ${n(sy + sy * 0.2)}), mats[0], verts=12))
join_under(${pyStr(_s.objectName)}, parts)`,

  furniture: (_s, sx, sy, sz) => `parts = []
parts.append(add_box("Seat", (${n(sx / 2)}, ${n(sz / 2)}, 0.04), (0, 0, ${n(sy * 0.46)}), mats[0]))
parts.append(add_box("Back", (${n(sx / 2)}, 0.03, ${n(sy * 0.28)}), (0, ${n(-sz / 2 + 0.03)}, ${n(sy * 0.74)}), mats[0]))
for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
    parts.append(add_box("Leg", (0.03, 0.03, ${n(sy * 0.23)}), (dx * ${n(sx / 2 - 0.06)}, dy * ${n(sz / 2 - 0.06)}, ${n(sy * 0.23)}), mats[1] if len(mats) > 1 else mats[0]))
join_under(${pyStr(_s.objectName)}, parts)`,

  environment: (_s, sx, sy, sz) => `parts = []
parts.append(add_box("Slab", (${n(sx / 2)}, ${n(sz / 2)}, ${n(sy / 2)}), (0, 0, ${n(sy / 2)}), mats[0]))
parts.append(add_box("Frame", (${n(sx / 2 + 0.03)}, ${n(sz / 2 + 0.02)}, 0.04), (0, 0, ${n(sy - 0.02)}), mats[1] if len(mats) > 1 else mats[0]))
parts.append(add_box("Stripe", (${n(sx / 2 - 0.1)}, ${n(sz / 2 + 0.01)}, 0.06), (0, 0, ${n(sy * 0.28)}), mats[1] if len(mats) > 1 else mats[0]))
join_under(${pyStr(_s.objectName)}, parts)`,

  organic: (_s, sx, sy, sz) => `parts = []
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=${n(Math.max(sx, sz) * 0.38)}, location=(0, 0, ${n(sy * 0.38)}))
a = C.object
a.name = "Mass_A"
a.scale = (1.0, 0.85, 0.7)
link_mat(a, mats[0])
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=${n(Math.max(sx, sz) * 0.28)}, location=(${n(sx * 0.22)}, ${n(-sz * 0.1)}, ${n(sy * 0.28)}))
b = C.object
b.name = "Mass_B"
b.scale = (0.9, 1.1, 0.75)
link_mat(b, mats[1] if len(mats) > 1 else mats[0])
parts = [a, b]
join_under(${pyStr(_s.objectName)}, parts)`,

  machine: (_s, sx, sy) => `parts = []
r = ${n(sx * 0.22)}
parts.append(add_cyl("Riser", r, ${n(sy * 0.55)}, (0, 0, ${n(sy * 0.28)}), mats[0], verts=20))
parts.append(add_box("Flange_Bot", (${n(sx * 0.38)}, ${n(sx * 0.38)}, 0.05), (0, 0, 0.03), mats[1] if len(mats) > 1 else mats[0]))
parts.append(add_box("Flange_Top", (${n(sx * 0.32)}, ${n(sx * 0.32)}, 0.04), (0, 0, ${n(sy * 0.58)}), mats[0]))
bpy.ops.mesh.primitive_torus_add(major_radius=${n(sx * 0.28)}, minor_radius=0.035, location=(0, 0, ${n(sy * 0.72)}), major_segments=20, minor_segments=10)
wheel = C.object
wheel.name = "Handwheel"
link_mat(wheel, mats[1] if len(mats) > 1 else mats[0])
parts.append(wheel)
join_under(${pyStr(_s.objectName)}, parts)`,
};

function n(v: number) {
  return Number(v.toFixed(3));
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
