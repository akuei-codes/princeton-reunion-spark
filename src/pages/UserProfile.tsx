
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, LogOut, Settings, Edit, MapPin } from 'lucide-react';
import Logo from '../components/Logo';

// Sample user data - in a real app, this would come from authentication
const currentUser = {
  id: "current",
  name: 'Alex',
  classYear: '2023',
  vibe: 'Down to Roam',
  bio: 'Computer science major who knows all the secret spots on campus. Let me show you around!',
  photos: [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600&h=800'
  ],
  interests: ['Coding', 'Music', 'Coffee', 'Hiking'],
  clubs: ['Quadrangle', 'CS Club'],
  major: 'Computer Science',
};

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    // In a real app, this would handle logout
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/swipe')}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
        <button 
          onClick={() => navigate('/settings')}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <Settings size={24} />
        </button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col items-center">
          {/* Profile photo */}
          <div className="relative mb-6">
            <img 
              src={currentUser.photos[0]} 
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-princeton-orange"
            />
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-princeton-orange rounded-full flex items-center justify-center"
            >
              <Camera size={16} className="text-black" />
            </button>
          </div>
          
          {/* User info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-princeton-white">
              {currentUser.name}, <span className="text-princeton-orange">{currentUser.classYear}</span>
            </h1>
            <div className="flex items-center justify-center mt-1 text-sm text-princeton-white/70">
              <MapPin size={14} className="mr-1" />
              <span>Frist Campus Center</span>
            </div>
            <div className="mt-2 inline-block px-3 py-1 bg-princeton-orange/20 text-princeton-orange rounded-full text-sm">
              {currentUser.vibe}
            </div>
          </div>
        </div>
        
        <div className="profile-card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">About</h2>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-princeton-orange"
            >
              <Edit size={18} />
            </button>
          </div>
          <p className="text-princeton-white/80">{currentUser.bio}</p>
        </div>
        
        <div className="profile-card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Interests</h2>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-princeton-orange"
            >
              <Edit size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentUser.interests.map((interest, index) => (
              <div 
                key={index}
                className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm"
              >
                {interest}
              </div>
            ))}
          </div>
        </div>
        
        <div className="profile-card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Princeton Info</h2>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-princeton-orange"
            >
              <Edit size={18} />
            </button>
          </div>
          <div className="space-y-2 text-princeton-white/80">
            <div>Major: {currentUser.major}</div>
            <div>Clubs: {currentUser.clubs.join(', ')}</div>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-500 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </main>
    </div>
  );
};

export default UserProfile;
