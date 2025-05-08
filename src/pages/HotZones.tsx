
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getHotZones } from '../lib/api';
import { toast } from 'sonner';

const HotZones: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch hot zones data
  const { data: hotZones = [], isLoading, error } = useQuery({
    queryKey: ['hot-zones'],
    queryFn: getHotZones,
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching hot zones:", error);
        toast.error("Failed to load hot zones");
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-4 flex items-center">
        <button 
          onClick={() => navigate('/dashboard')}
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
        
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-pulse text-princeton-orange text-lg">Loading hot zones...</div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-10">
            <div className="text-red-500 mb-2">Failed to load hot zones</div>
            <button 
              onClick={() => window.location.reload()}
              className="text-princeton-orange underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="space-y-4">
            {hotZones.length > 0 ? hotZones.map((zone) => (
              <div 
                key={zone.id}
                className="relative overflow-hidden rounded-xl border border-princeton-orange/30 hover:border-princeton-orange transition-all duration-200"
              >
                {/* Background image with gradient overlay */}
                <div className="relative h-40">
                  <img 
                    src={zone.image_url || '/placeholder.svg'}
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
                          <span>{zone.distance || "On campus"}</span>
                          <span className="mx-2">•</span>
                          <Clock size={14} className="mr-1" />
                          <span>Updated recently</span>
                        </div>
                      </div>
                      
                      <div className="bg-princeton-orange text-princeton-black px-3 py-1 rounded-lg font-medium text-sm">
                        {zone.matches_nearby || zone.active_users} {zone.matches_nearby === 1 ? 'match' : 'matches'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom section */}
                <div className="bg-secondary p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-princeton-white">
                      <Users size={18} className="text-princeton-orange mr-2" />
                      <span>{zone.active_users} Tigers active now</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/hot-zone/${zone.id}`)}
                      className="text-princeton-orange"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {zone.events && Array.isArray(zone.events) ? zone.events.map((event, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1 bg-black/30 text-princeton-white/80 rounded-full text-sm"
                      >
                        {event.name}
                      </div>
                    )) : (
                      <div className="px-3 py-1 bg-black/30 text-princeton-white/80 rounded-full text-sm">
                        No scheduled events
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <div className="text-princeton-white mb-4">No hot zones available right now</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-princeton-orange underline"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HotZones;
