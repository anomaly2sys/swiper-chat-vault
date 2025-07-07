import React from "react";
import { LogOut, Settings, Users, Crown, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";

interface ServerContextMenuProps {
  children: React.ReactNode;
  server: any;
  userRole?: "owner" | "moderator" | "member";
}

const ServerContextMenu: React.FC<ServerContextMenuProps> = ({
  children,
  server,
  userRole = "member",
}) => {
  const { currentUser } = useAuth();
  const { deleteServer } = useChat();
  const { toast } = useToast();

  const handleLeaveServer = () => {
    // Remove user from server members
    const savedServers = localStorage.getItem("swiperEmpire_servers");
    if (savedServers) {
      try {
        const servers = JSON.parse(savedServers);
        const updatedServers = servers.map((s: any) => {
          if (s.id === server.id) {
            return {
              ...s,
              members: s.members.filter(
                (m: any) => m.userId !== currentUser?.id,
              ),
            };
          }
          return s;
        });
        localStorage.setItem(
          "swiperEmpire_servers",
          JSON.stringify(updatedServers),
        );

        toast({
          title: "Left server",
          description: `You have left ${server.name}`,
        });

        // Refresh the page to update the UI
        window.location.reload();
      } catch (error) {
        console.error("Error leaving server:", error);
      }
    }
  };

  const handleDeleteServer = () => {
    if (userRole === "owner") {
      deleteServer(server.id);
      toast({
        title: "Server deleted",
        description: `${server.name} has been permanently deleted`,
      });
    }
  };

  const isOwner = userRole === "owner";
  const canLeave = server.id !== "server-1"; // Can't leave the main SwiperEmpire server

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="bg-black/90 border-purple-500/30 backdrop-blur-xl">
        {isOwner && (
          <>
            <ContextMenuItem className="text-gray-300">
              <Settings className="h-4 w-4 mr-2" />
              Server Settings
            </ContextMenuItem>

            <ContextMenuItem className="text-gray-300">
              <Users className="h-4 w-4 mr-2" />
              Manage Members
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem
              onClick={handleDeleteServer}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Server
            </ContextMenuItem>
          </>
        )}

        {canLeave && (
          <>
            {isOwner && <ContextMenuSeparator />}
            <ContextMenuItem
              onClick={handleLeaveServer}
              className="text-red-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Server
            </ContextMenuItem>
          </>
        )}

        {!canLeave && (
          <ContextMenuItem disabled className="text-gray-500">
            <Crown className="h-4 w-4 mr-2" />
            Official Server
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ServerContextMenu;
