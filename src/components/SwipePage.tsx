
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Heart, X, MessageCircle, User, Map } from 'lucide-react';
import AppLayout from './AppLayout';

// Sample user data - in a real app, this would come from a backend
const sampleUsers = [
  {
    id: 1,
    name: 'Emma',
    classYear: '2022',
    vibe: 'Looking to Party',
    bio: 'Former Daily Prince editor who misses late nights at Terrace. Here for old times and maybe new memories.',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800'],
  },
  {
    id: 2,
    name: 'Jake',
    classYear: '2020',
    vibe: 'Looking to Catch Up',
    bio: 'Economics major, Tower Club alum. Would love to catch up over drinks at the reunions!',
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800'],
  },
  {
    id: 3,
    name: 'Sophia',
    classYear: '2023',
    vibe: 'Down to Roam',
    bio: 'Computer science major who knows all the secret spots on campus. Let me show you around!',
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800'],
  },
  {
    id: 4,
    name: 'David',
    classYear: '2018',
    vibe: 'Looking for a Hook-Up',
    bio: 'Back for my 5th reunion. Remember those crazy nights at Cannon? Let\'s recreate them.',
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=800'],
  },
];

const SwipePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentUser = sampleUsers[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    
    // Simulate a match 50% of the time on right swipes
    if (direction === 'right' && Math.random() > 0.5) {
      setMatches([...matches, currentUser.id]);
    }
    
    // Wait for animation, then reset and move to next card
    setTimeout(() => {
      setSwipeDirection(null);
      if (currentIndex < sampleUsers.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Cycle back to first card for demo purposes
        setCurrentIndex(0);
      }
    }, 300);
  };

  const handleViewProfile = () => {
    navigate(`/profile/${currentUser.id}`);
  };

  return (
    <AppLayout matchesCount={matches.length}>
      <header className="container mx-auto px-4 py-4 flex justify-center">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative">
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
                <img 
                  src={currentUser.photos[0]} 
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
                
                {/* User info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="text-2xl font-bold">
                    {currentUser.name}, {currentUser.classYear}
                  </div>
                  <div className="text-sm text-princeton-orange font-medium mb-1">
                    {currentUser.vibe}
                  </div>
                  <div className="text-sm text-white/80">
                    {currentUser.bio}
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
        
        {/* Match notification */}
        {matches.length > 0 && (
          <button
            onClick={() => navigate('/matches')} 
            className="absolute top-4 right-4 bg-princeton-orange text-black px-3 py-2 rounded-full animate-pulse font-bold"
          >
            {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}!
          </button>
        )}
      </main>
    </AppLayout>
  );
};

export default SwipePage;
