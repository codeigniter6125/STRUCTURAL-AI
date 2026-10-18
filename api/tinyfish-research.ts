// api/tinyfish-research.ts
// Vercel serverless function (also mounted in server.ts for local dev).
// Uses the TinyFish Web Agent to research live, public reference material
// (repair methods, code clauses, material rates) for a detected defect.
// The TinyFish key stays server-side: process.env.TINYFISH_API_KEY.

export const config = { maxDuration: 60 }; // Vercel: raise if your plan allows

const TINYFISH_RUN_URL = "https://agent.tinyfish.ai/v1/automation/run";

type Topic = "repair_guidance" | "code_lookup" | "material_rates";

interface ResearchBody {
  topic: Topic;
  defectType: string;      // e.g. "crack", "spalling", "corrosion", "exposed rebar"
  element?: string;        // e.g. "column", "beam", "slab"
  location?: string;       // e.g. "Delhi, India" (used for rates)
  startUrl?: string;       // optional override; must be https
}

const DEFECT_ALLOWLIST = [
  "crack", "spall", "spalling", "efflorescence", "corrosion", "exposed rebar",
];
const ELEMENT_ALLOWLIST = ["column", "beam", "slab", "wall", "foundation", "footing"];

const clean = (s: unknown, max = 80) =>
  String(s ?? "").replace(/[^\p{L}\p{N} ,.\-]/gu, "").slice(0, max).trim();

function buildGoal(b: ResearchBody): { url: string; goal: string; schema: object } {
  const defect = clean(b.defectType);
  const element = clean(b.element) || "RCC member";
  const location = clean(b.location) || "India";

  const base = "https://duckduckgo.com/";

  if (b.topic === "code_lookup") {
    return {
      url: base,
      goal:
        `Search for Indian Standard IS 456:2000 and IS 13920 provisions relevant to ${defect} ` +
        `in a reinforced concrete ${element} (crack width limits, cover, durability). ` +
        `Open at most 3 reputable results (BIS, CPWD, university or engineering-institute pages). ` +
        `Return a short summary and the source URLs. Do not invent clause numbers; ` +
        `only report clauses actually shown on the pages.`,
      schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          clauses: {
            type: "array",
            items: {
              type: "object",
              properties: { reference: { type: "string" }, note: { type: "string" } },
            },
          },
          sources: { type: "array", items: { type: "string" } },
        },
      },
    };
  }

  if (b.topic === "material_rates") {
    return {
      url: base,
      goal:
        `Search for current approximate market or CPWD/DSR rates in ${location} for repairing ${defect} ` +
        `in an RCC ${element}: epoxy injection, polymer-modified repair mortar, and anti-corrosive rebar coating. ` +
        `Open at most 3 results. Return item, unit, approximate price in INR, and the source URL for each.`,
      schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                unit: { type: "string" },
                priceInr: { type: "string" },
                source: { type: "string" },
              },
            },
          },
        },
      },
    };
  }

  return {
    url: base,
    goal:
      `Search for accepted repair methods for ${defect} in a reinforced concrete ${element}, ` +
      `preferring Indian guidance (CPWD, BIS, IIT/NIT, IS 456 context). Open at most 3 reputable results. ` +
      `Return step-by-step repair method, materials, and safety precautions, with source URLs.`,
    schema: {
      type: "object",
      properties: {
        method: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
        materials: { type: "array", items: { type: "string" } },
        precautions: { type: "array", items: { type: "string" } },
        sources: { type: "array", items: { type: "string" } },
      },
    },
  };
}

// Verify the caller is a signed-in Supabase user so the endpoint cannot be
// used by strangers to burn your TinyFish credits.
async function verifyUser(authHeader?: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !authHeader?.startsWith("Bearer ")) return false;
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TINYFISH_API_KEY is not configured on the server." });
  }

  if (!(await verifyUser(req.headers?.authorization))) {
    return res.status(401).json({ error: "Sign in required." });
  }

  const body: ResearchBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

  if (!["repair_guidance", "code_lookup", "material_rates"].includes(body.topic)) {
    return res.status(400).json({ error: "Invalid topic." });
  }
  const defect = clean(body.defectType).toLowerCase();
  if (!DEFECT_ALLOWLIST.some((d) => defect.includes(d))) {
    return res.status(400).json({ error: "Unsupported defectType." });
  }
  if (body.element && !ELEMENT_ALLOWLIST.includes(clean(body.element).toLowerCase())) {
    return res.status(400).json({ error: "Unsupported element." });
  }

  const { url, goal, schema } = buildGoal(body);
  const startUrl = body.startUrl && /^https:\/\//.test(body.startUrl) ? body.startUrl : url;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);

  try {
    const r = await fetch(TINYFISH_RUN_URL, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ url: startUrl, goal, output_schema: schema }),
      signal: controller.signal,
    });

    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(502).json({ error: "TinyFish request failed", status: r.status, detail: data });
    }

    // Bare lists / text come back under result.result; objects come back directly.
    const result = data?.result?.result ?? data?.result ?? null;
    return res.status(200).json({
      ok: true,
      runId: data?.run_id ?? null,
      status: data?.status ?? null,
      topic: body.topic,
      result,
      note: "Third-party web research. Verify against the official IS code before use.",
    });
  } catch (e: any) {
    const timedOut = e?.name === "AbortError";
    return res
      .status(timedOut ? 504 : 500)
      .json({ error: timedOut ? "TinyFish run timed out" : "TinyFish integration error" });
  } finally {
    clearTimeout(timer);
  }
}
