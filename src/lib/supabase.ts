import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

// Lazy initialization to avoid build-time errors
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabase;
}

// Export as getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as Record<string, unknown>)[prop as string];
  },
});

// Helper to get workspace by slug
export async function getWorkspaceBySlug(slug: string) {
  const { data, error } = await getSupabase()
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

// Helper to get or create demo workspace
export async function getOrCreateDemoWorkspace() {
  const slug = process.env.DEMO_WORKSPACE_SLUG || 'maison_demo';

  const { data: existing } = await getSupabase()
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (existing) return existing;

  const { data: created, error } = await getSupabase()
    .from('workspaces')
    .insert({
      slug,
      name: 'MAISON SPECIAL Demo',
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}
