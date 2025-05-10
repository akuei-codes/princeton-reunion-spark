
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge'; // Make sure this import exists
import { Input } from '@/components/ui/input';
import { Loader2, Plus, X } from 'lucide-react';

interface InterestSelectorProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
}

interface Interest {
  id: string;
  name: string;
}

const InterestSelector: React.FC<InterestSelectorProps> = ({ selectedInterests, onChange }) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const { data, error } = await supabase
          .from('interests')
          .select('*')
          .order('name');
          
        if (error) {
          console.error('Error fetching interests:', error);
        } else {
          setInterests(data || []);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterests();
  }, []);
  
  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onChange(selectedInterests.filter(id => id !== interestId));
    } else {
      onChange([...selectedInterests, interestId]);
    }
  };
  
  const filteredInterests = interests.filter(interest => 
    interest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="search-interests" className="text-princeton-white">Search Interests</label>
        <Input 
          id="search-interests"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search..."
          className="bg-secondary border-princeton-orange/30 text-princeton-white"
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-princeton-orange" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-princeton-white">Selected Interests</label>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.length === 0 ? (
                <p className="text-sm text-princeton-white/60">No interests selected</p>
              ) : (
                interests
                  .filter(interest => selectedInterests.includes(interest.id))
                  .map(interest => (
                    <Badge 
                      key={interest.id} 
                      className="bg-princeton-orange text-black cursor-pointer hover:bg-princeton-orange/80"
                      onClick={() => toggleInterest(interest.id)}
                    >
                      {interest.name} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-princeton-white">Available Interests</label>
            <div className="flex flex-wrap gap-2">
              {filteredInterests.length === 0 ? (
                <p className="text-sm text-princeton-white/60">No matching interests found</p>
              ) : (
                filteredInterests
                  .filter(interest => !selectedInterests.includes(interest.id))
                  .map(interest => (
                    <Badge 
                      key={interest.id} 
                      variant="outline" 
                      className="border-princeton-orange/50 text-princeton-white cursor-pointer hover:border-princeton-orange"
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {interest.name}
                    </Badge>
                  ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InterestSelector;
