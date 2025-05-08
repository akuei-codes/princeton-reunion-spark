
import { supabase } from './supabase';
import type { 
  User, UserPhoto, Interest, Club, Swipe, Match, Message,
  HotZone, HotZoneEvent, UserWithRelations, MatchWithUserAndLastMessage,
  HotZoneWithEvents 
} from '../types/database';
import { toast } from "sonner";

// Transform format of timestamp_string from "2023-01-01T00:00:00.000Z" to "1d" or "2h" etc.
const formatTimeSince = (timestamp_string: string): string => {
  const timestamp = new Date(timestamp_string).getTime();
  const now = new Date().getTime();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Just now';
};

// Helper to check if a user has a match with another user
export const checkIfMatched = async (userId: string, otherUserId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .or(`user_id_1.eq.${otherUserId},user_id_2.eq.${otherUserId}`)
    .limit(1);
    
  if (error) {
    console.error('Error checking match:', error);
    return false;
  }
  
  return data && data.length > 0;
};

// Get current user from auth session
export const getCurrentUser = async (): Promise<UserWithRelations | null> => {
  try {
    // Get the current session user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    // Get the user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return null;
    }
    
    // Get the user photos
    const { data: photosData, error: photosError } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', userData.id)
      .order('position', { ascending: true });
      
    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }
    
    // Get user interests
    const { data: interestsJunction, error: interestsError } = await supabase
      .from('user_interests')
      .select('interests(*)')
      .eq('user_id', userData.id);
      
    if (interestsError) {
      console.error('Error fetching interests:', interestsError);
    }
    
    // Get user clubs
    const { data: clubsJunction, error: clubsError } = await supabase
      .from('user_clubs')
      .select('clubs(*)')
      .eq('user_id', userData.id);
      
    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
    }
    
    // Format the data
    const interests = interestsJunction?.map(item => item.interests) || [];
    const clubs = clubsJunction?.map(item => item.clubs) || [];
    
    return {
      ...userData,
      photos: photosData || [],
      interests,
      clubs
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Get user by ID with all relations
export const getUserById = async (userId: string): Promise<UserWithRelations | null> => {
  try {
    // Get the user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return null;
    }
    
    // Get the user photos
    const { data: photosData, error: photosError } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });
      
    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }
    
    // Get user interests
    const { data: interestsJunction, error: interestsError } = await supabase
      .from('user_interests')
      .select('interests(*)')
      .eq('user_id', userId);
      
    if (interestsError) {
      console.error('Error fetching interests:', interestsError);
    }
    
    // Get user clubs
    const { data: clubsJunction, error: clubsError } = await supabase
      .from('user_clubs')
      .select('clubs(*)')
      .eq('user_id', userId);
      
    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
    }
    
    // Format the data
    const interests = interestsJunction?.map(item => item.interests) || [];
    const clubs = clubsJunction?.map(item => item.clubs) || [];
    
    return {
      ...userData,
      photos: photosData || [],
      interests,
      clubs
    };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

// Create or update user profile
export const updateUserProfile = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    // Check if user exists already
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();
      
    let result;
    
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('auth_id', session.user.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          auth_id: session.user.id
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      
      result = data;
    }
    
    return result;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Upload user photo and add to user_photos
export const uploadUserPhoto = async (file: File, position: number): Promise<UserPhoto | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('user-photos')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('user-photos')
      .getPublicUrl(filePath);
      
    // Add entry to user_photos table
    const { data, error } = await supabase
      .from('user_photos')
      .insert({
        user_id: currentUser.id,
        photo_url: publicUrl,
        position
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding photo to database:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in uploadUserPhoto:', error);
    return null;
  }
};

// Delete user photo
export const deleteUserPhoto = async (photoId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_photos')
      .delete()
      .eq('id', photoId);
      
    if (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteUserPhoto:', error);
    return false;
  }
};

// Update user interests
export const updateUserInterests = async (interests: string[]): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    // First, delete existing interests
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', currentUser.id);
      
    if (deleteError) {
      console.error('Error deleting interests:', deleteError);
      return false;
    }
    
    // Get or create interests
    const interestRecords = [];
    
    for (const interest of interests) {
      // Check if interest exists
      let { data: existingInterest } = await supabase
        .from('interests')
        .select('*')
        .eq('name', interest)
        .single();
        
      if (!existingInterest) {
        // Create the interest
        const { data, error } = await supabase
          .from('interests')
          .insert({ name: interest })
          .select()
          .single();
          
        if (error) {
          console.error('Error creating interest:', error);
          continue;
        }
        
        existingInterest = data;
      }
      
      interestRecords.push({
        user_id: currentUser.id,
        interest_id: existingInterest.id
      });
    }
    
    // Insert the user_interests records
    if (interestRecords.length > 0) {
      const { error } = await supabase
        .from('user_interests')
        .insert(interestRecords);
        
      if (error) {
        console.error('Error adding interests:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserInterests:', error);
    return false;
  }
};

// Update user clubs
export const updateUserClubs = async (clubs: string[]): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    // First, delete existing clubs
    const { error: deleteError } = await supabase
      .from('user_clubs')
      .delete()
      .eq('user_id', currentUser.id);
      
    if (deleteError) {
      console.error('Error deleting clubs:', deleteError);
      return false;
    }
    
    // Get or create clubs
    const clubRecords = [];
    
    for (const club of clubs) {
      // Check if club exists
      let { data: existingClub } = await supabase
        .from('clubs')
        .select('*')
        .eq('name', club)
        .single();
        
      if (!existingClub) {
        // Create the club
        const { data, error } = await supabase
          .from('clubs')
          .insert({ name: club })
          .select()
          .single();
          
        if (error) {
          console.error('Error creating club:', error);
          continue;
        }
        
        existingClub = data;
      }
      
      clubRecords.push({
        user_id: currentUser.id,
        club_id: existingClub.id
      });
    }
    
    // Insert the user_clubs records
    if (clubRecords.length > 0) {
      const { error } = await supabase
        .from('user_clubs')
        .insert(clubRecords);
        
      if (error) {
        console.error('Error adding clubs:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserClubs:', error);
    return false;
  }
};

// Get potential matches for swiping
export const getPotentialMatches = async (): Promise<UserWithRelations[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    
    // Get users who haven't been swiped yet by the current user
    const { data: swipedUsers } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', currentUser.id);
      
    const swipedIds = swipedUsers?.map(swipe => swipe.swiped_id) || [];
    
    // Always exclude the current user
    swipedIds.push(currentUser.id);
    
    // Get users who aren't in the swiped list
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .not('id', 'in', `(${swipedIds.join(',')})`)
      .eq('profile_complete', true)
      .limit(20);
      
    if (error) {
      console.error('Error fetching potential matches:', error);
      return [];
    }
    
    // Get additional details for each user
    const usersWithDetails = await Promise.all(users.map(async user => {
      // Get photos
      const { data: photos } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });
        
      // Get interests
      const { data: interestsJunction } = await supabase
        .from('user_interests')
        .select('interests(*)')
        .eq('user_id', user.id);
        
      // Get clubs
      const { data: clubsJunction } = await supabase
        .from('user_clubs')
        .select('clubs(*)')
        .eq('user_id', user.id);
        
      // Format the data
      const interests = interestsJunction?.map(item => item.interests) || [];
      const clubs = clubsJunction?.map(item => item.clubs) || [];
      
      return {
        ...user,
        photos: photos || [],
        interests,
        clubs
      };
    }));
    
    return usersWithDetails;
  } catch (error) {
    console.error('Error in getPotentialMatches:', error);
    return [];
  }
};

// Record swipe
export const recordSwipe = async (swipedId: string, direction: 'left' | 'right'): Promise<{ isMatch: boolean }> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { isMatch: false };
    
    // Record the swipe
    const { error } = await supabase
      .from('swipes')
      .insert({
        swiper_id: currentUser.id,
        swiped_id: swipedId,
        direction
      });
      
    if (error) {
      console.error('Error recording swipe:', error);
      return { isMatch: false };
    }
    
    // Check if this created a match
    if (direction === 'right') {
      const { data } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', swipedId)
        .eq('swiped_id', currentUser.id)
        .eq('direction', 'right')
        .single();
        
      if (data) {
        // It's a match! (Check if the match was created by the trigger)
        const matchId1 = currentUser.id < swipedId ? currentUser.id : swipedId;
        const matchId2 = currentUser.id < swipedId ? swipedId : currentUser.id;
        
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id_1', matchId1)
          .eq('user_id_2', matchId2)
          .single();
          
        return { isMatch: !!matchData };
      }
    }
    
    return { isMatch: false };
  } catch (error) {
    console.error('Error in recordSwipe:', error);
    return { isMatch: false };
  }
};

// Get user matches with last message
export const getUserMatches = async (): Promise<MatchWithUserAndLastMessage[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    
    // Get all matches for current user
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
    
    // Get details for each match
    const matchesWithDetails = await Promise.all(matches.map(async match => {
      // Determine the other user in this match
      const otherUserId = match.user_id_1 === currentUser.id ? match.user_id_2 : match.user_id_1;
      const otherUser = await getUserById(otherUserId);
      
      if (!otherUser) return null;
      
      // Get the most recent message for this match
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      const lastMessage = messages && messages.length > 0 ? {
        message: messages[0].message,
        created_at: messages[0].created_at,
        sender_id: messages[0].sender_id,
        read: messages[0].read
      } : undefined;
      
      return {
        id: match.id,
        created_at: match.created_at,
        other_user: otherUser,
        last_message
      };
    }));
    
    // Filter out null results and format for UI
    return matchesWithDetails.filter(Boolean).map(match => {
      if (!match) return null;
      
      return {
        ...match,
        other_user: {
          ...match.other_user,
          name: match.other_user.name,
          classYear: match.other_user.class_year,
          lastMessage: match.last_message?.message || 'Just matched!',
          time: match.last_message ? formatTimeSince(match.last_message.created_at) : formatTimeSince(match.created_at),
          photo: match.other_user.photos[0]?.photo_url || '',
          unread: match.last_message ? !match.last_message.read && match.last_message.sender_id !== currentUser.id : false,
        }
      };
    }).filter(Boolean) as MatchWithUserAndLastMessage[];
  } catch (error) {
    console.error('Error in getUserMatches:', error);
    return [];
  }
};

// Get messages for a specific match
export const getMessages = async (matchId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getMessages:', error);
    return [];
  }
};

// Send message
export const sendMessage = async (matchId: string, message: string): Promise<Message | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUser.id,
        message
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return null;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (matchId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;
    
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', currentUser.id)
      .eq('read', false);
      
    if (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    return false;
  }
};

// Get hot zones
export const getHotZones = async (): Promise<HotZoneWithEvents[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    
    const { data: zones, error } = await supabase
      .from('hot_zones')
      .select('*')
      .order('active_users', { ascending: false });
      
    if (error) {
      console.error('Error fetching hot zones:', error);
      return [];
    }
    
    // Get details for each hot zone
    const zonesWithDetails = await Promise.all(zones.map(async zone => {
      // Get events for this zone
      const { data: events } = await supabase
        .from('hot_zone_events')
        .select('*')
        .eq('hot_zone_id', zone.id);
        
      // Get random number of matches nearby (simulated for now)
      const matchesNearby = Math.floor(Math.random() * 5) + 1;
      
      return {
        ...zone,
        events: events || [],
        matches_nearby: matchesNearby
      };
    }));
    
    return zonesWithDetails;
  } catch (error) {
    console.error('Error in getHotZones:', error);
    return [];
  }
};

// Complete user profile setup
export const completeUserProfile = async (
  userData: Partial<User>,
  photos: File[],
  interests: string[],
  clubs: string[]
): Promise<boolean> => {
  try {
    // Update user profile first
    const updatedUser = await updateUserProfile({
      ...userData,
      profile_complete: true
    });
    
    if (!updatedUser) {
      toast.error("Failed to update profile information");
      return false;
    }
    
    // Upload photos
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const uploadedPhoto = await uploadUserPhoto(photo, i);
      
      if (!uploadedPhoto) {
        toast.error(`Failed to upload photo ${i + 1}`);
      }
    }
    
    // Update interests
    const interestsSuccess = await updateUserInterests(interests);
    if (!interestsSuccess) {
      toast.error("Failed to update interests");
    }
    
    // Update clubs
    const clubsSuccess = await updateUserClubs(clubs);
    if (!clubsSuccess) {
      toast.error("Failed to update clubs");
    }
    
    return true;
  } catch (error) {
    console.error('Error in completeUserProfile:', error);
    toast.error("An error occurred while completing your profile");
    return false;
  }
};
