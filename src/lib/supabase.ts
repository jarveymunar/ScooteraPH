import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment or Next.js environment or user runtime configuration
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || '';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Allow runtime overrides stored in localStorage for interactive testing in AI Studio
function getRuntimeConfig() {
  if (typeof window === 'undefined') {
    return { url: defaultUrl, key: defaultKey };
  }
  const customUrl = localStorage.getItem('scootera_supabase_url');
  const customKey = localStorage.getItem('scootera_supabase_anon_key');
  return {
    url: customUrl || defaultUrl,
    key: customKey || defaultKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getRuntimeConfig();
  return Boolean(url && key && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getRuntimeConfig();
  if (!url || !key) {
    return null;
  }
  try {
    return createClient(url, key);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveCustomSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('scootera_supabase_url', url);
    else localStorage.removeItem('scootera_supabase_url');

    if (key) localStorage.setItem('scootera_supabase_anon_key', key);
    else localStorage.removeItem('scootera_supabase_anon_key');
  }
}

export function getActiveSupabaseConfig(): { url: string; key: string } {
  return getRuntimeConfig();
}
