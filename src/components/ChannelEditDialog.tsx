import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Channel } from "@/types/channels";
import { Trash2, Save, X } from "lucide-react";

interface ChannelEditDialogProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (channelId: string, updates: Partial<Channel>) => void;
  onDelete: (channelId: string) => void;
  canDelete: boolean;
}

const ChannelEditDialog: React.FC<ChannelEditDialogProps> = ({
  channel,
  isOpen,
  onClose,
  onSave,
  onDelete,
  canDelete,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (channel) {
      setFormData({
        name: channel.name,
        description: channel.description || "",
        isPrivate: channel.isPrivate || false,
      });
    }
  }, [channel]);

  const handleSave = () => {
    if (!channel) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Invalid name",
        description: "Channel name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Can't change shop channel name
    if (channel.type === "shop" && formData.name !== "Shop") {
      toast({
        title: "Cannot rename shop channel",
        description: "Shop channels must be named 'Shop'",
        variant: "destructive",
      });
      return;
    }

    onSave(channel.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isPrivate: formData.isPrivate,
    });

    toast({
      title: "Channel updated",
      description: "Channel settings have been saved",
    });

    onClose();
  };

  const handleDelete = () => {
    if (!channel) return;
    
    onDelete(channel.id);
    
    toast({
      title: "Channel deleted",
      description: "Channel has been permanently deleted",
    });

    setShowDeleteConfirm(false);
    onClose();
  };

  if (!channel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border-purple-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            Edit Channel: #{channel.name}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Channel Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter channel name"
                disabled={channel.type === "shop"}
                className="bg-gray-800 border-gray-600 text-white"
              />
              {channel.type === "shop" && (
                <p className="text-xs text-gray-400">
                  Shop channels must be named "Shop"
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Channel description (optional)"
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
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
                checked={formData.isPrivate}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, isPrivate: checked }))
                }
              />
            </div>

            <div className="flex justify-between space-x-2 pt-4">
              {canDelete && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              
              <div className="flex space-x-2 flex-1">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Trash2 className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Delete Channel
              </h3>
              <p className="text-gray-400 mb-1">
                Are you sure you want to delete <strong>#{channel.name}</strong>?
              </p>
              <p className="text-sm text-red-400">
                This action cannot be undone. All messages will be lost.
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
              >
                Delete Channel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChannelEditDialog;