import React, { useState } from "react";
import { Link, Copy, Share, Users, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ServerInviteManagerProps {
  serverId: string;
  serverName: string;
  userRole: "owner" | "moderator" | "member";
}

interface InviteLink {
  id: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
  isActive: boolean;
}

const ServerInviteManager: React.FC<ServerInviteManagerProps> = ({
  serverId,
  serverName,
  userRole,
}) => {
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>(() => {
    const saved = localStorage.getItem(`swiperEmpire_invites_${serverId}`);
    if (saved) {
      try {
        return JSON.parse(saved).map((invite: any) => ({
          ...invite,
          createdAt: new Date(invite.createdAt),
          expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : undefined,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInvite, setNewInvite] = useState({
    maxUses: 0, // 0 = unlimited
    expireHours: 0, // 0 = never
  });

  const { toast } = useToast();
  const canManageInvites = userRole === "owner" || userRole === "moderator";

  const generateInviteCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const createInvite = () => {
    const inviteCode = generateInviteCode();
    const expiresAt =
      newInvite.expireHours > 0
        ? new Date(Date.now() + newInvite.expireHours * 60 * 60 * 1000)
        : undefined;

    const invite: InviteLink = {
      id: `invite-${Date.now()}`,
      code: inviteCode,
      createdBy: "Current User",
      createdAt: new Date(),
      expiresAt,
      maxUses: newInvite.maxUses || undefined,
      uses: 0,
      isActive: true,
    };

    const updatedInvites = [...inviteLinks, invite];
    setInviteLinks(updatedInvites);
    localStorage.setItem(
      `swiperEmpire_invites_${serverId}`,
      JSON.stringify(updatedInvites),
    );

    // Also update the server with the invite code
    const savedServers = localStorage.getItem("swiperEmpire_servers");
    if (savedServers) {
      try {
        const servers = JSON.parse(savedServers);
        const updatedServers = servers.map((server: any) =>
          server.id === serverId
            ? { ...server, inviteCode: inviteCode }
            : server,
        );
        localStorage.setItem(
          "swiperEmpire_servers",
          JSON.stringify(updatedServers),
        );
      } catch (error) {
        console.error("Error updating server invite code:", error);
      }
    }

    toast({
      title: "Invite created",
      description: `New invite link created for ${serverName}`,
    });

    setNewInvite({ maxUses: 0, expireHours: 0 });
    setShowCreateDialog(false);
  };

  const copyInviteLink = (code: string) => {
    const fullLink = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(fullLink);

    toast({
      title: "Invite copied",
      description: "Invite link copied to clipboard",
    });
  };

  const revokeInvite = (inviteId: string) => {
    const updatedInvites = inviteLinks.map((invite) =>
      invite.id === inviteId ? { ...invite, isActive: false } : invite,
    );
    setInviteLinks(updatedInvites);
    localStorage.setItem(
      `swiperEmpire_invites_${serverId}`,
      JSON.stringify(updatedInvites),
    );

    toast({
      title: "Invite revoked",
      description: "Invite link has been deactivated",
    });
  };

  const isExpired = (invite: InviteLink) => {
    return invite.expiresAt && invite.expiresAt < new Date();
  };

  const isMaxUsesReached = (invite: InviteLink) => {
    return invite.maxUses && invite.uses >= invite.maxUses;
  };

  return (
    <Card className="bg-black/40 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Server Invites
          </CardTitle>
          {canManageInvites && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Share className="h-4 w-4 mr-2" />
                  Create Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create Invite Link
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Max Uses (0 = unlimited)
                    </Label>
                    <Input
                      type="number"
                      value={newInvite.maxUses}
                      onChange={(e) =>
                        setNewInvite((prev) => ({
                          ...prev,
                          maxUses: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Expire After (hours, 0 = never)
                    </Label>
                    <Select
                      value={newInvite.expireHours.toString()}
                      onValueChange={(value) =>
                        setNewInvite((prev) => ({
                          ...prev,
                          expireHours: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Never</SelectItem>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">1 day</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                        <SelectItem value="720">1 month</SelectItem>
                      </SelectContent>
                    </Select>
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
                      onClick={createInvite}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Invite
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {inviteLinks.length > 0 ? (
            inviteLinks.map((invite) => {
              const expired = isExpired(invite);
              const maxReached = isMaxUsesReached(invite);
              const isInactive = !invite.isActive || expired || maxReached;

              return (
                <div
                  key={invite.id}
                  className={`p-3 rounded border ${
                    isInactive
                      ? "bg-gray-800/20 border-gray-700"
                      : "bg-gray-800/30 border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <code className="text-purple-300 font-mono">
                        {window.location.origin}/invite/{invite.code}
                      </code>
                      {isInactive && (
                        <Badge className="bg-red-500/20 text-red-300">
                          {expired
                            ? "Expired"
                            : maxReached
                              ? "Max Uses"
                              : "Inactive"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {!isInactive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invite.code)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}

                      {canManageInvites && invite.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvite(invite.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {invite.uses}/{invite.maxUses || "∞"} uses
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {invite.expiresAt
                        ? `Expires ${invite.expiresAt.toLocaleDateString()}`
                        : "Never expires"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Link className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p>No invite links created yet</p>
              {canManageInvites && (
                <p className="text-sm">
                  Create an invite to let others join this server
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerInviteManager;
