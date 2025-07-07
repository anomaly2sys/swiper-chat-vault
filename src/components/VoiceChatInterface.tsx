import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Users,
  Settings,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VoiceUser {
  id: string;
  username: string;
  displayName: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface VoiceChatInterfaceProps {
  channelName: string;
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({
  channelName,
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);

  // Simulate voice users
  useEffect(() => {
    if (isConnected) {
      setVoiceUsers([
        {
          id: currentUser?.id || "user1",
          username: currentUser?.username || "user",
          displayName: currentUser?.displayName || "User",
          isMuted,
          isDeafened,
          isSpeaking: false,
        },
        {
          id: "user2",
          username: "crypto_trader",
          displayName: "Crypto Trader",
          isMuted: false,
          isDeafened: false,
          isSpeaking: Math.random() > 0.7,
        },
        {
          id: "user3",
          username: "bitcoin_whale",
          displayName: "Bitcoin Whale",
          isMuted: true,
          isDeafened: false,
          isSpeaking: false,
        },
      ]);
    } else {
      setVoiceUsers([]);
    }
  }, [isConnected, isMuted, isDeafened, currentUser]);

  const handleConnect = () => {
    if (isConnected) {
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: `Left voice channel: ${channelName}`,
      });
    } else {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Joined voice channel: ${channelName}`,
      });
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: `Microphone ${isMuted ? "enabled" : "disabled"}`,
    });
  };

  const handleDeafen = () => {
    setIsDeafened(!isDeafened);
    if (!isDeafened) {
      setIsMuted(true); // Deafen also mutes
    }
    toast({
      title: isDeafened ? "Undeafened" : "Deafened",
      description: `Audio ${isDeafened ? "enabled" : "disabled"}`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Voice Channel Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-5 w-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">{channelName}</h2>
            <Badge
              variant="secondary"
              className="bg-green-500/20 text-green-300 border-green-500/30"
            >
              <Users className="h-3 w-3 mr-1" />
              {voiceUsers.length} Connected
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Voice Chat Content */}
      <div className="flex-1 p-6">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-8">
              <Volume2 className="h-24 w-24 mx-auto text-purple-400 mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">
                Join Voice Channel
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Connect to start talking with other members in this voice
                channel. Your audio is encrypted with military-grade security.
              </p>
              <Button
                onClick={handleConnect}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                <Phone className="h-5 w-5 mr-2" />
                Connect to Voice
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md text-xs">
              <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                <Volume2 className="h-6 w-6 mx-auto mb-2 text-green-400" />
                <div className="font-medium text-green-300">
                  High Quality Audio
                </div>
                <div className="text-gray-400">Crystal clear voice chat</div>
              </div>
              <div className="bg-purple-500/10 p-4 rounded border border-purple-500/20">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <div className="font-medium text-purple-300">
                  Secure Connection
                </div>
                <div className="text-gray-400">End-to-end encrypted</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Users */}
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Voice Participants ({voiceUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {voiceUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              className={`${
                                user.isSpeaking
                                  ? "bg-green-600 ring-2 ring-green-400"
                                  : "bg-gray-600"
                              } text-white transition-all`}
                            >
                              {user.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {user.isSpeaking && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {user.displayName}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {user.isMuted && (
                          <MicOff className="h-4 w-4 text-red-400" />
                        )}
                        {user.isDeafened && (
                          <VolumeX className="h-4 w-4 text-red-400" />
                        )}
                        {user.isSpeaking && (
                          <div className="flex space-x-1">
                            <div className="h-2 w-1 bg-green-400 rounded animate-pulse" />
                            <div className="h-3 w-1 bg-green-400 rounded animate-pulse delay-75" />
                            <div className="h-2 w-1 bg-green-400 rounded animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voice Controls */}
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Voice Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={handleMute}
                    variant={isMuted ? "destructive" : "secondary"}
                    size="lg"
                    className="h-12 w-12 rounded-full"
                  >
                    {isMuted ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>

                  <Button
                    onClick={handleDeafen}
                    variant={isDeafened ? "destructive" : "secondary"}
                    size="lg"
                    className="h-12 w-12 rounded-full"
                  >
                    {isDeafened ? (
                      <VolumeX className="h-6 w-6" />
                    ) : (
                      <Volume2 className="h-6 w-6" />
                    )}
                  </Button>

                  <Button
                    onClick={handleConnect}
                    variant="destructive"
                    size="lg"
                    className="h-12 w-12 rounded-full"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </div>

                <div className="flex justify-center space-x-6 mt-4 text-xs text-gray-400">
                  <span>Mute/Unmute</span>
                  <span>Deafen/Undeafen</span>
                  <span>Disconnect</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChatInterface;
