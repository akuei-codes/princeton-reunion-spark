
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/api';

interface ProfileCompletionNotificationProps {
  className?: string;
}

const ProfileCompletionNotification: React.FC<ProfileCompletionNotificationProps> = ({ 
  className = '' 
}) => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { profileComplete } = useAuth();

  // Get current user to check if profile is complete
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 60000, // 1 minute
  });

  const isProfileComplete = profileComplete || (currentUser && currentUser.profile_complete);

  const handleDismiss = () => {
    setDismissed(true);
    toast.success("You can complete your profile later from your settings", {
      duration: 4000,
    });
  };

  const handleCompleteProfile = () => {
    navigate('/profile-setup');
  };

  // Don't show notification if dismissed or profile is already complete
  if (dismissed || isProfileComplete) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-amber-600 p-4 rounded-lg shadow-lg animate-fade-in mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-bold text-black text-lg mb-1">Complete your profile!</h3>
          <p className="text-black/80 mb-3">
            Add photos and details to your profile to start matching with other Tigers.
          </p>
          <Button 
            onClick={handleCompleteProfile}
            className="bg-black text-white hover:bg-gray-900"
          >
            Complete Profile
          </Button>
        </div>
        <button 
          onClick={handleDismiss} 
          className="text-black/70 hover:text-black"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionNotification;
