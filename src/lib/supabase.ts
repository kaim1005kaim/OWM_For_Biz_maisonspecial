import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key (no RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to get workspace by slug
export async function getWorkspaceBySlug(slug: string) {
  const { data, error } = await supabase
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

  const { data: existing } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
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
