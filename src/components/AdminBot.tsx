import React, { useState, useEffect } from "react";
import {
  Bot,
  Crown,
  Database,
  Users,
  Shield,
  AlertTriangle,
  Trash2,
  Ban,
  Volume2,
  MessageSquare,
  BarChart3,
  Settings,
  Key,
  Lock,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface AdminBotProps {
  onCommand: (command: string, args: string[]) => string;
}

interface BotMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: "system" | "command" | "response" | "error";
}

const AdminBot: React.FC<AdminBotProps> = ({ onCommand }) => {
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "1",
      content:
        "Admin Bot initialized. Welcome BlankBank! I have full access to the system database and all user management functions.",
      timestamp: new Date(),
      type: "system",
    },
    {
      id: "2",
      content:
        "Available commands: /users, /ban, /kick, /mute, /warn, /purge, /db, /stats, /server, /backup",
      timestamp: new Date(),
      type: "system",
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [systemStats, setSystemStats] = useState({
    totalUsers: 42,
    activeUsers: 15,
    totalServers: 8,
    totalMessages: 1337,
    databaseSize: "2.4 GB",
    uptime: "15d 8h 42m",
  });
  const { toast } = useToast();

  const botCommands = [
    {
      command: "/users list",
      description: "List all registered users",
      icon: Users,
    },
    {
      command: "/users search <query>",
      description: "Search users by username/email",
      icon: Users,
    },
    {
      command: "/ban <username> [reason]",
      description: "Ban user from platform",
      icon: Ban,
    },
    {
      command: "/kick <username> [reason]",
      description: "Kick user from current server",
      icon: Trash2,
    },
    {
      command: "/mute <username> [duration]",
      description: "Mute user temporarily",
      icon: Volume2,
    },
    {
      command: "/warn <username> <message>",
      description: "Send warning to user",
      icon: AlertTriangle,
    },
    {
      command: "/db read <table>",
      description: "Read from database table",
      icon: Database,
    },
    {
      command: "/db write <table> <data>",
      description: "Write to database table",
      icon: Database,
    },
    {
      command: "/db backup",
      description: "Create database backup",
      icon: Database,
    },
    {
      command: "/stats",
      description: "Show comprehensive system statistics",
      icon: BarChart3,
    },
    {
      command: "/server delete <servername>",
      description: "Delete entire server",
      icon: Trash2,
    },
    {
      command: "/logs <type>",
      description: "View system logs",
      icon: Activity,
    },
    {
      command: "/security scan",
      description: "Run security vulnerability scan",
      icon: Shield,
    },
    {
      command: "/purge <count>",
      description: "Delete multiple messages",
      icon: MessageSquare,
    },
  ];

  const executeCommand = () => {
    if (!currentCommand.trim().startsWith("/")) {
      addBotMessage("Commands must start with /", "error");
      return;
    }

    const [cmd, ...args] = currentCommand.trim().split(" ");

    addBotMessage(currentCommand, "command");

    // Simulate command execution
    setTimeout(() => {
      let response = "";

      switch (cmd) {
        case "/users":
          if (args[0] === "list") {
            response = `Database Query: SELECT * FROM users;\n\nFound ${systemStats.totalUsers} users:\n- BlankBank (Admin, ID: admin-1)\n- TestUser1 (Member, ID: user-1001)\n- TestUser2 (Member, ID: user-1002)\n[... ${systemStats.totalUsers - 3} more users]`;
          } else if (args[0] === "search") {
            response = `Searching for "${args[1]}"...\nFound 3 matches:\n- ${args[1]}User (ID: user-2001)\n- Test${args[1]} (ID: user-2002)\n- ${args[1]}Admin (ID: user-2003)`;
          } else {
            response = "Usage: /users list OR /users search <query>";
          }
          break;

        case "/ban":
          if (args.length > 0) {
            response = `Database: UPDATE users SET banned=true WHERE username='${args[0]}';\nUser ${args[0]} has been banned from the platform.\nReason: ${args.slice(1).join(" ") || "No reason provided"}`;
          } else {
            response = "Usage: /ban <username> [reason]";
          }
          break;

        case "/db":
          if (args[0] === "read") {
            response = `Reading from table: ${args[1]}\n\n[DATABASE ACCESS GRANTED]\nTable: ${args[1]}\nRows: 1,247\nSize: 42.8 MB\nLast modified: ${new Date().toISOString()}`;
          } else if (args[0] === "write") {
            response = `Writing to table: ${args[1]}\nData: ${args.slice(2).join(" ")}\n\n[WRITE OPERATION SUCCESSFUL]\nRows affected: 1\nOperation completed at: ${new Date().toISOString()}`;
          } else if (args[0] === "backup") {
            response = `Creating database backup...\n\nBackup initiated: ${new Date().toISOString()}\nEstimated size: ${systemStats.databaseSize}\nDestination: /backups/admin_backup_${Date.now()}.sql\n\n✅ Backup completed successfully!`;
          } else {
            response =
              "Usage: /db read <table> OR /db write <table> <data> OR /db backup";
          }
          break;

        case "/stats":
          response = `SYSTEM STATISTICS:\n\n👥 Users: ${systemStats.totalUsers} total, ${systemStats.activeUsers} online\n🏰 Servers: ${systemStats.totalServers} active\n💬 Messages: ${systemStats.totalMessages} sent today\n💾 Database: ${systemStats.databaseSize} used\n⏱️ Uptime: ${systemStats.uptime}\n🔒 Security: All systems nominal\n📊 Load: 12% CPU, 34% RAM\n🌐 Network: 99.9% uptime`;
          break;

        case "/security":
          if (args[0] === "scan") {
            response = `Running comprehensive security scan...\n\n🔍 Scanning user permissions...\n🔍 Checking database integrity...\n🔍 Analyzing network traffic...\n🔍 Validating encryption keys...\n\n✅ SECURITY SCAN COMPLETE\n- No vulnerabilities detected\n- All encryption active\n- User permissions valid\n- Database integrity: 100%`;
          }
          break;

        case "/server":
          if (args[0] === "delete") {
            response = `⚠️ CRITICAL OPERATION ⚠️\n\nPreparing to delete server: ${args[1]}\n\nThis action will:\n- Remove all channels\n- Delete all messages\n- Remove all members\n- Cannot be undone\n\nType '/server delete ${args[1]} CONFIRM' to proceed.`;
          }
          break;

        case "/purge":
          const count = parseInt(args[0]) || 10;
          response = `Purging ${count} messages from current channel...\n\nDatabase: DELETE FROM messages WHERE channel_id='current' LIMIT ${count};\n\n✅ Successfully deleted ${count} messages.`;
          break;

        default:
          response = onCommand(cmd, args);
      }

      addBotMessage(response, "response");
    }, 1000);

    setCurrentCommand("");
  };

  const addBotMessage = (content: string, type: BotMessage["type"]) => {
    const newMessage: BotMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      type,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    // Simulate live system updates
    const interval = setInterval(() => {
      setSystemStats((prev) => ({
        ...prev,
        activeUsers: Math.max(
          5,
          prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        ),
        totalMessages: prev.totalMessages + Math.floor(Math.random() * 10),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Bot Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
              <Crown className="h-2 w-2 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center">
              Admin Bot
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                SYSTEM
              </Badge>
            </h3>
            <p className="text-sm text-gray-300">
              Full database and user management access
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Active Users</p>
                  <p className="text-xl font-bold text-white">
                    {systemStats.activeUsers}
                  </p>
                </div>
                <Activity className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Database</p>
                  <p className="text-xl font-bold text-white">
                    {systemStats.databaseSize}
                  </p>
                </div>
                <Database className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bot Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className={
                    message.type === "command"
                      ? "bg-purple-600 text-white"
                      : "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  }
                >
                  {message.type === "command" ? (
                    ">"
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-white">
                    {message.type === "command" ? "BlankBank" : "Admin Bot"}
                  </span>
                  <Badge
                    variant={
                      message.type === "error"
                        ? "destructive"
                        : message.type === "system"
                          ? "secondary"
                          : message.type === "command"
                            ? "outline"
                            : "default"
                    }
                    className="text-xs"
                  >
                    {message.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <pre
                  className={`text-sm whitespace-pre-wrap font-mono ${
                    message.type === "error"
                      ? "text-red-300"
                      : message.type === "command"
                        ? "text-purple-300"
                        : message.type === "system"
                          ? "text-yellow-300"
                          : "text-gray-300"
                  }`}
                >
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Commands */}
      <div className="p-4 border-t border-gray-700">
        <div className="mb-3">
          <p className="text-sm text-gray-400 mb-2">Quick Commands:</p>
          <div className="flex flex-wrap gap-1">
            {["/users list", "/stats", "/db backup", "/security scan"].map(
              (cmd) => (
                <Button
                  key={cmd}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => setCurrentCommand(cmd)}
                >
                  {cmd}
                </Button>
              ),
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Input
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            placeholder="Enter admin command..."
            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 font-mono"
            onKeyPress={(e) => e.key === "Enter" && executeCommand()}
          />
          <Button
            onClick={executeCommand}
            disabled={!currentCommand.trim()}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-600 hover:to-orange-600"
          >
            Execute
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminBot;
