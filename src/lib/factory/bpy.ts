import { isWardrobe, type AssetSpec } from "./types";
import { maxInfluences } from "./spec";

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
  const wardrobe = isWardrobe(spec.family);

  return `# CRUCIBLE mill packet — ${spec.objectName}
# ${spec.displayName}
# Family ${spec.family} · style ${spec.style} · engine ${spec.engine}
# Scale ${sx} x ${sy} x ${sz} m · seed ${spec.seed}
# ${wardrobe ? `Wardrobe: 180cm T-pose jig. ${spec.rig ?? "mixamo"} ${spec.bind ?? "skinned"} bind.` : "Prop: origin at contact patch."}
# Run: blender --background --python ${spec.objectName}.py
#   or paste into Blender's Scripting workspace and hit Run.

import bpy
from mathutils import Vector

C = bpy.context
D = bpy.data


def wipe():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (D.meshes, D.materials, D.cameras, D.lights, D.armatures):
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


def add_uvs(name, radius, location, mat, segments=16):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=location, segments=segments, ring_count=10
    )
    ob = C.object
    ob.name = name
    link_mat(ob, mat)
    return ob


def add_jig():
    """180cm T-pose mannequin. Shrinkwrap target, not part of the asset."""
    jig_mat = new_mat("JIG_Skin", (0.22, 0.23, 0.25), 0.0, 0.9)
    parts = []
    parts.append(add_uvs("JIG_Head", 0.10, (0, 0, 1.68), jig_mat, 12))
    parts.append(add_box("JIG_Torso", (0.16, 0.10, 0.28), (0, 0, 1.22), jig_mat))
    parts.append(add_box("JIG_Pelvis", (0.14, 0.09, 0.08), (0, 0, 0.94), jig_mat))
    for x in (-0.09, 0.09):
        parts.append(add_cyl("JIG_Leg", 0.055, 0.78, (x, 0, 0.50), jig_mat, 12))
    for x in (-0.42, 0.42):
        parts.append(add_cyl("JIG_Arm", 0.04, 0.52, (x, 0, 1.42), jig_mat, 10))
        C.object.rotation_euler[1] = 1.5708
        bpy.ops.object.transform_apply(rotation=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in parts:
        ob.select_set(True)
    C.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    jig = C.object
    jig.name = "JIG_Mannequin"
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return jig


def _bone(arm, name, head, tail, parent=None):
    b = arm.edit_bones.new(name)
    b.head = head
    b.tail = tail
    if parent is not None:
        b.parent = parent
        b.use_connect = False
    return b


def add_rig(kind="mixamo"):
    """Mixamo / UE5 / MetaHuman T-pose armature. Names match animator retargets."""
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    ob = C.object
    arm = ob.data
    if kind == "ue5" or kind == "metahuman":
        ob.name = "SK_Mannequin"
        arm.name = "UE5_Mannequin"
        hips, spine, spine1, spine2, neck, head = (
            "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head",
        )
        lsh, larm, lfa, lhand = "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l"
        rsh, rarm, rfa, rhand = "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r"
        lul, ll, lf = "thigh_l", "calf_l", "foot_l"
        rul, rl, rf = "thigh_r", "calf_r", "foot_r"
    else:
        ob.name = "mixamorig"
        arm.name = "mixamorig"
        p = "mixamorig:"
        hips, spine, spine1, spine2, neck, head = (
            p+"Hips", p+"Spine", p+"Spine1", p+"Spine2", p+"Neck", p+"Head",
        )
        lsh, larm, lfa, lhand = p+"LeftShoulder", p+"LeftArm", p+"LeftForeArm", p+"LeftHand"
        rsh, rarm, rfa, rhand = p+"RightShoulder", p+"RightArm", p+"RightForeArm", p+"RightHand"
        lul, ll, lf = p+"LeftUpLeg", p+"LeftLeg", p+"LeftFoot"
        rul, rl, rf = p+"RightUpLeg", p+"RightLeg", p+"RightFoot"
    eb = arm.edit_bones
    for b in list(eb):
        eb.remove(b)
    h = _bone(arm, hips, (0, 0, 0.94), (0, 0, 1.08))
    s = _bone(arm, spine, (0, 0, 1.08), (0, 0, 1.22), h)
    s1 = _bone(arm, spine1, (0, 0, 1.22), (0, 0, 1.36), s)
    s2 = _bone(arm, spine2, (0, 0, 1.36), (0, 0, 1.48), s1)
    nk = _bone(arm, neck, (0, 0, 1.48), (0, 0, 1.58), s2)
    _bone(arm, head, (0, 0, 1.58), (0, 0, 1.78), nk)
    ls = _bone(arm, lsh, (0.04, 0, 1.42), (0.18, 0, 1.42), s2)
    la = _bone(arm, larm, (0.18, 0, 1.42), (0.46, 0, 1.42), ls)
    lf0 = _bone(arm, lfa, (0.46, 0, 1.42), (0.70, 0, 1.42), la)
    _bone(arm, lhand, (0.70, 0, 1.42), (0.82, 0, 1.42), lf0)
    rs = _bone(arm, rsh, (-0.04, 0, 1.42), (-0.18, 0, 1.42), s2)
    ra = _bone(arm, rarm, (-0.18, 0, 1.42), (-0.46, 0, 1.42), rs)
    rf0 = _bone(arm, rfa, (-0.46, 0, 1.42), (-0.70, 0, 1.42), ra)
    _bone(arm, rhand, (-0.70, 0, 1.42), (-0.82, 0, 1.42), rf0)
    lu = _bone(arm, lul, (0.09, 0, 0.94), (0.09, 0, 0.50), h)
    le = _bone(arm, ll, (0.09, 0, 0.50), (0.09, 0, 0.12), lu)
    _bone(arm, lf, (0.09, 0, 0.12), (0.09, 0.14, 0.04), le)
    ru = _bone(arm, rul, (-0.09, 0, 0.94), (-0.09, 0, 0.50), h)
    re = _bone(arm, rl, (-0.09, 0, 0.50), (-0.09, 0, 0.12), ru)
    _bone(arm, rf, (-0.09, 0, 0.12), (-0.09, 0.14, 0.04), re)
    bpy.ops.object.mode_set(mode="OBJECT")
    ob.show_in_front = True
    return ob


def bind_everywear(garment, jig, armature, max_inf=4):
    """EveryWear-style bind: auto-weight the jig, copy groups onto the garment."""
    bpy.ops.object.select_all(action="DESELECT")
    jig.select_set(True)
    armature.select_set(True)
    C.view_layer.objects.active = armature
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    dt = garment.modifiers.new(name="EveryWear_Transfer", type="DATA_TRANSFER")
    dt.object = jig
    dt.use_vert_data = True
    dt.data_types_verts = {"VGROUP_WEIGHTS"}
    dt.vert_mapping = "POLYINTERP_NEAREST"
    bpy.ops.object.select_all(action="DESELECT")
    garment.select_set(True)
    C.view_layer.objects.active = garment
    bpy.ops.object.datalayout_transfer(modifier="EveryWear_Transfer")
    bpy.ops.object.modifier_apply(modifier="EveryWear_Transfer")
    am = garment.modifiers.new(name="Armature", type="ARMATURE")
    am.object = armature
    am.use_vertex_groups = True
    garment.parent = armature
    try:
        bpy.ops.object.vertex_group_limit_total(limit=max_inf)
    except Exception:
        pass
    return garment


def join_under(root_name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objects:
        ob.select_set(True)
    C.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    mesh = C.object
    mesh.name = root_name + "_Mesh"
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    min_z = min((mesh.matrix_world @ Vector(c)).z for c in mesh.bound_box)
    mesh.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = C.object
    root.name = root_name
    mesh.parent = root
    mesh.location = (0, 0, 0)
    return root


def join_fitted(root_name, objects):
    """Wardrobe join: origin stays at world origin (armature / between feet)."""
    C.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objects:
        ob.select_set(True)
    C.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    mesh = C.object
    mesh.name = root_name + "_Mesh"
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = C.object
    root.name = root_name
    mesh.parent = root
    return root


wipe()
C.scene.cursor.location = (0, 0, 0)
mats = [None] * ${spec.materials.length}
${mats}
${wardrobe ? `jig = add_jig()
arm = add_rig(${pyStr(spec.rig ?? "mixamo")})
` : ""}
${body}
${wardrobe && spec.bind !== "cache" ? `bind_everywear(D.objects[${pyStr(spec.objectName + "_Mesh")}], jig, arm, ${maxInfluences(spec.engine)})
` : ""}
${wardrobe && spec.bind === "cache" ? `# Cinematic path: simulate in Marvelous on this T-pose avatar, then
# bpy.ops.wm.alembic_export(filepath=out + ".abc", selected=True)
# Do not skin an Alembic cache.
` : ""}

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

  shirt: (_s, sx, sy, sz) => `parts = []
trim = mats[1] if len(mats) > 1 else mats[0]
parts.append(add_box("Torso", (${n(sx / 2)}, ${n(sz / 2)}, ${n(sy * 0.38)}), (0, 0, 1.18), mats[0]))
for x in (-0.42, 0.42):
    parts.append(add_cyl("Sleeve", ${n(sz * 0.2)}, ${n(sy * 0.42)}, (x, 0, 1.42), mats[0], verts=16))
    C.object.rotation_euler[1] = 1.5708
    bpy.ops.object.transform_apply(rotation=True)
parts.append(add_cyl("Collar", ${n(sz * 0.22)}, 0.04, (0, 0, 1.48), trim, verts=16))
join_fitted(${pyStr(_s.objectName)}, parts)`,

  pants: (_s, sx, sy, sz) => `parts = []
trim = mats[1] if len(mats) > 1 else mats[0]
parts.append(add_box("Hips", (${n(sx / 2)}, ${n(sz / 2)}, 0.08), (0, 0, 0.96), mats[0]))
for x in (-0.09, 0.09):
    parts.append(add_cyl("Leg", ${n(sx * 0.22)}, ${n(sy * 0.72)}, (x, 0, 0.52), mats[0], verts=16))
parts.append(add_box("Belt", (${n(sx / 2 + 0.01)}, ${n(sz / 2 + 0.01)}, 0.025), (0, 0, 1.02), trim))
join_fitted(${pyStr(_s.objectName)}, parts)`,

  cloak: (_s, sx, sy, sz) => `parts = []
trim = mats[1] if len(mats) > 1 else mats[0]
parts.append(add_box("Drape", (${n(sx / 2)}, 0.04, ${n(sy * 0.42)}), (0, -0.16, 0.82), mats[0]))
C.object.rotation_euler[0] = 0.12
bpy.ops.object.transform_apply(rotation=True)
parts.append(add_box("Fold_L", (${n(sx * 0.22)}, 0.03, ${n(sy * 0.36)}), (-0.16, -0.12, 0.86), mats[0]))
C.object.rotation_euler[0] = 0.1
C.object.rotation_euler[2] = 0.18
bpy.ops.object.transform_apply(rotation=True)
parts.append(add_box("Fold_R", (${n(sx * 0.22)}, 0.03, ${n(sy * 0.36)}), (0.16, -0.12, 0.86), mats[0]))
C.object.rotation_euler[0] = 0.1
C.object.rotation_euler[2] = -0.18
bpy.ops.object.transform_apply(rotation=True)
parts.append(add_uvs("Hood", 0.14, (0, -0.04, 1.58), mats[0], 14))
C.object.scale = (1.05, 0.85, 0.7)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.mesh.primitive_torus_add(major_radius=0.07, minor_radius=0.016, location=(0, 0.02, 1.46), major_segments=16, minor_segments=8)
clasp = C.object
clasp.name = "Clasp"
link_mat(clasp, trim)
parts.append(clasp)
join_fitted(${pyStr(_s.objectName)}, parts)`,

  armor: (_s, sx, sy, sz) => `parts = []
trim = mats[1] if len(mats) > 1 else mats[0]
parts.append(add_box("Cuirass", (${n(sx / 2)}, ${n(sz * 0.28)}, ${n(sy * 0.28)}), (0, 0.04, 1.22), mats[0]))
parts.append(add_uvs("Pauldron_L", 0.11, (-0.22, 0.02, 1.42), mats[0], 14))
parts.append(add_uvs("Pauldron_R", 0.11, (0.22, 0.02, 1.42), mats[0], 14))
parts.append(add_box("Belt", (${n(sx / 2 + 0.01)}, ${n(sz * 0.22)}, 0.03), (0, 0.02, 0.98), trim))
parts.append(add_uvs("Helm", 0.13, (0, 0, 1.70), mats[0], 16))
parts.append(add_box("Visor", (0.08, 0.09, 0.04), (0, 0.08, 1.66), trim))
join_fitted(${pyStr(_s.objectName)}, parts)`,

  boots: (_s, sx, sy, sz) => `parts = []
trim = mats[1] if len(mats) > 1 else mats[0]
for x, side in ((-0.09, "L"), (0.09, "R")):
    parts.append(add_cyl("Shaft_" + side, ${n(sx * 0.28)}, ${n(sy * 0.72)}, (x, 0, ${n(sy * 0.55)}), mats[0], verts=16))
    parts.append(add_box("Sole_" + side, (${n(sx * 0.28)}, ${n(sz * 0.38)}, 0.03), (x, 0.04, 0.03), trim))
    parts.append(add_box("Toe_" + side, (${n(sx * 0.24)}, ${n(sz * 0.22)}, 0.05), (x, 0.08, 0.08), mats[0]))
join_fitted(${pyStr(_s.objectName)}, parts)`,
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
