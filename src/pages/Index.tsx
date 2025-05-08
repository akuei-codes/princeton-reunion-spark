import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import TigerAnimation from '../components/TigerAnimation';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If authenticated, redirect to the swipe page
  if (user) {
    return <Navigate to="/swipe" replace />;
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
