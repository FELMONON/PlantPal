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
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Attempting signin for:', email);
    setLoading(true);
    
    try {
      // Add timeout for mobile networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      clearTimeout(timeoutId);
      console.log('AuthContext: Supabase response received');
      console.log('AuthContext: Signin result:', error ? `Error: ${error.message}` : 'Success');
      
      if (error) {
        setLoading(false);
        
        // Handle 502 and server errors
        if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
          return { error: { message: 'Server temporarily unavailable. Please try again in a few moments.' } };
        }
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Invalid email or password. Please check your credentials or sign up for a new account.' } };
        } else if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Please check your email and click the confirmation link before signing in.' } };
        } else if (error.message.includes('Too many requests')) {
          return { error: { message: 'Too many sign-in attempts. Please wait a few minutes and try again.' } };
        } else if (error.message.includes('User not found')) {
          return { error: { message: 'No account found with this email. Please sign up first.' } };
        }
        
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
      if (errorMessage.includes('fetch') || 
          errorMessage.includes('network') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('502') ||
          errorMessage.includes('Bad Gateway') ||
          errorMessage.includes('aborted')) {
        return { error: { message: 'Unable to connect to authentication service. Please check your internet connection and try again.' } };
      }
      
      return { error: { message: 'Authentication failed. Please try again.' } };
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    setLoading(true);
    await supabase.auth.signOut();
    try {
      // Add timeout for mobile networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation for mobile
        }
      });
      
      clearTimeout(timeoutId);
      console.log('AuthContext: Signup result:', { data: !!data, error: error?.message });
      setLoading(false);
      
      if (error) {
        // Handle 502 and server errors
        if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
          return { data, error: { message: 'Server temporarily unavailable. Please try again in a few moments.' } };
        }
      }
      
      return { data, error };
    } catch (error) {
      console.log('AuthContext: Signup exception occurred');
      console.log('AuthContext: Exception details:', error instanceof Error ? error.message : String(error));
      setLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('502') || 
          errorMessage.includes('Bad Gateway') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('fetch')) {
        return { data: null, error: { message: 'Server temporarily unavailable. Please try again in a few moments.' } };
      }
      
      return { data: null, error: { message: 'Signup failed. Please try again.' } };
    }
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