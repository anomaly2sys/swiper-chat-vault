import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Shield,
  Settings,
  Plus,
  Hash,
  Volume2,
  Crown,
  Users,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  Link,
  Edit,
  Trash2,
  MessageSquare,
  Bell,
  Search,
  Smile,
  Paperclip,
  Mic,
  Phone,
  Video,
  Pin,
  Star,
  Flag,
  Copy,
  Reply,
  LogOut,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import UnifiedAdminBot from "./UnifiedAdminBot";
import UserProfile from "./UserProfile";
import ServerManager from "./ServerManager";
import UserContextMenu from "./UserContextMenu";
import MessageControls from "./MessageControls";
import RoleBadge from "./RoleBadge";

import { useNavigate } from "react-router-dom";

const MainChatApp: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const {
    servers,
    currentServer,
    currentChannel,
    messages,
    directMessages,
    adminCommands,
    setCurrentServer,
    setCurrentChannel,
    sendMessage,
    deleteMessage,
    createServer,
    joinServer,
    createChannel,
    executeAdminCommand,
    canAccessChannel,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [serverManager, setServerManager] = useState<{
    isOpen: boolean;
    mode: "create" | "join" | "manage";
    server?: any;
  }>({ isOpen: false, mode: "create" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, directMessages]);

  // Welcome toast for new users
  useEffect(() => {
    if (currentUser) {
      const welcomeTimeout = setTimeout(() => {
        toast({
          title: `Welcome to SwiperEmpire, ${currentUser.displayName}! 🏰`,
          description: currentUser.isAdmin
            ? "You have admin access. Check out the admin-console channel for bot commands!"
            : "Explore channels, create servers, and chat securely with disappearing messages!",
        });
      }, 1000);

      return () => clearTimeout(welcomeTimeout);
    }
  }, [currentUser, toast]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Check for admin commands
    if (
      newMessage.startsWith("/") &&
      currentUser?.isAdmin &&
      currentChannel?.name === "admin-console"
    ) {
      const [command, ...args] = newMessage.split(" ");
      const result = executeAdminCommand(command, args);
      toast({
        title: "Command executed",
        description: result,
      });
      setNewMessage("");
      return;
    }

    if (selectedDM) {
      sendMessage(newMessage, undefined, selectedDM);
    } else {
      sendMessage(newMessage, currentChannel?.id);
    }
    setNewMessage("");
  };

  const isAdminChannel =
    currentChannel?.name === "admin-console" && currentUser?.isAdmin;
  const canViewChannel =
    currentChannel?.name !== "admin-console" || currentUser?.isAdmin;

  if (!canViewChannel) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center text-white">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-300">
            You don't have permission to view this channel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      {/* Main Content */}
      <div className="flex-1 flex h-full">
        {/* Server Sidebar */}
        <div className="w-16 bg-black/40 backdrop-blur-xl border-r border-purple-500/30 flex flex-col items-center py-3">
          {servers.map((server) => (
            <Button
              key={server.id}
              variant="ghost"
              size="sm"
              className={`w-12 h-12 rounded-full mb-2 text-lg ${
                currentServer?.id === server.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => setCurrentServer(server)}
            >
              {server.icon || server.name.charAt(0)}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="w-12 h-12 rounded-full border-2 border-dashed border-gray-500 text-gray-400 hover:border-purple-400 hover:text-purple-400"
            onClick={() => setServerManager({ isOpen: true, mode: "create" })}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Channel Sidebar */}
        <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-purple-500/30">
          {/* Server Header */}
          <div className="p-4 border-b border-gray-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-white hover:bg-gray-700"
                >
                  <span className="font-semibold">
                    {currentServer?.name || "Select Server"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-600">
                <DropdownMenuItem
                  className="text-white hover:bg-gray-700"
                  onClick={() =>
                    setServerManager({ isOpen: true, mode: "join" })
                  }
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Server
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-gray-700"
                  onClick={() =>
                    setServerManager({
                      isOpen: true,
                      mode: "manage",
                      server: currentServer,
                    })
                  }
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Server Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-gray-700"
                  onClick={() =>
                    setServerManager({ isOpen: true, mode: "create" })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Server
                </DropdownMenuItem>
                {currentUser?.isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <DropdownMenuItem className="text-red-400 hover:bg-red-900">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Server
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Channels */}
          <ScrollArea className="flex-1">
            {currentServer?.categories
              .filter((category) =>
                category.channels.some((channel) =>
                  canAccessChannel(channel, currentUser),
                ),
              )
              .map((category) => (
                <div key={category.id} className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {category.name}
                    </span>
                    {(currentUser?.isAdmin ||
                      currentServer?.ownerId === currentUser?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-gray-400 hover:text-white"
                        onClick={() =>
                          setServerManager({
                            isOpen: true,
                            mode: "manage",
                            server: currentServer,
                          })
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {category.channels
                    .filter((channel) => canAccessChannel(channel, currentUser))
                    .map((channel) => (
                      <Button
                        key={channel.id}
                        variant="ghost"
                        className={`w-full justify-start mb-1 ${
                          currentChannel?.id === channel.id
                            ? "bg-purple-500/20 text-white"
                            : "text-gray-300 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          setCurrentChannel(channel);
                          setSelectedDM(null);
                        }}
                      >
                        {channel.type === "text" ? (
                          <Hash className="h-4 w-4 mr-2" />
                        ) : (
                          <Volume2 className="h-4 w-4 mr-2" />
                        )}
                        {channel.name}
                        {channel.name === "admin-console" && (
                          <Crown className="h-3 w-3 ml-auto text-yellow-500" />
                        )}
                      </Button>
                    ))}
                </div>
              ))}
          </ScrollArea>

          {/* User Info */}
          <div className="p-3 border-t border-gray-700 bg-black/20">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-600 text-white">
                  {currentUser?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {currentUser?.displayName}
                  {currentUser?.isAdmin && (
                    <Crown className="h-3 w-3 inline ml-1 text-yellow-500" />
                  )}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  @{currentUser?.username}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-600">
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-700"
                    onClick={() => setShowProfile(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    User Settings
                  </DropdownMenuItem>
                  {currentUser?.isAdmin && (
                    <DropdownMenuItem
                      className="text-yellow-300 hover:bg-yellow-900/20"
                      onClick={() => navigate("/admin-dashboard")}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-600" />
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-red-900"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Channel Header */}
          <div className="p-4 border-b border-purple-500/30 bg-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Hash className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-semibold text-white">
                  {currentChannel?.name || "Select a channel"}
                  {isAdminChannel && (
                    <Crown className="h-4 w-4 inline ml-2 text-yellow-500" />
                  )}
                </h2>
                {currentChannel?.topic && (
                  <span className="text-sm text-gray-400">
                    — {currentChannel.topic}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-300"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isAdminChannel && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-400 font-medium text-sm">
                    Admin Console
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Administrative commands and bot management. Use / commands for
                  database access and user management.
                </p>
              </div>
            )}
          </div>

          {/* Messages / Admin Bot */}
          {isAdminChannel ? (
            <UnifiedAdminBot />
          ) : (
            <ScrollArea className="flex-1 p-4">
              {(selectedDM
                ? directMessages
                : messages.filter((m) => m.channelId === currentChannel?.id)
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-6">
                    <Hash className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Welcome to #{currentChannel?.name}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      This is the beginning of your conversation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(selectedDM
                    ? directMessages
                    : messages.filter((m) => m.channelId === currentChannel?.id)
                  ).map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start space-x-3 group"
                    >
                      <UserContextMenu
                        username={
                          message.authorId === currentUser?.id
                            ? currentUser.username
                            : "User"
                        }
                        isAdmin={message.authorId === "admin-1"}
                      >
                        <Avatar className="h-8 w-8 cursor-pointer">
                          <AvatarFallback
                            className={
                              message.authorId === "system"
                                ? "bg-gradient-to-r from-green-600 to-blue-600 text-white"
                                : message.authorId === currentUser?.id
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-600 text-white"
                            }
                          >
                            {message.authorId === "system"
                              ? "🏰"
                              : message.authorId === currentUser?.id
                                ? currentUser.username.charAt(0).toUpperCase()
                                : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </UserContextMenu>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className={`font-medium ${
                              message.authorId === "system"
                                ? "text-green-400"
                                : "text-white"
                            }`}
                          >
                            {message.authorId === "system"
                              ? "SwiperEmpire System"
                              : message.authorId === currentUser?.id
                                ? currentUser.displayName
                                : "User"}
                          </span>
                          <RoleBadge
                            username={
                              message.authorId === "system"
                                ? "SwiperEmpire System"
                                : message.authorId === currentUser?.id
                                  ? currentUser.displayName
                                  : "User"
                            }
                            isAdmin={
                              message.authorId === "admin-1" ||
                              (message.authorId === currentUser?.id &&
                                currentUser?.isAdmin)
                            }
                            roles={
                              message.authorId === currentUser?.id &&
                              currentUser?.isAdmin
                                ? ["Administrator"]
                                : ["Member"]
                            }
                          />
                          <span className="text-xs text-gray-400">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p
                          className={`${
                            message.authorId === "system"
                              ? "text-green-300"
                              : "text-gray-300"
                          }`}
                        >
                          {message.content}
                        </p>
                      </div>

                      <MessageControls
                        messageId={message.id}
                        isOwn={message.authorId === currentUser?.id}
                        isDisappearing={message.isDisappearing}
                        disappearAt={message.disappearAt}
                        onDelete={deleteMessage}
                        onToggleDisappearing={(id, enabled) => {
                          // Handle toggle disappearing
                          toast({
                            title: enabled
                              ? "Auto-delete enabled"
                              : "Auto-delete disabled",
                            description: enabled
                              ? "Message will disappear in 35 seconds"
                              : "Message will not auto-delete",
                          });
                        }}
                        onRequestSave={(id) => {
                          // Handle save request
                          toast({
                            title: "Save request sent",
                            description:
                              "Waiting for the other user to approve",
                          });
                        }}
                        recipientUsername={selectedDM ? "User" : undefined}
                        isDirectMessage={!!selectedDM}
                      />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          )}

          {/* Message Input - Hidden for Admin Console */}
          {!isAdminChannel && (
            <div className="p-4 border-t border-purple-500/30 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${currentChannel?.name || "channel"}`}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-20"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>🔒 End-to-end encrypted</span>
                  <span>🔥 Messages disappear in 35s</span>
                  <span>📝 {newMessage.length}/2000</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Modal */}
        {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

        {/* Server Manager Modal */}
        <ServerManager
          isOpen={serverManager.isOpen}
          onClose={() =>
            setServerManager((prev) => ({ ...prev, isOpen: false }))
          }
          mode={serverManager.mode}
          server={serverManager.server}
        />
      </div>
    </div>
  );
};

export default MainChatApp;
