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
  canAccessChannel: (channel: Channel, user: any) => boolean;
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
        (m) => String(m.userId) === String(currentUser.id),
      );
      if (!isAlreadyMember) {
        // Use actual user join date for admin, or current date for new users
        const joinDate =
          currentUser.isAdmin && currentUser.username === "blankbank"
            ? currentUser.joinedAt
            : new Date();

        // Auto-assign all roles to admin users (blankbank)
        const memberRoles =
          currentUser.isAdmin && currentUser.username === "blankbank"
            ? [
                "owner",
                "empire-elite",
                "verified-vendor",
                "vendor",
                "moderator",
                "member",
              ]
            : [
                defaultServer.roles.find((r) => r.name === "@everyone")?.id ||
                  "",
              ];

        const newMember: ServerMember = {
          userId: String(currentUser.id),
          serverId: defaultServer.id,
          roles: memberRoles,
          joinedAt: joinDate,
          isMuted: false,
          isBanned: false,
        };

        // Also save user roles to localStorage
        if (currentUser.isAdmin && currentUser.username === "blankbank") {
          const userRoles = JSON.parse(
            localStorage.getItem("swiperEmpire_userRoles") || "[]",
          );
          const existingUserRole = userRoles.find(
            (ur: any) => ur.userId === currentUser.id,
          );

          if (!existingUserRole) {
            const adminUserRole = {
              userId: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName,
              roles: [
                "owner",
                "empire-elite",
                "verified-vendor",
                "vendor",
                "moderator",
                "member",
              ],
            };
            userRoles.push(adminUserRole);
            localStorage.setItem(
              "swiperEmpire_userRoles",
              JSON.stringify(userRoles),
            );
          }
        }

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

  const [servers, setServers] = useState<Server[]>(() => {
    const savedServers = localStorage.getItem("swiperEmpire_servers");
    if (savedServers) {
      try {
        return JSON.parse(savedServers).map((server: any) => ({
          ...server,
          createdAt: new Date(server.createdAt),
        }));
      } catch {
        return [defaultServer];
      }
    }
    return [defaultServer];
  });
  const [currentServer, setCurrentServer] = useState<Server | null>(
    defaultServer,
  );
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(
    defaultServer.categories[0].channels[0],
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem("swiperEmpire_messages");
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          disappearAt: msg.disappearAt ? new Date(msg.disappearAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const savedDMs = localStorage.getItem("swiperEmpire_directMessages");
    if (savedDMs) {
      try {
        return JSON.parse(savedDMs).map((dm: any) => ({
          ...dm,
          timestamp: new Date(dm.timestamp),
          disappearAt: dm.disappearAt ? new Date(dm.disappearAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("swiperEmpire_servers", JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem("swiperEmpire_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(
      "swiperEmpire_directMessages",
      JSON.stringify(directMessages),
    );
  }, [directMessages]);

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
        authorId: String(currentUser.id),
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
        authorId: String(currentUser.id),
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
      ownerId: String(currentUser.id),
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
          userId: String(currentUser.id),
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
      const isMember = server.members.some((m) => String(m.userId) === String(currentUser.id));
      if (!isMember) {
        const newMember: ServerMember = {
          userId: String(currentUser.id),
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
      id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      categoryId,
      serverId: currentServer.id,
      position: 0,
      permissions: [],
    };

    // Update servers state
    setServers((prev) => {
      const updatedServers = prev.map((server) =>
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
      );

      // Also update localStorage immediately
      localStorage.setItem(
        "swiperEmpire_servers",
        JSON.stringify(updatedServers),
      );
      return updatedServers;
    });

    // Update current server to reflect changes immediately
    const updatedCurrentServer = {
      ...currentServer,
      categories: currentServer.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, channels: [...cat.channels, newChannel] }
          : cat,
      ),
    };
    setCurrentServer(updatedCurrentServer);
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
    if (String(currentServer?.id) === String(serverId)) {
      setCurrentServer(servers.find((s) => s.id !== serverId) || null);
    }
  };

  const sendWarning = (userId: string, message: string) => {
    if (!currentUser?.isAdmin) return;

    // In a real app, this would send a notification to the user
    console.log(`Warning sent to user ${userId}: ${message}`);
  };

  const canAccessChannel = (channel: Channel, user: any): boolean => {
    // Admin can access all channels
    if (user?.isAdmin) return true;

    // Check if it's an admin-only channel
    if (
      channel.name === "admin-console" ||
      channel.categoryId === "admin-cat"
    ) {
      return false;
    }

    return true;
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
        canAccessChannel,
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
