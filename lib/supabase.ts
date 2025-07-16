import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Conditionally import AsyncStorage only in client-side environments
const getStorage = () => {
  if (typeof window !== 'undefined') {
    // We're in a browser or React Native environment
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage;
    } catch (error) {
      // Fallback to a dummy storage for web environments
      return {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      };
    }
  }
  // We're in a Node.js environment (SSR), provide dummy storage
  return {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
};

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
    storage: getStorage(),
    storageKey: 'plantpal-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'plantpal-mobile',
      'apikey': supabaseAnonKey!,
      'Authorization': `Bearer ${supabaseAnonKey!}`,
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  db: {
    schema: 'public',
  },
});