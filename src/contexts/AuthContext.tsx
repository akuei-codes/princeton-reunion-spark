
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserGender, GenderPreference } from '@/types/database';
import { updateUserProfile } from '@/lib/api';

interface AuthContextType {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, classYear: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  user: any | null;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session) {
        await loadUserProfile();
      } else {
        setLoading(false);
      }
    }
    
    loadSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state changed: ${event}`);
        setSession(session);
        
        if (session) {
          await loadUserProfile();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          interests:user_interests(name:interests(*)),
          clubs:user_clubs(name:clubs(*))
        `)
        .eq('auth_id', session?.user.id)
        .single();
      
      if (error) {
        console.error('Error loading user profile:', error);
        throw error;
      }
      
      setUser(userData);
      
      // Check if profile is complete
      const isComplete = Boolean(
        userData.bio && 
        userData.major && 
        userData.gender && 
        userData.gender_preference &&
        (userData.photo_urls && userData.photo_urls.length > 0)
      );
      
      setIsProfileComplete(isComplete);
      setLoading(false);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Navigate based on profile completion
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('bio, major, gender, photo_urls')
          .eq('auth_id', data.user.id)
          .single();
          
        const isComplete = Boolean(
          userData?.bio && 
          userData?.major && 
          userData?.gender && 
          (userData?.photo_urls && userData?.photo_urls.length > 0)
        );
        
        if (!isComplete) {
          navigate('/setup');
        } else {
          navigate('/swipe');
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, classYear: string) => {
    try {
      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create the user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              auth_id: data.user.id,
              name,
              class_year: classYear,
              bio: '',
              major: '',
              gender: 'other' as UserGender, 
              gender_preference: 'everyone' as GenderPreference,
            }
          ]);
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          throw profileError;
        }
        
        navigate('/setup');
      }
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      signIn, 
      signUp, 
      signOut, 
      loading, 
      user, 
      isProfileComplete 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
