import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { ArrowLeft, ArrowRight, Upload, X, MapPin, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { UserGender, GenderPreference, UserVibe, CampusBuilding } from '@/types/database';

type Step = 'basics' | 'photos' | 'interests' | 'gender' | 'location' | 'review';

interface VibeOption {
  id: string;
  label: UserVibe;
  emoji: string;
}

const vibeOptions: VibeOption[] = [
  { id: 'party', label: 'Looking to Party', emoji: '🍻' },
  { id: 'catch-up', label: 'Looking to Catch Up', emoji: '💬' },
  { id: 'roam', label: 'Down to Roam', emoji: '🧡' },
  { id: 'hook-up', label: 'Looking for a Hook-Up', emoji: '❤️' },
  { id: 'night', label: '🌙 Let\'s Just See Where the Night Takes Us', emoji: '🌙' },
  { id: 'deeper', label: '💑 Looking for Something Deeper', emoji: '💑' },
];

const genderOptions: { value: UserGender, label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' }
];

const preferenceOptions: { value: GenderPreference, label: string }[] = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'everyone', label: 'Everyone' }
];

const MAX_PHOTOS = 6;
const MAX_PHOTO_SIZE_MB = 5;
const MAX_INTERESTS = 5;
const MAX_CLUBS = 3;

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setProfileComplete } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [stepNumber, setStepNumber] = useState<number>(1);
  const totalSteps = 6;

  // Basic info
  const [name, setName] = useState<string>('');
  const [classYear, setClassYear] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [major, setMajor] = useState<string>('');
  
  // Photos
  const [photos, setPhotos] = useState<{url: string, file: File}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Vibe and gender
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [gender, setGender] = useState<UserGender | ''>('');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('everyone');
  
  // Interests and clubs
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableClubs, setAvailableClubs] = useState<string[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState<string>('');
  
  // Location
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch available interests and clubs on component mount
  useEffect(() => {
    const fetchInterestsAndClubs = async () => {
      try {
        // Fetch interests
        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('name')
          .order('name');
        
        if (interestsError) throw interestsError;
        setAvailableInterests(interestsData.map(interest => interest.name));
        
        // Fetch clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('name')
          .order('name');
        
        if (clubsError) throw clubsError;
        setAvailableClubs(clubsData.map(club => club.name));
        
        // Fetch buildings
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('campus_buildings')
          .select('*')
          .order('name');
        
        if (buildingsError) throw buildingsError;
        setBuildings(buildingsData);
        
      } catch (error) {
        console.error('Error fetching options:', error);
        toast.error('Failed to load options');
      }
    };
    
    fetchInterestsAndClubs();
  }, []);

  const handleContinue = () => {
    // Validate current step
    if (currentStep === 'basics') {
      if (!name || !classYear || !major) {
        toast.error('Please fill out all required fields');
        return;
      }
      setCurrentStep('photos');
      setStepNumber(2);
    } else if (currentStep === 'photos') {
      if (photos.length === 0) {
        toast.error('Please add at least one photo');
        return;
      }
      setCurrentStep('gender');
      setStepNumber(3);
    } else if (currentStep === 'gender') {
      if (!gender || !selectedVibe) {
        toast.error('Please select your gender and vibe');
        return;
      }
      setCurrentStep('interests');
      setStepNumber(4);
    } else if (currentStep === 'interests') {
      if (selectedInterests.length === 0 || selectedClubs.length === 0) {
        toast.error('Please select at least one interest and one club');
        return;
      }
      setCurrentStep('location');
      setStepNumber(5);
    } else if (currentStep === 'location') {
      if (!selectedBuilding) {
        toast.error('Please select your location');
        return;
      }
      setCurrentStep('review');
      setStepNumber(6);
    } else if (currentStep === 'review') {
      handleSubmitProfile();
    }
  };

  const handleBack = () => {
    if (currentStep === 'basics') {
      navigate('/');
      return;
    }
    
    if (currentStep === 'photos') {
      setCurrentStep('basics');
      setStepNumber(1);
    } else if (currentStep === 'gender') {
      setCurrentStep('photos');
      setStepNumber(2);
    } else if (currentStep === 'interests') {
      setCurrentStep('gender');
      setStepNumber(3);
    } else if (currentStep === 'location') {
      setCurrentStep('interests');
      setStepNumber(4);
    } else if (currentStep === 'review') {
      setCurrentStep('location');
      setStepNumber(5);
    }
  };
  
  const handleAddPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if we already have 6 photos
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      toast.error(`Photo size must be less than ${MAX_PHOTO_SIZE_MB}MB`);
      return;
    }
    
    // Create a URL for the file
    const url = URL.createObjectURL(file);
    
    // Add the new photo
    setPhotos([...photos, {url, file}]);
    
    // Reset the file input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = [...photos];
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(updatedPhotos[index].url);
    
    // Remove the photo
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
  };
  
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length >= MAX_INTERESTS) {
        toast.error(`You can select up to ${MAX_INTERESTS} interests`);
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  const toggleClub = (club: string) => {
    if (selectedClubs.includes(club)) {
      setSelectedClubs(selectedClubs.filter(c => c !== club));
    } else {
      if (selectedClubs.length >= MAX_CLUBS) {
        toast.error(`You can select up to ${MAX_CLUBS} clubs`);
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
    if (selectedInterests.length >= MAX_INTERESTS) {
      toast.error(`You can select up to ${MAX_INTERESTS} interests`);
      return;
    }
    
    // Add to selected
    setSelectedInterests([...selectedInterests, newInterest]);
    setAvailableInterests([...availableInterests, newInterest]);
    setNewInterest('');
  };
  
  const findNearestBuilding = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Find nearest building
        let nearestBuilding = buildings[0];
        let minDistance = Number.MAX_VALUE;
        
        buildings.forEach(building => {
          const distance = calculateDistance(
            userLat, userLng, 
            building.latitude, building.longitude
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestBuilding = building;
          }
        });
        
        setSelectedBuilding(nearestBuilding);
        setIsLocating(false);
        toast.success(`Location set to ${nearestBuilding.name}`);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Failed to get your location. Please select manually.');
        setIsLocating(false);
        toast.error('Failed to get your location');
      }
    );
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    
    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // Distance in meters
  };
  
  const handleSubmitProfile = async () => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      console.log("Creating profile for user ID:", session.user.id);
      toast.info("Starting profile creation...");

      // Get the selected vibe label
      const vibeLabel = vibeOptions.find(v => v.id === selectedVibe)?.label;

      // Initialize photo uploads
      const photoUrls: string[] = [];
      
      // Show upload progress toast
      const uploadToastId = toast.loading("Uploading photos...");
      
      // Try to upload photos to Cloudinary, but proceed even if some fail
      let successCount = 0;
      let failCount = 0;
      
      for (const photo of photos) {
        try {
          console.log("Uploading photo:", photo.file.name);
          const cloudinaryUrl = await uploadToCloudinary(photo.file);
          if (cloudinaryUrl) {
            photoUrls.push(cloudinaryUrl);
            successCount++;
            console.log("Photo uploaded successfully");
          }
        } catch (err) {
          console.error('Error uploading to Cloudinary:', err);
          failCount++;
          // Continue with other photos on failure
        }
      }
      
      // Dismiss the upload toast
      toast.dismiss(uploadToastId);
      
      // Provide feedback about uploads
      if (successCount === 0 && photos.length > 0) {
        // All uploads failed but we'll continue with profile creation
        toast.error('Failed to upload photos but will continue with profile creation');
      } else if (failCount > 0) {
        toast.warning(`Only ${successCount} of ${photos.length} photos were uploaded successfully, but we'll continue.`);
      } else if (successCount > 0) {
        toast.success(`All ${successCount} photos uploaded successfully.`);
      }
      
      console.log("Creating/updating user profile with photo URLs:", photoUrls);
      
      // First check if the user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .maybeSingle();
        
      let userData;
      
      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            name,
            class_year: classYear,
            vibe: vibeLabel,
            gender: gender as UserGender,
            gender_preference: genderPreference,
            bio,
            major,
            building: selectedBuilding?.name,
            location: selectedBuilding?.name,
            latitude: selectedBuilding?.latitude,
            longitude: selectedBuilding?.longitude,
            photo_urls: photoUrls.length > 0 ? photoUrls : null,
            profile_complete: true
          })
          .eq('auth_id', session.user.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating user profile:', updateError);
          throw updateError;
        }
        
        userData = updatedUser;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: session.user.id,
            name,
            class_year: classYear,
            role: 'current_student',
            vibe: vibeLabel,
            gender: gender as UserGender,
            gender_preference: genderPreference,
            bio,
            major,
            building: selectedBuilding?.name,
            location: selectedBuilding?.name,
            latitude: selectedBuilding?.latitude,
            longitude: selectedBuilding?.longitude,
            photo_urls: photoUrls.length > 0 ? photoUrls : null,
            profile_complete: true
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating user profile:', createError);
          throw createError;
        }
        
        userData = newUser;
      }
      
      if (!userData) {
        throw new Error('Failed to create or update user profile');
      }
      
      console.log("User profile created/updated:", userData.id);
      
      // First clean up any existing interests/clubs to avoid duplicates
      if (userData.id) {
        // Delete existing interests
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', userData.id);
          
        // Delete existing clubs
        await supabase
          .from('user_clubs')
          .delete()
          .eq('user_id', userData.id);
      }
      
      // Process interests
      console.log("Processing interests:", selectedInterests);
      for (const interest of selectedInterests) {
        try {
          // Check if interest exists
          let interestId = null;
          const { data: existingInterest } = await supabase
            .from('interests')
            .select('id')
            .eq('name', interest)
            .maybeSingle();
            
          if (existingInterest) {
            interestId = existingInterest.id;
          } else {
            // Create new interest
            const { data: newInterest, error: newInterestError } = await supabase
              .from('interests')
              .insert({ name: interest })
              .select()
              .single();
              
            if (newInterestError) {
              console.error('Error creating interest:', newInterestError);
              continue; // Skip this interest but continue with others
            }
            interestId = newInterest.id;
          }
          
          // Link interest to user with user ID from the response
          const { error: linkError } = await supabase
            .from('user_interests')
            .insert({
              user_id: userData.id,
              interest_id: interestId
            });
            
          if (linkError) {
            console.error('Error linking interest to user:', linkError);
          }
        } catch (error) {
          console.error(`Error processing interest "${interest}":`, error);
        }
      }
      
      // Process clubs
      console.log("Processing clubs:", selectedClubs);
      for (const club of selectedClubs) {
        try {
          // Check if club exists
          let clubId = null;
          const { data: existingClub } = await supabase
            .from('clubs')
            .select('id')
            .eq('name', club)
            .maybeSingle();
            
          if (existingClub) {
            clubId = existingClub.id;
          } else {
            // Create new club
            const { data: newClub, error: newClubError } = await supabase
              .from('clubs')
              .insert({ name: club })
              .select()
              .single();
              
            if (newClubError) {
              console.error('Error creating club:', newClubError);
              continue; // Skip this club but continue with others
            }
            clubId = newClub.id;
          }
          
          // Link club to user
          const { error: linkError } = await supabase
            .from('user_clubs')
            .insert({
              user_id: userData.id,
              club_id: clubId
            });
            
          if (linkError) {
            console.error('Error linking club to user:', linkError);
          }
        } catch (error) {
          console.error(`Error processing club "${club}":`, error);
        }
      }
      
      // Mark profile as complete in the context
      setProfileComplete(true);
      
      toast.success("Profile completed successfully!");
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Error completing profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={handleBack}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
        <div className="w-6"></div> {/* Spacer for centering logo */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-princeton-white">Complete Your Profile</h1>
              <div className="text-princeton-white/60 text-sm">
                Step {stepNumber} of {totalSteps}
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full tiger-gradient transition-all duration-300"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="animate-fade-in">
            {currentStep === 'basics' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm text-princeton-white/80">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name displayed to others"
                    required
                    className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="classYear" className="block text-sm text-princeton-white/80">
                    Class Year
                  </label>
                  <input
                    id="classYear"
                    type="text"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    placeholder="e.g., 2022"
                    required
                    className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="major" className="block text-sm text-princeton-white/80">
                    Major
                  </label>
                  <input
                    id="major"
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g., Computer Science"
                    required
                    className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-sm text-princeton-white/80">
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a bit about yourself..."
                    rows={3}
                    className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
            
            {currentStep === 'photos' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-princeton-white mb-2">Add Photos</h2>
                  <p className="text-princeton-white/70 text-sm">
                    Show off your best moments (up to 6 photos)
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Hidden file input */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Photo grid */}
                  {[...Array(MAX_PHOTOS)].map((_, index) => {
                    const hasPhoto = index < photos.length;
                    
                    return (
                      <div 
                        key={index}
                        className={`aspect-square rounded-lg overflow-hidden relative flex items-center justify-center ${
                          hasPhoto ? '' : 'border-2 border-dashed border-princeton-orange/30'
                        }`}
                      >
                        {hasPhoto ? (
                          <>
                            <img 
                              src={photos[index].url} 
                              alt={`User photo ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white hover:bg-black"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleAddPhotoClick}
                            disabled={photos.length >= MAX_PHOTOS}
                            className={`w-full h-full flex flex-col items-center justify-center transition-colors ${
                              photos.length >= MAX_PHOTOS 
                                ? 'text-princeton-white/30 cursor-not-allowed' 
                                : 'text-princeton-white/50 hover:text-princeton-orange'
                            }`}
                          >
                            <Upload size={24} />
                            <span className="text-xs mt-1">Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center text-xs text-princeton-white/60">
                  First photo will be your main profile picture
                </div>
              </div>
            )}
            
            {currentStep === 'gender' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-princeton-white mb-2">About You</h2>
                  <p className="text-princeton-white/70 text-sm">
                    Tell us about yourself
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm text-princeton-white/80">
                      Your Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {genderOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setGender(option.value)}
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
                      {preferenceOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setGenderPreference(option.value)}
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
                  
                  <div className="space-y-2">
                    <label className="block text-sm text-princeton-white/80">
                      Your Vibe
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {vibeOptions.map((vibe) => (
                        <button
                          key={vibe.id}
                          onClick={() => setSelectedVibe(vibe.id)}
                          className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                            selectedVibe === vibe.id
                              ? 'bg-princeton-orange text-princeton-black border-princeton-orange'
                              : 'bg-secondary text-princeton-white border-princeton-orange/30 hover:border-princeton-orange/60'
                          }`}
                        >
                          <div className="text-2xl mb-1">{vibe.emoji}</div>
                          <div className="text-sm font-medium">{vibe.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'interests' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-princeton-white mb-2">Interests & Clubs</h2>
                  <p className="text-princeton-white/70 text-sm">
                    Select up to {MAX_INTERESTS} interests and {MAX_CLUBS} clubs
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm text-princeton-white/80 flex justify-between">
                      <span>Interests</span>
                      <span className="text-princeton-orange">{selectedInterests.length}/{MAX_INTERESTS}</span>
                    </label>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
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
                        disabled={!newInterest.trim() || selectedInterests.length >= MAX_INTERESTS}
                        className="px-3 py-1 bg-princeton-orange text-black rounded-lg text-sm disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto bg-secondary/50 rounded-lg p-2">
                      <div className="flex flex-wrap gap-2">
                        {availableInterests
                          .filter(interest => !selectedInterests.includes(interest))
                          .map((interest) => (
                            <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              disabled={selectedInterests.length >= MAX_INTERESTS}
                              className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm hover:bg-secondary/80 disabled:opacity-50"
                            >
                              {interest}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm text-princeton-white/80 flex justify-between">
                      <span>Princeton Clubs</span>
                      <span className="text-princeton-orange">{selectedClubs.length}/{MAX_CLUBS}</span>
                    </label>
                    
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
                    
                    <div className="max-h-40 overflow-y-auto bg-secondary/50 rounded-lg p-2">
                      <div className="flex flex-wrap gap-2">
                        {availableClubs
                          .filter(club => !selectedClubs.includes(club))
                          .map((club) => (
                            <button
                              key={club}
                              onClick={() => toggleClub(club)}
                              disabled={selectedClubs.length >= MAX_CLUBS}
                              className="px-3 py-1 bg-secondary text-princeton-white/80 rounded-full text-sm hover:bg-secondary/80 disabled:opacity-50"
                            >
                              {club}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'location' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-princeton-white mb-2">Your Location</h2>
                  <p className="text-princeton-white/70 text-sm">
                    Select your current location on campus
                  </p>
                </div>
                
                <div className="flex justify-center mb-4">
                  <button
                    onClick={findNearestBuilding}
                    disabled={isLocating}
                    className="flex items-center gap-2 px-4 py-2 bg-princeton-orange rounded-lg text-black hover:bg-princeton-orange/90 transition-colors disabled:opacity-70"
                  >
                    {isLocating ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                    <span>{isLocating ? 'Finding Location...' : 'Use Current Location'}</span>
                  </button>
                </div>
                
                {locationError && (
                  <div className="text-red-400 text-sm text-center mb-4">
                    {locationError}
                  </div>
                )}
                
                <div className="max-h-80 overflow-y-auto bg-secondary/80 rounded-lg">
                  {buildings.map((building) => (
                    <button
                      key={building.id}
                      onClick={() => setSelectedBuilding(building)}
                      className={`w-full flex items-center justify-between p-3 border-b border-princeton-white/10 transition-colors ${
                        selectedBuilding?.id === building.id
                          ? 'bg-princeton-orange/20'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-princeton-orange/80" />
                        <span className="text-princeton-white">{building.name}</span>
                      </div>
                      
                      {selectedBuilding?.id === building.id && (
                        <Check size={18} className="text-princeton-orange" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-princeton-white mb-2">Review Your Profile</h2>
                  <p className="text-princeton-white/70 text-sm">
                    Take a moment to review your information before finalizing
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <img 
                          src={photos.length > 0 ? photos[0].url : '/placeholder.svg'} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-princeton-white">{name}</h3>
                        <div className="text-sm text-princeton-white/70">Class of {classYear}</div>
                        <div className="text-sm text-princeton-white/70">
                          {selectedBuilding?.name || 'No location set'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-princeton-white/70 mb-2">Basic Information</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-princeton-white/60">Major:</span>
                        <span className="text-princeton-white">{major}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-princeton-white/60">Gender:</span>
                        <span className="text-princeton-white">{gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-princeton-white/60">Interested in:</span>
                        <span className="text-princeton-white">
                          {genderPreference === 'everyone' 
                            ? 'Everyone' 
                            : genderPreference === 'male' ? 'Men' : 'Women'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-princeton-white/60">Vibe:</span>
                        <span className="text-princeton-white">
                          {vibeOptions.find(v => v.id === selectedVibe)?.label || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-princeton-white/70 mb-2">Photos</h3>
                    <div className="grid grid-cols-6 gap-1">
                      {photos.map((photo, i) => (
                        <div key={i} className="aspect-square rounded overflow-hidden">
                          <img src={photo.url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-princeton-white/70 mb-2">Interests & Clubs</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-princeton-white/60 text-xs mb-1">Interests:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedInterests.map((interest, i) => (
                            <div key={i} className="px-2 py-1 bg-secondary rounded-full text-princeton-white/90 text-xs">
                              {interest}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-princeton-white/60 text-xs mb-1">Clubs:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedClubs.map((club, i) => (
                            <div key={i} className="px-2 py-1 bg-secondary rounded-full text-princeton-white/90 text-xs">
                              {club}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-princeton-white/70 mb-2">Bio</h3>
                    <div className="text-princeton-white/90">
                      {bio || 'No bio provided'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-princeton-orange rounded-lg text-black font-medium flex items-center justify-center gap-2 hover:bg-princeton-orange/90 transition-colors"
              >
                <span>{currentStep === 'review' ? 'Complete Profile' : 'Continue'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSetupPage;
