
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Clock, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isDisappearing: boolean;
  requiresMutualConsent: boolean;
  isEncrypted: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (message.isDisappearing) {
      const startTime = Date.now();
      const endTime = message.timestamp.getTime() + 10000; // 10 seconds
      
      const timer = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [message]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <Card className={`p-3 ${
          isOwn 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
            : 'bg-gray-800/60 text-gray-100 border-gray-600'
        } backdrop-blur-sm`}>
          <div className="space-y-2">
            {!isOwn && (
              <div className="text-xs font-medium text-gray-300">
                {message.sender}
              </div>
            )}
            
            <div className="text-sm">
              {message.text}
            </div>
            
            <div className="flex items-center justify-between text-xs opacity-70">
              <div className="flex items-center space-x-2">
                <span>{formatTime(message.timestamp)}</span>
                {message.isEncrypted && (
                  <Lock className="h-3 w-3 text-green-400" />
                )}
                {message.isDisappearing && (
                  <div className="flex items-center space-x-1">
                    <EyeOff className="h-3 w-3 text-purple-300" />
                    {timeLeft !== null && timeLeft > 0 && (
                      <span className="text-purple-300">{timeLeft}s</span>
                    )}
                  </div>
                )}
                {message.requiresMutualConsent && (
                  <Shield className="h-3 w-3 text-blue-400" />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MessageBubble;
