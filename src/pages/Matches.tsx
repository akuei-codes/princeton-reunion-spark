
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, MessageCircle } from 'lucide-react';

// Sample matches data - in a real app, this would come from a backend
const sampleMatches = [
  {
    id: 1,
    name: 'Emma',
    classYear: '2022',
    lastMessage: 'See you at Reunions!',
    time: '2h',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800',
    unread: true,
  },
  {
    id: 2,
    name: 'Jake',
    classYear: '2020',
    lastMessage: 'Which tent are you at?',
    time: '5h',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800',
    unread: false,
  },
  {
    id: 3,
    name: 'Sophia',
    classYear: '2023',
    lastMessage: 'Just matched!',
    time: '1d',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800',
    unread: false,
  },
];

const Matches: React.FC = () => {
  const navigate = useNavigate();

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
        
        <div className="space-y-4">
          {sampleMatches.map((match) => (
            <div 
              key={match.id}
              className="flex items-center p-3 rounded-lg bg-secondary border border-princeton-orange/20 hover:border-princeton-orange/50 transition-all cursor-pointer"
              onClick={() => navigate(`/chat/${match.id}`)}
            >
              <div className="relative">
                <img 
                  src={match.photo}
                  alt={match.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {match.unread && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-princeton-orange rounded-full border border-black"></div>
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex justify-between">
                  <h3 className="font-bold text-princeton-white">
                    {match.name} <span className="text-princeton-white/60 font-normal">'{match.classYear.slice(-2)}</span>
                  </h3>
                  <span className="text-xs text-princeton-white/60">{match.time}</span>
                </div>
                <p className={`text-sm ${match.unread ? 'text-princeton-white font-medium' : 'text-princeton-white/70'}`}>
                  {match.lastMessage}
                </p>
              </div>
              
              <button className="ml-2 text-princeton-orange">
                <MessageCircle size={20} />
              </button>
            </div>
          ))}
        </div>
        
        {sampleMatches.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-princeton-orange" />
            </div>
            <h3 className="text-xl font-bold text-princeton-white mb-2">No matches yet</h3>
            <p className="text-princeton-white/70">
              Start swiping to find your Tiger match!
            </p>
          </div>
        )}
      </main>

      {/* We'll use the common bottom navigation in the app layout later */}
    </div>
  );
};

export default Matches;
