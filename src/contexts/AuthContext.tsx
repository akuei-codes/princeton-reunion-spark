
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserGender, GenderPreference } from '@/types/database';
import { updateUserProfile } from '@/lib/api';
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, classYear: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  user: any | null;
  isProfileComplete: boolean;
  profileComplete: boolean;
  setProfileComplete: (value: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
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
        console.log("Session found, loading user profile with ID:", data.session.user.id);
        try {
          // First ensure the user profile exists
          await ensureUserProfile(data.session.user.id, data.session.user);
          await loadUserProfile(data.session.user.id);
        } catch (error) {
          console.error("Error during initial profile load:", error);
          setLoading(false);
        }
      } else {
        console.log("No session found, skipping profile load");
        setLoading(false);
      }
    }
    
    loadSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state changed: ${event}`, session?.user?.id);
        setSession(session);
        
        if (session && session.user) {
          console.log("Auth state change with session, loading profile for:", session.user.id);
          
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            try {
              // Check if user exists in database
              await ensureUserProfile(session.user.id, session.user);
              await loadUserProfile(session.user.id);
            } catch (error) {
              console.error("Error during auth state change:", error);
              setLoading(false);
            }
          } else {
            try {
              await loadUserProfile(session.user.id);
            } catch (error) {
              console.error("Error loading profile on auth state change:", error);
              setLoading(false);
            }
          }
        } else {
          console.log("Auth state change without session, clearing user data");
          setUser(null);
          setIsProfileComplete(false);
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

  // New function to ensure a user profile exists
  const ensureUserProfile = async (userId: string, authUser: any) => {
    try {
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing user:', checkError);
        // Continue anyway to try to create the user
      }
      
      // If user doesn't exist, create a new profile
      if (!existingUser) {
        console.log("Creating new user profile for auth_id:", userId);
        
        // Extract name from metadata or email
        let name = '';
        if (authUser.user_metadata && authUser.user_metadata.full_name) {
          name = authUser.user_metadata.full_name;
        } else if (authUser.email) {
          name = authUser.email.split('@')[0]; // Use part before @ as name
        } else if (authUser.phone) {
          name = "Phone User"; // Default name for phone users
        } else {
          name = "New User";
        }
        
        // Create the user profile with only fields that exist in the schema
        const { error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: userId,
            name: name,
            class_year: 'Current Student',
            role: 'current_student', // Required field
            bio: '',
            major: '',
            gender: 'other' as UserGender, 
            gender_preference: 'everyone' as GenderPreference,
            profile_complete: false
          });
        
        if (createError) {
          console.error('Error creating new user profile:', createError);
          toast.error("Failed to create your profile. Please try again.");
          throw createError; // Re-throw to handle upstream
        } else {
          console.log("Successfully created new user profile");
          toast.success("Welcome! Please complete your profile to get started.");
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
      throw error; // Re-throw for upstream handling
    }
  };
  
  const loadUserProfile = async (userId: string) => {
    if (!userId) {
      console.error("Cannot load user profile: userId is undefined");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Loading user profile for auth_id:", userId);
      // Use .single() carefully, or use maybeSingle() to avoid 406 errors
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          *,
          interests:user_interests(name:interests(*)),
          clubs:user_clubs(name:clubs(*))
        `)
        .eq('auth_id', userId)
        .maybeSingle(); // Using maybeSingle instead of single
      
      if (error) {
        console.error('Error loading user profile:', error);
        
        // Special handling for "no rows returned" - this is expected for new users
        if (error.code === 'PGRST116') {
          console.log("No user profile found - likely a new user");
          setUser(null);
          setIsProfileComplete(false);
        } else {
          throw error;
        }
      } else if (userData) {
        console.log("User profile loaded successfully:", userData.id);
        setUser(userData);
        
        // Check if profile is complete
        const isComplete = Boolean(
          userData.bio && 
          userData.major && 
          userData.gender && 
          userData.gender_preference &&
          (userData.photo_urls && userData.photo_urls.length > 0)
        );
        
        console.log("Profile complete status:", isComplete);
        setIsProfileComplete(isComplete);
      } else {
        // No error but also no data
        console.log("No user profile data returned");
        setUser(null);
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
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
        console.log("User signed up successfully, creating profile for:", data.user.id);
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
              profile_complete: false,
            }
          ]);
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          throw profileError;
        }
        
        navigate('/profile-setup');
      }
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      throw error;
    }
  };

  // Rename this function for consistency but keep implementation
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsProfileComplete(false);
    navigate('/');
  };

  // Implement Google authentication
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
      
      console.log('Google authentication initiated:', data);
    } catch (error: any) {
      console.error('Failed to sign in with Google:', error.message);
      throw error;
    }
  };

  // Update phone authentication to create profile
  const signInWithPhone = async (phoneNumber: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      
      if (error) throw error;
      console.log('Phone OTP sent:', data);
    } catch (error: any) {
      console.error('Phone sign in error:', error.message);
      throw error;
    }
  };

  const verifyOtp = async (phoneNumber: string, otp: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });
      
      if (error) throw error;
      console.log('OTP verified successfully for user:', data.user?.id);
      
      if (data.user) {
        // ensureUserProfile will create a profile if one doesn't exist
        await ensureUserProfile(data.user.id, data.user);
        await loadUserProfile(data.user.id);
        
        // Determine where to navigate
        if (!isProfileComplete) {
          navigate('/profile-setup');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      signIn, 
      signUp, 
      signOut, 
      loading, 
      user, 
      isProfileComplete,
      profileComplete: isProfileComplete,
      setProfileComplete: setIsProfileComplete,
      signInWithGoogle,
      signInWithPhone,
      verifyOtp
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
