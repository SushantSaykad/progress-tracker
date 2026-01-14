import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yvmmhdeemzaknucodcjw.supabase.co";
const supabaseAnonKey = "sb_publishable_uTNhdYA64CY9aIkkQ0nUrg_8cPoiFmU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
