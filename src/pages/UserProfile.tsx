
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, LogOut, Settings, Edit, MapPin } from 'lucide-react';
import Logo from '../components/Logo';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { signOut } = useAuth();

  // Fetch current user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4">Error loading profile</div>
        <button 
          onClick={() => navigate('/swipe')}
          className="px-4 py-2 bg-princeton-orange text-black rounded-lg"
        >
          Back to Swiping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/swipe')}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
        <button 
          onClick={() => navigate('/settings')}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <Settings size={24} />
        </button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col items-center">
          {/* Profile photo */}
          <div className="relative mb-6">
            <img 
              src={user.photos[0]?.photo_url || '/placeholder.svg'}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-princeton-orange"
            />
            <button 
              onClick={() => navigate('/profile-setup')}
              className="absolute bottom-0 right-0 w-8 h-8 bg-princeton-orange rounded-full flex items-center justify-center"
            >
              <Camera size={16} className="text-black" />
            </button>
          </div>
          
          {/* User info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-princeton-white">
              {user.name}, <span className="text-princeton-orange">{user.class_year}</span>
            </h1>
            <div className="flex items-center justify-center mt-1 text-sm text-princeton-white/70">
              <MapPin size={14} className="mr-1" />
              <span>{user.location || "Princeton Campus"}</span>
            </div>
            {user.vibe && (
              <div className="mt-2 inline-block px-3 py-1 bg-princeton-orange/20 text-princeton-orange rounded-full text-sm">
                {user.vibe}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">About</h2>
            <button 
              onClick={() => navigate('/profile-setup')}
              className="text-princeton-orange"
            >
              <Edit size={18} />
            </button>
          </div>
          <p className="text-princeton-white/80">{user.bio || "No bio added yet"}</p>
        </div>
        
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Interests</h2>
            <button 
              onClick={() => navigate('/profile-setup')}
              className="text-princeton-orange"
            >
              <Edit size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.interests && user.interests.length > 0 ? (
              user.interests.map((interest, index) => (
                <div 
                  key={index}
                  className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm"
                >
                  {interest.name}
                </div>
              ))
            ) : (
              <p className="text-princeton-white/60">No interests added yet</p>
            )}
          </div>
        </div>
        
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Princeton Info</h2>
            <button 
              onClick={() => navigate('/profile-setup')}
              className="text-princeton-orange"
            >
              <Edit size={18} />
            </button>
          </div>
          <div className="space-y-2 text-princeton-white/80">
            <div>Major: {user.major || "Not specified"}</div>
            <div>
              Clubs: {user.clubs && user.clubs.length > 0 
                ? user.clubs.map(club => club.name).join(', ') 
                : "None added yet"}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-500 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </main>
    </div>
  );
};

export default UserProfile;
