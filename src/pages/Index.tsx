import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import TigerAnimation from '../components/TigerAnimation';
import ProfileCompletionNotification from '../components/ProfileCompletionNotification';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // Force canvas to initialize properly by triggering a resize event
    // This helps ensure the tiger animation renders correctly
    if (!loading && user) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [loading, user]);
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-princeton-orange text-xl">Loading...</div>
      </div>
    );
  }
  
  // If authenticated, show the home page with the profile completion notification
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212]">
        <TigerAnimation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center">
            <ProfileCompletionNotification className="w-full max-w-2xl" />
            
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-princeton-white mb-4">Welcome, Tiger!</h1>
              <p className="text-xl text-princeton-white/80">
                Ready to connect with fellow Princetonians during reunion weekend?
              </p>
            </div>
            
            {/* Rest of the authenticated home page content will go here */}
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
              <div className="bg-secondary/70 backdrop-blur-sm p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-princeton-white mb-3">Start Swiping</h2>
                <p className="text-princeton-white/70 mb-4">
                  Find your perfect Tiger match by swiping through profiles of fellow Princetonians.
                </p>
                <button 
                  onClick={() => window.location.href = '/swipe'} 
                  className="tiger-btn w-full"
                >
                  Find Matches
                </button>
              </div>
              
              <div className="bg-secondary/70 backdrop-blur-sm p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-princeton-white mb-3">Hot Zones</h2>
                <p className="text-princeton-white/70 mb-4">
                  Discover the most popular reunion events and meet-ups happening right now.
                </p>
                <button 
                  onClick={() => window.location.href = '/zones'} 
                  className="tiger-btn w-full"
                >
                  Explore Hot Zones
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise show the landing page with tiger animation
  return (
    <>
      <TigerAnimation />
      <LandingPage />
    </>
  );
};

export default Index;
