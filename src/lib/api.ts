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
    
    const newPhotoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${uploadData.Key}`;
    
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
    
    return matchedUsers || [];
  } catch (error) {
    console.error('Error in getUserMatches:', error);
    return [];
  }
};
