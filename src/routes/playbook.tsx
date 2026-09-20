import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ShellHeader } from "@/components/mill/shell";

export const Route = createFileRoute("/playbook")({ component: Playbook });

function Playbook() {
  return (
    <div className="min-h-dvh bg-bg">
      <ShellHeader current="playbook" />

      <article className="mx-auto max-w-[760px] px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Operator manual</p>
        <h1 className="mt-2 font-display text-5xl font-semibold leading-[0.95] tracking-tight">
          How to make a Blender asset factory for AI
        </h1>
        <p className="mt-5 text-lg text-muted">
          The mill on the other tab is the control plane. This page is the plant you stand up around Blender so the
          control plane can actually ship game-ready files.
        </p>

        <Section kicker="00" title="Do not let the model freehand bpy">
          <p>
            Asking an LLM to dump Blender Python and hoping it runs is not a factory. It hallucinates operators, leaves
            origin in the volume, skips UVs, and never QC-gates. The mill that survives contact with a game engine is a
            spec-driven line: the model writes a locked ticket, templates build the mesh, stations mutate one thing at
            a time, and a vision loop checks the plate after every mutation.
          </p>
        </Section>

        <Section kicker="01" title="The line">
          <ol className="grid gap-3">
            {[
              ["Intake", "Typed brief. Family, style, engine, poly budget. Free text is flavor, not the contract."],
              ["Brief mill", "LLM expands the ticket into a spec: SM_ name, meters, 1–3 PBR slots. Spec wins over the image."],
              [
                "Source",
                "Hard-surface / machines / architecture → scripted bpy or geometry nodes. Organic / hero sculpts → Meshy, Tripo, Hunyuan3D, or Rodin, then import. Wardrobe → never in empty space: shrinkwrap / solidify on a standard mannequin, Marvelous or Clo for hero cloth, then retopo. Reuse first — PolyHaven and your own catalog are cheaper than generation.",
              ],
              ["Cleanup", "Apply transforms. Origin at the contact patch. 1 unit = 1 meter. Merge, recalc normals."],
              ["Material", "Assign the spec’s slots, or bake. Keep material count at or under 3 for game props."],
              ["QC gate", "Naming, origin, poly vs budget, manifold, material count. Alert — do not silently decimate a hero."],
              ["Export", "GLB for Godot/web, FBX for Unreal/Unity, engine preset baked into the packet."],
              ["Vision loop", "Screenshot after every mutation. One action, one verification. Retry the single failed op."],
            ].map(([name, copy], i) => (
              <li key={name} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong className="font-medium text-fg">{name}.</strong> {copy}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section kicker="02" title="Stack">
          <div className="grid gap-3">
            <Row k="Orchestrator" v="Grok / Claude Code with a skill. Plans stations. Does not sculpt." />
            <Row k="Hands" v="blender-mcp on a local socket, or blender --background --python for headless CI." />
            <Row k="Mesh backends" v="Meshy (game PBR props), Tripo (speed), Hunyuan3D (local), Rodin (dense geo). Wardrobe: Marvelous Designer / Clo3D, or Blender cloth on the jig — not text-to-3D in empty space." />
            <Row k="Cleanup" v="Purpose-built MCP tools over execute_python. Undo step on every call." />
            <Row k="Catalog" v="Git LFS + a JSON index. One asset per process. SM_ names, meters, bottom origin." />
          </div>
          <pre className="mt-5 overflow-x-auto rounded-lg bg-raised p-4 font-mono text-[12px] leading-relaxed text-fg">
{`Human brief
  → Spec mill (LLM, JSON only)
    → Source (template bpy  |  text-to-3D API  |  catalog hit)
      → Blender MCP / headless bpy
        → Viewport screenshot
          → VLM QC (pass / retry one op)
            → Export GLB/FBX → engine`}
          </pre>
        </Section>

        <Section kicker="03" title="Wire Blender">
          <p>Minimum plant, in order:</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Install Blender 4.2+ or 5.x LTS. Enable an MCP add-on (blender-mcp or a larger fork).</li>
            <li>
              Point your agent at the MCP server. Live GUI for watching;{" "}
              <code className="font-mono text-[13px]">blender --background</code> for batch.
            </li>
            <li>
              Optional local mesh server: Hunyuan3D-2 on a GPU box. Cloud: Meshy / Tripo keys as env vars, never in the
              skill file.
            </li>
            <li>
              Give the agent a skill with iron rules, poly tiers, naming, and export presets. First asset of a new
              family is a human gate. After that, kits mill unattended with the vision loop on.
            </li>
          </ol>
        </Section>

        <Section kicker="04" title="Iron rules">
          <ul className="grid gap-2">
            {[
              "One asset per process. Kits are a queue, not a pile.",
              "get_scene_info before a station. Screenshot after every mutation.",
              "Spec wins over the reference image.",
              "Never hard-cap polys — flag out-of-range, do not silently destroy a hero.",
              "LLM does not freehand bpy as the primary path. Templates + params. execute_python is the fallback.",
              "Cheapest asset is one you do not generate. Search the catalog and PolyHaven first.",
              "Origin bottom-center for props. Armature root (between feet) for wardrobe. 1u = 1m. SM_ props, SK_ skinned garments. ≤3 materials, transforms applied.",
              "The body is the jig. Do not mill shirts, armor, cloaks, or boots in empty space.",
            ].map((r) => (
              <li key={r} className="grid grid-cols-[0.6rem_1fr] gap-3">
                <span className="mt-2 size-1.5 rounded-full bg-fg" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section kicker="05" title="Wardrobe mill">
          <p>
            Clothing is not a crate. A shirt that floats at the world origin is scrap. The factory that survives a
            character pipeline treats the body as a jig: one standard mannequin, one bind pose, garments grown on it.
          </p>
          <ol className="mt-4 grid gap-3">
            {[
              [
                "Jig first",
                "Lock a 180cm mannequin and armature (A-pose or T-pose, Mixamo / UE5 mannequin bone names). Every shirt, pant, cloak, boot, and plate piece is fitted to that mesh. Catalog the jig. Never invent a new body per ticket.",
              ],
              [
                "Split the line",
                "Hard armor (cuirass, helm, sabatons) is kitbash / boolean on an inflated body envelope — same as hard-surface props, then parented to bones. Soft garments (shirts, pants, cloaks) are hulls: shrinkwrap to the body, Solidify 4–8mm so the character mesh does not clip, retopo, UV. Footwear is one boot, mirrored, origins at the ankle or sole per engine.",
              ],
              [
                "Do not text-to-3D clothing in a void",
                "Meshy / Tripo / Hunyuan without a body give you a sculpture, not a wearable. Use them for fabric trim, heraldry, or a high-poly drape you will retopo onto the jig. Hero cloth still belongs in Marvelous Designer, Clo3D, or Blender cloth on a proxy, then bake and retopo.",
              ],
              [
                "Weights",
                "Data Transfer / weight-transfer from the body, then paint. Cloaks need extra bones or a cloth sim at runtime — do not pretend a static drape will sit through a run cycle. Boots get mirrored weights. QC in bind pose and a walk cycle, not just T-pose.",
              ],
              [
                "Names and origin",
                "SK_ for anything skinned. SM_ only for rigid socketed pieces (a helm that snaps to a head socket and never deforms). Origin is the armature root, between the feet — not the garment AABB. Left/right boots are a pair under one empty, or Boot_L / Boot_R with a mirror modifier applied on export.",
              ],
              [
                "QC that is not a prop QC",
                "Clip test against the jig. Thickness. L/R. Poly vs budget. Material count. Weights on shoulders, crotch, ankles. Inner shell deleted or not exported. Screenshot bind pose and one posed frame.",
              ],
            ].map(([name, copy], i) => (
              <li key={name} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong className="font-medium text-fg">{name}.</strong> {copy}
                </span>
              </li>
            ))}
          </ol>
          <pre className="mt-5 overflow-x-auto rounded-lg bg-raised p-4 font-mono text-[12px] leading-relaxed text-fg">
{`Standard 180cm T-pose jig (cataloged)
  → Ticket: shirt | pants | cloak | armor | boots
    → Hull on body (shrinkwrap + solidify)
      → Retopo / UV / 1–3 mats
        → EveryWear / Mixamo bind  OR  Marvelous Alembic cache
          → Walk-cycle QC, never T-pose only
            → Export SK_  GLB/FBX`}
          </pre>
        </Section>

        <Section kicker="06" title="Marvelous → animator rig">
          <p>
            Marvelous Designer is not a game exporter. It is a drape mill. The animator rig is a different station.
            MD 2025+ can ingest Mixamo, Daz, Character Creator, and MetaHuman FBX with IK joint mapping. MD 2026 adds
            rig templates and glTF. EveryWear auto-retopos and copies body weights. None of that means you dump a sim
            into Unreal and call it a character.
          </p>
          <p>Two paths. Do not mix them.</p>
          <ol className="mt-4 grid gap-3">
            {[
              [
                "Path A — Skinned (games)",
                "Import the Mixamo / UE5 / MetaHuman avatar into MD as Avatar, T-pose, centimetres, Y-up. Turn off auto arrangement if you are only mapping IK. Make the garment on that jig. Rest-pose sim. EveryWear: Quad Optimize, Rigging, max 8 influences for Unreal (4 for Unity/Godot). Export FBX / USD / glTF with thickness and unified UVs. No simulation cache. In Blender this mill’s packet does the same bind: auto-weight the jig, Data Transfer vertex groups onto the garment, Armature modifier, limit total. Result is an SK_ skeletal mesh.",
              ],
              [
                "Path B — Cache (cinematics)",
                "Animate first (Mixamo, iClone, Unreal Sequencer). MD 2025+ imports FBX joint animation directly — no MDD. Sim the garment in Animation (Stable). Avatar Tape at the shoulders so the cloth does not explode. Particle distance 10–20mm. Export Alembic (Ogawa), garment only. UE Geometry Cache or Blender Mesh Sequence. Never skin a cache. Never cache a game shirt.",
              ],
              [
                "IK joint mapping",
                "If the avatar is not an MD native, map IK in Avatar Editor so MD poses and motion assets retarget. Same IK tree as Mixamo / MetaHuman or the mapping fails silently and the drape slides.",
              ],
              [
                "Walk-cycle QC",
                "T-pose pass is not a pass. Shoulders, crotch, boot shaft, cloak hem. If it clips in a run cycle, the bind is wrong — paint weights or add a cape bone. Cloaks that must flow go Path B or a runtime cloth bone, not hope.",
              ],
            ].map(([name, copy], i) => (
              <li key={name} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong className="font-medium text-fg">{name}.</strong> {copy}
                </span>
              </li>
            ))}
          </ol>
          <pre className="mt-5 overflow-x-auto rounded-lg bg-raised p-4 font-mono text-[12px] leading-relaxed text-fg">
{`Animator (Mixamo / UE5 / MetaHuman) T-pose FBX
  → Marvelous Avatar + IK map
    → Garment + rest sim
      ├─ EveryWear rig (≤8 inf) → SK_ FBX/glTF   [game]
      └─ Animation sim → Alembic cache           [cine]
         → Walk-cycle QC → engine`}
          </pre>
        </Section>

        <Section kicker="07" title="What this mill already does">
          <p>
            CRUCIBLE is the control plane you can run in a browser: tickets, kits, Grok brief mill, parametric preview,
            QC gate, and a real Blender Python packet. Props sit on the floor. Wardrobe (shirt, pants, cloak, armor,
            boots) is fitted to a 180cm T-pose jig. Pick Mixamo, UE5 mannequin, or MetaHuman, then{" "}
            <strong className="font-medium">skinned</strong> (EveryWear weights, walk-test on the plate) or{" "}
            <strong className="font-medium">cache</strong> (Alembic, not skinned). Drop the{" "}
            <code className="font-mono text-[13px]">.py</code> into Blender — it builds the armature and binds.
          </p>
          <p className="mt-4">
            <Link to="/" className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
              Back to the mill
            </Link>
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{kicker}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{k}</span>
      <span className="text-[15px]">{v}</span>
    </div>
  );
}
