import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin client with service_role privileges.
 * This client bypasses RLS and should ONLY be used in server-side actions/routes.
 * NEVER expose the SERVICE_ROLE_KEY to the client.
 */
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
