
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
