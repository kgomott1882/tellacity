/** Single browser client , anon key + session; no service role. */
import { supabaseBrowser, supabase } from "@/lib/supabaseBrowser";

export function createClient() {
  return supabaseBrowser();
}

export { supabaseBrowser, supabase };
