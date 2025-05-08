
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, HelpCircle, MessageCircle, Shield, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

const Help: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBack = () => {
    // If we have a state with a previous path, use that
    if (location.state && location.state.from) {
      navigate(location.state.from);
    } else {
      // Default is settings
      navigate('/settings');
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
        <h1 className="text-xl font-bold text-princeton-white">Help Center</h1>
        <div className="w-6"></div> {/* Empty div for spacing */}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="profile-card p-6 mb-6">
          <div className="flex items-center mb-4">
            <HelpCircle size={24} className="text-princeton-orange mr-3" />
            <h2 className="text-xl font-bold text-princeton-white">How can we help?</h2>
          </div>
          <p className="text-princeton-white/80 mb-4">
            Find answers to common questions about using Me&Union during Reunions weekend.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1" className="profile-card border-none">
            <AccordionTrigger className="px-4 py-3 text-princeton-white hover:text-princeton-orange">
              <div className="flex items-center">
                <Info size={18} className="text-princeton-orange mr-3" />
                <span>How does Me&Union work?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-princeton-white/80">
              Me&Union is an exclusive dating app for Princeton reunions. Simply create a profile, swipe on other Tigers, and when you match, start chatting! The app is only active during Reunions weekend, so make the most of it!
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="profile-card border-none">
            <AccordionTrigger className="px-4 py-3 text-princeton-white hover:text-princeton-orange">
              <div className="flex items-center">
                <Shield size={18} className="text-princeton-orange mr-3" />
                <span>How is my privacy protected?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-princeton-white/80">
              Me&Union takes your privacy seriously. Your profile is only visible to fellow Princeton alumni and students. You can control your location sharing and activity status in Settings. We never share your personal information with third parties.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="profile-card border-none">
            <AccordionTrigger className="px-4 py-3 text-princeton-white hover:text-princeton-orange">
              <div className="flex items-center">
                <MessageCircle size={18} className="text-princeton-orange mr-3" />
                <span>How do I report inappropriate behavior?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-2 text-princeton-white/80">
              If you encounter any inappropriate behavior, please report it immediately. Go to Settings &gt; Report a Problem to submit a report. Our team will review it promptly and take appropriate action to ensure a safe environment for all users.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-8 text-center">
          <p className="text-princeton-white/70 mb-4">Still have questions?</p>
          <Button 
            onClick={() => navigate('/contact-support')}
            className="bg-princeton-orange hover:bg-princeton-orange/90 text-black"
          >
            Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Help;
