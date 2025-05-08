
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, MapPin, Users, Clock, ChevronRight } from 'lucide-react';

// Sample hot zones data - in a real app, this would come from a backend
const hotZones = [
  {
    id: 1,
    name: "Terrace Club",
    activeUsers: 24,
    matchesNearby: 2,
    distance: "0.2 miles",
    timeUpdated: "2 min ago",
    events: ["90's Dance Party", "Alumni Mixer"],
    image: "https://princetoniansforeweb.com/wp-content/uploads/2020/12/PFE_Website_Terrace.jpg"
  },
  {
    id: 2,
    name: "Cannon Green",
    activeUsers: 42,
    matchesNearby: 3,
    distance: "0.3 miles",
    timeUpdated: "Just now",
    events: ["Class of '22 Gathering"],
    image: "https://www.princeton.edu/sites/default/files/styles/half_2x/public/images/2022/02/20220215_Cannon_Green_DJA_011.jpg"
  },
  {
    id: 3,
    name: "Ivy Club",
    activeUsers: 18,
    matchesNearby: 1,
    distance: "0.4 miles",
    timeUpdated: "5 min ago",
    events: ["Formal Reception"],
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Princeton_Ivy_Club.jpg"
  },
  {
    id: 4,
    name: "Tiger Inn",
    activeUsers: 36,
    matchesNearby: 4,
    distance: "0.3 miles",
    timeUpdated: "1 min ago",
    events: ["Beer Pong Tournament", "Open Bar"],
    image: "https://princetoniansforeweb.com/wp-content/uploads/2020/12/PFE_Website_TI.jpg"
  },
];

const HotZones: React.FC = () => {
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
        <h1 className="text-2xl font-bold text-princeton-white mb-2">Hot Zones</h1>
        <p className="text-princeton-white/70 mb-6">
          Find where Tigers are gathering during Reunions
        </p>
        
        <div className="space-y-4">
          {hotZones.map((zone) => (
            <div 
              key={zone.id}
              className="relative overflow-hidden rounded-xl border border-princeton-orange/30 hover:border-princeton-orange transition-all duration-200"
            >
              {/* Background image with gradient overlay */}
              <div className="relative h-40">
                <img 
                  src={zone.image}
                  alt={zone.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-bold text-white">{zone.name}</h3>
                      <div className="flex items-center text-princeton-white/70 text-sm mt-1">
                        <MapPin size={14} className="mr-1" />
                        <span>{zone.distance}</span>
                        <span className="mx-2">•</span>
                        <Clock size={14} className="mr-1" />
                        <span>{zone.timeUpdated}</span>
                      </div>
                    </div>
                    
                    <div className="bg-princeton-orange text-princeton-black px-3 py-1 rounded-lg font-medium text-sm">
                      {zone.matchesNearby} {zone.matchesNearby === 1 ? 'match' : 'matches'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom section */}
              <div className="bg-secondary p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center text-princeton-white">
                    <Users size={18} className="text-princeton-orange mr-2" />
                    <span>{zone.activeUsers} Tigers active now</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/hot-zone/${zone.id}`)}
                    className="text-princeton-orange"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {zone.events.map((event, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1 bg-black/30 text-princeton-white/80 rounded-full text-sm"
                    >
                      {event}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HotZones;
