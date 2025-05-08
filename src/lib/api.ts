import { supabase } from './supabase';
import { uploadToCloudinary } from './cloudinary';
import { UserGender, GenderPreference } from '@/types/database';

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data: user } = await supabase
    .from('users')
    .select(`
      *,
      interests:user_interests(name:interests(*)),
      clubs:user_clubs(name:clubs(*))
    `)
    .eq('auth_id', session.user.id)
    .single();

  return user;
};

export const updateUserProfile = async ({
  bio,
  major,
  gender,
  gender_preference
}: {
  bio: string;
  major: string;
  gender: UserGender;
  gender_preference: GenderPreference;
}) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      bio,
      major,
      gender,
      gender_preference
    })
    .eq('auth_id', session.user.id);

  if (error) {
    throw error;
  }

  return data;
};

export const uploadUserPhoto = async (file: File, position: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');
    
    // Get the current user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, photo_urls')
      .eq('auth_id', session.user.id)
      .single();
        
    if (userError || !userData) {
      throw new Error('Could not validate user');
    }
    
    // Upload to Cloudinary
    const publicUrl = await uploadToCloudinary(file);
    
    // Update the photo_urls array in the users table
    const updatedPhotoUrls = [...(userData.photo_urls || [])];
    
    // Ensure the position exists in the array
    while (updatedPhotoUrls.length <= position) {
      updatedPhotoUrls.push('');
    }
    
    // Update the URL at the specified position
    updatedPhotoUrls[position] = publicUrl;
    
    // Filter out any empty strings
    const filteredUrls = updatedPhotoUrls.filter(url => url);
    
    // Update the user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        photo_urls: filteredUrls
      })
      .eq('id', userData.id);
      
    if (updateError) throw updateError;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

export const deleteUserPhoto = async (photoUrl: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get current photo URLs
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, photo_urls')
    .eq('auth_id', session.user.id)
    .single();

  if (userError || !userData) {
    throw new Error('Could not validate user');
  }

  // Filter out the URL to delete
  const updatedPhotoUrls = (userData.photo_urls || []).filter(url => url !== photoUrl);

  // Update the user record
  const { error: updateError } = await supabase
    .from('users')
    .update({
      photo_urls: updatedPhotoUrls
    })
    .eq('id', userData.id);

  if (updateError) {
    throw updateError;
  }

  return true;
};

export const updateUserInterests = async (interests: string[]) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get the user id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (userError) {
    throw userError;
  }

  // Get the existing interests
  const { data: existingInterests, error: existingInterestsError } = await supabase
    .from('user_interests')
    .select('interest_id')
    .eq('user_id', user.id);

  if (existingInterestsError) {
    throw existingInterestsError;
  }

  // Get the interests to remove
  const interestsToRemove = existingInterests.filter(existingInterest => {
    return !interests.includes(existingInterest.interest_id);
  });

  // Remove the interests
  if (interestsToRemove.length > 0) {
    const { error: removeError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id)
      .in('interest_id', interestsToRemove.map(interest => interest.interest_id));

    if (removeError) {
      throw removeError;
    }
  }

  // Get the interests to add
  const interestsToAdd = interests.filter(interest => {
    return !existingInterests.find(existingInterest => existingInterest.interest_id === interest);
  });

  // Add the interests
  if (interestsToAdd.length > 0) {
    // Get the interest ids
    const { data: interestIds, error: interestIdsError } = await supabase
      .from('interests')
      .select('id')
      .in('name', interestsToAdd);

    if (interestIdsError) {
      throw interestIdsError;
    }

    // Add the interests
    const { error: addError } = await supabase
      .from('user_interests')
      .insert(interestIds.map(interestId => ({
        user_id: user.id,
        interest_id: interestId.id
      })));

    if (addError) {
      throw addError;
    }
  }

  return true;
};

export const updateUserClubs = async (clubs: string[]) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get the user id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (userError) {
    throw userError;
  }

  // Get the existing clubs
  const { data: existingClubs, error: existingClubsError } = await supabase
    .from('user_clubs')
    .select('club_id')
    .eq('user_id', user.id);

  if (existingClubsError) {
    throw existingClubsError;
  }

  // Get the clubs to remove
  const clubsToRemove = existingClubs.filter(existingClub => {
    return !clubs.includes(existingClub.club_id);
  });

  // Remove the clubs
  if (clubsToRemove.length > 0) {
    const { error: removeError } = await supabase
      .from('user_clubs')
      .delete()
      .eq('user_id', user.id)
      .in('club_id', clubsToRemove.map(club => club.club_id));

    if (removeError) {
      throw removeError;
    }
  }

  // Get the clubs to add
  const clubsToAdd = clubs.filter(club => {
    return !existingClubs.find(existingClub => existingClub.club_id === club);
  });

  // Add the clubs
  if (clubsToAdd.length > 0) {
    // Get the club ids
    const { data: clubIds, error: clubIdsError } = await supabase
      .from('clubs')
      .select('id')
      .in('name', clubsToAdd);

    if (clubIdsError) {
      throw clubIdsError;
    }

    // Add the clubs
    const { error: addError } = await supabase
      .from('user_clubs')
      .insert(clubIds.map(clubId => ({
        user_id: user.id,
        club_id: clubId.id
      })));

    if (addError) {
      throw addError;
    }
  }

  return true;
};

export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      interests:user_interests(name:interests(*)),
      clubs:user_clubs(name:clubs(*))
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }

  return data;
};

// New functions for swipe functionality
export const getPotentialMatches = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get current user's ID and preferences
  const { data: currentUser } = await supabase
    .from('users')
    .select('id, gender, gender_preference')
    .eq('auth_id', session.user.id)
    .single();

  if (!currentUser) {
    throw new Error('User profile not found');
  }

  // Get list of users we've already swiped on
  const { data: swipedUsers } = await supabase
    .from('swipes')
    .select('swiped_id')
    .eq('swiper_id', currentUser.id);
  
  const swipedUserIds = swipedUsers?.map(swipe => swipe.swiped_id) || [];

  // Add current user ID to the excluded list
  const excludedUserIds = [...swipedUserIds, currentUser.id];

  // Build gender filter based on user preference
  let genderFilter = {};
  
  if (currentUser.gender_preference !== 'everyone') {
    genderFilter = { gender: currentUser.gender_preference };
  }

  // Get potential matches excluding already swiped users
  const { data: potentialMatches, error } = await supabase
    .from('users')
    .select(`
      *,
      interests:user_interests(interests(*)),
      clubs:user_clubs(clubs(*))
    `)
    .not('id', 'in', `(${excludedUserIds.join(',')})`)
    .match(genderFilter)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching potential matches:', error);
    throw error;
  }

  // Format the response for the frontend
  const formattedMatches = potentialMatches.map(user => ({
    ...user,
    interests: user.interests.map((item: any) => item.interests),
    clubs: user.clubs.map((item: any) => item.clubs)
  }));

  return formattedMatches;
};

export const recordSwipe = async (userId: string, direction: 'left' | 'right') => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get current user ID
  const { data: currentUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Record the swipe
  const { error } = await supabase
    .from('swipes')
    .insert({
      swiper_id: currentUser.id,
      swiped_id: userId,
      direction
    });

  if (error && error.code !== '23505') { // Ignore unique violation errors
    console.error('Error recording swipe:', error);
    throw error;
  }

  // If it was a right swipe, check if there's a match
  if (direction === 'right') {
    const { data: mutualSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_id', userId)
      .eq('swiped_id', currentUser.id)
      .eq('direction', 'right')
      .maybeSingle();

    // If mutual right swipe, create a match
    if (mutualSwipe) {
      // Match is created by the trigger in the database
      return true; // Return true to indicate it's a match
    }
  }

  return false; // Not a match
};

// New functions for matches functionality
export const getUserMatches = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get current user ID
  const { data: currentUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Get all matches for the current user
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      created_at,
      user_id_1,
      user_id_2,
      users1:user_id_1(id, name, class_year, photo_urls),
      users2:user_id_2(id, name, class_year, photo_urls)
    `)
    .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }

  // Get the last message for each match
  const formattedMatches = await Promise.all(
    matches.map(async match => {
      // Determine which user is the other person in the match
      const otherUser = match.user_id_1 === currentUser.id ? match.users2 : match.users1;
      
      // Get the last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Check for unread messages
      const { data: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .eq('sender_id', otherUser.id)
        .eq('read', false);

      // Format the last message time
      const lastMessageTime = lastMessage ? 
        new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
        null;

      return {
        id: match.id,
        created_at: match.created_at,
        other_user: {
          id: otherUser.id,
          name: otherUser.name,
          class_year: otherUser.class_year,
          photos: otherUser.photo_urls?.map((url: string) => ({ photo_url: url })) || [],
          unread: unreadCount ? unreadCount > 0 : false
        },
        last_message: lastMessage ? {
          message: lastMessage.message,
          time: lastMessageTime
        } : null
      };
    })
  );

  return formattedMatches;
};

// New functions for chat functionality
export const getMessages = async (matchId: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get messages for the match
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return messages;
};

export const sendMessage = async (matchId: string, message: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get current user ID
  const { data: currentUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Insert the message
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

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data;
};

export const markMessagesAsRead = async (matchId: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  // Get current user ID
  const { data: currentUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', session.user.id)
    .single();

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Get the other user in this match
  const { data: match } = await supabase
    .from('matches')
    .select('user_id_1, user_id_2')
    .eq('id', matchId)
    .single();

  if (!match) {
    throw new Error('Match not found');
  }

  // Determine the other user's ID
  const otherUserId = match.user_id_1 === currentUser.id ? match.user_id_2 : match.user_id_1;

  // Mark all messages from the other user as read
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('match_id', matchId)
    .eq('sender_id', otherUserId)
    .eq('read', false);

  if (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }

  return true;
};

// New function for hot zones
export const getHotZones = async () => {
  const { data: hotZones, error } = await supabase
    .from('hot_zones')
    .select(`
      *,
      events:hot_zone_events(*)
    `)
    .order('active_users', { ascending: false });

  if (error) {
    console.error('Error fetching hot zones:', error);
    throw error;
  }

  // Add a calculated field for matches nearby (this would be more complex in a real app)
  const enhancedHotZones = hotZones.map(zone => ({
    ...zone,
    matches_nearby: Math.floor(Math.random() * 5) // Just for demo purposes
  }));

  return enhancedHotZones;
};
