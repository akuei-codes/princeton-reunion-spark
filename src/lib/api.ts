
import { supabase } from './supabase';
import { UserGender, GenderPreference } from '@/types/database';

// Get the currently logged in user from the database
export const getCurrentUser = async () => {
  // Get the user ID from the session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No authenticated user');
  }

  const userId = session.user.id;
  console.log("getCurrentUser: Looking up user with auth_id:", userId);

  try {
    // Use maybeSingle to handle case where the user might not exist yet
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .eq('auth_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData: {
  name?: string;
  bio?: string;
  major?: string;
  gender?: UserGender;
  gender_preference?: GenderPreference;
  photo_urls?: string[];
  profile_complete?: boolean;
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No authenticated user');
  }

  try {
    // First get the user's database ID using auth_id
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .maybeSingle();
      
    if (!userData) {
      throw new Error('User profile not found');
    }
    
    // Now update using the database ID
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userData.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
