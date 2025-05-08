
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUserMatches, markMessagesAsRead } from '../lib/api';

const Matches: React.FC = () => {
  const navigate = useNavigate();

  // Fetch matches data
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: () => getUserMatches(),
  });

  const handleMatchClick = async (matchId: string) => {
    // Mark messages as read when clicking on a match
    await markMessagesAsRead(matchId);
    navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-4 flex items-center">
        <button 
          onClick={() => navigate('/swipe')}
          className="text-princeton-white hover:text-princeton-orange transition-colors mr-4"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-princeton-white mb-6">Your Matches</h1>
        
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-pulse text-princeton-orange text-lg">Loading matches...</div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-10">
            <div className="text-red-500 mb-2">Failed to load matches</div>
            <button 
              onClick={() => window.location.reload()}
              className="text-princeton-orange underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="space-y-4">
            {matches && matches.length > 0 ? matches.map((match) => (
              <div 
                key={match.matchId}
                className="flex items-center p-3 rounded-lg bg-secondary border border-princeton-orange/20 hover:border-princeton-orange/50 transition-all cursor-pointer"
                onClick={() => handleMatchClick(match.matchId)}
              >
                <div className="relative">
                  <img 
                    src={match.photoUrl || '/placeholder.svg'}
                    alt={match.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {match.unread && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-princeton-orange rounded-full border border-black"></div>
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-princeton-white">
                      {match.name}
                    </h3>
                    <span className="text-xs text-princeton-white/60">{match.lastMessageTime || '--'}</span>
                  </div>
                  <p className={`text-sm ${match.unread ? 'text-princeton-white font-medium' : 'text-princeton-white/70'}`}>
                    {match.lastMessage || 'Just matched!'}
                  </p>
                </div>
                
                <button className="ml-2 text-princeton-orange">
                  <MessageCircle size={20} />
                </button>
              </div>
            )) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={32} className="text-princeton-orange" />
                </div>
                <h3 className="text-xl font-bold text-princeton-white mb-2">No matches yet</h3>
                <p className="text-princeton-white/70">
                  Start swiping to find your Tiger match!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
