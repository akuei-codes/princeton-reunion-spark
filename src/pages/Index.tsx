
import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import TigerAnimation from '../components/TigerAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { checkUserTableAccess } from '@/lib/supabase';

const Index = () => {
  const { user, loading, isProfileComplete } = useAuth();
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  
  useEffect(() => {
    // Force canvas to initialize properly by triggering a resize event
    // This helps ensure the tiger animation renders correctly
    if (!loading && user) {
      window.dispatchEvent(new Event('resize'));
      
      // Check database permissions
      const checkPermissions = async () => {
        setCheckingPermissions(true);
        try {
          const hasAccess = await checkUserTableAccess();
          if (!hasAccess) {
            toast.error("Database permission issues detected. Please check your RLS policies.", {
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("Error checking permissions:", error);
        } finally {
          setCheckingPermissions(false);
        }
      };
      
      checkPermissions();
    }
  }, [loading, user]);
  
  // Show loading state while checking auth
  if (loading || checkingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-princeton-orange text-xl">Loading...</div>
      </div>
    );
  }
  
  // If authenticated, redirect based on profile completion
  if (user) {
    // For users with auth but no profile in database yet, redirect to profile setup
    if (!isProfileComplete) {
      return <Navigate to="/profile-setup" replace />;
    }
    // For users with complete profiles, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
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
