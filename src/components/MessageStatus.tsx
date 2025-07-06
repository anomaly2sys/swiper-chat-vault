
import React from 'react';
import { Check, CheckCheck, Eye, Clock, AlertCircle } from 'lucide-react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status, isOwn }) => {
  if (!isOwn) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-spin" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-300" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      {getStatusIcon()}
    </div>
  );
};

export default MessageStatus;
