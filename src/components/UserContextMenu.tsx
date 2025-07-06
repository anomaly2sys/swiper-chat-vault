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
  Clock,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileViewer from "./UserProfileViewer";

interface UserContextMenuProps {
  username: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}

interface ModerationAction {
  type: "mute" | "ban" | "kick" | "warn";
  duration?: string;
  reason: string;
}

const UserContextMenu: React.FC<UserContextMenuProps> = ({
  username,
  isAdmin = false,
  children,
}) => {
  const { currentUser } = useAuth();
  const [moderationDialog, setModerationDialog] = useState<{
    isOpen: boolean;
    action: ModerationAction["type"] | null;
  }>({ isOpen: false, action: null });
  const [formData, setFormData] = useState({
    reason: "",
    duration: "1h",
    customDuration: "",
    message: "",
  });
  const [showProfile, setShowProfile] = useState(false);
  const { toast } = useToast();

  const canModerate =
    currentUser?.isAdmin && username.toLowerCase() !== "blankbank";

  const muteDurations = [
    { label: "1 minute", value: "1m" },
    { label: "5 minutes", value: "5m" },
    { label: "10 minutes", value: "10m" },
    { label: "30 minutes", value: "30m" },
    { label: "1 hour", value: "1h" },
    { label: "6 hours", value: "6h" },
    { label: "12 hours", value: "12h" },
    { label: "1 day", value: "1d" },
    { label: "1 week", value: "7d" },
    { label: "Until I unmute", value: "permanent" },
    { label: "Custom", value: "custom" },
  ];

  const handleModerationAction = (action: ModerationAction["type"]) => {
    setModerationDialog({ isOpen: true, action });
    setFormData({
      reason: "",
      duration: "1h",
      customDuration: "",
      message: "",
    });
  };

  const executeModerationAction = () => {
    const action = moderationDialog.action;
    if (!action) return;

    const duration =
      formData.duration === "custom"
        ? formData.customDuration
        : formData.duration;
    const reason = formData.reason || "No reason provided";

    let message = "";
    switch (action) {
      case "mute":
        message = `🔇 User ${username} has been muted for ${duration}. Reason: ${reason}`;
        break;
      case "ban":
        message = `🔨 User ${username} has been banned permanently. Reason: ${reason}`;
        break;
      case "kick":
        message = `👢 User ${username} has been kicked from the server. Reason: ${reason}`;
        break;
      case "warn":
        message = `⚠️ Warning sent to ${username}. Message: ${formData.message}`;
        break;
    }

    toast({
      title: "Moderation Action Executed",
      description: message,
    });

    setModerationDialog({ isOpen: false, action: null });
  };

  const handleDirectMessage = () => {
    toast({
      title: "Direct Message",
      description: `Opening DM with ${username}`,
    });
  };

  const handleViewProfile = () => {
    setShowProfile(true);
  };

  const getDialogTitle = () => {
    switch (moderationDialog.action) {
      case "mute":
        return `Mute ${username}`;
      case "ban":
        return `Ban ${username}`;
      case "kick":
        return `Kick ${username}`;
      case "warn":
        return `Warn ${username}`;
      default:
        return "Moderation Action";
    }
  };

  const getDialogDescription = () => {
    switch (moderationDialog.action) {
      case "mute":
        return "Temporarily restrict this user from sending messages";
      case "ban":
        return "Permanently remove this user from the platform";
      case "kick":
        return "Remove this user from the current server";
      case "warn":
        return "Send a warning message to this user";
      default:
        return "";
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56 bg-gray-800 border-gray-600">
          {/* Basic Actions */}
          <ContextMenuItem
            className="text-white hover:bg-gray-700"
            onClick={handleViewProfile}
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </ContextMenuItem>

          <ContextMenuItem
            className="text-white hover:bg-gray-700"
            onClick={handleDirectMessage}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Direct Message
          </ContextMenuItem>

          {/* Admin Actions */}
          {canModerate && (
            <>
              <ContextMenuSeparator className="bg-gray-600" />

              {/* Mute Submenu */}
              <ContextMenuSub>
                <ContextMenuSubTrigger className="text-orange-300 hover:bg-orange-900/20">
                  <VolumeX className="h-4 w-4 mr-2" />
                  Mute User
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48 bg-gray-800 border-gray-600">
                  {muteDurations.map((duration) => (
                    <ContextMenuItem
                      key={duration.value}
                      className="text-white hover:bg-gray-700"
                      onClick={() => {
                        if (duration.value === "custom") {
                          handleModerationAction("mute");
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            duration: duration.value,
                          }));
                          handleModerationAction("mute");
                        }
                      }}
                    >
                      <Clock className="h-3 w-3 mr-2" />
                      {duration.label}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuItem
                className="text-yellow-300 hover:bg-yellow-900/20"
                onClick={() => handleModerationAction("warn")}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Send Warning
              </ContextMenuItem>

              <ContextMenuItem
                className="text-blue-300 hover:bg-blue-900/20"
                onClick={() => handleModerationAction("kick")}
              >
                <UserX className="h-4 w-4 mr-2" />
                Kick from Server
              </ContextMenuItem>

              <ContextMenuSeparator className="bg-gray-600" />

              <ContextMenuItem
                className="text-red-300 hover:bg-red-900/20"
                onClick={() => handleModerationAction("ban")}
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </ContextMenuItem>
            </>
          )}

          {/* Show admin indicator */}
          {isAdmin && (
            <>
              <ContextMenuSeparator className="bg-gray-600" />
              <ContextMenuItem disabled className="text-yellow-400">
                <Shield className="h-4 w-4 mr-2" />
                Administrator
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Moderation Dialog */}
      <Dialog
        open={moderationDialog.isOpen}
        onOpenChange={(open) =>
          setModerationDialog({ isOpen: open, action: null })
        }
      >
        <DialogContent className="max-w-md bg-black/40 border-purple-500/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">{getDialogTitle()}</DialogTitle>
            <DialogDescription className="text-gray-300">
              {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {moderationDialog.action === "mute" && (
              <div className="space-y-2">
                <Label className="text-white">Duration</Label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  {muteDurations.map((duration) => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>

                {formData.duration === "custom" && (
                  <Input
                    value={formData.customDuration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customDuration: e.target.value,
                      }))
                    }
                    placeholder="e.g., 2h, 30m, 1d"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                )}
              </div>
            )}

            {moderationDialog.action === "warn" && (
              <div className="space-y-2">
                <Label className="text-white">Warning Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Enter warning message..."
                  className="bg-gray-800/50 border-gray-600 text-white"
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white">
                Reason {moderationDialog.action === "warn" ? "(Optional)" : ""}
              </Label>
              <Textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Enter reason for this action..."
                className="bg-gray-800/50 border-gray-600 text-white"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() =>
                  setModerationDialog({ isOpen: false, action: null })
                }
              >
                Cancel
              </Button>
              <Button
                onClick={executeModerationAction}
                className={
                  moderationDialog.action === "ban"
                    ? "bg-red-600 hover:bg-red-700"
                    : moderationDialog.action === "mute"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : moderationDialog.action === "kick"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-yellow-600 hover:bg-yellow-700"
                }
              >
                {moderationDialog.action === "mute"
                  ? "Mute User"
                  : moderationDialog.action === "ban"
                    ? "Ban User"
                    : moderationDialog.action === "kick"
                      ? "Kick User"
                      : "Send Warning"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Viewer */}
      <UserProfileViewer
        username={username}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
};

export default UserContextMenu;
