
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Users, Compass } from 'lucide-react';
import TigerAnimation from '../components/TigerAnimation';
import ProfileCompletionNotification from '../components/ProfileCompletionNotification';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getUserLikers } from '@/lib/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch likers count
  const { data: likers } = useQuery({
    queryKey: ['likers'],
    queryFn: getUserLikers,
    // Don't retry on errors since we expect errors for new users
    retry: false,
    // Only fetch if user is logged in
    enabled: !!user,
    // Don't show an error if this fails
    meta: {
      errorMessage: false
    }
  });
  
  const likersCount = likers?.length || 0;

  const features = [
    {
      title: 'Swipe',
      description: 'Find potential matches by swiping through profiles of other Tigers.',
      icon: <Heart size={40} className="text-princeton-orange" />,
      action: '/swipe',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Messages',
      description: 'View and respond to conversations with your matches.',
      icon: <MessageCircle size={40} className="text-princeton-orange" />,
      action: '/chat',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Matches',
      description: 'See all your current matches and start conversations.',
      icon: <Users size={40} className="text-princeton-orange" />,
      action: '/matches',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Hot Zones',
      description: 'Discover popular reunion areas and events happening now.',
      icon: <Compass size={40} className="text-princeton-orange" />,
      action: '/hot-zones',
      color: 'from-amber-500 to-yellow-500',
    },
  ];
  
  // Function to handle dashboard navigation
  const navigateTo = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  return (
    <AppLayout>
      <TigerAnimation />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col items-center">
          <ProfileCompletionNotification className="w-full max-w-2xl" />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-princeton-white mb-2">
              Welcome, <span className="text-princeton-orange">{user?.email?.split('@')[0] || 'Tiger'}</span>!
            </h1>
            <p className="text-xl text-princeton-white/80 max-w-2xl mx-auto">
              Connect with fellow Princetonians during reunion weekend. 
              What would you like to do today?
            </p>
          </div>
          
          {/* See Who Likes You Button */}
          {likersCount > 0 && (
            <div className="w-full max-w-4xl mb-6">
              <Button 
                onClick={() => navigate('/likers')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-4 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-start pl-6">
                  <Heart size={28} className="text-white animate-pulse" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-semibold">See Who Likes You</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-white/30 rounded-full text-white font-bold">
                    {likersCount}
                  </span>
                </div>
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-70 group-hover:right-4 transition-all duration-300">
                  <Heart size={28} className="text-white fill-white" />
                </div>
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="bg-secondary/70 backdrop-blur-sm border-none shadow-lg overflow-hidden hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                onClick={() => navigateTo(feature.action)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    {feature.icon}
                    <CardTitle className="text-princeton-white text-2xl">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <CardDescription className="text-princeton-white/70 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent double navigation
                      navigateTo(feature.action);
                    }}
                    className="w-full bg-princeton-orange hover:bg-princeton-orange/80 text-black font-medium"
                  >
                    Explore {feature.title}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card className="w-full max-w-4xl bg-secondary/70 backdrop-blur-sm border-none shadow-lg overflow-hidden mb-8">
            <CardHeader>
              <CardTitle className="text-princeton-white text-center text-2xl">
                Your Reunion Weekend Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-3xl font-bold text-princeton-orange">0</p>
                  <p className="text-princeton-white/70">Matches</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-3xl font-bold text-princeton-orange">0</p>
                  <p className="text-princeton-white/70">Messages</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-3xl font-bold text-princeton-orange">0</p>
                  <p className="text-princeton-white/70">Profile Views</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-3xl font-bold text-princeton-orange">3</p>
                  <p className="text-princeton-white/70">Days Left</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/profile')}
              variant="outline"
              className="border-princeton-orange/60 text-princeton-orange hover:bg-princeton-orange/10"
            >
              Edit Your Profile
            </Button>

            {likersCount > 0 && (
              <Button 
                onClick={() => navigate('/likers')}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 flex items-center gap-2"
              >
                <Heart size={16} className="text-purple-400" />
                <span>{likersCount} {likersCount === 1 ? 'Tiger' : 'Tigers'} like you</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
