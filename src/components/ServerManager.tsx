import React, { useState } from "react";
import {
  Plus,
  Users,
  Link,
  Copy,
  Check,
  Crown,
  Settings,
  Trash2,
  UserPlus,
  Globe,
  Lock,
  Hash,
  Volume2,
  Edit,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChat, Server } from "@/contexts/ChatContext";

interface ServerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "join" | "manage";
  server?: Server;
}

const ServerManager: React.FC<ServerManagerProps> = ({
  isOpen,
  onClose,
  mode,
  server,
}) => {
  const { currentUser } = useAuth();
  const { createServer, joinServer, createChannel, createCategory } = useChat();
  const [formData, setFormData] = useState({
    name: server?.name || "",
    description: server?.description || "",
    inviteCode: "",
    channelName: "",
    channelType: "text" as "text" | "voice" | "announcement",
    categoryName: "",
  });
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateServer = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Server name required",
        description: "Please enter a name for your server",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newServer = createServer(formData.name, formData.description);
      toast({
        title: "Server created!",
        description: `${newServer.name} has been created successfully`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Failed to create server",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinServer = async () => {
    if (!formData.inviteCode.trim()) {
      toast({
        title: "Invite code required",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = joinServer(formData.inviteCode.toUpperCase());
      if (success) {
        toast({
          title: "Joined server!",
          description: "Successfully joined the server",
        });
        onClose();
      } else {
        toast({
          title: "Invalid invite code",
          description: "The invite code is invalid or expired",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to join server",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = () => {
    if (!formData.channelName.trim() || !server) return;

    const categoryId = server.categories[0]?.id;
    if (categoryId) {
      createChannel(formData.channelName, formData.channelType, categoryId);
      toast({
        title: "Channel created!",
        description: `#${formData.channelName} has been added to the server`,
      });
      setFormData((prev) => ({ ...prev, channelName: "" }));
    }
  };

  const handleCreateCategory = () => {
    if (!formData.categoryName.trim() || !server) return;

    createCategory(formData.categoryName, server.id);
    toast({
      title: "Category created!",
      description: `${formData.categoryName} category has been added`,
    });
    setFormData((prev) => ({ ...prev, categoryName: "" }));
  };

  const copyInviteCode = () => {
    if (server?.inviteCode) {
      navigator.clipboard.writeText(server.inviteCode);
      setCopied(true);
      toast({
        title: "Invite code copied!",
        description: "Share this code with others to invite them",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "create":
        return "Create New Server";
      case "join":
        return "Join Server";
      case "manage":
        return `Manage ${server?.name}`;
      default:
        return "Server Manager";
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case "create":
        return "Create your own community space";
      case "join":
        return "Enter an invite code to join a server";
      case "manage":
        return "Manage server settings and channels";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black/40 border-purple-500/30 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            {mode === "create" && <Plus className="h-5 w-5 mr-2" />}
            {mode === "join" && <UserPlus className="h-5 w-5 mr-2" />}
            {mode === "manage" && <Settings className="h-5 w-5 mr-2" />}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "create" && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Server Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="My Awesome Server"
                  className="bg-gray-800/50 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description (Optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe your server..."
                  className="bg-gray-800/50 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCreateServer}
                disabled={isLoading || !formData.name.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isLoading ? "Creating..." : "Create Server"}
              </Button>
            </>
          )}

          {mode === "join" && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Invite Code</Label>
                <Input
                  value={formData.inviteCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      inviteCode: e.target.value,
                    }))
                  }
                  placeholder="SWIPEREMPIRE"
                  className="bg-gray-800/50 border-gray-600 text-white uppercase"
                  maxLength={12}
                />
                <p className="text-xs text-gray-400">
                  Enter the invite code shared with you
                </p>
              </div>

              <Button
                onClick={handleJoinServer}
                disabled={isLoading || !formData.inviteCode.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isLoading ? "Joining..." : "Join Server"}
              </Button>
            </>
          )}

          {mode === "manage" && server && (
            <>
              {/* Server Info */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Server Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Server Name</p>
                    <p className="text-white font-medium">{server.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-gray-300 text-sm">
                      {server.description || "No description"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Members</p>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-white">
                        {server.members.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invite Code */}
              <Card className="bg-green-500/10 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-300 flex items-center">
                    <Link className="h-4 w-4 mr-2" />
                    Invite Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-800/50 p-2 rounded text-white font-mono">
                      {server.inviteCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInviteCode}
                      className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Share this code to invite new members
                  </p>
                </CardContent>
              </Card>

              {/* Create Channel */}
              {(currentUser?.isAdmin || String(server.ownerId) === String(currentUser?.id)) && (
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-300 flex items-center">
                      <Hash className="h-4 w-4 mr-2" />
                      Create Channel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        value={formData.channelName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            channelName: e.target.value,
                          }))
                        }
                        placeholder="channel-name"
                        className="flex-1 bg-gray-800/50 border-gray-600 text-white"
                      />
                      <Select
                        value={formData.channelType}
                        onValueChange={(
                          value: "text" | "voice" | "announcement",
                        ) =>
                          setFormData((prev) => ({
                            ...prev,
                            channelType: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="text" className="text-white">
                            <div className="flex items-center">
                              <Hash className="h-4 w-4 mr-2" />
                              Text
                            </div>
                          </SelectItem>
                          <SelectItem value="voice" className="text-white">
                            <div className="flex items-center">
                              <Volume2 className="h-4 w-4 mr-2" />
                              Voice
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="announcement"
                            className="text-white"
                          >
                            <div className="flex items-center">
                              <Crown className="h-4 w-4 mr-2" />
                              Announcement
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCreateChannel}
                      disabled={!formData.channelName.trim()}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Create Channel
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Create Category */}
              {(currentUser?.isAdmin || String(server.ownerId) === String(currentUser?.id)) && (
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-purple-300">
                      Create Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={formData.categoryName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoryName: e.target.value,
                        }))
                      }
                      placeholder="Category Name"
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                    <Button
                      onClick={handleCreateCategory}
                      disabled={!formData.categoryName.trim()}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Create Category
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Danger Zone */}
              {currentUser?.isAdmin && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-300 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Server
                    </Button>
                    <p className="text-xs text-red-300 mt-2">
                      This action cannot be undone!
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServerManager;
