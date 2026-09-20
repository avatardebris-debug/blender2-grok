import { createServerFn } from "@tanstack/react-start";
import type { AssetSpec, Bind, Engine, Family, Rig, Style } from "./types";
import { isWardrobe } from "./types";

function getApiKey() {
  return process.env["XAI_API_KEY"]?.trim() || undefined;
}

export const grokStatus = createServerFn({ method: "POST" }).handler(async () => {
  return { available: Boolean(getApiKey()) };
});

type BriefInput = {
  prompt: string;
  family: Family;
  style: Style;
  engine: Engine;
  polyTarget: number;
  rig?: Rig;
  bind?: Bind;
};

export const millBrief = createServerFn({ method: "POST" })
  .validator((input: BriefInput) => input)
  .handler(async ({ data }) => {
    const apiKey = getApiKey();
    if (!apiKey) return { ok: false as const, error: "AI is not available" };

    const wardrobe = isWardrobe(data.family);
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.5,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: `You are the brief mill of CRUCIBLE, an AI 3D asset factory.
Return ONLY compact JSON, no markdown, matching:
{"objectName":"${wardrobe ? "SK" : "SM"}_StyleFamily_01","displayName":"short title","scaleMeters":[x,y,z],"polyTarget":1800,"materials":[{"name":"Pascal_Case","hex":"#rrggbb","metal":0.2,"rough":0.5}],"notes":"one sentence","qc":[${wardrobe ? `"origin armature root","T-pose ${data.rig ?? "mixamo"} bind"` : `"origin bottom center","1u=1m"`}]}
Rules:
- Family is locked. Do not write Python.
- Hex is 6-digit. 2 materials.
${
  wardrobe
    ? `- WARDROBE job. objectName MUST start with SK_.
- scaleMeters is the garment hull on a 1.80m T-pose mannequin.
- Origin is armature root between the feet, never the garment AABB.
- Animator rig is ${data.rig ?? "mixamo"}. Bind is ${data.bind ?? "skinned"}.
- If bind is skinned: EveryWear path, copy body weights, max 4 influences (8 for Unreal). Notes mention T-pose and weight transfer.
- If bind is cache: Marvelous animation sim, Alembic geometry cache, do not skin. Notes say that.
- Do not mill clothing in empty space.`
    : `- PROP job. objectName MUST start with SM_.
- Scale in meters, plausible for the object (a crate is ~1m, a sword is thin).
- Origin at the contact patch.`
}`,
          },
          {
            role: "user",
            content: `Brief this mill job.
prompt: ${data.prompt}
family: ${data.family}
style: ${data.style}
engine: ${data.engine}
polyTarget: ${data.polyTarget}
rig: ${data.rig ?? "none"}
bind: ${data.bind ?? "none"}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `xAI API error ${res.status}` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const parsed = parseJson(text);
    if (!parsed) return { ok: false as const, error: "Brief mill returned unreadable JSON" };
    return { ok: true as const, spec: parsed as Partial<AssetSpec> };
  });

function parseJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
