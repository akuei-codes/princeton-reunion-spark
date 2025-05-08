
import React, { useState, useEffect } from 'react';
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
  const { isProfileComplete, user } = useAuth();

  // Get current user to check if profile is complete
  // Added error handling for 406 errors (no rows found)
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    // Don't show an error if this fails - we'll fall back to the context value
    meta: {
      errorMessage: false
    },
    // Don't retry on errors since we expect 406 errors for new users
    retry: false
  });

  // Use either the API response or the context value
  const profileComplete = isProfileComplete || (currentUser && currentUser.profile_complete);
  
  // Calculate profile completion percentage based on required fields
  const getCompletionPercentage = () => {
    if (!currentUser) return 0;
    
    let completedFields = 0;
    let totalFields = 6; // Total number of important profile fields
    
    if (currentUser.photo_urls && currentUser.photo_urls.length > 0) completedFields++;
    if (currentUser.bio) completedFields++;
    if (currentUser.major) completedFields++;
    if (currentUser.gender) completedFields++;
    if (currentUser.gender_preference) completedFields++;
    if (currentUser.interests && currentUser.interests.length > 0) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  // Don't show if not logged in
  if (!user) {
    return null;
  }
  
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
  if (dismissed || profileComplete) {
    return null;
  }

  const completionPercentage = currentUser ? getCompletionPercentage() : 0;
  const completionText = completionPercentage > 0 
    ? `Continue where you left off (${completionPercentage}% complete)` 
    : "Complete Profile";

  return (
    <div className={`bg-gradient-to-r from-orange-500 to-amber-600 p-4 rounded-lg shadow-lg animate-fade-in mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-bold text-black text-lg mb-1">Complete your profile!</h3>
          <p className="text-black/80 mb-3">
            Add photos and details to your profile to start matching with other Tigers.
          </p>
          
          {completionPercentage > 0 && (
            <div className="w-full bg-black/20 rounded-full h-2.5 mb-3">
              <div 
                className="bg-black h-2.5 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          )}
          
          <Button 
            onClick={handleCompleteProfile}
            className="bg-black text-white hover:bg-gray-900"
          >
            {completionText}
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
