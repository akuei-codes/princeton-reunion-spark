import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCurrentUser, getUserById, updateUserProfile, uploadUserPhoto, deleteUserPhoto, updateUserInterests } from '../lib/api';
import { ArrowLeft, Camera, Trash2, Plus, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import InterestSelector from '@/components/InterestSelector';
import { UserVibe } from '@/types/database';

interface UserProfileProps {
  viewUserId?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ viewUserId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [classYear, setClassYear] = useState('');
  const [gender, setGender] = useState<string>('');
  const [genderPreference, setGenderPreference] = useState<string>('');
  const [vibe, setVibe] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Fetch user data - either current user or viewed user
  const { data: user, isLoading, error } = useQuery({
    queryKey: viewUserId ? ['user', viewUserId] : ['currentUser'],
    queryFn: () => viewUserId ? getUserById(viewUserId) : getCurrentUser(),
    meta: {
      onError: (error: any) => {
        toast.error(`Failed to load profile: ${error.message}`);
      }
    }
  });
  
  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setMajor(user.major || '');
      setClassYear(user.class_year || '');
      setGender(user.gender || '');
      setGenderPreference(user.gender_preference || '');
      setVibe(user.vibe || '');
      setPhotos(user.photo_urls || []);
      
      // Extract interest IDs from the nested structure
      const interestIds = user.interests?.map(interest => {
        if (interest.name && interest.name.id) {
          return interest.name.id;
        }
        return '';
      }).filter(Boolean) || [];
      
      setSelectedInterests(interestIds);
    }
  }, [user]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => updateUserProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    }
  });
  
  // Update interests mutation
  const updateInterestsMutation = useMutation({
    mutationFn: (interestIds: string[]) => updateUserInterests(interestIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Interests updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update interests: ${error.message}`);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData = {
      name,
      bio,
      major,
      gender,
      gender_preference: genderPreference,
      profile_complete: true
    };
    
    updateProfileMutation.mutate(profileData);
  };
  
  // Handle interests update
  const handleInterestsUpdate = () => {
    updateInterestsMutation.mutate(selectedInterests);
  };
  
  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Use the File object directly with the API function
      const uploadedPhotoUrl = await uploadUserPhoto(file);
      
      // Update the photos array with the new photo URL
      setPhotos(prevPhotos => [...prevPhotos, uploadedPhotoUrl]);
      
      setIsUploading(false);
      toast.success('Photo uploaded successfully');
    } catch (error: any) {
      setIsUploading(false);
      setUploadError(error.message);
      toast.error('Failed to upload photo');
    }
  };
  
  // Handle photo deletion
  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      await deleteUserPhoto(photoUrl);
      // Update local state by filtering out the deleted photo
      setPhotos(prevPhotos => prevPhotos.filter(url => url !== photoUrl));
      toast.success('Photo deleted successfully');
    } catch (error: any) {
      toast.error(`Failed to delete photo: ${error.message}`);
    }
  };
  
  // Viewing another user's profile
  const isViewingOtherUser = !!viewUserId;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
        <header className="container mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-princeton-white hover:text-princeton-orange transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <Logo />
        </header>
        
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-princeton-white mb-6">{isViewingOtherUser ? 'Profile' : 'Your Profile'}</h1>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
        <header className="container mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-princeton-white hover:text-princeton-orange transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <Logo />
        </header>
        
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="text-center py-10">
            <div className="text-red-500 mb-2">Failed to load profile</div>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: viewUserId ? ['user', viewUserId] : ['currentUser'] })}
              className="text-princeton-orange underline"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  // Display either view mode or edit mode based on whether we're viewing another user's profile
  if (isViewingOtherUser) {
    // View only profile for other users
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
        <header className="container mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-princeton-white hover:text-princeton-orange transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <Logo />
        </header>
        
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-princeton-white mb-6">{name}'s Profile</h1>
          
          {/* Photos */}
          {photos && photos.length > 0 && (
            <div className="mb-8">
              <div className="aspect-[4/5] rounded-lg overflow-hidden mb-4">
                <img 
                  src={photos[0]} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {photos.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.slice(1).map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`${name} ${index + 2}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Basic info */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-princeton-white mb-2">About</h2>
            <div className="bg-secondary rounded-lg p-4 text-princeton-white">
              <div className="mb-4">
                <h3 className="text-sm text-princeton-white/60 mb-1">Name</h3>
                <p>{name}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm text-princeton-white/60 mb-1">Bio</h3>
                <p>{bio || 'No bio provided'}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm text-princeton-white/60 mb-1">Major</h3>
                <p>{major || 'Not specified'}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm text-princeton-white/60 mb-1">Class Year</h3>
                <p>{classYear || 'Not specified'}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm text-princeton-white/60 mb-1">Vibe</h3>
                <p>{vibe || 'Not specified'}</p>
              </div>
            </div>
          </div>
          
          {/* Interests */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-princeton-white mb-2">Interests</h2>
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {user?.interests && user.interests.length > 0 ? (
                  user.interests.map((interest, index) => (
                    <Badge key={index} className="bg-princeton-orange/70 text-black">
                      {interest.name.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-princeton-white/60">No interests listed</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Clubs */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-princeton-white mb-2">Clubs</h2>
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {user?.clubs && user.clubs.length > 0 ? (
                  user.clubs.map((club, index) => (
                    <Badge key={index} variant="outline" className="border-princeton-orange text-princeton-white">
                      {club.name.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-princeton-white/60">No clubs listed</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#121212] p-4">
      <header className="container mx-auto px-4 py-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="text-princeton-white hover:text-princeton-orange transition-colors mr-4"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-princeton-white mb-6">Your Profile</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-princeton-white">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="bg-secondary border-princeton-orange/30 text-princeton-white"
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-princeton-white">Bio</Label>
                <Textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="bg-secondary border-princeton-orange/30 text-princeton-white min-h-[100px]"
                  placeholder="Tell others about yourself"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="major" className="text-princeton-white">Major</Label>
                <Input 
                  id="major" 
                  value={major} 
                  onChange={(e) => setMajor(e.target.value)} 
                  className="bg-secondary border-princeton-orange/30 text-princeton-white"
                  placeholder="Your major"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-princeton-white">Gender</Label>
                <RadioGroup value={gender} onValueChange={setGender} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="text-princeton-white">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="text-princeton-white">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-binary" id="non-binary" />
                    <Label htmlFor="non-binary" className="text-princeton-white">Non-binary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="text-princeton-white">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label className="text-princeton-white">Interested In</Label>
                <RadioGroup value={genderPreference} onValueChange={setGenderPreference} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="pref-male" />
                    <Label htmlFor="pref-male" className="text-princeton-white">Men</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="pref-female" />
                    <Label htmlFor="pref-female" className="text-princeton-white">Women</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="everyone" id="pref-everyone" />
                    <Label htmlFor="pref-everyone" className="text-princeton-white">Everyone</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-princeton-orange hover:bg-princeton-orange/90 text-black"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="photos">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={photo} 
                      alt={`Profile photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500/80"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {photos.length < 6 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-princeton-orange/50 flex flex-col items-center justify-center cursor-pointer hover:bg-princeton-orange/10 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-princeton-orange animate-spin" />
                    ) : (
                      <>
                        <Camera size={32} className="text-princeton-orange mb-2" />
                        <span className="text-sm text-princeton-orange">Add Photo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              
              {uploadError && (
                <div className="text-red-500 text-sm">{uploadError}</div>
              )}
              
              <div className="text-sm text-princeton-white/70">
                <p>Add up to 6 photos to show off your best self.</p>
                <p>First photo will be your main profile picture.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="interests">
            <div className="space-y-6">
              <InterestSelector 
                selectedInterests={selectedInterests}
                onChange={setSelectedInterests}
              />
              
              <Button 
                onClick={handleInterestsUpdate}
                className="w-full bg-princeton-orange hover:bg-princeton-orange/90 text-black"
                disabled={updateInterestsMutation.isPending}
              >
                {updateInterestsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Interests'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserProfile;
