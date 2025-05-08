
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, X, Heart, Calendar, MapPin, Globe, GraduationCap } from 'lucide-react';
import Logo from '../components/Logo';

// Sample user data - in a real app, this would come from a backend
const sampleUsers = {
  "1": {
    id: 1,
    name: 'Emma',
    classYear: '2022',
    vibe: 'Looking to Party',
    bio: 'Former Daily Prince editor who misses late nights at Terrace. Here for old times and maybe new memories.',
    location: 'Near Terrace Club',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    interests: ['Journalism', 'Art', 'Film', 'Dancing'],
    clubs: ['Terrace', 'Daily Princetonian'],
    major: 'English',
  },
  "2": {
    id: 2,
    name: 'Jake',
    classYear: '2020',
    vibe: 'Looking to Catch Up',
    bio: 'Economics major, Tower Club alum. Would love to catch up over drinks at the reunions!',
    location: 'Near Tiger Inn',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    interests: ['Finance', 'Running', 'Beer Pong', 'Travel'],
    clubs: ['Tower', 'Investment Club'],
    major: 'Economics',
  }
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Get the user data for the current ID
  const user = id && sampleUsers[id as keyof typeof sampleUsers];
  
  // Handle case where user doesn't exist
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4">User not found</div>
        <button 
          onClick={() => navigate('/swipe')}
          className="px-4 py-2 bg-princeton-orange text-black rounded-lg"
        >
          Back to Swiping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <div className="relative h-[40vh] bg-gray-800">
        {/* Main profile photo */}
        <img 
          src={user.photos[0]} 
          alt={user.name}
          className="w-full h-full object-cover"
        />
        
        {/* Header overlay with back button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </button>
          
          <Logo />
          
          <div className="w-10"></div> {/* Empty div for symmetric spacing */}
        </div>
        
        {/* Action buttons */}
        <div className="absolute -bottom-6 right-4 flex gap-3">
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500 text-red-500">
            <X size={24} />
          </button>
          <button className="w-12 h-12 bg-princeton-orange rounded-full flex items-center justify-center shadow-lg">
            <Heart size={24} className="text-white" />
          </button>
          <button className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <MessageCircle size={24} className="text-white" />
          </button>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-6 mt-4">
        <div className="space-y-6">
          {/* User info */}
          <div>
            <h1 className="text-3xl font-bold text-princeton-white">
              {user.name}, <span className="text-princeton-orange">{user.classYear}</span>
            </h1>
            <div className="flex items-center mt-1 text-sm text-princeton-white/70">
              <MapPin size={14} className="mr-1" />
              <span>{user.location}</span>
            </div>
            <div className="mt-1 inline-block px-3 py-1 bg-princeton-orange/20 text-princeton-orange rounded-full text-sm">
              {user.vibe}
            </div>
          </div>
          
          {/* Bio */}
          <div>
            <h2 className="text-lg font-semibold text-princeton-white mb-2">About</h2>
            <p className="text-princeton-white/80">{user.bio}</p>
          </div>
          
          {/* Education */}
          <div>
            <h2 className="text-lg font-semibold text-princeton-white mb-2">Princeton Experience</h2>
            <div className="space-y-2">
              <div className="flex items-center text-princeton-white/80">
                <GraduationCap size={18} className="mr-2 text-princeton-orange" />
                <span>Studied {user.major}</span>
              </div>
              <div className="flex items-center text-princeton-white/80">
                <Calendar size={18} className="mr-2 text-princeton-orange" />
                <span>Class of {user.classYear}</span>
              </div>
              <div className="flex items-start text-princeton-white/80">
                <Globe size={18} className="mr-2 text-princeton-orange mt-1" />
                <span>Member of {user.clubs.join(', ')}</span>
              </div>
            </div>
          </div>
          
          {/* Interests */}
          <div>
            <h2 className="text-lg font-semibold text-princeton-white mb-2">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <div 
                  key={index}
                  className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm"
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
          
          {/* More photos */}
          {user.photos.length > 1 && (
            <div>
              <h2 className="text-lg font-semibold text-princeton-white mb-2">More Photos</h2>
              <div className="grid grid-cols-2 gap-2">
                {user.photos.slice(1).map((photo, index) => (
                  <img 
                    key={index}
                    src={photo}
                    alt={`${user.name} photo ${index + 2}`}
                    className="rounded-lg w-full h-48 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
