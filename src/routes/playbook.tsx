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
                "Hard-surface / machines / architecture → scripted bpy or geometry nodes. Organic / hero sculpts → Meshy, Tripo, Hunyuan3D, or Rodin, then import. Reuse first — PolyHaven and your own catalog are cheaper than generation.",
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
            <Row k="Mesh backends" v="Meshy (game PBR), Tripo (speed), Hunyuan3D (local), Rodin (dense geo)." />
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
              "Origin bottom-center, 1u = 1m, SM_ names, ≤3 materials, transforms applied.",
            ].map((r) => (
              <li key={r} className="grid grid-cols-[0.6rem_1fr] gap-3">
                <span className="mt-2 size-1.5 rounded-full bg-fg" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section kicker="05" title="What this mill already does">
          <p>
            CRUCIBLE is the control plane you can run in a browser: tickets, kits, Grok brief mill, parametric preview,
            QC gate, and a real Blender Python packet. Drop the <code className="font-mono text-[13px]">.py</code> into
            Blender or run it headless. Point a GPU worker at the same spec JSON when you are ready to swap the preview
            plate for Meshy / Hunyuan and a live bpy socket.
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
