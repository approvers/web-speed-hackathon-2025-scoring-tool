import { createClient } from "@supabase/supabase-js";

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = import.meta.env;
if (url == null || key == null) {
  throw new Error("supabase creds missing");
}
export const supabase = createClient(url, key);
