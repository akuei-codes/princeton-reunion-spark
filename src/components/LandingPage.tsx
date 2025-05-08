
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Logo from './Logo';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <header className="container mx-auto px-4 py-8">
        <Logo />
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full space-y-10 text-center backdrop-blur-sm bg-black/30 p-8 rounded-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-princeton-white">Find Your </span>
            <span className="text-princeton-orange">Tiger</span>
            <span className="text-princeton-white"> Match</span>
          </h1>
          
          <p className="text-xl text-princeton-white/80">
            Princeton's exclusive reunion dating app. Connect with fellow Tigers during the most memorable weekend of the year.
          </p>
          
          <div className="pt-5">
            <button 
              onClick={() => navigate('/signup')}
              className="tiger-btn group"
            >
              Get Started
              <ArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </button>
          </div>
        </div>
      </main>
      
      {/* Features section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Princeton Exclusive" 
            description="Connect only with verified Princeton students and alumni."
          />
          <FeatureCard 
            title="Set Your Vibe" 
            description="Be clear about what you're looking for during Reunions weekend."
            highlighted={true}
          />
          <FeatureCard 
            title="Reunion-Only" 
            description="Like the weekend itself, Me&Union is temporary and magical."
          />
        </div>
      </section>
      
      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-princeton-white/60 text-sm">
        Me&Union • Princeton Reunions {new Date().getFullYear()} • For Tigers Only
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  highlighted?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, highlighted }) => {
  return (
    <div 
      className={`p-6 rounded-xl backdrop-blur-sm ${
        highlighted 
          ? 'bg-gradient-to-br from-princeton-orange to-[#FF5E00]/90 text-black' 
          : 'bg-secondary/70 text-white'
      }`}
    >
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className={highlighted ? 'text-black/90' : 'text-white/80'}>
        {description}
      </p>
    </div>
  );
};

export default LandingPage;
