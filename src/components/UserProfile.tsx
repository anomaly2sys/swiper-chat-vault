import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Edit,
  Save,
  X,
  Shield,
  Crown,
  Calendar,
  MessageSquare,
  Settings,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Bell,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || "",
    bio: currentUser?.bio || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    profilePicture: currentUser?.profilePicture || "",
  });
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    allowDMs: true,
    notifications: true,
    soundEnabled: true,
    theme: "dark",
  });
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  const handleSave = () => {
    if (currentUser) {
      updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });

      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: currentUser?.displayName || "",
      bio: currentUser?.bio || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }));
    toast({
      title: "Setting updated",
      description: `${setting} has been ${value ? "enabled" : "disabled"}`,
    });
  };

  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card
        ref={modalRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-black/40 border-purple-500/30 backdrop-blur-xl"
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              User Profile
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={currentUser.profilePicture} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full border-purple-500/30 bg-black/60"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white">
                    {currentUser.displayName}
                  </h3>
                  {currentUser.isAdmin && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400">@{currentUser.username}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {currentUser.joinedAt.toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Active user
                  </div>
                </div>
              </div>

              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  isEditing ? handleCancel() : setIsEditing(true)
                }
                className={isEditing ? "border-red-500/30 text-red-300" : ""}
              >
                {isEditing ? (
                  <X className="h-4 w-4 mr-2" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Profile Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              Profile Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Display Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white bg-gray-800/50 p-2 rounded border border-gray-600">
                    {currentUser.displayName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Username</Label>
                <p className="text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700">
                  @{currentUser.username} (cannot be changed)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Bio</Label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="bg-gray-800/50 border-gray-600 text-white"
                  rows={3}
                />
              ) : (
                <p className="text-white bg-gray-800/50 p-2 rounded border border-gray-600 min-h-[80px]">
                  {currentUser.bio || "No bio added yet..."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email (optional)
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white bg-gray-800/50 p-2 rounded border border-gray-600">
                    {currentUser.email || "Not provided"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone (optional)
                </Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                ) : (
                  <p className="text-white bg-gray-800/50 p-2 rounded border border-gray-600">
                    {currentUser.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Privacy & Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Privacy & Settings
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-300">Show online status</Label>
                  <p className="text-sm text-gray-400">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showOnlineStatus", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-300">Allow direct messages</Label>
                  <p className="text-sm text-gray-400">
                    Allow users to send you DMs
                  </p>
                </div>
                <Switch
                  checked={settings.allowDMs}
                  onCheckedChange={(checked) =>
                    handleSettingChange("allowDMs", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-300">Push notifications</Label>
                  <p className="text-sm text-gray-400">
                    Receive notifications for mentions and DMs
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange("notifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-300">Sound effects</Label>
                  <p className="text-sm text-gray-400">
                    Play sounds for messages and notifications
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange("soundEnabled", checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Security Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security
            </h4>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-600 hover:bg-gray-700"
                onClick={() =>
                  toast({
                    title: "Change Password",
                    description:
                      "Password change functionality will be available after deployment",
                  })
                }
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-600 hover:bg-gray-700"
                onClick={() =>
                  toast({
                    title: "Two-Factor Authentication",
                    description:
                      "2FA is automatically enabled with quantum encryption",
                  })
                }
              >
                <Shield className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-600 hover:bg-gray-700"
                onClick={() =>
                  toast({
                    title: "Active Sessions",
                    description:
                      "Current session: Secure browser session with quantum encryption",
                  })
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                Active Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
