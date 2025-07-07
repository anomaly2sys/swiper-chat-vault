import { useState, useEffect, useCallback } from "react";
import { Server, ServerMember } from "@/contexts/ChatContext";

const createDefaultServer = (): Server => ({
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
});

export const useServers = () => {
  const [servers, setServers] = useState<Server[]>(() => {
    const savedServers = localStorage.getItem("swiperEmpire_servers");
    if (savedServers) {
      try {
        return JSON.parse(savedServers).map((server: any) => ({
          ...server,
          createdAt: new Date(server.createdAt),
        }));
      } catch {
        return [createDefaultServer()];
      }
    }
    return [createDefaultServer()];
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("swiperEmpire_servers", JSON.stringify(servers));
  }, [servers]);

  const createServer = useCallback((name: string, description: string, ownerId: string): Server => {
    const newServer: Server = {
      id: `server-${Date.now()}`,
      name,
      description,
      ownerId,
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
          id: `owner-${Date.now()}`,
          name: "Owner",
          color: "#ff0000",
          permissions: ["ADMINISTRATOR"],
          serverId: `server-${Date.now()}`,
          position: 0,
        },
      ],
      members: [],
      createdAt: new Date(),
    };

    setServers(prev => [...prev, newServer]);
    return newServer;
  }, []);

  const joinServer = useCallback((inviteCode: string): boolean => {
    const server = servers.find(s => s.inviteCode === inviteCode);
    return !!server;
  }, [servers]);

  const addMemberToServer = useCallback((serverId: string, member: ServerMember) => {
    setServers(prev =>
      prev.map(server =>
        server.id === serverId
          ? { ...server, members: [...server.members, member] }
          : server
      )
    );
  }, []);

  const removeMemberFromServer = useCallback((serverId: string, userId: string) => {
    setServers(prev =>
      prev.map(server =>
        server.id === serverId
          ? { ...server, members: server.members.filter(m => m.userId !== userId) }
          : server
      )
    );
  }, []);

  const updateServerMember = useCallback((serverId: string, userId: string, updates: Partial<ServerMember>) => {
    setServers(prev =>
      prev.map(server =>
        server.id === serverId
          ? {
              ...server,
              members: server.members.map(member =>
                member.userId === userId ? { ...member, ...updates } : member
              )
            }
          : server
      )
    );
  }, []);

  return {
    servers,
    createServer,
    joinServer,
    addMemberToServer,
    removeMemberFromServer,
    updateServerMember,
    defaultServer: servers.find(s => s.id === "swiper-empire") || createDefaultServer(),
  };
};