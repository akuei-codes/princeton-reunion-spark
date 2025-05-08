
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowLeft, Send, InfoIcon, MapPin } from 'lucide-react';

// Sample chats data - in a real app, this would come from a backend
const sampleChats = {
  "1": {
    id: 1,
    name: 'Emma',
    classYear: '2022',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800',
    messages: [
      {
        id: 1,
        sender: 'them',
        text: 'Hey! Just saw your profile. Are you going to the P-rade tomorrow?',
        time: '2:30 PM'
      },
      {
        id: 2,
        sender: 'me',
        text: 'Definitely! Planning to be there in my class jacket.',
        time: '2:35 PM'
      },
      {
        id: 3,
        sender: 'them',
        text: 'Awesome! Maybe we can meet up at the 5th reunion tent after?',
        time: '2:36 PM'
      }
    ]
  },
  "2": {
    id: 2,
    name: 'Jake',
    classYear: '2020',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800',
    messages: [
      {
        id: 1,
        sender: 'them',
        text: 'Which tent are you at?',
        time: '7:45 PM'
      }
    ]
  },
  "3": {
    id: 3,
    name: 'Sophia',
    classYear: '2023',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800',
    messages: []
  }
};

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  
  // Get the chat data for the current ID
  const chat = id && sampleChats[id as keyof typeof sampleChats];
  
  if (!chat) {
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    // In a real app, this would send the message to a backend
    console.log('Sending message:', newMessage);
    
    // Clear the input
    setNewMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-[#121212]">
      <header className="container sticky top-0 z-10 mx-auto px-4 py-3 flex items-center bg-black border-b border-princeton-orange/20">
        <button 
          onClick={() => navigate('/matches')}
          className="text-princeton-white hover:text-princeton-orange transition-colors mr-3"
        >
          <ArrowLeft size={22} />
        </button>
        
        <div className="flex items-center" onClick={() => navigate(`/profile/${chat.id}`)}>
          <img 
            src={chat.photo}
            alt={chat.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <h3 className="font-bold text-princeton-white">
              {chat.name} <span className="text-princeton-white/60 font-normal">'{chat.classYear.slice(-2)}</span>
            </h3>
            <div className="flex items-center text-xs text-princeton-white/60">
              <MapPin size={12} className="mr-1" />
              <span>Near Cannon Club</span>
            </div>
          </div>
        </div>
        
        <div className="ml-auto">
          <button className="text-princeton-white/70 hover:text-princeton-orange">
            <InfoIcon size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {chat.messages.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-princeton-orange" />
              </div>
              <h3 className="text-xl font-bold text-princeton-white mb-2">Start the conversation</h3>
              <p className="text-princeton-white/70">
                Say hello to your new match!
              </p>
            </div>
          ) : (
            chat.messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.sender === 'me' 
                      ? 'bg-princeton-orange text-princeton-black' 
                      : 'bg-secondary text-princeton-white'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div 
                    className={`text-[10px] mt-1 ${
                      message.sender === 'me' 
                        ? 'text-princeton-black/70' 
                        : 'text-princeton-white/60'
                    }`}
                  >
                    {message.time}
                  </div>
                </div>
              </div>
            ))
          )}
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
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;
