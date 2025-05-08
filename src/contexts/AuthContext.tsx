
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { toast } from "sonner";
import { getCurrentUser, updateUserProfile } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

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
  updateRole: (role: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const setData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // If we have a user, check if their profile is complete
      if (session?.user) {
        try {
          const userProfile = await getCurrentUser();
          if (userProfile) {
            setProfileComplete(userProfile.profile_complete || false);
          }
        } catch (error) {
          console.error('Error getting user profile:', error);
        }
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user just logged in, check profile status
        if (session?.user) {
          try {
            // Invalidate any existing queries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ['current-user'] });

            // Check if user already exists in our database
            const userProfile = await getCurrentUser();
            
            if (userProfile) {
              setProfileComplete(userProfile.profile_complete || false);
            } else if (session.user.user_metadata?.full_name) {
              // If user doesn't exist in our DB but has metadata from OAuth,
              // create basic profile automatically
              const name = session.user.user_metadata.full_name;
              await updateUserProfile({
                name,
                class_year: new Date().getFullYear().toString(),
                role: 'alum',
                profile_complete: false
              });
              setProfileComplete(false);
            }
          } catch (error) {
            console.error('Error checking profile status:', error);
          }
        } else {
          setProfileComplete(false);
        }
        
        setLoading(false);
      }
    );

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const handleSetProfileComplete = (complete: boolean) => {
    setProfileComplete(complete);
    if (complete) {
      // Only update in database if setting to complete
      updateUserProfile({ profile_complete: true })
        .catch(err => {
          console.error('Error updating profile completion status:', err);
        });
    }
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
    // Clear any cached queries
    queryClient.clear();
    
    // Sign out from supabase
    await supabase.auth.signOut();
    
    // Reset local state
    setProfileComplete(false);
  };
  
  const updateRole = async (role: string) => {
    try {
      const result = await updateUserProfile({
        role: role as any
      });
      
      return !!result;
    } catch (error) {
      console.error('Error updating role:', error);
      return false;
    }
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
    updateRole
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
