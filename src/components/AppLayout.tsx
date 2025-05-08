
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, User, Map, MessageCircle } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  matchesCount?: number;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, hideNav = false, matchesCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  
  const isActive = (path: string) => {
    if (path === '/swipe' && pathname === '/swipe') return true;
    if (path === '/matches' && pathname.includes('/matches')) return true;
    if (path === '/profile' && pathname.includes('/profile')) return true;
    if (path === '/zones' && pathname.includes('/zone')) return true;
    return false;
  };
  
  const navItems = [
    { icon: <Heart size={24} />, label: 'Swipe', path: '/swipe' },
    { icon: <MessageCircle size={24} />, label: 'Matches', path: '/matches', count: matchesCount },
    { icon: <Map size={24} />, label: 'Hot Zones', path: '/zones' },
    { icon: <User size={24} />, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      {children}
      
      {!hideNav && (
        <nav className="sticky bottom-0 bg-secondary border-t border-princeton-orange/20 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-around">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center ${
                    isActive(item.path) 
                      ? 'text-princeton-orange' 
                      : 'text-princeton-white/60 hover:text-princeton-white'
                  } transition-colors`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                  {item.count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-princeton-orange rounded-full flex items-center justify-center text-[10px] text-black font-bold">
                      {item.count}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default AppLayout;
