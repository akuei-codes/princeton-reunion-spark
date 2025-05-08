
import React from 'react';
import { useParams } from 'react-router-dom';
import UserProfile from './UserProfile';

const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  
  return <UserProfile viewUserId={id} />;
};

export default Profile;
