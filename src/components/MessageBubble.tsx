
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Clock, Shield, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MessageStatus from './MessageStatus';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isDisappearing: boolean;
  requiresMutualConsent: boolean;
  isEncrypted: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (message.isDisappearing) {
      const startTime = Date.now();
      const endTime = message.timestamp.getTime() + 35000; // Changed to 35 seconds
      
      const timer = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(timer);
          onDelete?.(message.id);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [message, onDelete]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative group`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className={`p-3 transition-all duration-200 ${
          isOwn 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
            : 'bg-gray-800/60 text-gray-100 border-gray-600 hover:bg-gray-700/60'
        } backdrop-blur-sm ${timeLeft && timeLeft <= 3 ? 'animate-pulse' : ''}`}>
          <div className="space-y-2">
            {!isOwn && (
              <div className="text-xs font-medium text-gray-300">
                {message.sender}
              </div>
            )}
            
            <div className="text-sm leading-relaxed">
              {message.text}
            </div>
            
            <div className="flex items-center justify-between text-xs opacity-70">
              <div className="flex items-center space-x-2">
                <span>{formatTime(message.timestamp)}</span>
                {message.isEncrypted && (
                  <div title="End-to-end encrypted">
                    <Lock className="h-3 w-3 text-green-400" />
                  </div>
                )}
                {message.isDisappearing && (
                  <div className="flex items-center space-x-1">
                    <div title="Disappearing message">
                      <EyeOff className="h-3 w-3 text-purple-300" />
                    </div>
                    {timeLeft !== null && timeLeft > 0 && (
                      <span className={`text-purple-300 ${timeLeft <= 3 ? 'text-red-300 font-bold' : ''}`}>
                        {timeLeft}s
                      </span>
                    )}
                  </div>
                )}
                {message.requiresMutualConsent && (
                  <div title="Requires mutual consent to save">
                    <Shield className="h-3 w-3 text-blue-400" />
                  </div>
                )}
              </div>
              <MessageStatus status={message.status} isOwn={isOwn} />
            </div>
          </div>
        </Card>
        
        {/* Delete button for own messages */}
        {isOwn && isHovered && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/40 text-red-300"
            onClick={() => onDelete(message.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
