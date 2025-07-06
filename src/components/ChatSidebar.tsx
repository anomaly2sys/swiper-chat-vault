
import React from 'react';
import { MessageCircle, Shield, Users, Settings, Plus, Search, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Chat {
  id: string;
  name: string;
  unread: number;
  lastMessage: string;
  isOnline?: boolean;
}

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat: string;
  onChatSelect: (chatName: string) => void;
  username: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  selectedChat,
  onChatSelect,
  username
}) => {
  return (
    <div className="w-80 bg-black/40 backdrop-blur-xl border-r border-purple-500/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MessageCircle className="h-6 w-6 text-purple-400" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Swiper Chat</h2>
              <p className="text-xs text-purple-300">Ultra-Secure Messaging</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search secure chats..."
            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Enhanced User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">{username}</div>
            <div className="text-xs text-green-400 flex items-center">
              <Wifi className="w-3 h-3 mr-1" />
              Online • Ultra-Secure Mode
            </div>
            <div className="text-xs text-purple-300 mt-1">
              🛡️ Quantum-resistant encryption active
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chats List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-purple-300 hover:text-white hover:bg-purple-500/20 mb-2 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ultra-Secure Room
          </Button>
        </div>

        <div className="space-y-1 px-2">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className={`p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedChat === chat.name
                  ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                  : 'bg-gray-800/20 border-gray-700 hover:bg-gray-700/30'
              }`}
              onClick={() => onChatSelect(chat.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                      {chat.name === 'Secure Room' && <Shield className="h-4 w-4 text-green-400" />}
                      {chat.name === 'Ghost Mode' && <EyeOff className="h-4 w-4 text-purple-400" />}
                      {chat.name === 'General' && <MessageCircle className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                      chat.isOnline ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm flex items-center">
                      {chat.name}
                      {chat.isOnline ? (
                        <Wifi className="h-3 w-3 ml-1 text-green-400" />
                      ) : (
                        <WifiOff className="h-3 w-3 ml-1 text-gray-400" />
                      )}
                    </div>
                    <div className="text-gray-400 text-xs truncate max-w-32">
                      {chat.lastMessage}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  {chat.unread > 0 && (
                    <Badge variant="secondary" className="bg-purple-600 text-white text-xs animate-pulse">
                      {chat.unread}
                    </Badge>
                  )}
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Security Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-green-400 animate-pulse" />
            <span className="text-green-400 font-medium text-sm">Maximum Security Active</span>
          </div>
          <div className="text-xs text-gray-300 space-y-1">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Quantum-resistant encryption
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              Zero-knowledge architecture
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              Mutual consent protocol
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
              No backdoors or logging
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
