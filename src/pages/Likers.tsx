import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getUserLikers, recordSwipe } from '@/lib/api';
import { UserWithRelations } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge'; // Add this import

const LikersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: likers, isLoading, isError } = useQuery({
    queryKey: ['likers'],
    queryFn: getUserLikers
  });

  // Handle swipe on a user who likes you
  const swipeMutation = useMutation({
    mutationFn: ({ userId, direction }: { userId: string, direction: 'left' | 'right' }) => 
      recordSwipe(userId, direction),
    onSuccess: (isMatch, variables) => {
      if (isMatch) {
        toast.success("It's a match! 🎉", {
          action: {
            label: "View Matches",
            onClick: () => navigate('/matches')
          }
        });
      } else if (variables.direction === 'right') {
        toast.success("You liked them back!");
      } else {
        toast.info("You passed on this user");
      }
      
      // Invalidate and refetch likers query
      queryClient.invalidateQueries({ queryKey: ['likers'] });
    },
    onError: () => {
      toast.error("Error recording response");
    }
  });
  
  const handleSwipe = (userId: string, direction: 'left' | 'right') => {
    swipeMutation.mutate({ userId, direction });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
        <div className="container mx-auto max-w-md py-8 flex flex-col">
          <Button 
            variant="ghost" 
            className="text-princeton-white mb-6 w-fit"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-princeton-white mb-6">People Who Like You</h1>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-princeton-white">Loading your admirers...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
        <div className="container mx-auto max-w-md py-8 flex flex-col">
          <Button 
            variant="ghost" 
            className="text-princeton-white mb-6 w-fit"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-princeton-white mb-6">People Who Like You</h1>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-princeton-white">Error loading admirers</div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!likers || likers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
        <div className="container mx-auto max-w-md py-8 flex flex-col">
          <Button 
            variant="ghost" 
            className="text-princeton-white mb-6 w-fit"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-princeton-white mb-6">People Who Like You</h1>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">😢</div>
            <h2 className="text-xl font-semibold text-princeton-white mb-2">No one has liked you yet</h2>
            <p className="text-princeton-white/70 mb-6">Keep swiping to get more visibility!</p>
            <Button 
              variant="outline"
              className="border-princeton-orange text-princeton-orange hover:bg-princeton-orange/10"
              onClick={() => navigate('/swipe')}
            >
              Go Swipe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
      <div className="container mx-auto max-w-md py-8">
        <Button 
          variant="ghost" 
          className="text-princeton-white mb-6 w-fit"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-princeton-white mb-6">People Who Like You</h1>
        
        <div className="space-y-6">
          {likers.map((user: UserWithRelations) => (
            <Card key={user.auth_id} className="bg-secondary border-none overflow-hidden">
              <CardHeader className="p-0">
                <Carousel>
                  <CarouselContent>
                    {user.photo_urls?.map((photoUrl, index) => (
                      <CarouselItem key={index}>
                        <div className="h-72 relative">
                          <img
                            src={photoUrl}
                            alt={`${user.name}'s photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    )) || (
                      <CarouselItem>
                        <div className="h-72 bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-400">No photo</span>
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </CardHeader>
              
              <CardContent className="p-4">
                <h2 className="text-xl font-bold text-princeton-white">{user.name}, {user.class_year}</h2>
                {user.major && <p className="text-princeton-orange">{user.major}</p>}
                
                {/* Intention - Simplified */}
                {user.intention && (
                  <div className="text-xs text-princeton-orange font-medium mt-1 mb-2">
                    {user.intention === "casual" ? "Casual" : "Serious"}
                  </div>
                )}
                
                {user.bio && (
                  <p className="text-sm text-white/80 line-clamp-3 mt-2">{user.bio}</p>
                )}
                
                {/* Interests */}
                {user.interests && user.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {user.interests.slice(0, 3).map((interest: any, index: number) => {
                      const interestName = typeof interest === 'string' 
                        ? interest 
                        : interest?.name?.name || interest?.name || '';
                      
                      return interestName ? (
                        <span key={index} className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                          {interestName}
                        </span>
                      ) : null;
                    })}
                    
                    {user.interests.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-xs text-white">
                        +{user.interests.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between gap-4">
                <Button 
                  className="w-1/2 bg-red-500 hover:bg-red-600"
                  onClick={() => handleSwipe(user.auth_id, 'left')}
                >
                  <X className="mr-2 h-4 w-4" />
                  Pass
                </Button>
                <Button 
                  className="w-1/2 bg-green-500 hover:bg-green-600"
                  onClick={() => handleSwipe(user.auth_id, 'right')}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Like Back
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LikersPage;
