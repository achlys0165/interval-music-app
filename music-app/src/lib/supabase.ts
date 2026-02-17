import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client for development if env vars are missing
const isDev = !supabaseUrl || !supabaseAnonKey;

if (isDev) {
  console.warn('⚠️ Supabase env vars not found. App running in offline/demo mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Mock auth functions for development when env vars are missing
export const signInWithEmail = async (email: string, password: string) => {
  if (isDev) {
    console.log('🔧 Dev mode: Mock login');
    return { 
      data: { 
        user: { 
          id: 'dev-user-123', 
          email: email,
          user_metadata: { full_name: 'Dev User' }
        } 
      }, 
      error: null 
    };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signInWithGoogle = async () => {
  if (isDev) {
    console.log('🔧 Dev mode: Mock Google login');
    return { data: { url: '#' }, error: null };
  }
  
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  const redirectTo = isLocalhost
    ? 'http://localhost:5173/'
    : 'https://top-himig.vercel.app/'; 

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  
  return { data, error };
};

export const signOut = async () => {
  if (isDev) {
    console.log('🔧 Dev mode: Mock logout');
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) => {
  if (isDev) {
    console.log(`🔧 Dev mode: Mock subscription to ${table}`);
    return () => {};
  }
  
  const channel = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event, schema: 'public', table }, callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
};