import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signup for:', email);
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for mobile
      }
    });
    
    console.log('AuthContext: Signup result:', { data: !!data, error: error?.message });
    setLoading(false);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signin for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('AuthContext: Supabase response received');
      console.log('AuthContext: Signin result:', error ? `Error: ${error.message}` : 'Success');
      
      if (error) {
        setLoading(false);
        return { error };
      }
      
      // If we get here and have a session, auth state change will handle the rest
      if (data.session) {
        console.log('AuthContext: Session received, waiting for auth state change...');
      }
      
      return { error: null };
    } catch (error) {
      console.log('AuthContext: Signin exception occurred');
      console.log('AuthContext: Exception details:', error instanceof Error ? error.message : String(error));
      setLoading(false);
      
      // Check if it's a network/connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        return { error: { message: 'Unable to connect to authentication service. Please check your internet connection and try again.' } };
      }
      
      return { error: { message: 'Authentication failed. Please try again.' } };
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};