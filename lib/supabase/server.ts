import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function createServerSupabaseClient(
  source: EnvironmentSource = process.env,
): SupabaseClient {
  const url = source.NEXT_PUBLIC_SUPABASE_URL;
  const anonymousKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.trim() || !anonymousKey?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, anonymousKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
