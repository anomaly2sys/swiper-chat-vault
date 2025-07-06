
import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, Lock, Eye, EyeOff, Settings, Users, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SecurityIndicator from './SecurityIndicator';
import MessageBubble from './MessageBubble';
import ChatSidebar from './ChatSidebar';

interface ChatInterfaceProps {
  username: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isDisappearing: boolean;
  requiresMutualConsent: boolean;
  isEncrypted: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ username }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState('General');
  const [isDisappearingMode, setIsDisappearingMode] = useState(true);
  const [requireConsent, setRequireConsent] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chats = [
    { id: 'general', name: 'General', unread: 0, lastMessage: 'Welcome to Swiper Chat!' },
    { id: 'secure', name: 'Secure Room', unread: 2, lastMessage: 'End-to-end encrypted' },
    { id: 'disappearing', name: 'Ghost Mode', unread: 0, lastMessage: 'Messages disappear in 10s' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: username,
      timestamp: new Date(),
      isDisappearing: isDisappearingMode,
      requiresMutualConsent: requireConsent,
      isEncrypted: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate disappearing messages
    if (isDisappearingMode) {
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
      }, 10000); // 10 seconds
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <ChatSidebar 
        chats={chats}
        selectedChat={selectedChat}
        onChatSelect={setSelectedChat}
        username={username}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-xl border-b border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-semibold text-white">{selectedChat}</h2>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Shield className="h-3 w-3 mr-1" />
                Encrypted
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <SecurityIndicator isSecure={true} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDisappearingMode(!isDisappearingMode)}
                className={`${isDisappearingMode ? 'text-purple-300' : 'text-gray-400'} hover:text-white`}
              >
                {isDisappearingMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRequireConsent(!requireConsent)}
                className={`${requireConsent ? 'text-blue-300' : 'text-gray-400'} hover:text-white`}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Security Status Bar */}
          <div className="flex items-center space-x-4 mt-2 text-xs">
            <span className="text-green-300 flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              E2E Encrypted
            </span>
            <span className={`flex items-center ${isDisappearingMode ? 'text-purple-300' : 'text-gray-500'}`}>
              <EyeOff className="h-3 w-3 mr-1" />
              {isDisappearingMode ? 'Disappearing Mode' : 'Standard Mode'}
            </span>
            <span className={`flex items-center ${requireConsent ? 'text-blue-300' : 'text-gray-500'}`}>
              <Users className="h-3 w-3 mr-1" />
              {requireConsent ? 'Mutual Consent Required' : 'Auto Save'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <Shield className="h-16 w-16 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl font-semibold mb-2">Secure Chat Initialized</h3>
              <p>Your messages are end-to-end encrypted and protected.</p>
              <p className="text-sm mt-2">Start chatting - your privacy is guaranteed.</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isOwn={message.sender === username}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-black/40 backdrop-blur-xl border-t border-purple-500/30 p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a secure message..."
              className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>🔒 Messages are encrypted locally before sending</span>
            <span>🔥 {isDisappearingMode ? 'Will disappear in 10s' : 'Saved with consent'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
