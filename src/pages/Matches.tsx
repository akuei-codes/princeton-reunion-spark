
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, MessageCircle, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUserMatches, markMessagesAsRead } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const MatchesSkeleton = () => (
  <>
    {[1, 2, 3].map((index) => (
      <div key={index} className="flex items-center p-3 rounded-lg bg-secondary border border-princeton-orange/20 mb-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="ml-4 flex-1">
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </>
);

const Matches: React.FC = () => {
  const navigate = useNavigate();

  // Fetch matches data with better error handling and stale time
  const { data: matches, isLoading, error, refetch } = useQuery({
    queryKey: ['matches'],
    queryFn: () => getUserMatches(),
    staleTime: 30000, // Data stays fresh for 30 seconds
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching matches:", error);
        toast.error("Failed to load matches");
      }
    }
  });

  const handleMatchClick = async (matchId: string) => {
    try {
      // Show loading state
      toast.loading("Opening chat...");
      
      // Mark messages as read when clicking on a match
      await markMessagesAsRead(matchId);
      
      // Navigate to chat
      navigate(`/chat/${matchId}`);
      
      // Dismiss loading toast
      toast.dismiss();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.dismiss();
      
      // Still navigate even if marking as read fails
      navigate(`/chat/${matchId}`);
    }
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
          <div className="space-y-4">
            <MatchesSkeleton />
          </div>
        )}
        
        {error && (
          <div className="text-center py-10">
            <div className="text-red-500 mb-2">Failed to load matches</div>
            <button 
              onClick={() => refetch()}
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
                    loading="lazy"
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
                <h3 className="text-xl font-bold text-princeton-white mb-2">No Tiger Matches Yet!</h3>
                <p className="text-princeton-white/70 mb-6">
                  Start swiping to find your perfect reunion connection!
                </p>
                <Button 
                  onClick={() => navigate('/swipe')}
                  className="bg-princeton-orange hover:bg-princeton-orange/90 text-black"
                >
                  Start Swiping
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
