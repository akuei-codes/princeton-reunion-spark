import { supabase } from './supabase';
import { UserGender, GenderPreference } from '@/types/database';

export const getCurrentUser = async () => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .eq('auth_id', userData.session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, name, class_year, bio, major, gender, gender_preference, building, vibe, photo_urls,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
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
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        bio,
        major,
        gender,
        gender_preference
      })
      .eq('auth_id', userData.session.user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

export const uploadUserPhoto = async (file: File, position: number) => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('photo_urls')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }
    
    let currentPhotos = user?.photo_urls || [];
    
    // Upload file to Supabase storage
    const timestamp = Date.now();
    const filePath = `avatars/${userData.session.user.id}/${timestamp}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    // Fix: Build the URL correctly based on the returned path
    const newPhotoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
    
    // Insert the new photo URL at the specified position
    currentPhotos[position] = newPhotoUrl;
    
    // Update user profile with new photo URLs
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        photo_urls: currentPhotos
      })
      .eq('auth_id', userData.session.user.id);
    
    if (updateError) {
      console.error('Error updating user profile:', updateError);
      throw updateError;
    }
    
    return updateData;
  } catch (error) {
    console.error('Error in uploadUserPhoto:', error);
    throw error;
  }
};

export const deleteUserPhoto = async (photoUrl: string) => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('photo_urls')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }
    
    let currentPhotos = user?.photo_urls || [];
    
    // Remove the photo URL from the array
    currentPhotos = currentPhotos.filter(url => url !== photoUrl);
    
    // Update user profile with updated photo URLs
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        photo_urls: currentPhotos
      })
      .eq('auth_id', userData.session.user.id);
    
    if (updateError) {
      console.error('Error updating user profile:', updateError);
      throw updateError;
    }
    
    // Extract the path from the URL
    const urlParts = photoUrl.split('/avatars/');
    if (urlParts.length < 2) {
      console.error('Invalid photo URL:', photoUrl);
      throw new Error('Invalid photo URL');
    }
    
    const filePath = `avatars/${urlParts[1]}`;
    
    // Delete file from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([filePath]);
    
    if (deleteError) {
      console.error('Error deleting file:', deleteError);
      throw deleteError;
    }
    
    return updateData;
  } catch (error) {
    console.error('Error in deleteUserPhoto:', error);
    throw error;
  }
};

export const updateUserInterests = async (interests: string[]) => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Delete existing interests
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting user interests:', deleteError);
      throw deleteError;
    }
    
    // Insert new interests
    for (const interest of interests) {
      // Check if interest exists
      let interestId = null;
      const { data: existingInterest } = await supabase
        .from('interests')
        .select('id')
        .eq('name', interest)
        .maybeSingle();
      
      if (existingInterest) {
        interestId = existingInterest.id;
      } else {
        // Create new interest
        const { data: newInterest, error: newInterestError } = await supabase
          .from('interests')
          .insert({ name: interest })
          .select()
          .single();
        
        if (newInterestError) {
          console.error('Error creating interest:', newInterestError);
          throw newInterestError;
        }
        interestId = newInterest.id;
      }
      
      // Link interest to user
      const { error: linkError } = await supabase
        .from('user_interests')
        .insert({
          user_id: user.id,
          interest_id: interestId
        });
      
      if (linkError) {
        console.error('Error linking interest to user:', linkError);
        throw linkError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserInterests:', error);
    throw error;
  }
};

export const updateUserClubs = async (clubs: string[]) => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Delete existing clubs
    const { error: deleteError } = await supabase
      .from('user_clubs')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting user clubs:', deleteError);
      throw deleteError;
    }
    
    // Insert new clubs
    for (const club of clubs) {
      // Check if club exists
      let clubId = null;
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', club)
        .maybeSingle();
      
      if (existingClub) {
        clubId = existingClub.id;
      } else {
        // Create new club
        const { data: newClub, error: newClubError } = await supabase
          .from('clubs')
          .insert({ name: club })
          .select()
          .single();
        
        if (newClubError) {
          console.error('Error creating club:', newClubError);
          throw newClubError;
        }
        clubId = newClub.id;
      }
      
      // Link club to user
      const { error: linkError } = await supabase
        .from('user_clubs')
        .insert({
          user_id: user.id,
          club_id: clubId
        });
      
      if (linkError) {
        console.error('Error linking club to user:', linkError);
        throw linkError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserClubs:', error);
    throw error;
  }
};

// Add missing functions needed by SwipePage.tsx
export const getPotentialMatches = async () => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user preferences
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, gender_preference')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return [];
    }
    
    // Get users that match the gender preference
    let query = supabase
      .from('users')
      .select(`
        id, name, class_year, bio, major, gender, building, vibe, photo_urls,
        interests:user_interests(name:interests(*)),
        clubs:user_clubs(name:clubs(*))
      `)
      .neq('id', currentUser.id); // Don't include current user
    
    // Apply gender preference filter if set
    if (currentUser.gender_preference && currentUser.gender_preference !== 'everyone') {
      query = query.eq('gender', currentUser.gender_preference);
    }
    
    // Get users we've already swiped on
    const { data: swipes, error: swipesError } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', currentUser.id);
    
    if (!swipesError && swipes && swipes.length > 0) {
      // Exclude users we've already swiped on
      const swipedIds = swipes.map(swipe => swipe.swiped_id);
      query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }
    
    const { data: potentialMatches, error } = await query;
    
    if (error) {
      console.error('Error fetching potential matches:', error);
      return [];
    }
    
    return potentialMatches || [];
  } catch (error) {
    console.error('Error in getPotentialMatches:', error);
    return [];
  }
};

export const recordSwipe = async (userId: string, direction: 'left' | 'right'): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return false;
    }
    
    // Record the swipe
    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .insert({
        swiper_id: currentUser.id,
        swiped_id: userId,
        direction
      })
      .select()
      .single();
    
    if (swipeError) {
      console.error('Error recording swipe:', swipeError);
      return false;
    }
    
    // If it's a right swipe, check if there's a match
    if (direction === 'right') {
      const { data: matchCheck, error: matchError } = await supabase
        .from('swipes')
        .select()
        .eq('swiper_id', userId)
        .eq('swiped_id', currentUser.id)
        .eq('direction', 'right')
        .single();
      
      // If the other user already swiped right on us, create a match
      if (matchCheck && !matchError) {
        // Create the match record
        const { data: match, error: createMatchError } = await supabase
          .from('matches')
          .insert({
            user_id_1: currentUser.id,
            user_id_2: userId
          })
          .select();
        
        if (createMatchError) {
          console.error('Error creating match:', createMatchError);
        }
        
        // Return true to indicate it's a match
        return true;
      }
    }
    
    // Not a match
    return false;
  } catch (error) {
    console.error('Error in recordSwipe:', error);
    return false;
  }
};

// Add missing functions needed by Chat.tsx and Matches.tsx
export const getMessages = async (matchedUserId: string): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return [];
    }
    
    // Get the match id
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .or(`user_id_1.eq.${matchedUserId},user_id_2.eq.${matchedUserId}`)
      .single();
    
    if (matchError || !match) {
      console.error('Error fetching match:', matchError);
      return [];
    }
    
    // Get messages for this match
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', match.id)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return [];
    }
    
    return messages || [];
  } catch (error) {
    console.error('Error in getMessages:', error);
    return [];
  }
};

export const sendMessage = async (matchedUserId: string, message: string): Promise<any> => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }
    
    // Get the match id
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .or(`user_id_1.eq.${matchedUserId},user_id_2.eq.${matchedUserId}`)
      .single();
    
    if (matchError || !match) {
      console.error('Error fetching match:', matchError);
      throw new Error('Match not found');
    }
    
    // Send the message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: currentUser.id,
        message,
        read: false
      })
      .select();
    
    if (messageError) {
      console.error('Error sending message:', messageError);
      throw messageError;
    }
    
    return newMessage;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (matchedUserId: string): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    // Get current user id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    // Get the match id
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .or(`user_id_1.eq.${matchedUserId},user_id_2.eq.${matchedUserId}`)
      .single();
    
    if (matchError || !match) {
      console.error('Error fetching match:', matchError);
      return;
    }
    
    // Mark messages as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', match.id)
      .neq('sender_id', currentUser.id);
    
    if (updateError) {
      console.error('Error marking messages as read:', updateError);
    }
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
  }
};

// Add missing function for HotZones.tsx
export const getHotZones = async (): Promise<any[]> => {
  try {
    const { data: hotZones, error } = await supabase
      .from('hot_zones')
      .select(`
        *,
        events:hot_zone_events(*)
      `);
    
    if (error) {
      console.error('Error fetching hot zones:', error);
      return [];
    }
    
    // Add a field for matches nearby (mock data for now)
    const processedHotZones = hotZones.map(zone => ({
      ...zone,
      matches_nearby: Math.floor(Math.random() * 5) // Random number of matches nearby
    }));
    
    return processedHotZones || [];
  } catch (error) {
    console.error('Error in getHotZones:', error);
    return [];
  }
};

// Fix the getUserMatches function to properly handle array elements
export const getUserMatches = async (): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getSession();
    if (!userData.session) {
      throw new Error('No session found');
    }
    
    const { data: userMatches, error } = await supabase
      .from('matches')
      .select(`
        matched_user_id
      `)
      .eq('user_id', userData.session.user.id)
      .eq('status', 'matched');
    
    if (error) {
      console.error('Error fetching matches:', error);
      return [];
    }

    if (!userMatches || userMatches.length === 0) {
      return [];
    }

    const matchedUserIds = userMatches.map(match => match.matched_user_id);
    
    const { data: matchedUsers, error: matchedUsersError } = await supabase
      .from('users')
      .select(`
        id, name, class_year, photo_urls
      `)
      .in('id', matchedUserIds);
    
    if (matchedUsersError) {
      console.error('Error fetching matched users:', matchedUsersError);
      return [];
    }
    
    // Process matches to include other_user and photos in the expected format for the UI
    const processedMatches = matchedUsers?.map(user => ({
      id: user.id,
      created_at: new Date().toISOString(),
      other_user: {
        id: user.id,
        name: user.name,
        class_year: user.class_year,
        photos: user.photo_urls ? user.photo_urls.map((url: string) => ({ photo_url: url })) : [],
        unread: Math.random() > 0.5 // Random unread status for demo
      },
      // Mock last message for UI
      last_message: Math.random() > 0.3 ? {
        message: "Hey there!",
        created_at: new Date().toISOString(),
        time: "Just now",
        read: Math.random() > 0.5,
        sender_id: Math.random() > 0.5 ? user.id : userData.session.user.id
      } : null
    })) || [];
    
    return processedMatches;
  } catch (error) {
    console.error('Error in getUserMatches:', error);
    return [];
  }
};
