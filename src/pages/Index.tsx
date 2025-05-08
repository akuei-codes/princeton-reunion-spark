import { Navigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';

// In a real app, we would check if the user is authenticated
const isAuthenticated = false; // For demo purposes

const Index = () => {
  // If authenticated, redirect to the swipe page
  if (isAuthenticated) {
    return <Navigate to="/swipe" replace />;
  }
  
  // Otherwise show the landing page
  return <LandingPage />;
};

export default Index;
