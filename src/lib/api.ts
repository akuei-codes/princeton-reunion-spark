
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
