
import React from 'react';

interface TypingIndicatorProps {
  username: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username }) => {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs lg:max-w-md">
        <div className="bg-gray-800/60 text-gray-100 border-gray-600 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-300">{username} is typing</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
