import React, { useState } from "react";
import {
  Edit,
  Trash2,
  Settings,
  Lock,
  Unlock,
  Hash,
  Volume2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ChannelContextMenuProps {
  children: React.ReactNode;
  channel: any;
  userRole?: "owner" | "moderator" | "member";
  onUpdateChannel?: (channelId: string, updates: any) => void;
  onDeleteChannel?: (channelId: string) => void;
}

const ChannelContextMenu: React.FC<ChannelContextMenuProps> = ({
  children,
  channel,
  userRole = "member",
  onUpdateChannel,
  onDeleteChannel,
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: channel.name,
    description: channel.description || "",
  });
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const canManage = userRole === "owner" || userRole === "moderator";
  const canDelete =
    userRole === "owner" ||
    (userRole === "moderator" &&
      channel.type !== "announcements" &&
      channel.type !== "shop");

  const handleEditChannel = () => {
    if (!canManage) {
      toast({
        title: "Access denied",
        description: "You don't have permission to edit channels",
        variant: "destructive",
      });
      return;
    }
    setShowEditDialog(true);
  };

  const handleDeleteChannel = () => {
    if (!canDelete) {
      toast({
        title: "Access denied",
        description: "You don't have permission to delete this channel",
        variant: "destructive",
      });
      return;
    }

    if (channel.type === "announcements" || channel.type === "shop") {
      toast({
        title: "Cannot delete",
        description: "Special channels cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    if (onDeleteChannel) {
      onDeleteChannel(channel.id);
    }

    // Update localStorage
    const savedServers = localStorage.getItem("swiperEmpire_servers");
    if (savedServers) {
      try {
        const servers = JSON.parse(savedServers);
        const updatedServers = servers.map((server: any) => {
          if (server.id === channel.serverId) {
            return {
              ...server,
              categories: server.categories.map((category: any) => ({
                ...category,
                channels: category.channels.filter(
                  (ch: any) => ch.id !== channel.id,
                ),
              })),
            };
          }
          return server;
        });
        localStorage.setItem(
          "swiperEmpire_servers",
          JSON.stringify(updatedServers),
        );

        toast({
          title: "Channel deleted",
          description: `#${channel.name} has been deleted`,
        });

        // Refresh to update UI
        window.location.reload();
      } catch (error) {
        console.error("Error deleting channel:", error);
      }
    }
  };

  const saveChannelEdits = () => {
    if (!editData.name.trim()) {
      toast({
        title: "Invalid name",
        description: "Channel name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (onUpdateChannel) {
      onUpdateChannel(channel.id, editData);
    }

    // Update localStorage
    const savedServers = localStorage.getItem("swiperEmpire_servers");
    if (savedServers) {
      try {
        const servers = JSON.parse(savedServers);
        const updatedServers = servers.map((server: any) => {
          if (server.id === channel.serverId) {
            return {
              ...server,
              categories: server.categories.map((category: any) => ({
                ...category,
                channels: category.channels.map((ch: any) =>
                  ch.id === channel.id
                    ? {
                        ...ch,
                        name: editData.name,
                        description: editData.description,
                      }
                    : ch,
                ),
              })),
            };
          }
          return server;
        });
        localStorage.setItem(
          "swiperEmpire_servers",
          JSON.stringify(updatedServers),
        );

        toast({
          title: "Channel updated",
          description: `Channel has been updated`,
        });

        setShowEditDialog(false);
        // Refresh to update UI
        window.location.reload();
      } catch (error) {
        console.error("Error updating channel:", error);
      }
    }
  };

  const getChannelIcon = () => {
    switch (channel.type) {
      case "voice":
        return <Volume2 className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  if (!canManage) {
    return <>{children}</>;
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="bg-black/90 border-purple-500/30 backdrop-blur-xl">
          <ContextMenuItem
            onClick={handleEditChannel}
            className="text-gray-300"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Channel
          </ContextMenuItem>

          <ContextMenuItem className="text-gray-300">
            <Settings className="h-4 w-4 mr-2" />
            Channel Settings
          </ContextMenuItem>

          <ContextMenuSeparator />

          {canDelete && (
            <ContextMenuItem
              onClick={handleDeleteChannel}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Channel
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Edit Channel Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-black/90 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              {getChannelIcon()}
              <span className="ml-2">Edit Channel</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Channel Name</Label>
              <Input
                value={editData.name}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description (Optional)</Label>
              <Textarea
                value={editData.description}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={saveChannelEdits}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChannelContextMenu;
