
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileComplete: boolean;
  setProfileComplete: (complete: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ data: any; error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const setData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // If we have a user, check if their profile is complete
      if (session?.user) {
        // In a real app, we'd fetch profile completion status from the database
        // For now, we'll check localStorage as a demo
        const hasProfile = localStorage.getItem('profileComplete') === 'true';
        setProfileComplete(hasProfile);
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user just logged in, check profile status
        if (session?.user) {
          // In a real app, we'd fetch profile completion status from the database
          const hasProfile = localStorage.getItem('profileComplete') === 'true';
          setProfileComplete(hasProfile);
        }
        
        setLoading(false);
      }
    );

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSetProfileComplete = (complete: boolean) => {
    setProfileComplete(complete);
    localStorage.setItem('profileComplete', complete ? 'true' : 'false');
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signInWithPhone = async (phone: string) => {
    return await supabase.auth.signInWithOtp({
      phone,
    });
  };

  const verifyOtp = async (phone: string, token: string) => {
    return await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    profileComplete,
    setProfileComplete: handleSetProfileComplete,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
