
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { ArrowLeft, ArrowRight, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

type Vibe = 'party' | 'catch-up' | 'hook-up' | 'deeper' | 'roam' | 'night';

interface VibeOption {
  id: Vibe;
  label: string;
  emoji: string;
}

const vibeOptions: VibeOption[] = [
  { id: 'party', label: 'Looking to Party', emoji: '🍻' },
  { id: 'catch-up', label: 'Looking to Catch Up', emoji: '💬' },
  { id: 'hook-up', label: 'Looking for a Hook-Up', emoji: '❤️' },
  { id: 'deeper', label: 'Looking for Something Deeper', emoji: '💑' },
  { id: 'roam', label: 'Down to Roam', emoji: '🧡' },
  { id: 'night', label: "Let's Just See Where the Night Takes Us", emoji: '🌙' },
];

const MAX_PHOTOS = 6;
const MAX_PHOTO_SIZE_MB = 5;

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [classYear, setClassYear] = useState<string>('');
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [bio, setBio] = useState<string>('');
  const [photos, setPhotos] = useState<{url: string, file: File}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // In a real app, would save profile here
      navigate('/swipe');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/signup');
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
                Step {step} of 3
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full tiger-gradient transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="animate-fade-in">
            {step === 1 && (
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

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-princeton-white mb-2">Set Your Vibe</h2>
                  <p className="text-princeton-white/70 text-sm">
                    Be honest about what you're looking for
                  </p>
                </div>
                
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
            )}

            {step === 3 && (
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

            <div className="mt-8">
              <button 
                onClick={handleContinue}
                className="w-full tiger-btn flex items-center justify-center gap-2"
                disabled={(step === 1 && (!name || !classYear)) || (step === 2 && !selectedVibe) || (step === 3 && photos.length === 0)}
              >
                {step === 3 ? 'Complete Profile' : 'Continue'}
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
