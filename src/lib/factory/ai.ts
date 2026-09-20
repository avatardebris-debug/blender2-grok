import { createServerFn } from "@tanstack/react-start";
import type { AssetSpec, Engine, Family, Style } from "./types";

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
};

export const millBrief = createServerFn({ method: "POST" })
  .validator((input: BriefInput) => input)
  .handler(async ({ data }) => {
    const apiKey = getApiKey();
    if (!apiKey) return { ok: false as const, error: "AI is not available" };

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
{"objectName":"SM_StyleFamily_01","displayName":"short title","scaleMeters":[x,y,z],"polyTarget":1800,"materials":[{"name":"Pascal_Case","hex":"#rrggbb","metal":0.2,"rough":0.5}],"notes":"one sentence","qc":["origin bottom center","1u=1m"]}
Rules: Unreal-style SM_ names. Scale in meters, plausible for the object (a crate is ~1m, a sword is thin). 2 materials. Hex is 6-digit. Family is locked. Do not write Python.`,
          },
          {
            role: "user",
            content: `Brief this mill job.
prompt: ${data.prompt}
family: ${data.family}
style: ${data.style}
engine: ${data.engine}
polyTarget: ${data.polyTarget}`,
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
