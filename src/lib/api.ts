
import { supabase } from './supabase';
import { UserGender, GenderPreference } from '@/types/database';

export interface UserWithRelations {
  id: string;
  auth_id: string;
  name: string;
  class_year: string;
  bio: string;
  major: string;
  gender: UserGender;
  gender_preference: GenderPreference;
  building?: string;
  vibe?: string;
  photo_urls: string[];
  role: string;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
  interests: { name: string[] }[];
  clubs: { name: string[] }[];
}

/**
 * Updates the logged in user's profile
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: {
    bio?: string;
    major?: string;
    gender?: UserGender;
    gender_preference?: GenderPreference;
    building?: string;
    vibe?: string;
    photo_urls?: string[];
    interests?: string[];
    clubs?: string[];
  }
) => {
  try {
    // First update the basic profile fields
    const { error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
        profile_complete: true
      })
      .eq('auth_id', userId);
    
    if (error) throw error;
    
    // If interests are provided, update the user_interests table
    if (profileData.interests && profileData.interests.length > 0) {
      // First delete all existing interests for the user
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Insert new interests
      const interestRows = profileData.interests.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }));
      
      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(interestRows);
      
      if (insertError) throw insertError;
    }
    
    // If clubs are provided, update the user_clubs table
    if (profileData.clubs && profileData.clubs.length > 0) {
      // First delete all existing clubs for the user
      const { error: deleteError } = await supabase
        .from('user_clubs')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Insert new clubs
      const clubRows = profileData.clubs.map(clubId => ({
        user_id: userId,
        club_id: clubId
      }));
      
      const { error: insertError } = await supabase
        .from('user_clubs')
        .insert(clubRows);
      
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Uploads a user photo to Supabase Storage
 */
export const uploadUserPhoto = async (userId: string, file: File): Promise<string> => {
  try {
    // Ensure the bucket exists
    const bucketName = 'user-photos';
    
    // Create a unique file name using the current timestamp
    const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    
    // Upload the file
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(`${userId}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(`${userId}/${fileName}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading user photo:', error);
    throw error;
  }
};

/**
 * Gets potential matches for the user to swipe on
 */
export const getPotentialMatches = async (userId: string, limit: number = 20): Promise<UserWithRelations[]> => {
  try {
    // Get the user's gender preference
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('gender_preference, gender')
      .eq('auth_id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Build query based on gender preference
    let query = supabase
      .from('users')
      .select(`
        *,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .neq('auth_id', userId) // Don't include the current user
      .eq('profile_complete', true) // Only include users with complete profiles
      .order('created_at', { ascending: false }) // Get newest profiles first
      .limit(limit);
    
    // Filter based on the user's gender preference
    if (currentUser.gender_preference !== 'everyone') {
      query = query.eq('gender', currentUser.gender_preference);
    }
    
    // Get users who haven't been swiped on yet
    const { data: swipedUserIds, error: swipeError } = await supabase
      .from('swipes')
      .select('swiped_user_id')
      .eq('user_id', userId);
    
    if (swipeError) throw swipeError;
    
    // If there are swiped users, exclude them from results
    if (swipedUserIds && swipedUserIds.length > 0) {
      const ids = swipedUserIds.map(s => s.swiped_user_id);
      query = query.not('auth_id', 'in', `(${ids.join(',')})`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as UserWithRelations[];
  } catch (error) {
    console.error('Error getting potential matches:', error);
    throw error;
  }
};

/**
 * Records a user's swipe (like or pass)
 */
export const recordSwipe = async (
  userId: string, 
  swipedUserId: string, 
  liked: boolean
): Promise<{ isMatch: boolean }> => {
  try {
    // Record the swipe
    const { error } = await supabase
      .from('swipes')
      .insert({
        user_id: userId,
        swiped_user_id: swipedUserId,
        liked,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // If liked, check if there's a mutual like (a match)
    if (liked) {
      const { data, error: matchError } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', swipedUserId)
        .eq('swiped_user_id', userId)
        .eq('liked', true)
        .single();
      
      if (matchError && matchError.code !== 'PGRST116') throw matchError;
      
      if (data) {
        // It's a match! Create a new chat
        const { error: chatError } = await supabase
          .from('chats')
          .insert({
            user1_id: userId,
            user2_id: swipedUserId,
            created_at: new Date().toISOString()
          });
        
        if (chatError) throw chatError;
        
        return { isMatch: true };
      }
    }
    
    return { isMatch: false };
  } catch (error) {
    console.error('Error recording swipe:', error);
    throw error;
  }
};

/**
 * Gets a user's matches
 */
export const getUserMatches = async (userId: string): Promise<any[]> => {
  try {
    // Get chats where the user is either user1 or user2
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        user1:user1_id(*),
        user2:user2_id(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
    if (error) throw error;
    
    // Transform the data to get the matched user
    const matches = data.map(chat => {
      // Determine which user in the chat is the matched user
      const matchedUser = chat.user1.auth_id === userId ? chat.user2 : chat.user1;
      
      return {
        chatId: chat.id,
        userId: matchedUser.auth_id,
        name: matchedUser.name,
        photoUrl: matchedUser.photo_urls ? matchedUser.photo_urls[0] : null,
        lastActivity: chat.updated_at || chat.created_at
      };
    });
    
    return matches;
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
};

/**
 * Gets messages for a specific chat
 */
export const getMessages = async (chatId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Sends a message in a chat
 */
export const sendMessage = async (
  chatId: string, 
  senderId: string, 
  content: string
): Promise<any> => {
  try {
    // Insert the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update the chat's updated_at timestamp
    const { error: updateError } = await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);
    
    if (updateError) throw updateError;
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Marks all messages in a chat as read
 */
export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('read', false);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Gets hot zones (popular locations)
 */
export const getHotZones = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('hot_zones')
      .select('*')
      .order('user_count', { ascending: false });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting hot zones:', error);
    throw error;
  }
};
