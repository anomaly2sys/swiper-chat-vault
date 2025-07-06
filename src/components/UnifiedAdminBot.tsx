import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Terminal,
  Shield,
  Database,
  Users,
  Activity,
  Trash2,
  Copy,
  Download,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { realDatabaseService } from "@/services/realDatabaseService";

interface BotMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: "command" | "response" | "error" | "success";
  data?: any;
}

const UnifiedAdminBot: React.FC = () => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    addBotMessage(
      "🤖 **UNIFIED ADMIN BOT ONLINE**\n\nWelcome to the production admin console. All operations are connected to the live Netlify database.\n\nType `/help` to see available commands.",
      "success",
    );
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (
    content: string,
    type: BotMessage["type"],
    data?: any,
  ) => {
    const newMessage: BotMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date(),
      type,
      data,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const executeCommand = async (input: string) => {
    if (!input.trim()) return;

    const fullCommand = input.trim();
    addBotMessage(fullCommand, "command");

    if (!fullCommand.startsWith("/")) {
      addBotMessage(
        "❌ Commands must start with '/'. Type `/help` for available commands.",
        "error",
      );
      return;
    }

    const [command, ...args] = fullCommand.slice(1).split(" ");
    setIsLoading(true);

    try {
      const result = await realDatabaseService.executeBotCommand(
        command,
        args,
        currentUser?.id || 0,
      );

      if (result.success) {
        addBotMessage(result.response, "success", result.data);
      } else {
        addBotMessage(result.response, "error");
      }
    } catch (error: any) {
      addBotMessage(`❌ Error: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && inputValue.trim()) {
      executeCommand(inputValue);
      setInputValue("");
    }
  };

  const clearMessages = () => {
    setMessages([]);
    addBotMessage("🧹 Console cleared.", "success");
  };

  const exportLogs = () => {
    const logsText = messages
      .map(
        (m) =>
          `[${m.timestamp.toLocaleString()}] ${m.type.toUpperCase()}: ${m.content}`,
      )
      .join("\n");

    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-bot-logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Logs exported",
      description: "Admin bot logs have been downloaded",
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const getMessageIcon = (type: BotMessage["type"]) => {
    switch (type) {
      case "command":
        return <Terminal className="h-4 w-4 text-cyan-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "response":
        return <Bot className="h-4 w-4 text-purple-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatMessageContent = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>')
      .replace(/\n/g, "<br>");
  };

  return (
    <Card className="h-full bg-black/60 border-purple-500/30 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white flex items-center">
            <Bot className="h-6 w-6 mr-2 text-purple-400" />
            Unified Admin Bot
            <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
              LIVE
            </Badge>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full space-y-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 h-96 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start space-x-3 group"
              >
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        message.type === "success"
                          ? "border-green-500/30 text-green-300"
                          : message.type === "error"
                            ? "border-red-500/30 text-red-300"
                            : message.type === "command"
                              ? "border-cyan-500/30 text-cyan-300"
                              : "border-purple-500/30 text-purple-300"
                      }`}
                    >
                      {message.type}
                    </Badge>
                  </div>
                  <div
                    className="text-white prose prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content),
                    }}
                  />
                  {message.data && (
                    <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-700">
                      <pre className="text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                    onClick={() => copyToClipboard(message.content)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <Terminal className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter admin command (e.g., /help, /users, /stats)..."
              className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Quick Commands */}
        <div className="flex flex-wrap gap-2">
          {[
            { cmd: "/help", icon: AlertCircle, label: "Help" },
            { cmd: "/users", icon: Users, label: "Users" },
            { cmd: "/stats", icon: Activity, label: "Stats" },
            { cmd: "/tables", icon: Database, label: "Tables" },
            { cmd: "/online", icon: Shield, label: "Online" },
          ].map(({ cmd, icon: Icon, label }) => (
            <Button
              key={cmd}
              variant="outline"
              size="sm"
              onClick={() => setInputValue(cmd)}
              className="border-gray-600 hover:bg-gray-700 text-xs"
              disabled={isLoading}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedAdminBot;
