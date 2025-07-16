import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('SUPABASE_URL exists:', !!supabaseUrl);
  console.log('SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: undefined, // Use default AsyncStorage for mobile
    storageKey: 'plantpal-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'plantpal-mobile',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});