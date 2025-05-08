
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { ArrowLeft } from 'lucide-react';

type UserRole = 'current-student' | 'recent-grad' | 'alum' | null;

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<UserRole>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would handle authentication here
    navigate('/profile-setup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => step === 1 ? navigate('/') : setStep(1)}
          className="text-princeton-white hover:text-princeton-orange transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <Logo />
        <div className="w-6"></div> {/* Spacer for centering logo */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {step === 1 ? (
            <RoleSelection onSelect={handleRoleSelect} />
          ) : (
            <EmailSignup 
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              role={role}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
};

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-princeton-white mb-3">Which Tiger are you?</h1>
        <p className="text-princeton-white/70">
          Select your Princeton status to continue
        </p>
      </div>

      <div className="space-y-4">
        <RoleButton 
          role="current-student"
          label="Current Student (Class of 2025)"
          onClick={() => onSelect('current-student')}
        />
        <RoleButton 
          role="recent-grad"
          label="Recent Grad ('20-'24)"
          onClick={() => onSelect('recent-grad')}
        />
        <RoleButton 
          role="alum"
          label="Alum (All class years welcome)"
          onClick={() => onSelect('alum')}
        />
      </div>
    </div>
  );
};

interface RoleButtonProps {
  role: UserRole;
  label: string;
  onClick: () => void;
}

const RoleButton: React.FC<RoleButtonProps> = ({ role, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-lg border border-princeton-orange/30 bg-secondary hover:bg-princeton-orange hover:text-princeton-black transition-all duration-200 text-left text-princeton-white font-medium"
    >
      {label}
    </button>
  );
};

interface EmailSignupProps {
  email: string;
  password: string;
  role: UserRole;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EmailSignup: React.FC<EmailSignupProps> = ({ 
  email, 
  password, 
  role, 
  setEmail, 
  setPassword, 
  onSubmit 
}) => {
  const roleLabels = {
    'current-student': 'Current Student',
    'recent-grad': 'Recent Grad',
    'alum': 'Alum',
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-princeton-white mb-3">Create your account</h1>
        <p className="text-princeton-white/70">
          {role && `Join as ${roleLabels[role]}`}
        </p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-princeton-white/80">
            Princeton Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tiger@princeton.edu"
            required
            className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-princeton-white/80">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
          />
        </div>
        
        <div className="pt-4">
          <button 
            type="submit"
            className="w-full tiger-btn"
          >
            Continue
          </button>
        </div>
        
        <div className="text-center text-xs text-princeton-white/60 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
