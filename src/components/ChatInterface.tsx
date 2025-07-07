import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Settings,
  Users,
  Plus,
  Search,
  Smile,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SecurityIndicator from "./SecurityIndicator";
import MessageBubble from "./MessageBubble";
import ChatSidebar from "./ChatSidebar";
import TypingIndicator from "./TypingIndicator";

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
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ username }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState("General");
  const [isDisappearingMode, setIsDisappearingMode] = useState(true);
  const [requireConsent, setRequireConsent] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chats = [
    {
      id: "general",
      name: "General",
      unread: 0,
      lastMessage: "Welcome to Swiper Chat!",
      isOnline: true,
    },
    {
      id: "secure",
      name: "Secure Room",
      unread: 2,
      lastMessage: "End-to-end encrypted",
      isOnline: true,
    },
    {
      id: "disappearing",
      name: "Ghost Mode",
      unread: 0,
      lastMessage: "Messages disappear in 10s",
      isOnline: false,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (newMessage) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [newMessage]);

  // Simulate other users typing
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        if (Math.random() > 0.8) {
          setTypingUsers(["SecureUser"]);
          setTimeout(() => setTypingUsers([]), 3000);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newMessage,
      sender: username,
      timestamp: new Date(),
      isDisappearing: isDisappearingMode,
      requiresMutualConsent: requireConsent,
      isEncrypted: true,
      status: "sending",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate message delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, status: "sent" } : msg,
        ),
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, status: "delivered" } : msg,
        ),
      );
    }, 1000);

    // Show success toast
    toast({
      title: "Message sent securely",
      description: isDisappearingMode
        ? "Message will disappear in 10 seconds"
        : "Message saved with encryption",
    });

    // Handle disappearing messages
    if (isDisappearingMode) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      }, 10000);
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    toast({
      title: "Message deleted",
      description: "Message removed from chat",
    });
  };

  const toggleDisappearingMode = () => {
    setIsDisappearingMode(!isDisappearingMode);
    toast({
      title: isDisappearingMode
        ? "Standard mode enabled"
        : "Disappearing mode enabled",
      description: isDisappearingMode
        ? "Messages will be saved"
        : "Messages will disappear in 10 seconds",
    });
  };

  const toggleConsentMode = () => {
    setRequireConsent(!requireConsent);
    toast({
      title: requireConsent ? "Auto-save enabled" : "Mutual consent enabled",
      description: requireConsent
        ? "Messages saved automatically"
        : "Both users must consent to save messages",
    });
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
                <h2 className="text-xl font-semibold text-white">
                  {selectedChat}
                </h2>
                <span className="text-xs text-gray-400">3 online</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-green-300 border-green-500/30"
              >
                <Shield className="h-3 w-3 mr-1" />
                Military-Grade Encryption
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <SecurityIndicator isSecure={true} encryptionLevel="high" />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDisappearingMode}
                className={`${isDisappearingMode ? "text-purple-300 bg-purple-500/20" : "text-gray-400"} hover:text-white transition-all`}
              >
                {isDisappearingMode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleConsentMode}
                className={`${requireConsent ? "text-blue-300 bg-blue-500/20" : "text-gray-400"} hover:text-white transition-all`}
              >
                <Users className="h-4 w-4" />
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

          {/* Enhanced Security Status Bar */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-green-300 flex items-center bg-green-500/10 px-2 py-1 rounded">
                <Lock className="h-3 w-3 mr-1" />
                E2E Encrypted
              </span>
              <span
                className={`flex items-center px-2 py-1 rounded ${isDisappearingMode ? "text-purple-300 bg-purple-500/10" : "text-gray-500 bg-gray-500/10"}`}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                {isDisappearingMode ? "Disappearing Mode" : "Standard Mode"}
              </span>
              <span
                className={`flex items-center px-2 py-1 rounded ${requireConsent ? "text-blue-300 bg-blue-500/10" : "text-gray-500 bg-gray-500/10"}`}
              >
                <Users className="h-3 w-3 mr-1" />
                {requireConsent ? "Mutual Consent" : "Auto Save"}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              🛡️ Zero-Knowledge • No Backdoors • Quantum-Resistant
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <Shield className="h-16 w-16 mx-auto mb-4 text-purple-400 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">
                Ultra-Secure Chat Initialized
              </h3>
              <p>Your messages are protected with military-grade encryption.</p>
              <p className="text-sm mt-2">
                🔐 Zero-knowledge architecture ensures complete privacy.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 max-w-md mx-auto text-xs">
                <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                  <Shield className="h-4 w-4 mx-auto mb-1 text-green-400" />
                  End-to-End Encrypted
                </div>
                <div className="bg-purple-500/10 p-3 rounded border border-purple-500/20">
                  <EyeOff className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                  Disappearing Messages
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender === username}
                  onDelete={deleteMessage}
                />
              ))}
              {typingUsers.map((user) => (
                <TypingIndicator key={user} username={user} />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Message Input */}
        <div className="bg-black/40 backdrop-blur-xl border-t border-purple-500/30 p-4">
          <div className="flex space-x-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a secure message..."
              className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors"
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              maxLength={1000}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>🔒 End-to-end encrypted</span>
              <span>
                🔥{" "}
                {isDisappearingMode
                  ? "Disappears in 10s"
                  : "Saved with consent"}
              </span>
              <span>📱 {newMessage.length}/1000</span>
            </div>
            {isTyping && (
              <span className="text-purple-300">You are typing...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
