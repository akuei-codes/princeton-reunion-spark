import { supabase } from './supabase';
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
      photos:user_photos(*),
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

export const uploadUserPhoto = async (file: File, position: number, freshUserId?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');
    
    // If no freshUserId was provided, get it now
    let userId = freshUserId;
    if (!userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();
        
      if (userError || !userData) {
        throw new Error('Could not validate user');
      }
      userId = userData.id;
    }
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('user-photos')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName);
      
    // Save to the database
    const { error: dbError } = await supabase
      .from('user_photos')
      .insert({
        user_id: userId,
        photo_url: publicUrl,
        position
      });
      
    if (dbError) throw dbError;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

export const deleteUserPhoto = async (photoId: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const { data, error } = await supabase
    .from('user_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    throw error;
  }

  return data;
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
