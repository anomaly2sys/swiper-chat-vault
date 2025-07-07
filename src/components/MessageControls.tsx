import React, { useState, useEffect } from "react";
import {
  Trash2,
  Save,
  Clock,
  X,
  Check,
  Heart,
  Timer,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface MessageControlsProps {
  messageId: string;
  isOwn: boolean;
  isDisappearing: boolean;
  disappearAt?: Date;
  onDelete: (messageId: string) => void;
  onToggleDisappearing: (messageId: string, enabled: boolean) => void;
  onRequestSave?: (messageId: string) => void;
  recipientUsername?: string;
  isDirectMessage?: boolean;
}

const MessageControls: React.FC<MessageControlsProps> = ({
  messageId,
  isOwn,
  isDisappearing,
  disappearAt,
  onDelete,
  onToggleDisappearing,
  onRequestSave,
  recipientUsername,
  isDirectMessage = false,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveRequested, setSaveRequested] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [localDisappearing, setLocalDisappearing] = useState(isDisappearing);
  const { toast } = useToast();

  // Sync local state with prop
  useEffect(() => {
    setLocalDisappearing(isDisappearing);
  }, [isDisappearing]);

  // Calculate time remaining for disappearing messages
  useEffect(() => {
    if (localDisappearing && disappearAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const disappearTime = disappearAt.getTime();
        const remaining = Math.max(0, disappearTime - now);

        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(null);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [localDisappearing, disappearAt]);

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleSelfDelete = () => {
    onDelete(messageId);
    toast({
      title: "Message deleted",
      description: "Your message has been removed",
    });
  };

  const handleToggleDisappearing = () => {
    const newState = !localDisappearing;
    setLocalDisappearing(newState);
    onToggleDisappearing(messageId, newState);
  };

  const handleRequestSave = () => {
    if (!isDirectMessage) {
      toast({
        title: "Save not available",
        description: "Message saving is only available in direct messages",
        variant: "destructive",
      });
      return;
    }

    setShowSaveDialog(true);
  };

  const confirmSaveRequest = () => {
    setSaveRequested(true);
    onRequestSave?.(messageId);
    toast({
      title: "Save request sent",
      description: `Waiting for ${recipientUsername} to approve saving this message`,
    });
    setShowSaveDialog(false);
  };

  return (
    <>
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Time remaining indicator */}
        {localDisappearing && timeRemaining !== null && (
          <Badge
            variant="secondary"
            className="bg-red-500/20 text-red-300 text-xs flex items-center animate-pulse"
          >
            <Timer className="h-3 w-3 mr-1" />
            {formatTimeRemaining(timeRemaining)}
          </Badge>
        )}

        {/* Toggle disappearing messages (only for message owner) */}
        {isOwn && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 transition-colors ${
              localDisappearing
                ? "text-purple-400 hover:text-purple-300"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={handleToggleDisappearing}
            title={
              localDisappearing ? "Disable auto-delete" : "Enable auto-delete"
            }
          >
            {localDisappearing ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Status indicator */}
        {isOwn && (
          <Badge
            variant="secondary"
            className={`text-xs ${
              localDisappearing
                ? "bg-purple-500/20 text-purple-300"
                : "bg-gray-500/20 text-gray-300"
            }`}
          >
            {localDisappearing ? "Auto-delete" : "Permanent"}
          </Badge>
        )}

        {/* Save message (only in DMs and if not own message) */}
        {isDirectMessage && !isOwn && !saveRequested && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-green-400"
            onClick={handleRequestSave}
            title="Request to save message"
          >
            <Heart className="h-3 w-3" />
          </Button>
        )}

        {/* Save request pending indicator */}
        {saveRequested && (
          <Badge
            variant="secondary"
            className="bg-green-500/20 text-green-300 text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Save pending
          </Badge>
        )}

        {/* Self delete (only for message owner) */}
        {isOwn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
            onClick={handleSelfDelete}
            title="Delete message now"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md bg-black/40 border-purple-500/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Save className="h-5 w-5 mr-2" />
              Save Message
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Request to save this message permanently. Both you and{" "}
              {recipientUsername} must agree to save it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                ℹ️ Message saving requires mutual consent. If approved, this
                message will be saved permanently for both users and won't
                auto-delete.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSaveRequest}
                className="bg-green-600 hover:bg-green-700"
              >
                <Heart className="h-4 w-4 mr-2" />
                Request Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageControls;
