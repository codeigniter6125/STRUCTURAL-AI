// src/lib/tinyfish.ts  (browser-side helper; calls YOUR api route, never TinyFish directly)
import { supabase } from "./supabase";

export type ResearchTopic = "repair_guidance" | "code_lookup" | "material_rates";

export interface ResearchRequest {
  topic: ResearchTopic;
  defectType: string;
  element?: string;
  location?: string;
}

export async function researchDefect(req: ResearchRequest) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in first.");

  const r = await fetch("/api/tinyfish-research", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(req),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || "Research failed");
  return json as { ok: true; runId: string | null; status: string | null; result: any; note: string };
}

// Example usage in a defect card:
//   const res = await researchDefect({ topic: "repair_guidance", defectType: "crack", element: "column" });
//   setRepairInfo(res.result);
