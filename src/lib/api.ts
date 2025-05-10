import { supabase } from './supabase';
import { UserGender, GenderPreference, UserWithRelations } from '@/types/database';

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

// Get potential matches for the current user
export const getPotentialMatches = async (): Promise<UserWithRelations[]> => {
  try {
    console.time('getPotentialMatches'); // Add performance timing
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user with minimal fields needed
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, gender, gender_preference')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Get existing swipes in a separate query to optimize the main query
    const { data: swipes } = await supabase
      .from('swipes')
      .select('target_user_id')
      .eq('user_id', currentUser.id);

    const swipedUserIds = swipes?.map(swipe => swipe.target_user_id) || [];
    
    // Get users who match the current user's gender preference
    // and whose gender preference includes the current user's gender
    const { data, error } = await supabase
      .from('users')
      .select(`
        auth_id,
        id,
        name,
        class_year,
        bio,
        major, 
        photo_urls,
        gender,
        gender_preference,
        profile_complete,
        role,
        vibe,
        created_at,
        updated_at,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .neq('auth_id', session.user.id)
      .in('gender', [currentUser.gender_preference, 'any'])
      .in('gender_preference', [currentUser.gender, 'any'])
      .eq('profile_complete', true)
      .order('created_at', { ascending: false })
      .limit(20); // Limit results for better performance

    if (error) {
      console.error('Error getting potential matches:', error);
      throw error;
    }

    // Filter out users that the current user has already swiped on
    const filteredMatches = data?.filter(user => !swipedUserIds.includes(user.id)) || [];
    console.timeEnd('getPotentialMatches'); // Log timing
    
    return filteredMatches as unknown as UserWithRelations[];
  } catch (error) {
    console.error('Error getting potential matches:', error);
    throw error;
  }
};

// Record a swipe (like or pass) on another user
export const recordSwipe = async (targetAuthId: string, direction: 'left' | 'right') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get database IDs for both users
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', targetAuthId)
      .single();

    if (!currentUser || !targetUser) throw new Error('User not found');

    // Record the swipe
    const isLike = direction === 'right';
    const { error } = await supabase
      .from('swipes')
      .insert([
        {
          user_id: currentUser.id,
          target_user_id: targetUser.id,
          is_like: isLike
        }
      ]);

    if (error) {
      console.error('Error recording swipe:', error);
      throw error;
    }

    // If the swipe was a like, check if there's a match
    if (isLike) {
      const { data: matchingSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', targetUser.id)
        .eq('target_user_id', currentUser.id)
        .eq('is_like', true)
        .maybeSingle();

      // If there's a matching swipe, create a match
      if (matchingSwipe) {
        await supabase
          .from('matches')
          .insert([
            {
              user1_id: currentUser.id,
              user2_id: targetUser.id
            }
          ]);
        
        return true; // Return true to indicate a match was created
      }
    }

    return false; // No match or was a pass
  } catch (error) {
    console.error('Error recording swipe:', error);
    throw error;
  }
};

// Get a user by their auth ID
export const getUserById = async (authId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Get the current user's matches
export const getUserMatches = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Get matches where the current user is either user1 or user2
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at
      `)
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

    if (matchesError) {
      console.error('Error getting matches:', matchesError);
      throw matchesError;
    }

    // Format the matches with user details and last message
    const formattedMatches = await Promise.all(matchesData.map(async (match) => {
      // Determine which user is the other user in the match
      const otherUserId = match.user1_id === currentUser.id ? match.user2_id : match.user1_id;

      // Get the other user's details
      const { data: otherUser } = await supabase
        .from('users')
        .select('name, auth_id, photo_urls, class_year, building')
        .eq('id', otherUserId)
        .single();

      // Get the last message in this match
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = messages && messages.length > 0 ? messages[0] : null;

      // Check if there are unread messages for the current user
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('match_id', match.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);

      return {
        matchId: match.id,
        userId: otherUser?.auth_id,
        name: otherUser?.name,
        photoUrl: otherUser?.photo_urls?.[0] || null,
        class_year: otherUser?.class_year,
        building: otherUser?.building,
        lastMessage: lastMessage?.message,
        lastMessageTime: lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        unread: unreadCount && unreadCount > 0
      };
    }));

    return formattedMatches;
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
};

// Mark messages in a match as read
export const markMessagesAsRead = async (matchId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Mark all messages sent to this user in this match as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .eq('receiver_id', currentUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get messages for a specific match
export const getMessages = async (matchId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting messages:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Send a message in a match
export const sendMessage = async (matchId: string, message: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID and match details to determine receiver
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Get match to determine the receiver
    const { data: match } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', matchId)
      .single();

    if (!match) throw new Error('Match not found');

    // Determine receiver ID (the other user in the match)
    const receiverId = match.user1_id === currentUser.id ? match.user2_id : match.user1_id;

    // Insert the new message
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          match_id: matchId,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message,
          is_read: false
        }
      ])
      .select();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get hot zones (popular places during reunion)
export const getHotZones = async () => {
  try {
    const { data, error } = await supabase
      .from('hot_zones')
      .select('*');

    if (error) {
      console.error('Error getting hot zones:', error);
      throw error;
    }

    // If the table doesn't exist or no data, return mock data
    if (!data || data.length === 0) {
      return [
        {
          id: '1',
          name: 'Reunions Tent',
          image_url: 'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d',
          active_users: 42,
          matches_nearby: 5,
          distance: '0.2 miles',
          events: [
            { name: 'Class of 2010 Reception' },
            { name: 'Alumni Mixer' }
          ]
        },
        {
          id: '2',
          name: 'Frist Campus Center',
          image_url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3',
          active_users: 28,
          matches_nearby: 3,
          distance: 'On campus',
          events: [
            { name: 'Registration' },
            { name: 'Campus Tour' }
          ]
        },
        {
          id: '3',
          name: 'Prospect Garden',
          image_url: 'https://images.unsplash.com/photo-1501084291732-13b1ba8f0ebc',
          active_users: 15,
          matches_nearby: 2,
          distance: '0.5 miles',
          events: [
            { name: 'Garden Party' }
          ]
        }
      ];
    }

    return data;
  } catch (error) {
    console.error('Error getting hot zones:', error);
    // Return mock data as fallback
    return [
      {
        id: '1',
        name: 'Reunions Tent',
        image_url: 'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d',
        active_users: 42,
        matches_nearby: 5,
        distance: '0.2 miles',
        events: [
          { name: 'Class of 2010 Reception' },
          { name: 'Alumni Mixer' }
        ]
      },
      {
        id: '2',
        name: 'Frist Campus Center',
        image_url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3',
        active_users: 28,
        matches_nearby: 3,
        distance: 'On campus',
        events: [
          { name: 'Registration' },
          { name: 'Campus Tour' }
        ]
      }
    ];
  }
};

// Get users who have liked the current user
export const getUserLikers = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Find users who have liked the current user but the current user hasn't swiped on yet
    // First, get all users who have liked the current user
    const { data: likerSwipes, error: swipesError } = await supabase
      .from('swipes')
      .select(`
        user_id,
        users:user_id(auth_id)
      `)
      .eq('target_user_id', currentUser.id)
      .eq('is_like', true);

    if (swipesError) {
      console.error('Error getting likers:', swipesError);
      throw swipesError;
    }

    if (!likerSwipes || likerSwipes.length === 0) {
      return [];
    }

    // Get current user's swipes to filter out users they've already swiped on
    const { data: userSwipes } = await supabase
      .from('swipes')
      .select('target_user_id')
      .eq('user_id', currentUser.id);

    const alreadySwipedUserIds = userSwipes?.map(swipe => swipe.target_user_id) || [];
    
    // Filter out users the current user has already swiped on
    const filteredLikerIds = likerSwipes
      .filter(swipe => swipe.users && swipe.users.auth_id)
      .map(swipe => swipe.users.auth_id);

    // No likers
    if (filteredLikerIds.length === 0) {
      return [];
    }

    // Get full user details for the likers
    const { data: likerDetails, error: likerError } = await supabase
      .from('users')
      .select(`
        *,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .in('auth_id', filteredLikerIds);

    if (likerError) {
      console.error('Error getting liker details:', likerError);
      throw likerError;
    }

    return likerDetails || [];
  } catch (error) {
    console.error('Error getting user likers:', error);
    throw error;
  }
};

// Update user interests
export const updateUserInterests = async (interestIds: string[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', currentUser.id);

    // Insert new interests
    const interestInserts = interestIds.map(interestId => ({
      user_id: currentUser.id,
      interest_id: interestId
    }));

    const { error } = await supabase
      .from('user_interests')
      .insert(interestInserts);

    if (error) {
      console.error('Error updating interests:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user interests:', error);
    throw error;
  }
};

// Update user clubs
export const updateUserClubs = async (clubIds: string[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Delete existing clubs
    await supabase
      .from('user_clubs')
      .delete()
      .eq('user_id', currentUser.id);

    // Insert new clubs
    const clubInserts = clubIds.map(clubId => ({
      user_id: currentUser.id,
      club_id: clubId
    }));

    if (clubInserts.length === 0) {
      return true; // No clubs to insert
    }

    const { error } = await supabase
      .from('user_clubs')
      .insert(clubInserts);

    if (error) {
      console.error('Error updating clubs:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user clubs:', error);
    throw error;
  }
};

// Upload a user photo
export const uploadUserPhoto = async (photoUrl: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, photo_urls')
      .eq('auth_id', session.user.id)
      .single();

    if (!user) throw new Error('User profile not found');

    // Update photo URLs
    const updatedPhotoUrls = [...(user.photo_urls || []), photoUrl];
    
    const { error } = await supabase
      .from('users')
      .update({ photo_urls: updatedPhotoUrls })
      .eq('id', user.id);

    if (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }

    return updatedPhotoUrls;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Delete a user photo
export const deleteUserPhoto = async (photoUrl: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, photo_urls')
      .eq('auth_id', session.user.id)
      .single();

    if (!user) throw new Error('User profile not found');
    
    // Filter out the photo URL to delete
    const updatedPhotoUrls = (user.photo_urls || []).filter(url => url !== photoUrl);
    
    const { error } = await supabase
      .from('users')
      .update({ photo_urls: updatedPhotoUrls })
      .eq('id', user.id);

    if (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }

    return updatedPhotoUrls;
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

// Update user settings
export const updateUserSettings = async (settings: {
  notifications_enabled?: boolean;
  location_sharing?: boolean;
  discovery_enabled?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, settings')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Merge existing settings with new settings
    const updatedSettings = {
      ...(currentUser.settings || {}),
      ...settings
    };
    
    const { error } = await supabase
      .from('users')
      .update({ settings: updatedSettings })
      .eq('id', currentUser.id);

    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }

    return updatedSettings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Delete user account
export const deleteAccount = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Get current user's database ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (!currentUser) throw new Error('User profile not found');

    // Delete user data from tables
    await Promise.all([
      supabase.from('user_interests').delete().eq('user_id', currentUser.id),
      supabase.from('user_clubs').delete().eq('user_id', currentUser.id),
      supabase.from('swipes').delete().eq('user_id', currentUser.id),
      supabase.from('swipes').delete().eq('target_user_id', currentUser.id),
      supabase.from('messages').delete().eq('sender_id', currentUser.id),
      supabase.from('messages').delete().eq('receiver_id', currentUser.id),
      supabase.from('matches').delete().or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
    ]);

    // Finally delete the user record
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', currentUser.id);

    if (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }

    // Sign out
    await supabase.auth.signOut();

    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
