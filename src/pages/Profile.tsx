
import React from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge'; // Add this import
import UserProfile from '@/pages/UserProfile';

const Profile = () => {
  const { id } = useParams();
  return <UserProfile viewUserId={id} />;
};

export default Profile;
