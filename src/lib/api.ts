import { supabase } from './supabase';
import { User, UserWithRelations, UserPhoto } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

// Get current user with full profile details
export const getCurrentUser = async (): Promise<UserWithRelations | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Get user profile by auth_id
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();

    if (error || !user) return null;

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
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profileData: Partial<User>): Promise<User | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
};

// Upload user photo - Updated with better error handling
export const uploadUserPhoto = async (file: File, position: number): Promise<UserPhoto | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data: uploadData } = await supabase
      .storage
      .from('user-photos')
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('user-photos')
      .getPublicUrl(filePath);

    // Add to photos table
    const { data, error: photoError } = await supabase
      .from('user_photos')
      .insert({
        user_id: currentUser.id,
        photo_url: publicUrl,
        position
      })
      .select()
      .single();

    if (photoError) throw photoError;
    return data;
  } catch (error) {
    console.error('Error uploading photo:', error);
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

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
};

// Update user interests
export const updateUserInterests = async (interestNames: string[]): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    // Delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', currentUser.id);

    if (interestNames.length === 0) return true;

    // Process each interest
    for (const interestName of interestNames) {
      // Check if interest exists
      let interestId = null;
      const { data: existingInterest } = await supabase
        .from('interests')
        .select('id')
        .eq('name', interestName)
        .maybeSingle();

      if (existingInterest) {
        interestId = existingInterest.id;
      } else {
        // Create new interest
        const { data: newInterest, error: newInterestError } = await supabase
          .from('interests')
          .insert({ name: interestName })
          .select()
          .single();

        if (newInterestError) throw newInterestError;
        interestId = newInterest.id;
      }

      // Link interest to user
      const { error: linkError } = await supabase
        .from('user_interests')
        .insert({
          user_id: currentUser.id,
          interest_id: interestId
        });

      if (linkError) throw linkError;
    }

    return true;
  } catch (error) {
    console.error('Error updating interests:', error);
    return false;
  }
};

// Update user clubs
export const updateUserClubs = async (clubNames: string[]): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    // Delete existing clubs
    await supabase
      .from('user_clubs')
      .delete()
      .eq('user_id', currentUser.id);

    if (clubNames.length === 0) return true;

    // Process each club
    for (const clubName of clubNames) {
      // Check if club exists
      let clubId = null;
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', clubName)
        .maybeSingle();

      if (existingClub) {
        clubId = existingClub.id;
      } else {
        // Create new club
        const { data: newClub, error: newClubError } = await supabase
          .from('clubs')
          .insert({ name: clubName })
          .select()
          .single();

        if (newClubError) throw newClubError;
        clubId = newClub.id;
      }

      // Link club to user
      const { error: linkError } = await supabase
        .from('user_clubs')
        .insert({
          user_id: currentUser.id,
          club_id: clubId
        });

      if (linkError) throw linkError;
    }

    return true;
  } catch (error) {
    console.error('Error updating clubs:', error);
    return false;
  }
};

// Get user by ID with full profile details
export const getUserById = async (userId: string): Promise<UserWithRelations | null> => {
  try {
    // Get user profile
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) return null;

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
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

// Record a swipe (left or right)
export const recordSwipe = async (swipedId: string, direction: 'left' | 'right'): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    const { error } = await supabase
      .from('swipes')
      .insert({
        swiper_id: currentUser.id,
        swiped_id: swipedId,
        direction
      });

    if (error) throw error;

    // If this was a right swipe, check if it's a match
    if (direction === 'right') {
      const { data: matchData } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', swipedId)
        .eq('swiped_id', currentUser.id)
        .eq('direction', 'right')
        .maybeSingle();

      // If there's a mutual swipe, create a match
      if (matchData) {
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            user_id_1: currentUser.id,
            user_id_2: swipedId
          });

        if (matchError) throw matchError;
        return true; // Return true to indicate a match was created
      }
    }

    return false; // No match was created
  } catch (error) {
    console.error('Error recording swipe:', error);
    return false;
  }
};

// Check if users are matched
export const checkIfMatched = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking match:', error);
    return false;
  }
};

// Get all matches for current user
export const getUserMatches = async (): Promise<any> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    // Get all matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (error || !matches) return [];

    // Process each match to get other user details and last message
    const matchesWithDetails = await Promise.all(
      matches.map(async (match) => {
        // Determine which user is the "other" user
        const otherUserId = match.user_id_1 === currentUser.id ? match.user_id_2 : match.user_id_1;
        
        // Get other user details
        const otherUser = await getUserById(otherUserId);
        if (!otherUser) return null;

        // Get last message
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages && messages.length > 0
          ? {
              ...messages[0],
              time: formatDistanceToNow(new Date(messages[0].created_at), { addSuffix: true })
            }
          : undefined;

        // Check if there are unread messages
        const hasUnread = lastMessage && 
                           lastMessage.sender_id !== currentUser.id && 
                           !lastMessage.read;

        return {
          id: match.id,
          created_at: match.created_at,
          other_user: {
            ...otherUser,
            unread: hasUnread || false
          },
          last_message: lastMessage
        };
      })
    );

    // Filter out null values and sort by unread status and last message time
    return matchesWithDetails
      .filter(match => match !== null) as any[];
  } catch (error) {
    console.error('Error getting matches:', error);
    return [];
  }
};

// Get messages for a match
export const getMessages = async (matchId: string): Promise<any> => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return messages.map(message => ({
      ...message,
      time: formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
    }));
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (matchId: string, message: string): Promise<any | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUser.id,
        message,
        read: false
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      time: formatDistanceToNow(new Date(data.created_at), { addSuffix: true })
    };
  } catch (error) {
    console.error('Error sending message:', error);
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
      .neq('sender_id', currentUser.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

// Get hot zones
export const getHotZones = async (): Promise<any> => {
  try {
    const { data: zones, error } = await supabase
      .from('hot_zones')
      .select('*')
      .order('active_users', { ascending: false });

    if (error) throw error;

    // Get events for each zone
    const zonesWithEvents = await Promise.all(
      zones.map(async (zone) => {
        const { data: events } = await supabase
          .from('hot_zone_events')
          .select('*')
          .eq('hot_zone_id', zone.id);

        // Calculate a fake number of matches nearby (for demo purposes)
        const matchesNearby = Math.floor(Math.random() * 10);

        return {
          ...zone,
          events: events || [],
          matches_nearby: matchesNearby
        };
      })
    );

    return zonesWithEvents;
  } catch (error) {
    console.error('Error getting hot zones:', error);
    return [];
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
    
    // Build the gender filter based on user preferences
    let genderFilter = '';
    if (currentUser.gender_preference === 'male') {
      genderFilter = 'gender.eq.male';
    } else if (currentUser.gender_preference === 'female') {
      genderFilter = 'gender.eq.female';
    } 
    
    // Get users who aren't in the swiped list and match gender preference
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .not('id', 'in', `(${swipedIds.join(',')})`)
      .eq('profile_complete', true)
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) {
      console.error('Error fetching potential matches:', error);
      return [];
    }

    // Filter by gender preference
    let filteredUsers = users;
    if (currentUser.gender_preference !== 'everyone') {
      filteredUsers = users.filter(user => user.gender === currentUser.gender_preference);
    }
    
    // Get additional details for each user
    const usersWithDetails = await Promise.all(filteredUsers.map(async user => {
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
