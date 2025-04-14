import { createClient, type PostgrestError } from "@supabase/supabase-js";

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = import.meta.env;
if (url == null || key == null) {
  throw new Error("supabase creds missing");
}
export const supabase = createClient(url, key);

export interface ScoreData {
  username: string;
  latest_score_total: number;
}

export async function getScoreboard(): Promise<Array<ScoreData> | { error: PostgrestError }> {
  const res = await supabase.from("ranked_scores").select().order("rank");

  if (res.error != null) {
    return { error: res.error };
  }

  return res.data;
}
