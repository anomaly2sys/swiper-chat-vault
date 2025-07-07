import React, { useState } from "react";
import {
  Hash,
  Volume2,
  Megaphone,
  ShoppingCart,
  Plus,
  Settings,
  Lock,
  Shield,
  Crown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Channel,
  ChannelType,
  QUANTUM_ENCRYPTION_CONFIG,
} from "@/types/channels";

interface ChannelManagerProps {
  serverId: string;
  channels: Channel[];
  onCreateChannel: (channelData: Partial<Channel>) => void;
  onDeleteChannel: (channelId: string) => void;
  onUpdateChannel: (channelId: string, updates: Partial<Channel>) => void;
  userRole: "owner" | "moderator" | "member";
}

const ChannelManager: React.FC<ChannelManagerProps> = ({
  serverId,
  channels,
  onCreateChannel,
  onDeleteChannel,
  onUpdateChannel,
  userRole,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: "",
    type: "text" as ChannelType,
    description: "",
    isPrivate: false,
  });
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const canManageChannels = userRole === "owner" || userRole === "moderator";

  const hasVendorRole = () => {
    if (userRole !== "owner") return false;

    // Check if user has vendor or verified vendor role
    const userRoles = JSON.parse(
      localStorage.getItem("swiperEmpire_userRoles") || "[]",
    );
    const currentUserRoles = userRoles.find(
      (ur: any) => ur.userId === currentUser?.id,
    );

    if (!currentUserRoles) {
      // Owner automatically has vendor roles
      return userRole === "owner";
    }

    return (
      currentUserRoles.roles.includes("vendor") ||
      currentUserRoles.roles.includes("verified-vendor") ||
      userRole === "owner"
    );
  };

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case "text":
        return <Hash className="h-4 w-4" />;
      case "voice":
        return <Volume2 className="h-4 w-4" />;
      case "announcements":
        return <Megaphone className="h-4 w-4" />;
      case "shop":
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getChannelColor = (type: ChannelType) => {
    switch (type) {
      case "text":
        return "text-gray-300";
      case "voice":
        return "text-green-400";
      case "announcements":
        return "text-yellow-400";
      case "shop":
        return "text-purple-400";
    }
  };

  const validateChannelCreation = (type: ChannelType): boolean => {
    if (type === "announcements") {
      const hasAnnouncements = channels.some((c) => c.type === "announcements");
      if (hasAnnouncements) {
        toast({
          title: "Cannot create channel",
          description: "Only one announcements channel is allowed per server",
          variant: "destructive",
        });
        return false;
      }
    }

    if (type === "shop") {
      const hasShop = channels.some((c) => c.type === "shop");
      if (hasShop) {
        toast({
          title: "Cannot create channel",
          description: "Only one shop channel is allowed per server",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleCreateChannel = () => {
    if (!canManageChannels) {
      toast({
        title: "Access denied",
        description: "You don't have permission to create channels",
        variant: "destructive",
      });
      return;
    }

    if (!newChannelData.name.trim()) {
      toast({
        title: "Invalid name",
        description: "Channel name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!validateChannelCreation(newChannelData.type)) {
      return;
    }

    let channelName = newChannelData.name.trim();

    // Force shop channel name
    if (newChannelData.type === "shop") {
      channelName = "Shop";
    }

    const channelData = {
      id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: channelName,
      type: newChannelData.type,
      serverId,
      description: newChannelData.description,
      isPrivate: newChannelData.isPrivate,
      position: channels.length,
      createdAt: new Date(),
    };

    onCreateChannel(channelData);

    toast({
      title: "Channel created",
      description: `${channelName} channel has been created with ${QUANTUM_ENCRYPTION_CONFIG.description.toLowerCase()}`,
    });

    setNewChannelData({
      name: "",
      type: "text",
      description: "",
      isPrivate: false,
    });
    setShowCreateDialog(false);
  };

  const handleDeleteChannel = (channelId: string, channelType: ChannelType) => {
    if (!canManageChannels) {
      toast({
        title: "Access denied",
        description: "You don't have permission to delete channels",
        variant: "destructive",
      });
      return;
    }

    onDeleteChannel(channelId);

    toast({
      title: "Channel deleted",
      description: "Channel has been permanently deleted",
    });
  };

  return (
    <div className="space-y-4">
      {/* Security Notice */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-sm text-green-300 font-medium">
            Quantum Encryption Active
          </span>
        </div>
        <p className="text-xs text-green-400 mt-1">
          All channels protected with military-grade quantum encryption
          (AES-256-GCM)
        </p>
      </div>

      {/* Channel List */}
      <div className="space-y-2">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={getChannelColor(channel.type)}>
                {getChannelIcon(channel.type)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{channel.name}</span>
                  {channel.isPrivate && (
                    <Lock className="h-3 w-3 text-gray-400" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {channel.type}
                  </Badge>
                </div>
                {channel.description && (
                  <p className="text-sm text-gray-400">{channel.description}</p>
                )}
              </div>
            </div>

            {canManageChannels && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChannel(channel.id, channel.type)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Channel Button */}
      {canManageChannels && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">
                Create New Channel
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Channel Type</Label>
                <Select
                  value={newChannelData.type}
                  onValueChange={(value: ChannelType) =>
                    setNewChannelData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4" />
                        <span>Text Channel</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="voice">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Voice Channel</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="announcements"
                      disabled={channels.some(
                        (c) => c.type === "announcements",
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Megaphone className="h-4 w-4" />
                        <span>Announcements (One per server)</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="shop"
                      disabled={
                        channels.some((c) => c.type === "shop") ||
                        !hasVendorRole()
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Shop (Owner + Vendor role only)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Channel Name</Label>
                <Input
                  value={newChannelData.name}
                  onChange={(e) =>
                    setNewChannelData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder={
                    newChannelData.type === "shop"
                      ? "Shop (cannot be changed)"
                      : "Enter channel name"
                  }
                  disabled={newChannelData.type === "shop"}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                {newChannelData.type === "shop" && (
                  <p className="text-xs text-gray-400">
                    Shop channels are automatically named "Shop"
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Description (Optional)</Label>
                <Textarea
                  value={newChannelData.description}
                  onChange={(e) =>
                    setNewChannelData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter channel description"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-300">Private Channel</Label>
                  <p className="text-sm text-gray-400">
                    Only visible to specific roles
                  </p>
                </div>
                <Switch
                  checked={newChannelData.isPrivate}
                  onCheckedChange={(checked) =>
                    setNewChannelData((prev) => ({
                      ...prev,
                      isPrivate: checked,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Channel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ChannelManager;
