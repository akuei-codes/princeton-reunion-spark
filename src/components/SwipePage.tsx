
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Heart, X, MessageCircle } from 'lucide-react';
import AppLayout from './AppLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPotentialMatches, recordSwipe, getUserMatches } from '../lib/api';
import { toast } from "sonner";
import { UserWithRelations } from '../types/database';

const SwipePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch potential matches
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['potential-matches'],
    queryFn: getPotentialMatches
  });

  // Fetch current matches count
  const { data: currentMatches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: getUserMatches
  });

  // Get the current user to display
  const currentUser = users[currentIndex];

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentUser) return;
    
    setSwipeDirection(direction);
    
    try {
      const { isMatch } = await recordSwipe(currentUser.id, direction);
      
      // If it was a match, update the matches state
      if (direction === 'right' && isMatch) {
        setMatches(prev => [...prev, currentUser.id]);
        toast.success("It's a match!", {
          description: `You matched with ${currentUser.name}!`
        });
        
        // Invalidate and refetch matches data
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }
      
      // Wait for animation, then reset and move to next card
      setTimeout(() => {
        setSwipeDirection(null);
        if (currentIndex < users.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Refetch more potential matches if we've run out
          refetch().then(() => setCurrentIndex(0));
          toast.info("Looking for more Tigers...");
        }
      }, 300);
    } catch (error) {
      console.error('Error recording swipe:', error);
      toast.error("Couldn't record your choice");
      setSwipeDirection(null);
    }
  };

  const handleViewProfile = () => {
    if (currentUser) {
      navigate(`/profile/${currentUser.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout matchesCount={currentMatches.length}>
        <header className="container mx-auto px-4 py-4 flex justify-center">
          <Logo />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-princeton-white text-xl animate-pulse">
            Finding Tigers...
          </div>
        </main>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout matchesCount={currentMatches.length}>
        <header className="container mx-auto px-4 py-4 flex justify-center">
          <Logo />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">Failed to load profiles</div>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-princeton-orange text-black rounded-lg"
            >
              Try Again
            </button>
          </div>
        </main>
      </AppLayout>
    );
  }

  // No users to display
  if (users.length === 0) {
    return (
      <AppLayout matchesCount={currentMatches.length}>
        <header className="container mx-auto px-4 py-4 flex justify-center">
          <Logo />
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-princeton-orange" />
            </div>
            <h3 className="text-xl font-bold text-princeton-white mb-2">No more Tigers to show</h3>
            <p className="text-princeton-white/70 mb-6">
              Check back later for more potential matches!
            </p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-princeton-orange text-black rounded-lg"
            >
              Refresh
            </button>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout matchesCount={currentMatches.length}>
      <header className="container mx-auto px-4 py-4 flex justify-center">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative">
        {currentUser && (
          <div className="relative w-full max-w-sm h-[70vh] mx-auto">
            {/* Current card */}
            <div 
              ref={cardRef}
              className={`swipe-card ${
                swipeDirection === 'right' 
                  ? 'animate-swipe-right' 
                  : swipeDirection === 'left' 
                  ? 'animate-swipe-left' 
                  : ''
              }`}
              onClick={handleViewProfile}
            >
              <div className="w-full h-full flex flex-col">
                {/* Photo */}
                <div className="relative flex-1 bg-gray-800">
                  {currentUser.photos && currentUser.photos.length > 0 ? (
                    <img 
                      src={currentUser.photos[0].photo_url} 
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white">No photo available</div>
                    </div>
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
                  
                  {/* User info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="text-2xl font-bold">
                      {currentUser.name}, {currentUser.class_year}
                    </div>
                    {currentUser.vibe && (
                      <div className="text-sm text-princeton-orange font-medium mb-1">
                        {currentUser.vibe}
                      </div>
                    )}
                    <div className="text-sm text-white/80">
                      {currentUser.bio || 'No bio available'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-6">
              <button 
                onClick={() => handleSwipe('left')}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500 text-red-500"
              >
                <X size={32} />
              </button>
              
              <button 
                onClick={() => handleSwipe('right')}
                className="w-16 h-16 bg-princeton-orange rounded-full flex items-center justify-center shadow-lg"
              >
                <Heart size={32} className="text-white" />
              </button>
            </div>
          </div>
        )}
        
        {/* Match notification */}
        {currentMatches.length > 0 && (
          <button
            onClick={() => navigate('/matches')} 
            className="absolute top-4 right-4 bg-princeton-orange text-black px-3 py-2 rounded-full animate-pulse font-bold"
          >
            {currentMatches.length} {currentMatches.length === 1 ? 'Match' : 'Matches'}!
          </button>
        )}
      </main>
    </AppLayout>
  );
};

export default SwipePage;
