// api/tinyfish-poll.ts
// Polls the status of a TinyFish async run.
// Called by the browser: GET /api/tinyfish-poll?run_id=<id>&cache_key=<key>
//
// Returns the same shape as the completed tinyfish-research response so the
// browser code needs no special casing.

import { DEMO_CACHE } from "./tinyfish-research";

export const config = { maxDuration: 10 };

const TINYFISH_RUNS_URL = "https://agent.tinyfish.ai/v1/runs";

async function verifyUser(authHeader?: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey    = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TINYFISH_API_KEY is not configured on the server." });
  }

  if (!(await verifyUser(req.headers?.authorization))) {
    return res.status(401).json({ error: "Sign in required." });
  }

  const runId    = req.query?.run_id   as string | undefined;
  const cacheKey = req.query?.cache_key as string | undefined;

  if (!runId) {
    // If no run_id, try to serve from cache immediately
    if (cacheKey && DEMO_CACHE[cacheKey]) {
      return res.status(200).json({
        ok: true, runId: null, status: "COMPLETED",
        result: DEMO_CACHE[cacheKey], fromCache: true,
        note: "Served from pre-baked reference cache.",
      });
    }
    return res.status(400).json({ error: "run_id is required." });
  }

  try {
    const r = await fetch(`${TINYFISH_RUNS_URL}/${runId}`, {
      headers: { "X-API-Key": apiKey },
    });

    const data: any = await r.json().catch(() => ({}));

    if (!r.ok) {
      // If polling fails and we have a cache key, fall back
      if (cacheKey && DEMO_CACHE[cacheKey]) {
        return res.status(200).json({
          ok: true, runId, status: "COMPLETED",
          result: DEMO_CACHE[cacheKey], fromCache: true,
          note: "Served from pre-baked reference cache (poll failed). Verify against authoritative sources.",
        });
      }
      return res.status(502).json({ error: "Failed to poll TinyFish run", status: r.status });
    }

    const status: string = data.status ?? "UNKNOWN";
    const isDone = ["COMPLETED", "FAILED", "CANCELLED"].includes(status);

    if (status === "COMPLETED") {
      const result = data?.result?.result ?? data?.result ?? null;
      // If TinyFish returned empty result, fall back to cache
      if (!result && cacheKey && DEMO_CACHE[cacheKey]) {
        return res.status(200).json({
          ok: true, runId, status: "COMPLETED",
          result: DEMO_CACHE[cacheKey], fromCache: true,
          note: "Served from pre-baked reference cache (empty live result). Verify against authoritative sources.",
        });
      }
      return res.status(200).json({
        ok: true, runId, status, result, fromCache: false,
        note: "Third-party web research. Verify against the official IS code before use.",
      });
    }

    if (status === "FAILED" || status === "CANCELLED") {
      // Fall back to demo cache on failure
      if (cacheKey && DEMO_CACHE[cacheKey]) {
        return res.status(200).json({
          ok: true, runId, status: "COMPLETED",
          result: DEMO_CACHE[cacheKey], fromCache: true,
          note: "Served from pre-baked reference cache (run did not complete). Verify against authoritative sources.",
        });
      }
      return res.status(200).json({
        ok: false, runId, status,
        error: `Run ${status.toLowerCase()}: ${data?.error ?? "No details"}`,
      });
    }

    // Still PENDING or RUNNING — tell the client to keep polling
    return res.status(200).json({ ok: true, runId, status, result: null, isDone: false });
  } catch (e: any) {
    if (cacheKey && DEMO_CACHE[cacheKey]) {
      return res.status(200).json({
        ok: true, runId, status: "COMPLETED",
        result: DEMO_CACHE[cacheKey], fromCache: true,
        note: "Served from pre-baked reference cache (network error). Verify against authoritative sources.",
      });
    }
    return res.status(500).json({ error: "Poll error", detail: e?.message });
  }
}
