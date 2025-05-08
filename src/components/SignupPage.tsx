import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Logo from './Logo';
import { ArrowLeft, Phone, Mail } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserRole = 'current-student' | 'class-2025' | 'recent-grad' | 'alum' | null;
type AuthMethod = 'email' | 'phone' | null;

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<UserRole>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleAuthMethodSelect = (method: AuthMethod) => {
    setAuthMethod(method);
    setStep(3);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Google OAuth will handle the redirect
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      await signInWithPhone(phone);
      
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Check your phone for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyOtp(phone, otp);
      
      toast({
        title: "Success",
        description: "Phone verified successfully",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would handle email authentication here
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => {
            if (step === 1) navigate('/');
            else if (step === 2) setStep(1);
            else if (step === 3 && otpSent) setOtpSent(false);
            else if (step === 3) setStep(2);
          }}
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
          ) : step === 2 ? (
            <AuthMethodSelection onSelect={handleAuthMethodSelect} onGoogleSignIn={handleGoogleSignIn} />
          ) : (
            authMethod === 'email' ? (
              <EmailSignup 
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                role={role}
                onSubmit={handleEmailSubmit}
              />
            ) : (
              <PhoneSignup
                phone={phone}
                otp={otp}
                otpSent={otpSent}
                setPhone={setPhone}
                setOtp={setOtp}
                onPhoneSubmit={handlePhoneSubmit}
                onOtpVerify={handleOtpVerify}
              />
            )
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
          label="Current Student"
          description="Students currently enrolled at Princeton"
          emoji="🎓"
          onClick={() => onSelect('current-student')}
        />
        <RoleButton 
          role="class-2025"
          label="Class of 2025"
          description="Graduating seniors at Princeton"
          emoji="🏆"
          onClick={() => onSelect('class-2025')}
        />
        <RoleButton 
          role="recent-grad"
          label="Recent Grad ('20-'24)"
          description="Recent Princeton graduates"
          emoji="🔶"
          onClick={() => onSelect('recent-grad')}
        />
        <RoleButton 
          role="alum"
          label="Alum (All class years)"
          description="Princeton alumni from any year"
          emoji="🐯"
          onClick={() => onSelect('alum')}
        />
      </div>
    </div>
  );
};

interface RoleButtonProps {
  role: UserRole;
  label: string;
  description: string;
  emoji: string;
  onClick: () => void;
}

const RoleButton: React.FC<RoleButtonProps> = ({ role, label, description, emoji, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-lg border border-princeton-orange/30 bg-secondary hover:bg-princeton-orange hover:text-princeton-black transition-all duration-200 flex items-center text-left text-princeton-white font-medium"
    >
      <div className="text-2xl mr-3">{emoji}</div>
      <div>
        <div className="font-bold">{label}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </button>
  );
};

interface AuthMethodSelectionProps {
  onSelect: (method: AuthMethod) => void;
  onGoogleSignIn: () => void;
}

const AuthMethodSelection: React.FC<AuthMethodSelectionProps> = ({ onSelect, onGoogleSignIn }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-princeton-white mb-3">How would you like to continue?</h1>
        <p className="text-princeton-white/70">
          Select your preferred sign up method
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onSelect('phone')}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-princeton-orange/30 bg-secondary hover:bg-princeton-orange hover:text-princeton-black transition-all duration-200 text-princeton-white font-medium"
        >
          <Phone size={20} />
          Continue with Phone
        </button>
        
        <button
          onClick={() => onSelect('email')}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-princeton-orange/30 bg-secondary hover:bg-princeton-orange hover:text-princeton-black transition-all duration-200 text-princeton-white font-medium"
        >
          <Mail size={20} />
          Continue with Email
        </button>
        
        <button
          onClick={onGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-lg border border-princeton-orange/30 bg-white text-black hover:bg-gray-100 transition-all duration-200 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
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
    'class-2025': 'Class of 2025',
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
          <Input
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
          <Input
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
          <Button 
            type="submit"
            className="w-full tiger-btn bg-princeton-orange text-princeton-black hover:bg-princeton-orange/90"
          >
            Continue
          </Button>
        </div>
        
        <div className="text-center text-xs text-princeton-white/60 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </div>
      </form>
    </div>
  );
};

interface PhoneSignupProps {
  phone: string;
  otp: string;
  otpSent: boolean;
  setPhone: (phone: string) => void;
  setOtp: (otp: string) => void;
  onPhoneSubmit: (e: React.FormEvent) => void;
  onOtpVerify: (e: React.FormEvent) => void;
}

const PhoneSignup: React.FC<PhoneSignupProps> = ({
  phone,
  otp,
  otpSent,
  setPhone,
  setOtp,
  onPhoneSubmit,
  onOtpVerify
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-princeton-white mb-3">
          {otpSent ? "Verify Phone" : "Phone Number"}
        </h1>
        <p className="text-princeton-white/70">
          {otpSent 
            ? "Enter the verification code sent to your phone" 
            : "We'll send you a verification code"
          }
        </p>
      </div>
      
      {!otpSent ? (
        <form onSubmit={onPhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm text-princeton-white/80">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
              className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
            />
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit"
              className="w-full tiger-btn bg-princeton-orange text-princeton-black hover:bg-princeton-orange/90"
            >
              Send Code
            </Button>
          </div>
          
          <div className="text-center text-xs text-princeton-white/60 mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </div>
        </form>
      ) : (
        <form onSubmit={onOtpVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm text-princeton-white/80">
              Verification Code
            </label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
              className="w-full p-3 rounded-lg bg-secondary border border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:ring-2 focus:ring-princeton-orange focus:outline-none"
            />
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit"
              className="w-full tiger-btn bg-princeton-orange text-princeton-black hover:bg-princeton-orange/90"
            >
              Verify
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SignupPage;
