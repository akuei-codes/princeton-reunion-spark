import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import TigerAnimation from '../components/TigerAnimation';
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
  
  // If authenticated, redirect to dashboard
  if (user) {
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
