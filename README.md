# CRUCIBLE

AI Blender asset factory. Brief a prop, mill a mesh, pass QC, export Blender Python.

This is the Grok Build control plane for [avatardebris-debug/blender2-grok](https://github.com/avatardebris-debug/blender2-grok). The mill runs in the browser. The playbook is the plant you stand up around real Blender.

## What it does

- **Tickets** — family, style, engine packet, poly budget. Two lines: **props** (floor objects) and **wardrobe** (shirt, pants, cloak, armor, boots on a 180cm T-pose jig). Wardrobe binds Mixamo / UE5 / MetaHuman, skinned or Alembic cache.
- **Brief mill** — Grok locks a spec (`SM_` name, meters, PBR slots) or a local mill fills it
- **Preview plate** — parametric Three.js mesh, station-by-station
- **QC gate** — naming, origin, scale, poly vs budget, material count
- **Packet** — downloadable `.py` that rebuilds the asset in Blender (headless or Scripting workspace)
- **Kits** — sci-fi corridor, medieval tavern, industrial yard

## Stack

TanStack Start + React 19 + Tailwind v4 + Three.js / R3F. xAI `grok-4.5` for briefs when `XAI_API_KEY` is set.

## Run

```bash
npm install
npm run dev
```

Set `XAI_API_KEY` on the server for Grok briefs. Local mill works without it.

Drop a downloaded `.py` into Blender, or:

```bash
blender --background --python SM_HardCrate_12.py
```

## Iron rules (the real factory)

1. Do not let the model freehand `bpy` as the primary path — templates + params.
2. One asset per process. Kits are a queue.
3. Spec wins over the reference image.
4. Props: origin bottom-center, `SM_` names. Wardrobe: origin at armature root, `SK_` names, fitted to the 180cm mannequin. 1u = 1m, ≤3 materials, transforms applied.
5. Screenshot after every mutation when a live Blender MCP is wired.
6. Cheapest asset is one you do not generate.

Playbook tab in the app covers MCP, Meshy / Tripo / Hunyuan / Rodin, and export presets.
