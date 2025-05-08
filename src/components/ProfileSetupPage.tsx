
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';

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

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [classYear, setClassYear] = useState<string>('');
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [bio, setBio] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);

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

  const handleAddPhoto = () => {
    // In a real app, would handle photo upload here
    // For this demo, just add a placeholder
    setPhotos([...photos, `https://source.unsplash.com/random/300x400?person&${Date.now()}`]);
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
                    Show off your best moments or fun throwbacks
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, index) => {
                    const hasPhoto = index < photos.length;
                    
                    return (
                      <div 
                        key={index}
                        className={`aspect-square rounded-lg overflow-hidden flex items-center justify-center ${
                          hasPhoto ? '' : 'border-2 border-dashed border-princeton-orange/30'
                        }`}
                      >
                        {hasPhoto ? (
                          <img 
                            src={photos[index]} 
                            alt={`User photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <button
                            onClick={handleAddPhoto}
                            className="w-full h-full flex flex-col items-center justify-center text-princeton-white/50 hover:text-princeton-orange transition-colors"
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
                disabled={step === 2 && !selectedVibe}
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
