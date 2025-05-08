
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, LogOut, Settings, Edit, MapPin, 
  Heart, X, Save, GraduationCap, Calendar, Users
} from 'lucide-react';
import Logo from '../components/Logo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, updateUserProfile, uploadUserPhoto, deleteUserPhoto, updateUserInterests, updateUserClubs } from '../lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { UserGender, GenderPreference } from '@/types/database';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable state
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('everyone');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [availableClubs, setAvailableClubs] = useState<string[]>([]);

  // Fetch current user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    onSuccess: (data) => {
      if (data) {
        setBio(data.bio || '');
        setMajor(data.major || '');
        setGender(data.gender || '');
        setGenderPreference(data.gender_preference || 'everyone');
        setSelectedInterests(data.interests.map(i => i.name));
        setSelectedClubs(data.clubs.map(c => c.name));
      }
    }
  });

  // Fetch available interests and clubs
  const { data: interestsClubs } = useQuery({
    queryKey: ['interests-clubs'],
    queryFn: async () => {
      const [interestsRes, clubsRes] = await Promise.all([
        supabase.from('interests').select('name').order('name'),
        supabase.from('clubs').select('name').order('name')
      ]);
      
      const interests = interestsRes.data?.map(i => i.name) || [];
      const clubs = clubsRes.data?.map(c => c.name) || [];
      
      setAvailableInterests(interests);
      setAvailableClubs(clubs);
      
      return { interests, clubs };
    },
    enabled: isEditing
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Update basic profile info
      await updateUserProfile({ 
        bio, 
        major, 
        gender: gender as UserGender, 
        gender_preference: genderPreference 
      });
      
      // Update interests and clubs
      await Promise.all([
        updateUserInterests(selectedInterests),
        updateUserClubs(selectedClubs)
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const MAX_SIZE_MB = 5;
    
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File size should be less than ${MAX_SIZE_MB}MB`);
      return;
    }
    
    try {
      // Calculate the next position
      const position = user?.photos?.length || 0;
      
      await uploadUserPhoto(file, position);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Photo added successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    }
    
    // Reset input
    e.target.value = '';
  };
  
  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteUserPhoto(photoId);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };
  
  const handleSaveProfile = () => {
    updateProfileMutation.mutate();
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
    }
  };
  
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      // Limit to 5 interests
      if (selectedInterests.length >= 5) {
        toast.error('You can select up to 5 interests');
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  const toggleClub = (club: string) => {
    if (selectedClubs.includes(club)) {
      setSelectedClubs(selectedClubs.filter(c => c !== club));
    } else {
      // Limit to 3 clubs
      if (selectedClubs.length >= 3) {
        toast.error('You can select up to 3 clubs');
        return;
      }
      setSelectedClubs([...selectedClubs, club]);
    }
  };
  
  const addNewInterest = () => {
    if (!newInterest.trim()) return;
    
    // Check if it already exists
    if (availableInterests.includes(newInterest) || selectedInterests.includes(newInterest)) {
      toast.error('This interest already exists');
      return;
    }
    
    // Check max interests
    if (selectedInterests.length >= 5) {
      toast.error('You can select up to 5 interests');
      return;
    }
    
    // Add to selected
    setSelectedInterests([...selectedInterests, newInterest]);
    setAvailableInterests([...availableInterests, newInterest]);
    setNewInterest('');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4">Error loading profile</div>
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
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => isEditing ? setIsEditing(false) : navigate('/swipe')}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
        {isEditing ? (
          <button 
            onClick={handleSaveProfile} 
            className="text-princeton-white hover:text-princeton-orange transition-colors"
            disabled={updateProfileMutation.isPending}
          >
            <Save size={24} />
          </button>
        ) : (
          <button 
            onClick={() => navigate('/settings')}
            className="text-princeton-white hover:text-princeton-orange transition-colors"
          >
            <Settings size={24} />
          </button>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 pb-20">
        <div className="flex flex-col items-center">
          {/* Profile photo */}
          <div className="relative mb-6">
            <img 
              src={user.photos[0]?.photo_url || '/placeholder.svg'}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-princeton-orange"
            />
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAddPhoto}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-princeton-orange rounded-full flex items-center justify-center"
            >
              <Camera size={16} className="text-black" />
            </button>
          </div>
          
          {/* User info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-princeton-white">
              {user.name}, <span className="text-princeton-orange">{user.class_year}</span>
            </h1>
            
            {!isEditing && user.building && (
              <div className="flex items-center justify-center mt-1 text-sm text-princeton-white/70">
                <MapPin size={14} className="mr-1" />
                <span>{user.building}</span>
              </div>
            )}
            
            {!isEditing && user.vibe && (
              <div className="mt-2 inline-block px-3 py-1 bg-princeton-orange/20 text-princeton-orange rounded-full text-sm">
                {user.vibe}
              </div>
            )}
            
            {!isEditing && (
              <div className="mt-2 flex justify-center gap-2">
                <div className="inline-block px-3 py-1 bg-secondary/70 text-princeton-white/80 rounded-full text-sm flex items-center">
                  <Users size={14} className="mr-1" />
                  {user.gender_preference === 'everyone' 
                    ? 'Into Everyone' 
                    : `Into ${user.gender_preference === 'male' ? 'Men' : 'Women'}`
                  }
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Edit mode: gender preferences */}
        {isEditing && (
          <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-princeton-white mb-4">About You</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm text-princeton-white/80">
                  Your Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'non-binary', label: 'Non-binary' },
                    { value: 'other', label: 'Other' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value as UserGender)}
                      className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                        gender === option.value
                          ? 'bg-princeton-orange text-princeton-black border-princeton-orange'
                          : 'bg-secondary text-princeton-white border-princeton-orange/30 hover:border-princeton-orange/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm text-princeton-white/80">
                  Show Me
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'male', label: 'Men' },
                    { value: 'female', label: 'Women' },
                    { value: 'everyone', label: 'Everyone' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGenderPreference(option.value as GenderPreference)}
                      className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                        genderPreference === option.value
                          ? 'bg-princeton-orange text-princeton-black border-princeton-orange'
                          : 'bg-secondary text-princeton-white border-princeton-orange/30 hover:border-princeton-orange/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bio */}
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">About</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-princeton-orange"
              >
                <Edit size={18} />
              </button>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none resize-none"
            />
          ) : (
            <p className="text-princeton-white/80">{user.bio || "No bio added yet"}</p>
          )}
        </div>
        
        {/* Interests */}
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Interests</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-princeton-orange"
              >
                <Edit size={18} />
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className="px-3 py-1 bg-princeton-orange text-black rounded-full text-sm flex items-center gap-1"
                  >
                    {interest}
                    <X size={14} />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add new interest..."
                  className="flex-1 p-2 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none text-sm"
                />
                <button
                  onClick={addNewInterest}
                  disabled={!newInterest.trim() || selectedInterests.length >= 5}
                  className="px-3 py-1 bg-princeton-orange text-black rounded-lg text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              
              <div className="max-h-32 overflow-y-auto bg-secondary/50 rounded-lg p-2">
                <div className="flex flex-wrap gap-2">
                  {availableInterests
                    .filter(interest => !selectedInterests.includes(interest))
                    .map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        disabled={selectedInterests.length >= 5}
                        className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm hover:bg-secondary/80 disabled:opacity-50"
                      >
                        {interest}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <div 
                    key={index}
                    className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm"
                  >
                    {interest.name}
                  </div>
                ))
              ) : (
                <p className="text-princeton-white/60">No interests added yet</p>
              )}
            </div>
          )}
        </div>
        
        {/* Princeton Info */}
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Princeton Info</h2>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-princeton-orange"
              >
                <Edit size={18} />
              </button>
            )}
          </div>
          
          <div className="space-y-3 text-princeton-white/80">
            <div className="flex items-start gap-2">
              <GraduationCap className="text-princeton-orange mt-1" size={18} />
              {isEditing ? (
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Your major..."
                  className="flex-1 p-2 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
                />
              ) : (
                <div>Major: {user.major || "Not specified"}</div>
              )}
            </div>
            
            <div className="flex items-start gap-2">
              <Calendar className="text-princeton-orange mt-1" size={18} />
              <div>Class of {user.class_year}</div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2 mt-2">
                <label className="block text-sm text-princeton-white/80">Clubs:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedClubs.map((club) => (
                    <button
                      key={club}
                      onClick={() => toggleClub(club)}
                      className="px-3 py-1 bg-princeton-orange text-black rounded-full text-sm flex items-center gap-1"
                    >
                      {club}
                      <X size={14} />
                    </button>
                  ))}
                </div>
                
                <div className="max-h-32 overflow-y-auto bg-secondary/50 rounded-lg p-2">
                  <div className="flex flex-wrap gap-2">
                    {availableClubs
                      .filter(club => !selectedClubs.includes(club))
                      .map((club) => (
                        <button
                          key={club}
                          onClick={() => toggleClub(club)}
                          disabled={selectedClubs.length >= 3}
                          className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm hover:bg-secondary/80 disabled:opacity-50"
                        >
                          {club}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Users className="text-princeton-orange mt-1" size={18} />
                <div>
                  Clubs: {user.clubs && user.clubs.length > 0 
                    ? user.clubs.map(club => club.name).join(', ') 
                    : "None added yet"}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Photos */}
        <div className="profile-card bg-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-princeton-white">Photos</h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-princeton-orange"
            >
              <Camera size={18} />
            </button>
          </div>
          
          {user.photos && user.photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {user.photos.map((photo, index) => (
                <div className="relative aspect-square" key={photo.id}>
                  <img 
                    src={photo.photo_url} 
                    alt={`${user.name} photo ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {[...Array(Math.max(0, 6 - user.photos.length))].map((_, index) => (
                <button
                  key={`empty-${index}`}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-princeton-orange/30 flex items-center justify-center"
                >
                  <Camera size={20} className="text-princeton-white/60" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera size={32} className="mx-auto mb-2 text-princeton-white/40" />
              <p className="text-princeton-white/60">No photos yet</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-princeton-orange text-black rounded-lg text-sm"
              >
                Add Photos
              </button>
            </div>
          )}
          
          <div className="text-xs text-princeton-white/60 mt-2 text-center">
            First photo is your profile picture
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
