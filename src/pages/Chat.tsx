
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, Send, InfoIcon, MapPin } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserById, getMessages, sendMessage, markMessagesAsRead } from '../lib/api';
import { toast } from "sonner";
import { UserWithRelations, Message } from '../types/database';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the other user in this match
  const { data: match, isLoading: matchLoading, error: matchError } = useQuery({
    queryKey: ['match', id],
    queryFn: () => getUserById(id as string),
    enabled: !!id
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => getMessages(id as string),
    enabled: !!id,
    refetchInterval: 3000 // Poll for new messages every 3 seconds
  });

  // Mark messages as read when entering the chat
  useEffect(() => {
    if (id) {
      markMessagesAsRead(id);
    }
  }, [id, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle back navigation
  const handleBack = () => {
    navigate('/matches');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !id) return;
    
    try {
      await sendMessage(id, newMessage.trim());
      
      // Clear the input
      setNewMessage('');
      
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  // Display loading state
  if (matchLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4 animate-pulse">Loading chat...</div>
      </div>
    );
  }

  // Handle errors
  if (matchError || messagesError || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#121212]">
        <div className="text-princeton-white mb-4">Chat not found</div>
        <button 
          onClick={() => navigate('/matches')}
          className="px-4 py-2 bg-princeton-orange text-black rounded-lg"
        >
          Back to Matches
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container sticky top-0 z-10 mx-auto px-4 py-3 flex items-center bg-black border-b border-princeton-orange/20">
        <button 
          onClick={handleBack}
          className="text-princeton-white hover:text-princeton-orange transition-colors mr-3"
        >
          <ArrowLeft size={22} />
        </button>
        
        <div className="flex items-center" onClick={() => navigate(`/profile/${match.auth_id}`)}>
          <img 
            src={(match.photo_urls && match.photo_urls.length > 0) ? match.photo_urls[0] : '/placeholder.svg'}
            alt={match.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <h3 className="font-bold text-princeton-white">
              {match.name} <span className="text-princeton-white/60 font-normal">'{match.class_year.slice(-2)}</span>
            </h3>
            <div className="flex items-center text-xs text-princeton-white/60">
              <MapPin size={12} className="mr-1" />
              <span>{match.building || "Near Princeton"}</span>
            </div>
          </div>
        </div>
        
        <div className="ml-auto">
          <button 
            onClick={() => navigate(`/profile/${match.auth_id}`)}
            className="text-princeton-white/70 hover:text-princeton-orange"
          >
            <InfoIcon size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-princeton-orange" />
              </div>
              <h3 className="text-xl font-bold text-princeton-white mb-2">Oops, No Conversations Yet</h3>
              <p className="text-princeton-white/70">
                Break the ice! Send the first message to your new match!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.sender_id === match.auth_id ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.sender_id === match.auth_id 
                      ? 'bg-secondary text-princeton-white' 
                      : 'bg-princeton-orange text-princeton-black'
                  }`}
                >
                  <div className="text-sm">{message.message}</div>
                  <div 
                    className={`text-[10px] mt-1 ${
                      message.sender_id === match.auth_id
                        ? 'text-princeton-white/60' 
                        : 'text-princeton-black/70'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* Scroll anchor */}
        </div>
      </main>

      <footer className="container mx-auto px-4 py-3 border-t border-princeton-orange/20">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-secondary rounded-l-full px-4 py-2 text-princeton-white placeholder:text-princeton-white/50 focus:outline-none border-y border-l border-princeton-orange/30"
          />
          <button 
            type="submit"
            className="bg-princeton-orange text-princeton-black rounded-r-full px-4 py-2 border border-princeton-orange"
            disabled={newMessage.trim() === ''}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;
