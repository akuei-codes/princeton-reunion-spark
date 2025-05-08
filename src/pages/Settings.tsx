import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, Lock, Eye, HelpCircle, MessageCircle, MapPin, Flag, Moon, Heart, LogOut } from 'lucide-react';
import Logo from '../components/Logo';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { updateUserSettings, deleteAccount } from '../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth(); // Changed from logout to signOut
  const [notifications, setNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine where the back button should go
  const handleBack = () => {
    // If we have a state with a previous path, use that
    if (location.state && location.state.from) {
      navigate(location.state.from);
    } else {
      // Default is profile
      navigate('/profile');
    }
  };

  // Save settings changes
  const handleSettingChange = async (setting: string, value: boolean) => {
    try {
      setIsLoading(true);
      // Update local state
      switch (setting) {
        case 'notifications':
          setNotifications(value);
          break;
        case 'messageNotifications':
          setMessageNotifications(value);
          break;
        case 'locationEnabled':
          setLocationEnabled(value);
          break;
        case 'showActive':
          setShowActive(value);
          break;
        default:
          break;
      }
      
      // Call API to update user settings
      await updateUserSettings({ [setting]: value });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(); // Changed from logout to signOut
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await deleteAccount();
      await signOut(); // Changed from logout to signOut
      navigate('/');
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // In a real app, you would fetch user settings here
    // For now, we'll just set some defaults
    if (user) {
      setNotifications(user.settings?.notifications ?? true);
      setMessageNotifications(user.settings?.messageNotifications ?? true);
      setLocationEnabled(user.settings?.locationEnabled ?? true);
      setShowActive(user.settings?.showActive ?? true);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={handleBack}
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
                onClick={() => navigate('/profile')}
              >
                <div className="flex items-center">
                  <Eye size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Edit Profile</span>
                </div>
                <ArrowLeft size={18} className="text-princeton-white/60 transform rotate-180" />
              </div>
              
              <div 
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => navigate('/settings/password')}
              >
                <div className="flex items-center">
                  <Lock size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Change Password</span>
                </div>
                <ArrowLeft size={18} className="text-princeton-white/60 transform rotate-180" />
              </div>

              <div 
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={handleLogout}
              >
                <div className="flex items-center">
                  <LogOut size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Logout</span>
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
                <Switch 
                  checked={notifications}
                  onCheckedChange={(value) => handleSettingChange('notifications', value)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-princeton-orange"
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <MessageCircle size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">New Messages</span>
                </div>
                <Switch 
                  checked={messageNotifications}
                  onCheckedChange={(value) => handleSettingChange('messageNotifications', value)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-princeton-orange"
                />
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
                <Switch 
                  checked={locationEnabled}
                  onCheckedChange={(value) => handleSettingChange('locationEnabled', value)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-princeton-orange"
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Eye size={20} className="text-princeton-orange mr-3" />
                  <span className="text-princeton-white">Show Active Status</span>
                </div>
                <Switch 
                  checked={showActive}
                  onCheckedChange={(value) => handleSettingChange('showActive', value)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-princeton-orange"
                />
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

          {/* Delete Account */}
          <div className="profile-card p-4 border-red-500/30">
            <h2 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-secondary border-princeton-orange/20">
                <DialogHeader>
                  <DialogTitle className="text-princeton-white">Are you absolutely sure?</DialogTitle>
                  <DialogDescription className="text-princeton-white/70">
                    This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDeleteAccount()}
                    disabled={isLoading}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
