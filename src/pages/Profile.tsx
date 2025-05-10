
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import { getUserById } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(!!id);
  const [userExists, setUserExists] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      const checkUserExists = async () => {
        const user = await getUserById(id);
        if (!user) {
          toast.error("User not found");
          setUserExists(false);
          navigate('/swipe');
        }
        setIsLoading(false);
      };
      
      checkUserExists();
    }
  }, [id, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-princeton-orange" />
      </div>
    );
  }

  if (!userExists && id) {
    return null; // Will redirect via the useEffect
  }
  
  return <UserProfile viewUserId={id} />;
};

export default Profile;
