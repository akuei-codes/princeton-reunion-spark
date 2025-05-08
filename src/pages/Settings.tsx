
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Lock, Eye, HelpCircle, MessageCircle, MapPin, Flag } from 'lucide-react';
import Logo from '../components/Logo';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showActive, setShowActive] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/profile')}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-princeton-white">Settings</h1>
        <div className="w-6"></div> {/* Empty div for spacing */}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Account settings */}
          <div className="profile-card p-4">
            <h2 className="text-lg font-semibold text-princeton-white mb-4">Account</h2>
            
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => navigate('/edit-profile')}
              >
                <div className="flex items-center">
                  <Eye size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Edit Profile</span>
                </div>
                <ArrowLeft size={18} className="text-princeton-white/60 transform rotate-180" />
              </div>
              
              <div 
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => navigate('/account/password')}
              >
                <div className="flex items-center">
                  <Lock size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Change Password</span>
                </div>
                <ArrowLeft size={18} className="text-princeton-white/60 transform rotate-180" />
              </div>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="profile-card p-4">
            <h2 className="text-lg font-semibold text-princeton-white mb-4">Notifications</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Bell size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Push Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-princeton-orange"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <MessageCircle size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">New Messages</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-princeton-orange"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Privacy */}
          <div className="profile-card p-4">
            <h2 className="text-lg font-semibold text-princeton-white mb-4">Privacy</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <MapPin size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Location Services</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={locationEnabled}
                    onChange={() => setLocationEnabled(!locationEnabled)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-princeton-orange"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Eye size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Show Active Status</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showActive}
                    onChange={() => setShowActive(!showActive)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-princeton-orange"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Help & Support */}
          <div className="profile-card p-4">
            <h2 className="text-lg font-semibold text-princeton-white mb-4">Help & Support</h2>
            
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => navigate('/help')}
              >
                <div className="flex items-center">
                  <HelpCircle size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Help Center</span>
                </div>
                <ArrowLeft size={18} className="text-princeton-white/60 transform rotate-180" />
              </div>
              
              <div 
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => navigate('/report')}
              >
                <div className="flex items-center">
                  <Flag size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Report a Problem</span>
                </div>
                <ArrowLeft size={18} className="text-princeton-white/60 transform rotate-180" />
              </div>
            </div>
          </div>
          
          {/* App version */}
          <div className="text-center text-xs text-princeton-white/50 mt-4">
            Me&Union v1.0.0
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
