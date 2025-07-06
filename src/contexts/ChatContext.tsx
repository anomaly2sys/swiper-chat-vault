import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export interface Server {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  icon?: string;
  inviteCode: string;
  categories: Category[];
  roles: Role[];
  members: ServerMember[];
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  serverId: string;
  channels: Channel[];
  position: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice" | "announcement";
  categoryId: string;
  serverId: string;
  topic?: string;
  position: number;
  permissions: ChannelPermission[];
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  serverId: string;
  position: number;
}

export interface ServerMember {
  userId: string;
  serverId: string;
  nickname?: string;
  roles: string[];
  joinedAt: Date;
  isMuted: boolean;
  isBanned: boolean;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId?: string;
  timestamp: Date;
  editedAt?: Date;
  isDisappearing: boolean;
  disappearAt?: Date;
  requiresMutualConsent: boolean;
  isEncrypted: boolean;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  attachments?: string[];
}

export interface DirectMessage {
  id: string;
  content: string;
  authorId: string;
  recipientId: string;
  timestamp: Date;
  editedAt?: Date;
  isDisappearing: boolean;
  disappearAt?: Date;
  isEncrypted: boolean;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface ChannelPermission {
  roleId: string;
  allow: string[];
  deny: string[];
}

export interface AdminCommand {
  command: string;
  description: string;
  usage: string;
}

export interface ChatContextType {
  servers: Server[];
  currentServer: Server | null;
  currentChannel: Channel | null;
  messages: Message[];
  directMessages: DirectMessage[];
  adminCommands: AdminCommand[];
  setCurrentServer: (server: Server | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  sendMessage: (
    content: string,
    channelId?: string,
    recipientId?: string,
  ) => void;
  deleteMessage: (messageId: string) => void;
  createServer: (name: string, description: string) => Server;
  joinServer: (inviteCode: string) => boolean;
  createChannel: (
    name: string,
    type: "text" | "voice" | "announcement",
    categoryId: string,
  ) => void;
  createCategory: (name: string, serverId: string) => void;
  kickUser: (userId: string, serverId: string) => void;
  banUser: (userId: string, serverId: string) => void;
  muteUser: (userId: string, serverId: string) => void;
  deleteServer: (serverId: string) => void;
  sendWarning: (userId: string, message: string) => void;
  executeAdminCommand: (command: string, args: string[]) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();

  // Auto-join user to SwiperEmpire when they log in
  useEffect(() => {
    if (currentUser && defaultServer) {
      const isAlreadyMember = defaultServer.members.some(
        (m) => m.userId === currentUser.id,
      );
      if (!isAlreadyMember) {
        const newMember: ServerMember = {
          userId: currentUser.id,
          serverId: defaultServer.id,
          roles: [
            defaultServer.roles.find((r) => r.name === "@everyone")?.id || "",
          ],
          joinedAt: new Date(),
          isMuted: false,
          isBanned: false,
        };

        setServers((prev) =>
          prev.map((s) =>
            s.id === defaultServer.id
              ? { ...s, members: [...s.members, newMember] }
              : s,
          ),
        );

        // Send welcome message
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          content: `Welcome to SwiperEmpire, ${currentUser.displayName}! 🏰 You're now part of our community. Feel free to explore and chat with other members!`,
          authorId: "system",
          channelId: "general-channel",
          serverId: defaultServer.id,
          timestamp: new Date(),
          isDisappearing: false,
          requiresMutualConsent: false,
          isEncrypted: true,
          status: "sent",
        };

        setMessages((prev) => [...prev, welcomeMessage]);
      }
    }
  }, [currentUser]);

  // Default SwiperEmpire server that all users join by default
  const defaultServer: Server = {
    id: "swiper-empire",
    name: "SwiperEmpire",
    description: "The main community server - Welcome home!",
    ownerId: "admin-1",
    icon: "🏰",
    inviteCode: "SWIPEREMPIRE",
    categories: [
      {
        id: "general-cat",
        name: "General",
        serverId: "swiper-empire",
        position: 0,
        channels: [
          {
            id: "general-channel",
            name: "general",
            type: "text",
            categoryId: "general-cat",
            serverId: "swiper-empire",
            topic: "General discussion for all members",
            position: 0,
            permissions: [],
          },
          {
            id: "announcements",
            name: "announcements",
            type: "announcement",
            categoryId: "general-cat",
            serverId: "swiper-empire",
            topic: "Important server announcements",
            position: 1,
            permissions: [],
          },
        ],
      },
      {
        id: "admin-cat",
        name: "Admin Zone",
        serverId: "swiper-empire",
        position: 1,
        channels: [
          {
            id: "admin-console",
            name: "admin-console",
            type: "text",
            categoryId: "admin-cat",
            serverId: "swiper-empire",
            topic: "Administrative commands and bot management",
            position: 0,
            permissions: [
              {
                roleId: "admin-role",
                allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                deny: [],
              },
            ],
          },
        ],
      },
    ],
    roles: [
      {
        id: "admin-role",
        name: "Administrator",
        color: "#ff0000",
        permissions: ["ADMINISTRATOR"],
        serverId: "swiper-empire",
        position: 0,
      },
      {
        id: "member-role",
        name: "@everyone",
        color: "#ffffff",
        permissions: ["VIEW_CHANNELS", "SEND_MESSAGES"],
        serverId: "swiper-empire",
        position: 1,
      },
    ],
    members: [],
    createdAt: new Date("2024-01-01"),
  };

  const [servers, setServers] = useState<Server[]>([defaultServer]);
  const [currentServer, setCurrentServer] = useState<Server | null>(
    defaultServer,
  );
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(
    defaultServer.categories[0].channels[0],
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  const adminCommands: AdminCommand[] = [
    {
      command: "/users",
      description: "List all users in database",
      usage: "/users [search]",
    },
    {
      command: "/ban",
      description: "Ban a user from server",
      usage: "/ban <username> [reason]",
    },
    {
      command: "/kick",
      description: "Kick a user from server",
      usage: "/kick <username> [reason]",
    },
    {
      command: "/mute",
      description: "Mute a user",
      usage: "/mute <username> [duration]",
    },
    {
      command: "/warn",
      description: "Send warning to user",
      usage: "/warn <username> <message>",
    },
    {
      command: "/purge",
      description: "Delete messages",
      usage: "/purge <count>",
    },
    {
      command: "/server delete",
      description: "Delete current server",
      usage: "/server delete <confirmation>",
    },
    {
      command: "/db read",
      description: "Read from database",
      usage: "/db read <table>",
    },
    {
      command: "/db write",
      description: "Write to database",
      usage: "/db write <table> <data>",
    },
    {
      command: "/stats",
      description: "Show server statistics",
      usage: "/stats",
    },
  ];

  const sendMessage = (
    content: string,
    channelId?: string,
    recipientId?: string,
  ) => {
    if (!currentUser) return;

    if (recipientId) {
      // Direct message
      const dm: DirectMessage = {
        id: `dm-${Date.now()}`,
        content,
        authorId: currentUser.id,
        recipientId,
        timestamp: new Date(),
        isDisappearing: true,
        disappearAt: new Date(Date.now() + 35000), // 35 seconds
        isEncrypted: true,
        status: "sending",
      };
      setDirectMessages((prev) => [...prev, dm]);

      // Auto-delete after 35 seconds
      setTimeout(() => {
        setDirectMessages((prev) => prev.filter((msg) => msg.id !== dm.id));
      }, 35000);
    } else {
      // Channel message
      const message: Message = {
        id: `msg-${Date.now()}`,
        content,
        authorId: currentUser.id,
        channelId: channelId || currentChannel?.id || "",
        serverId: currentServer?.id,
        timestamp: new Date(),
        isDisappearing: true,
        disappearAt: new Date(Date.now() + 35000), // 35 seconds
        requiresMutualConsent: true,
        isEncrypted: true,
        status: "sending",
      };
      setMessages((prev) => [...prev, message]);

      // Auto-delete after 35 seconds
      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      }, 35000);
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    setDirectMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const createServer = (name: string, description: string): Server => {
    if (!currentUser) throw new Error("Must be logged in to create server");

    const newServer: Server = {
      id: `server-${Date.now()}`,
      name,
      description,
      ownerId: currentUser.id,
      inviteCode: Math.random().toString(36).substring(7).toUpperCase(),
      categories: [
        {
          id: `cat-${Date.now()}`,
          name: "General",
          serverId: `server-${Date.now()}`,
          position: 0,
          channels: [
            {
              id: `ch-${Date.now()}`,
              name: "general",
              type: "text",
              categoryId: `cat-${Date.now()}`,
              serverId: `server-${Date.now()}`,
              position: 0,
              permissions: [],
            },
          ],
        },
      ],
      roles: [
        {
          id: `role-${Date.now()}`,
          name: "@everyone",
          color: "#ffffff",
          permissions: ["VIEW_CHANNELS", "SEND_MESSAGES"],
          serverId: `server-${Date.now()}`,
          position: 0,
        },
      ],
      members: [
        {
          userId: currentUser.id,
          serverId: `server-${Date.now()}`,
          roles: [`role-${Date.now()}`],
          joinedAt: new Date(),
          isMuted: false,
          isBanned: false,
        },
      ],
      createdAt: new Date(),
    };

    setServers((prev) => [...prev, newServer]);
    return newServer;
  };

  const joinServer = (inviteCode: string): boolean => {
    const server = servers.find((s) => s.inviteCode === inviteCode);
    if (server && currentUser) {
      const isMember = server.members.some((m) => m.userId === currentUser.id);
      if (!isMember) {
        const newMember: ServerMember = {
          userId: currentUser.id,
          serverId: server.id,
          roles: [server.roles.find((r) => r.name === "@everyone")?.id || ""],
          joinedAt: new Date(),
          isMuted: false,
          isBanned: false,
        };

        setServers((prev) =>
          prev.map((s) =>
            s.id === server.id
              ? { ...s, members: [...s.members, newMember] }
              : s,
          ),
        );
      }
      return true;
    }
    return false;
  };

  const createChannel = (
    name: string,
    type: "text" | "voice" | "announcement",
    categoryId: string,
  ) => {
    if (!currentServer || !currentUser) return;

    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name,
      type,
      categoryId,
      serverId: currentServer.id,
      position: 0,
      permissions: [],
    };

    setServers((prev) =>
      prev.map((server) =>
        server.id === currentServer.id
          ? {
              ...server,
              categories: server.categories.map((cat) =>
                cat.id === categoryId
                  ? { ...cat, channels: [...cat.channels, newChannel] }
                  : cat,
              ),
            }
          : server,
      ),
    );
  };

  const createCategory = (name: string, serverId: string) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      serverId,
      channels: [],
      position: 0,
    };

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? { ...server, categories: [...server.categories, newCategory] }
          : server,
      ),
    );
  };

  const kickUser = (userId: string, serverId: string) => {
    if (!currentUser?.isAdmin) return;

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? {
              ...server,
              members: server.members.filter((m) => m.userId !== userId),
            }
          : server,
      ),
    );
  };

  const banUser = (userId: string, serverId: string) => {
    if (!currentUser?.isAdmin) return;

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? {
              ...server,
              members: server.members.map((m) =>
                m.userId === userId ? { ...m, isBanned: true } : m,
              ),
            }
          : server,
      ),
    );
  };

  const muteUser = (userId: string, serverId: string) => {
    if (!currentUser?.isAdmin) return;

    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? {
              ...server,
              members: server.members.map((m) =>
                m.userId === userId ? { ...m, isMuted: true } : m,
              ),
            }
          : server,
      ),
    );
  };

  const deleteServer = (serverId: string) => {
    if (!currentUser?.isAdmin) return;

    setServers((prev) => prev.filter((s) => s.id !== serverId));
    if (currentServer?.id === serverId) {
      setCurrentServer(servers.find((s) => s.id !== serverId) || null);
    }
  };

  const sendWarning = (userId: string, message: string) => {
    if (!currentUser?.isAdmin) return;

    // In a real app, this would send a notification to the user
    console.log(`Warning sent to user ${userId}: ${message}`);
  };

  const executeAdminCommand = (command: string, args: string[]): string => {
    if (!currentUser?.isAdmin)
      return "Access denied. Admin privileges required.";

    switch (command) {
      case "/users":
        return `Found ${servers.reduce((acc, s) => acc + s.members.length, 0)} total users across all servers.`;
      case "/stats":
        return `Server Statistics:\n- Total Servers: ${servers.length}\n- Total Channels: ${servers.reduce((acc, s) => acc + s.categories.reduce((catAcc, cat) => catAcc + cat.channels.length, 0), 0)}\n- Total Messages: ${messages.length}`;
      case "/purge":
        const count = parseInt(args[0]) || 10;
        setMessages((prev) => prev.slice(0, -count));
        return `Deleted ${count} messages.`;
      default:
        return `Unknown command: ${command}. Type /help for available commands.`;
    }
  };

  return (
    <ChatContext.Provider
      value={{
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
        createCategory,
        kickUser,
        banUser,
        muteUser,
        deleteServer,
        sendWarning,
        executeAdminCommand,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
