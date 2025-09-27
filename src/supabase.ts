import { createClient } from "@supabase/supabase-js";

// ⬇️ CRA injects these at build time (must start with REACT_APP_)
const url = process.env.REACT_APP_SUPABASE_URL as string;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

// Optional: safety check with a clearer message
if (!url) throw new Error("Missing REACT_APP_SUPABASE_URL (check your .env at project root)");
if (!key) throw new Error("Missing REACT_APP_SUPABASE_ANON_KEY (check your .env at project root)");

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

