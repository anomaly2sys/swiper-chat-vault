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
  HelpCircle,
  UserCheck,
  UserX,
  Clock,
  Bell,
  Eye,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancedAdminBotProps {
  onCommand: (command: string, args: string[]) => string;
}

interface BotMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: "system" | "command" | "response" | "error" | "help";
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  created: Date;
  assignedUsers: string[];
}

interface MutedUser {
  username: string;
  mutedUntil: Date;
  reason: string;
}

const EnhancedAdminBot: React.FC<EnhancedAdminBotProps> = ({ onCommand }) => {
  const { getAllUsers } = useAuth();
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "1",
      content:
        "🏰 SwiperEmpire Admin Bot v2.0 initialized successfully!\n\nFull system access granted to BlankBank.\nType /help to see all available commands.",
      timestamp: new Date(),
      type: "system",
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [dbPage, setDbPage] = useState(0);
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin-role",
      name: "Administrator",
      color: "#ff0000",
      permissions: ["*"],
      created: new Date("2024-01-01"),
      assignedUsers: ["BlankBank"],
    },
    {
      id: "moderator-role",
      name: "Moderator",
      color: "#00ff00",
      permissions: ["KICK_MEMBERS", "MUTE_MEMBERS", "MANAGE_MESSAGES"],
      created: new Date("2024-01-01"),
      assignedUsers: [],
    },
  ]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const allCommands = [
    // User Management
    {
      cmd: "/help",
      desc: "Show all available commands",
      usage: "/help [category]",
    },
    {
      cmd: "/users list",
      desc: "List all users in database",
      usage: "/users list [page]",
    },
    {
      cmd: "/users search",
      desc: "Search users",
      usage: "/users search <query>",
    },
    {
      cmd: "/users info",
      desc: "Get detailed user info",
      usage: "/users info <username>",
    },
    { cmd: "/users online", desc: "List online users", usage: "/users online" },

    // Moderation
    {
      cmd: "/ban",
      desc: "Ban user from platform",
      usage: "/ban <username> [reason]",
    },
    { cmd: "/unban", desc: "Unban user", usage: "/unban <username>" },
    {
      cmd: "/kick",
      desc: "Kick user from server",
      usage: "/kick <username> [reason]",
    },
    {
      cmd: "/mute",
      desc: "Mute user",
      usage: "/mute <username> <duration> [reason]",
    },
    { cmd: "/unmute", desc: "Unmute user", usage: "/unmute <username>" },
    {
      cmd: "/warn",
      desc: "Send warning to user",
      usage: "/warn <username> <message>",
    },
    {
      cmd: "/notify",
      desc: "Send notification to user",
      usage: "/notify <username> <message>",
    },

    // Role Management
    { cmd: "/roles list", desc: "List all roles", usage: "/roles list" },
    {
      cmd: "/roles create",
      desc: "Create new role",
      usage: "/roles create <name> <color> [permissions]",
    },
    {
      cmd: "/roles delete",
      desc: "Delete role",
      usage: "/roles delete <role_name>",
    },
    {
      cmd: "/roles assign",
      desc: "Assign role to user",
      usage: "/roles assign <username> <role_name>",
    },
    {
      cmd: "/roles remove",
      desc: "Remove role from user",
      usage: "/roles remove <username> <role_name>",
    },
    {
      cmd: "/roles permissions",
      desc: "Set role permissions",
      usage: "/roles permissions <role_name> <permissions>",
    },

    // Database Management
    { cmd: "/db list", desc: "List database tables", usage: "/db list" },
    {
      cmd: "/db read",
      desc: "Read from database",
      usage: "/db read <table> [page]",
    },
    {
      cmd: "/db write",
      desc: "Write to database",
      usage: "/db write <table> <data>",
    },
    {
      cmd: "/db backup",
      desc: "Create database backup",
      usage: "/db backup [name]",
    },
    {
      cmd: "/db restore",
      desc: "Restore from backup",
      usage: "/db restore <backup_name>",
    },
    {
      cmd: "/db query",
      desc: "Execute custom query",
      usage: "/db query <sql>",
    },

    // Server Management
    { cmd: "/servers list", desc: "List all servers", usage: "/servers list" },
    {
      cmd: "/servers delete",
      desc: "Delete server",
      usage: "/servers delete <server_name>",
    },
    {
      cmd: "/servers backup",
      desc: "Backup server data",
      usage: "/servers backup <server_name>",
    },
    {
      cmd: "/channels list",
      desc: "List channels in server",
      usage: "/channels list [server_name]",
    },

    // System Management
    {
      cmd: "/stats",
      desc: "Show system statistics",
      usage: "/stats [detailed]",
    },
    { cmd: "/logs", desc: "View system logs", usage: "/logs <type> [count]" },
    {
      cmd: "/security",
      desc: "Security operations",
      usage: "/security <scan|audit|report>",
    },
    {
      cmd: "/purge",
      desc: "Delete multiple messages",
      usage: "/purge <count> [channel]",
    },
    {
      cmd: "/maintenance",
      desc: "System maintenance",
      usage: "/maintenance <start|stop|status>",
    },
    {
      cmd: "/reload",
      desc: "Reload system components",
      usage: "/reload <component>",
    },
  ];

  const executeCommand = () => {
    if (!currentCommand.trim().startsWith("/")) {
      addBotMessage("❌ Commands must start with /", "error");
      return;
    }

    const [cmd, ...args] = currentCommand.trim().split(" ");
    addBotMessage(currentCommand, "command");

    setTimeout(() => {
      let response = "";

      switch (cmd) {
        case "/help":
          response = generateHelpResponse(args[0]);
          break;

        case "/users":
          response = handleUsersCommand(args);
          break;

        case "/roles":
          response = handleRolesCommand(args);
          break;

        case "/ban":
          response = handleBanCommand(args);
          break;

        case "/unban":
          response = handleUnbanCommand(args);
          break;

        case "/mute":
          response = handleMuteCommand(args);
          break;

        case "/unmute":
          response = handleUnmuteCommand(args);
          break;

        case "/warn":
        case "/notify":
          response = handleNotificationCommand(cmd, args);
          break;

        case "/db":
          response = handleDatabaseCommand(args);
          break;

        case "/stats":
          response = generateStatsResponse(args[0] === "detailed");
          break;

        case "/security":
          response = handleSecurityCommand(args);
          break;

        case "/purge":
          response = handlePurgeCommand(args);
          break;

        case "/servers":
          response = handleServersCommand(args);
          break;

        default:
          response = `❌ Unknown command: ${cmd}\nType /help to see all available commands.`;
      }

      addBotMessage(response, response.includes("❌") ? "error" : "response");
    }, 800);

    setCurrentCommand("");
  };

  const generateHelpResponse = (category?: string): string => {
    if (!category) {
      return `🤖 **SwiperEmpire Admin Bot - Command Help**

**Categories:**
• /help users - User management commands
• /help moderation - Moderation commands  
• /help roles - Role management commands
• /help database - Database commands
• /help servers - Server management commands
• /help system - System commands

**Quick Commands:**
• /users list - List all users
• /stats - System statistics
• /ban <user> - Ban user
• /roles list - List roles

Type /help <category> for detailed commands in that category.`;
    }

    const categoryCommands = {
      users: allCommands.filter((c) => c.cmd.startsWith("/users")),
      moderation: allCommands.filter((c) =>
        [
          "/ban",
          "/unban",
          "/kick",
          "/mute",
          "/unmute",
          "/warn",
          "/notify",
        ].includes(c.cmd),
      ),
      roles: allCommands.filter((c) => c.cmd.startsWith("/roles")),
      database: allCommands.filter((c) => c.cmd.startsWith("/db")),
      servers: allCommands.filter(
        (c) => c.cmd.startsWith("/servers") || c.cmd.startsWith("/channels"),
      ),
      system: allCommands.filter((c) =>
        [
          "/stats",
          "/logs",
          "/security",
          "/purge",
          "/maintenance",
          "/reload",
        ].includes(c.cmd),
      ),
    };

    const commands =
      categoryCommands[category as keyof typeof categoryCommands];
    if (!commands) {
      return `❌ Unknown category: ${category}`;
    }

    return `📋 **${category.toUpperCase()} COMMANDS:**\n\n${commands
      .map((c) => `• **${c.cmd}** - ${c.desc}\n  Usage: \`${c.usage}\``)
      .join("\n\n")}`;
  };

  const handleUsersCommand = (args: string[]): string => {
    const subcommand = args[0];
    const users = getAllUsers();

    switch (subcommand) {
      case "list":
        const page = parseInt(args[1]) || 0;
        const pageSize = 10;
        const startIdx = page * pageSize;
        const pageUsers = users.slice(startIdx, startIdx + pageSize);

        return `👥 **USER DATABASE** (Page ${page + 1}/${Math.ceil(users.length / pageSize)})

${pageUsers
  .map(
    (user) =>
      `• **${user.displayName}** (@${user.username})
  ID: ${user.id} | Admin: ${user.isAdmin ? "✅" : "❌"}
  Status: ${user.status} | Joined: ${user.joinedAt.toLocaleDateString()}`,
  )
  .join("\n\n")}

Total Users: ${users.length}
Use /users list ${page + 1} for next page.`;

      case "search":
        const query = args[1]?.toLowerCase();
        if (!query) return "❌ Usage: /users search <query>";

        const matches = users.filter(
          (u) =>
            u.username.toLowerCase().includes(query) ||
            u.displayName.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query),
        );

        return `🔍 **SEARCH RESULTS** for "${query}":

${matches
  .map(
    (user) =>
      `• **${user.displayName}** (@${user.username})
  Email: ${user.email || "N/A"} | Admin: ${user.isAdmin ? "✅" : "❌"}`,
  )
  .join("\n\n")}

Found ${matches.length} user(s).`;

      case "online":
        const onlineUsers = users.filter((u) => u.status === "online");
        return `🟢 **ONLINE USERS** (${onlineUsers.length}):

${onlineUsers
  .map(
    (user) =>
      `• **${user.displayName}** (@${user.username}) - ${user.isAdmin ? "👑 Admin" : "👤 User"}`,
  )
  .join("\n")}`;

      case "info":
        const username = args[1];
        if (!username) return "❌ Usage: /users info <username>";

        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase(),
        );
        if (!user) return `❌ User not found: ${username}`;

        return `👤 **USER INFO** for ${user.displayName}:

**Basic Info:**
�� Username: @${user.username}
• Display Name: ${user.displayName}
• User ID: ${user.id}
• Email: ${user.email || "Not provided"}
• Phone: ${user.phone || "Not provided"}

**Status:**
• Online Status: ${user.status}
• Admin: ${user.isAdmin ? "✅ Yes" : "❌ No"}
• Joined: ${user.joinedAt.toLocaleDateString()}
• Last Seen: ${user.lastSeen.toLocaleDateString()}

**Bio:** ${user.bio || "No bio provided"}`;

      default:
        return "❌ Usage: /users <list|search|online|info> [args]";
    }
  };

  const handleRolesCommand = (args: string[]): string => {
    const subcommand = args[0];

    switch (subcommand) {
      case "list":
        return `🎭 **SERVER ROLES** (${roles.length}):

${roles
  .map(
    (role) =>
      `• **${role.name}** (${role.color})
  ID: ${role.id} | Users: ${role.assignedUsers.length}
  Permissions: ${role.permissions.join(", ")}
  Created: ${role.created.toLocaleDateString()}`,
  )
  .join("\n\n")}`;

      case "create":
        const [name, color, ...permissions] = args.slice(1);
        if (!name || !color)
          return "❌ Usage: /roles create <name> <color> [permissions]";

        const newRole: Role = {
          id: `role-${Date.now()}`,
          name,
          color,
          permissions: permissions.length ? permissions : ["VIEW_CHANNELS"],
          created: new Date(),
          assignedUsers: [],
        };

        setRoles((prev) => [...prev, newRole]);
        return `✅ Role **${name}** created successfully!`;

      case "delete":
        const roleName = args[1];
        if (!roleName) return "❌ Usage: /roles delete <role_name>";

        const roleToDelete = roles.find(
          (r) => r.name.toLowerCase() === roleName.toLowerCase(),
        );
        if (!roleToDelete) return `❌ Role not found: ${roleName}`;

        if (roleToDelete.name === "Administrator") {
          return "❌ Cannot delete Administrator role!";
        }

        setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
        return `✅ Role **${roleName}** deleted successfully!`;

      case "assign":
        const [username, roleNameToAssign] = args.slice(1);
        if (!username || !roleNameToAssign)
          return "❌ Usage: /roles assign <username> <role_name>";

        const role = roles.find(
          (r) => r.name.toLowerCase() === roleNameToAssign.toLowerCase(),
        );
        if (!role) return `❌ Role not found: ${roleNameToAssign}`;

        if (role.assignedUsers.includes(username)) {
          return `❌ User ${username} already has role ${role.name}`;
        }

        setRoles((prev) =>
          prev.map((r) =>
            r.id === role.id
              ? { ...r, assignedUsers: [...r.assignedUsers, username] }
              : r,
          ),
        );

        return `✅ Assigned role **${role.name}** to user **${username}**`;

      default:
        return "❌ Usage: /roles <list|create|delete|assign|remove|permissions> [args]";
    }
  };

  const handleBanCommand = (args: string[]): string => {
    const username = args[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    if (!username) return "❌ Usage: /ban <username> [reason]";
    if (username.toLowerCase() === "blankbank")
      return "❌ Cannot ban administrator!";

    setBannedUsers((prev) => [...prev, username]);
    return `🔨 **USER BANNED**

**Username:** ${username}
**Reason:** ${reason}
**Banned by:** BlankBank
**Timestamp:** ${new Date().toISOString()}

User has been permanently banned from the platform.`;
  };

  const handleMuteCommand = (args: string[]): string => {
    const [username, duration, ...reasonParts] = args;
    const reason = reasonParts.join(" ") || "No reason provided";

    if (!username || !duration)
      return "❌ Usage: /mute <username> <duration> [reason]";
    if (username.toLowerCase() === "blankbank")
      return "❌ Cannot mute administrator!";

    const durationMs = parseDuration(duration);
    if (durationMs === 0)
      return "❌ Invalid duration format. Use: 1h, 30m, 1d, etc.";

    const mutedUntil = new Date(Date.now() + durationMs);
    setMutedUsers((prev) => [
      ...prev.filter((u) => u.username !== username),
      { username, mutedUntil, reason },
    ]);

    return `🔇 **USER MUTED**

**Username:** ${username}
**Duration:** ${duration}
**Muted until:** ${mutedUntil.toLocaleString()}
**Reason:** ${reason}

User has been temporarily muted.`;
  };

  const handleDatabaseCommand = (args: string[]): string => {
    const subcommand = args[0];

    switch (subcommand) {
      case "list":
        return `💾 **DATABASE TABLES:**

• **users** - User accounts and profiles
• **servers** - Server information and settings  
• **channels** - Channel data and permissions
• **messages** - Message history and metadata
• **roles** - Role definitions and assignments
• **sessions** - Active user sessions
• **audit_logs** - System audit trail
• **backups** - Database backup metadata

Use /db read <table> to view table contents.`;

      case "read":
        const table = args[1];
        const page = parseInt(args[2]) || 0;

        if (!table) return "❌ Usage: /db read <table> [page]";

        return `📖 **DATABASE READ** - Table: ${table} (Page ${page + 1})

**Sample Data:**
Row 1: { id: 1, data: "sample_data_1" }
Row 2: { id: 2, data: "sample_data_2" }
Row 3: { id: 3, data: "sample_data_3" }

**Table Stats:**
• Total Rows: 1,247
• Size: 42.8 MB
• Last Modified: ${new Date().toISOString()}
• Indexes: 3 active

Use /db read ${table} ${page + 1} for next page.`;

      case "backup":
        const backupName = args[1] || `backup_${Date.now()}`;
        return `💾 **DATABASE BACKUP CREATED**

**Backup Name:** ${backupName}
**Status:** ✅ Success
**Size:** 156.7 MB
**Duration:** 3.2 seconds
**Location:** /backups/${backupName}.sql
**Timestamp:** ${new Date().toISOString()}

Backup includes all tables and data.`;

      default:
        return "❌ Usage: /db <list|read|write|backup|restore|query> [args]";
    }
  };

  const generateStatsResponse = (detailed: boolean): string => {
    const users = getAllUsers();
    const onlineUsers = users.filter((u) => u.status === "online");

    const basicStats = `📊 **SYSTEM STATISTICS**

**Users:**
• Total Users: ${users.length}
• Online Users: ${onlineUsers.length}
• Admin Users: ${users.filter((u) => u.isAdmin).length}
• Banned Users: ${bannedUsers.length}
• Muted Users: ${mutedUsers.length}

**System:**
• Uptime: 15d 8h 42m
• CPU Usage: 12%
• Memory Usage: 34%
• Network: 99.9% uptime
• Database Size: 2.4 GB

**Security:**
• Encryption: ✅ Active
• Backups: ✅ Daily
• Monitoring: ✅ Active
• Vulnerabilities: 0 detected`;

    if (detailed) {
      return (
        basicStats +
        `

**Detailed Metrics:**
• Messages sent today: 1,337
• Servers created: 8
• Channels active: 24
• Login attempts: 42
• Failed logins: 0
• API calls: 15,234
• Cache hit rate: 94.2%
• Error rate: 0.01%

**Performance:**
• Avg response time: 45ms
• DB query time: 12ms
• File storage: 89% available
• Bandwidth usage: 2.3 GB/day`
      );
    }

    return basicStats;
  };

  const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const handleNotificationCommand = (cmd: string, args: string[]): string => {
    const username = args[0];
    const message = args.slice(1).join(" ");

    if (!username || !message) {
      return `❌ Usage: ${cmd} <username> <message>`;
    }

    const type = cmd === "/warn" ? "Warning" : "Notification";
    return `📢 **${type.toUpperCase()} SENT**

**To:** ${username}
**Message:** ${message}
**From:** BlankBank (Admin)
**Timestamp:** ${new Date().toISOString()}

${type} has been delivered to the user.`;
  };

  const handleSecurityCommand = (args: string[]): string => {
    const operation = args[0];

    switch (operation) {
      case "scan":
        return `🔍 **SECURITY SCAN COMPLETE**

**Scan Results:**
✅ No vulnerabilities detected
✅ All encryption keys valid  
✅ User permissions verified
✅ Database integrity: 100%
✅ Network security: Active
✅ Access logs: Clean
✅ Backup systems: Operational

**Scan Duration:** 2.3 seconds
**Last Scan:** ${new Date().toISOString()}`;

      case "audit":
        return `📋 **SECURITY AUDIT REPORT**

**Recent Activity:**
• 42 successful logins (24h)
• 0 failed login attempts
• 15 admin commands executed
• 0 unauthorized access attempts
• 3 database backups completed

**Compliance:**
✅ Password policies enforced
✅ Session management secure
✅ Data encryption active
✅ Audit logging enabled

**Recommendations:** All security measures optimal.`;

      default:
        return "❌ Usage: /security <scan|audit|report>";
    }
  };

  const handlePurgeCommand = (args: string[]): string => {
    const count = parseInt(args[0]) || 10;
    const channel = args[1] || "current channel";

    return `🗑️ **MESSAGES PURGED**

**Channel:** ${channel}
**Messages Deleted:** ${count}
**Executed by:** BlankBank
**Timestamp:** ${new Date().toISOString()}

Operation completed successfully.`;
  };

  const handleServersCommand = (args: string[]): string => {
    const subcommand = args[0];

    switch (subcommand) {
      case "list":
        return `🏰 **ALL SERVERS** (8 total):

• **SwiperEmpire** (Main) - 42 members
• **Dev Testing** - 5 members  
• **Community Hub** - 128 members
• **Gaming Zone** - 89 members
• **Study Group** - 23 members
• **Music Lounge** - 67 members
• **Art Gallery** - 34 members
• **Tech Talk** - 91 members

Use /servers info <name> for detailed information.`;

      default:
        return "❌ Usage: /servers <list|delete|backup|info> [args]";
    }
  };

  const handleUnbanCommand = (args: string[]): string => {
    const username = args[0];
    if (!username) return "❌ Usage: /unban <username>";

    if (!bannedUsers.includes(username)) {
      return `❌ User ${username} is not banned.`;
    }

    setBannedUsers((prev) => prev.filter((u) => u !== username));
    return `✅ User **${username}** has been unbanned.`;
  };

  const handleUnmuteCommand = (args: string[]): string => {
    const username = args[0];
    if (!username) return "❌ Usage: /unmute <username>";

    const mutedUser = mutedUsers.find((u) => u.username === username);
    if (!mutedUser) {
      return `❌ User ${username} is not muted.`;
    }

    setMutedUsers((prev) => prev.filter((u) => u.username !== username));
    return `✅ User **${username}** has been unmuted.`;
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

  const quickCommands = [
    "/help",
    "/users list",
    "/stats",
    "/roles list",
    "/db list",
    "/security scan",
  ];

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
              Enhanced Admin Bot
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                v2.0
              </Badge>
            </h3>
            <p className="text-sm text-gray-300">
              Full system control • Database access • User management
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-4 gap-2">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-white">
                {getAllUsers().length}
              </div>
              <div className="text-xs text-green-300">Total Users</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-white">{roles.length}</div>
              <div className="text-xs text-blue-300">Roles</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-white">
                {bannedUsers.length}
              </div>
              <div className="text-xs text-red-300">Banned</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-white">
                {mutedUsers.length}
              </div>
              <div className="text-xs text-orange-300">Muted</div>
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
                      : message.type === "error"
                        ? "bg-red-600 text-white"
                        : message.type === "help"
                          ? "bg-blue-600 text-white"
                          : "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  }
                >
                  {message.type === "command" ? (
                    ">"
                  ) : message.type === "error" ? (
                    "!"
                  ) : message.type === "help" ? (
                    <HelpCircle className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-white">
                    {message.type === "command"
                      ? "BlankBank"
                      : "Enhanced Admin Bot"}
                  </span>
                  <Badge
                    variant={
                      message.type === "error"
                        ? "destructive"
                        : message.type === "system"
                          ? "secondary"
                          : message.type === "command"
                            ? "outline"
                            : message.type === "help"
                              ? "default"
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
                          : message.type === "help"
                            ? "text-blue-300"
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
            {quickCommands.map((cmd) => (
              <Button
                key={cmd}
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setCurrentCommand(cmd)}
              >
                {cmd}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Input
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            placeholder="Enter admin command... (type /help for assistance)"
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

export default EnhancedAdminBot;
