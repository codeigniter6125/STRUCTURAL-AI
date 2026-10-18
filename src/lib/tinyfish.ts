// src/lib/tinyfish.ts  (browser-side helper; calls YOUR api routes, never TinyFish directly)
//
// Flow:
//   1. POST /api/tinyfish-research → starts a /run-async job, returns { runId, cacheKey, status }
//   2. If status is already COMPLETED (cache hit or instant result) → return immediately.
//   3. Otherwise poll GET /api/tinyfish-poll?run_id=&cache_key= every POLL_INTERVAL_MS
//      until COMPLETED, FAILED or CANCELLED (or MAX_POLLS reached).

import { supabase } from "./supabase";

export type ResearchTopic = "repair_guidance" | "code_lookup" | "material_rates";

export interface ResearchRequest {
  topic: ResearchTopic;
  defectType: string;
  element?: string;
  location?: string;
}

export interface ResearchResponse {
  ok: boolean;
  runId: string | null;
  status: string;
  result: any;
  fromCache?: boolean;
  note: string;
}

const POLL_INTERVAL_MS = 3_000;   // poll every 3 s
const MAX_POLLS = 30;             // give up after 90 s total

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in first.");
  return `Bearer ${token}`;
}

export async function researchDefect(req: ResearchRequest): Promise<ResearchResponse> {
  const auth = await authHeader();

  // --- Step 1: Start the async run ---
  const startRes = await fetch("/api/tinyfish-research", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(req),
  });
  const startJson: any = await startRes.json();
  if (!startRes.ok) throw new Error(startJson.error || "Research failed to start.");

  // Cache hit or instant result — no polling needed
  if (startJson.status === "COMPLETED") {
    return startJson as ResearchResponse;
  }

  // --- Step 2: Poll until done ---
  const { runId, cacheKey } = startJson;
  if (!runId) {
    // run_id missing and not completed — unexpected; return what we have
    throw new Error(startJson.error || "Research run could not be started.");
  }

  const pollUrl = `/api/tinyfish-poll?run_id=${encodeURIComponent(runId)}${
    cacheKey ? `&cache_key=${encodeURIComponent(cacheKey)}` : ""
  }`;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(pollUrl, { headers: { Authorization: auth } });
    const pollJson: any = await pollRes.json();

    if (!pollRes.ok) {
      throw new Error(pollJson.error || "Polling failed.");
    }

    const done = ["COMPLETED", "FAILED", "CANCELLED"].includes(pollJson.status ?? "");

    if (done) {
      if (!pollJson.ok) {
        throw new Error(pollJson.error || `Run ended with status ${pollJson.status}`);
      }
      return pollJson as ResearchResponse;
    }
    // status is PENDING or RUNNING — keep looping
  }

  throw new Error("Research timed out after 90 seconds. Please try again.");
}
