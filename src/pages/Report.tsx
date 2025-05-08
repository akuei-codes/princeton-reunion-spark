
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Flag, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

const Report: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reportType, setReportType] = useState<string>('');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleBack = () => {
    // If we have a state with a previous path, use that
    if (location.state && location.state.from) {
      navigate(location.state.from);
    } else {
      // Default is settings
      navigate('/settings');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    if (reportDetails.length < 10) {
      toast.error('Please provide more details about the issue');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would call your API to submit the report
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Report submitted successfully');
      navigate('/settings');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-xl font-bold text-princeton-white">Report a Problem</h1>
        <div className="w-6"></div> {/* Empty div for spacing */}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="profile-card p-6 mb-6">
          <div className="flex items-center mb-4">
            <Flag size={24} className="text-princeton-orange mr-3" />
            <h2 className="text-xl font-bold text-princeton-white">What's going on?</h2>
          </div>
          <p className="text-princeton-white/80 mb-4">
            Please let us know what issue you're experiencing so we can address it quickly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="profile-card p-6">
            <h3 className="text-lg font-semibold text-princeton-white mb-4">Report Type</h3>
            
            <RadioGroup value={reportType} onValueChange={setReportType}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" className="text-princeton-orange border-princeton-orange/50" />
                  <Label htmlFor="inappropriate" className="text-princeton-white">Inappropriate Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harassment" id="harassment" className="text-princeton-orange border-princeton-orange/50" />
                  <Label htmlFor="harassment" className="text-princeton-white">Harassment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake" id="fake" className="text-princeton-orange border-princeton-orange/50" />
                  <Label htmlFor="fake" className="text-princeton-white">Fake Profile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="technical" id="technical" className="text-princeton-orange border-princeton-orange/50" />
                  <Label htmlFor="technical" className="text-princeton-white">Technical Issue</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" className="text-princeton-orange border-princeton-orange/50" />
                  <Label htmlFor="other" className="text-princeton-white">Other</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="profile-card p-6">
            <h3 className="text-lg font-semibold text-princeton-white mb-4">Details</h3>
            <Textarea 
              placeholder="Please describe the issue in detail..." 
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="bg-secondary border-princeton-orange/30 text-princeton-white placeholder:text-princeton-white/50 focus:border-princeton-orange min-h-[150px]"
            />
          </div>

          <Button 
            type="submit"
            className="w-full bg-princeton-orange hover:bg-princeton-orange/90 text-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
            <Send size={16} className="ml-2" />
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Report;
