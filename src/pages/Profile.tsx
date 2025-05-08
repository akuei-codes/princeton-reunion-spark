
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, X, Heart, Calendar, MapPin, Globe, GraduationCap, Users } from 'lucide-react';
import Logo from '../components/Logo';
import { useQuery } from '@tanstack/react-query';
import { getUserById, recordSwipe, checkIfMatched } from '../lib/api';
import type { UserWithRelations } from '../types/database';
import { toast } from "sonner";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isMatched, setIsMatched] = useState(false);

  // Fetch user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id as string),
    enabled: !!id
  });

  // Check if user is matched with the current user
  useEffect(() => {
    if (id && user?.id) {
      checkIfMatched(user.id, id).then(matched => {
        setIsMatched(matched);
      });
    }
  }, [id, user]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!id) return;
    
    try {
      const { isMatch } = await recordSwipe(id, direction);
      
      if (direction === 'right' && isMatch) {
        setIsMatched(true);
        toast.success("It's a match!", { 
          duration: 4000,
          description: "You've connected with this Tiger!"
        });
      } else if (direction === 'right') {
        toast.success("Liked!", { duration: 2000 });
      } else {
        toast.info("Passed", { duration: 2000 });
      }
      
      // Navigate back after a brief delay
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      console.error('Error swiping:', error);
      toast.error("Failed to record your choice");
    }
  };
  
  // Handle case where user doesn't exist or is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4">Loading profile...</div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4">User not found</div>
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
      <div className="relative h-[40vh] bg-gray-800">
        {/* Main profile photo */}
        {user.photos && user.photos.length > 0 ? (
          <img 
            src={user.photos[0].photo_url} 
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-white">No photo available</div>
          </div>
        )}
        
        {/* Header overlay with back button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </button>
          
          <Logo />
          
          <div className="w-10"></div> {/* Empty div for symmetric spacing */}
        </div>
        
        {/* Action buttons */}
        <div className="absolute -bottom-6 right-4 flex gap-3">
          <button 
            onClick={() => handleSwipe('left')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500 text-red-500"
          >
            <X size={24} />
          </button>
          <button 
            onClick={() => handleSwipe('right')}
            className="w-12 h-12 bg-princeton-orange rounded-full flex items-center justify-center shadow-lg"
          >
            <Heart size={24} className="text-white" />
          </button>
          {isMatched && (
            <button 
              onClick={() => navigate(`/chat/${id}`)}
              className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <MessageCircle size={24} className="text-white" />
            </button>
          )}
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-6 mt-4 pb-20">
        <div className="space-y-6">
          {/* User info */}
          <div>
            <h1 className="text-3xl font-bold text-princeton-white">
              {user.name}, <span className="text-princeton-orange">{user.class_year}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {user.gender && (
                <div className="inline-block px-2 py-1 bg-secondary/70 text-princeton-white/70 rounded-full text-xs">
                  {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                </div>
              )}
              
              {user.location && (
                <div className="flex items-center text-sm text-princeton-white/70">
                  <MapPin size={14} className="mr-1" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
            
            {user.vibe && (
              <div className="mt-1 inline-block px-3 py-1 bg-princeton-orange/20 text-princeton-orange rounded-full text-sm">
                {user.vibe}
              </div>
            )}
          </div>
          
          {/* Bio */}
          <div>
            <h2 className="text-lg font-semibold text-princeton-white mb-2">About</h2>
            <p className="text-princeton-white/80">{user.bio || "No bio available"}</p>
          </div>
          
          {/* Education */}
          <div>
            <h2 className="text-lg font-semibold text-princeton-white mb-2">Princeton Experience</h2>
            <div className="space-y-2">
              {user.major && (
                <div className="flex items-center text-princeton-white/80">
                  <GraduationCap size={18} className="mr-2 text-princeton-orange" />
                  <span>Studied {user.major}</span>
                </div>
              )}
              <div className="flex items-center text-princeton-white/80">
                <Calendar size={18} className="mr-2 text-princeton-orange" />
                <span>Class of {user.class_year}</span>
              </div>
              {user.clubs && user.clubs.length > 0 && (
                <div className="flex items-start text-princeton-white/80">
                  <Users size={18} className="mr-2 text-princeton-orange mt-1" />
                  <span>Member of {user.clubs.map(club => club.name).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-princeton-white mb-2">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <div 
                    key={index}
                    className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm"
                  >
                    {interest.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* More photos */}
          {user.photos && user.photos.length > 1 && (
            <div>
              <h2 className="text-lg font-semibold text-princeton-white mb-2">More Photos</h2>
              <div className="grid grid-cols-2 gap-2">
                {user.photos.slice(1).map((photo, index) => (
                  <img 
                    key={index}
                    src={photo.photo_url}
                    alt={`${user.name} photo ${index + 2}`}
                    className="rounded-lg w-full h-48 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
