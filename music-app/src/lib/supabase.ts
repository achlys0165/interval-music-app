import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasRealCredentials = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder');

if (!hasRealCredentials) {
  console.warn('⚠️ Supabase env vars not found. App running in offline/demo mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

const isDevMode = () => {
  return !hasRealCredentials || 
    supabaseUrl?.includes('placeholder') || 
    !supabaseUrl?.includes('supabase.co');
};

export const signInWithEmail = async (email: string, password: string) => {
  if (isDevMode()) {
    console.log('🔧 Dev mode: Mock login');
    return { 
      data: { 
        user: { 
          id: 'dev-user-123', 
          email: email,
          user_metadata: { full_name: 'Dev User', username: 'devuser' }
        } 
      }, 
      error: null 
    };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, metadata: any) => {
  if (isDevMode()) {
    console.log('🔧 Dev mode: Mock signup');
    return { 
      data: { 
        user: { 
          id: 'dev-user-' + Date.now(), 
          email: email,
          user_metadata: metadata
        } 
      }, 
      error: null 
    };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  if (isDevMode()) {
    console.log('🔧 Dev mode: Mock Google login');
    return { data: { url: '#' }, error: null };
  }
  
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  const redirectTo = isLocalhost
    ? 'http://localhost:5173/'
    : 'https://himig.vercel.app/';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  
  return { data, error };
};

export const signOut = async () => {
  if (isDevMode()) {
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
  if (isDevMode()) {
    console.log(`🔧 Dev mode: Mock subscription to ${table}`);
    return () => {};
  }
  
  const channel = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event, schema: 'public', table }, callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
};