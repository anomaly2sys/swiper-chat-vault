import React, { useState } from "react";
import {
  Ban,
  UserX,
  Volume2,
  VolumeX,
  AlertTriangle,
  MessageSquare,
  User,
  Shield,
  Flag,
  Crown,
  Eye,
  Mail,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileViewer from "./UserProfileViewer";
import { ReportDialog } from "./ReportSystem";

interface EnhancedUserContextMenuProps {
  children: React.ReactNode;
  username: string;
  userId: string;
  userRole?: "owner" | "moderator" | "member";
  currentUserRole?: "owner" | "moderator" | "member";
  serverId?: string;
  onBanUser?: (userId: string, reason: string) => void;
  onKickUser?: (userId: string, reason: string) => void;
  onMuteUser?: (userId: string, duration: number) => void;
  onUnmuteUser?: (userId: string) => void;
  onWarnUser?: (userId: string, reason: string) => void;
  onStartDM?: (userId: string) => void;
}

const EnhancedUserContextMenu: React.FC<EnhancedUserContextMenuProps> = ({
  children,
  username,
  userId,
  userRole = "member",
  currentUserRole = "member",
  serverId,
  onBanUser,
  onKickUser,
  onMuteUser,
  onUnmuteUser,
  onWarnUser,
  onStartDM,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Check if current user can perform moderation actions
  const canModerate =
    currentUser?.isAdmin ||
    (serverId &&
      (currentUserRole === "owner" || currentUserRole === "moderator"));

  // Check if current user can perform owner actions
  const canOwnerActions =
    currentUser?.isAdmin || (serverId && currentUserRole === "owner");

  // Check if target user can be moderated (can't moderate owners unless you're admin)
  const canModerateTarget =
    currentUser?.isAdmin ||
    (userRole !== "owner" && userRole !== "moderator") ||
    (currentUserRole === "owner" && userRole === "moderator");

  const handleViewProfile = () => {
    setShowProfile(true);
  };

  const handleStartDM = () => {
    if (onStartDM) {
      onStartDM(userId);
    }
    toast({
      title: "Starting DM",
      description: `Opening encrypted direct message with @${username}`,
    });
  };

  const handleReport = () => {
    setShowReport(true);
  };

  const handleBan = () => {
    if (!canModerate || !canModerateTarget) {
      toast({
        title: "Access denied",
        description: "You don't have permission to ban this user",
        variant: "destructive",
      });
      return;
    }

    if (onBanUser) {
      onBanUser(userId, "Banned by moderator");
    }

    toast({
      title: "User banned",
      description: `@${username} has been banned from the server`,
    });
  };

  const handleKick = () => {
    if (!canModerate || !canModerateTarget) {
      toast({
        title: "Access denied",
        description: "You don't have permission to kick this user",
        variant: "destructive",
      });
      return;
    }

    if (onKickUser) {
      onKickUser(userId, "Kicked by moderator");
    }

    toast({
      title: "User kicked",
      description: `@${username} has been kicked from the server`,
    });
  };

  const handleMute = () => {
    if (!canModerate || !canModerateTarget) {
      toast({
        title: "Access denied",
        description: "You don't have permission to mute this user",
        variant: "destructive",
      });
      return;
    }

    if (onMuteUser) {
      onMuteUser(userId, 3600000); // 1 hour
    }

    toast({
      title: "User muted",
      description: `@${username} has been muted for 1 hour`,
    });
  };

  const handleWarn = () => {
    if (!canModerate || !canModerateTarget) {
      toast({
        title: "Access denied",
        description: "You don't have permission to warn this user",
        variant: "destructive",
      });
      return;
    }

    if (onWarnUser) {
      onWarnUser(userId, "Warning issued by moderator");
    }

    toast({
      title: "Warning issued",
      description: `Warning sent to @${username}`,
    });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="bg-black/90 border-purple-500/30 backdrop-blur-xl">
          {/* Profile Actions - Available to everyone */}
          <ContextMenuItem onClick={handleViewProfile}>
            <Eye className="h-4 w-4 mr-2" />
            View Profile
          </ContextMenuItem>

          <ContextMenuItem onClick={handleStartDM}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send DM
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Report - Available to everyone except admins */}
          {!currentUser?.isAdmin && (
            <>
              <ContextMenuItem onClick={handleReport} className="text-red-400">
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          {/* Moderation Actions - Only for moderators/owners/admins */}
          {canModerate && canModerateTarget && (
            <>
              <ContextMenuItem onClick={handleWarn} className="text-yellow-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warn User
              </ContextMenuItem>

              <ContextMenuItem onClick={handleMute} className="text-orange-400">
                <VolumeX className="h-4 w-4 mr-2" />
                Mute (1 hour)
              </ContextMenuItem>

              <ContextMenuItem onClick={handleKick} className="text-red-400">
                <UserX className="h-4 w-4 mr-2" />
                Kick from Server
              </ContextMenuItem>

              <ContextMenuItem onClick={handleBan} className="text-red-600">
                <Ban className="h-4 w-4 mr-2" />
                Ban from Server
              </ContextMenuItem>
            </>
          )}

          {/* Admin Actions */}
          {currentUser?.isAdmin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-purple-400">
                <Crown className="h-4 w-4 mr-2" />
                Admin Actions
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Profile Viewer */}
      <UserProfileViewer
        username={username}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        reportedUsername={username}
        reportedUserId={userId}
      />
    </>
  );
};

export default EnhancedUserContextMenu;
