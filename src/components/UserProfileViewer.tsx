import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Settings,
  Crown,
  Shield,
  Activity,
  MapPin,
  Globe,
  Github,
  Twitter,
  Instagram,
  Edit,
  X,
  Ban,
  UserCheck,
  Clock,
  Star,
  Heart,
  MessageCircle,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserProfileViewerProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastSeen: Date;
  status: "online" | "away" | "busy" | "offline";
  roles: string[];
  stats: {
    messagesCount: number;
    serversJoined: number;
    friendsCount: number;
    reputationScore: number;
  };
  badges: string[];
  socialLinks?: {
    twitter?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
  location?: string;
  timezone?: string;
}

const UserProfileViewer: React.FC<UserProfileViewerProps> = ({
  username,
  isOpen,
  onClose,
}) => {
  const { currentUser, getAllUsers } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && username) {
      loadUserProfile();
    }
  }, [isOpen, username]);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, onClose]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from the database
      const users = getAllUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );

      if (user) {
        // Transform user data to profile format with additional stats
        const profile: UserProfile = {
          id: user.id.toString(),
          username: user.username,
          displayName: user.displayName,
          email: user.email || undefined,
          phone: user.phone || undefined,
          bio: user.bio,
          profilePicture: user.profilePicture,
          isAdmin: user.isAdmin,
          status: user.status,
          joinedAt: user.joinedAt,
          lastSeen: user.lastSeen,
          location: user.isAdmin ? "Server Administration" : undefined,
          timezone: "UTC-5 (EST)",
          roles: user.isAdmin ? ["Administrator"] : ["Member"],
          stats: {
            messagesCount: Math.floor(Math.random() * 1000) + 50,
            serversJoined: Math.floor(Math.random() * 10) + 1,
            friendsCount: Math.floor(Math.random() * 50) + 5,
            reputationScore: Math.floor(Math.random() * 100) + 50,
          },
          badges: user.isAdmin
            ? ["Admin", "Founder", "Verified", "Pro User"]
            : ["Member", "Verified"],
          socialLinks: {
            github: user.isAdmin ? "https://github.com/blankbank" : undefined,
            twitter: user.isAdmin ? "https://twitter.com/blankbank" : undefined,
          },
          location: user.isAdmin ? "Digital Realm" : undefined,
          timezone: "UTC",
        };

        setUserProfile(profile);
      } else {
        toast({
          title: "User not found",
          description: `Could not find user: ${username}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case "admin":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "founder":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "verified":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "pro user":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const handleDirectMessage = () => {
    toast({
      title: "Opening DM",
      description: `Starting conversation with ${userProfile?.displayName}`,
    });
    onClose();
  };

  const handleAddFriend = () => {
    toast({
      title: "Friend Request Sent",
      description: `Friend request sent to ${userProfile?.displayName}`,
    });
  };

  if (!userProfile && !isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={modalRef}
        className="max-w-4xl max-h-[90vh] bg-black/40 border-purple-500/30 backdrop-blur-xl p-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Loading profile...</p>
            </div>
          </div>
        ) : userProfile ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="relative">
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex items-end space-x-4 -mt-16">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-black/40">
                      <AvatarImage src={userProfile.profilePicture} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl">
                        {userProfile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-1 right-1 w-6 h-6 ${getStatusColor(userProfile.status)} rounded-full border-2 border-black`}
                    />
                  </div>

                  <div className="flex-1 mt-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">
                        {userProfile.displayName}
                      </h2>
                      {userProfile.isAdmin && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                      <Badge className={getBadgeColor("verified")}>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-gray-400">@{userProfile.username}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined {userProfile.joinedAt.toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        {userProfile.status === "online"
                          ? "Online now"
                          : `Last seen ${userProfile.lastSeen.toLocaleDateString()}`}
                      </div>
                      {userProfile.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {userProfile.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    {currentUser?.username !== userProfile.username && (
                      <>
                        <Button
                          onClick={handleDirectMessage}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleAddFriend}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="px-6 mb-4">
              <div className="flex flex-wrap gap-2">
                {userProfile.badges.map((badge) => (
                  <Badge key={badge} className={getBadgeColor(badge)}>
                    {badge === "Admin" && <Crown className="h-3 w-3 mr-1" />}
                    {badge === "Verified" && (
                      <Shield className="h-3 w-3 mr-1" />
                    )}
                    {badge === "Founder" && <Star className="h-3 w-3 mr-1" />}
                    {badge === "Pro User" && <Award className="h-3 w-3 mr-1" />}
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">
                        {userProfile.bio || "No bio provided yet."}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-white font-medium mb-2">
                            Contact
                          </h4>
                          <div className="space-y-2 text-sm">
                            {userProfile.email && (
                              <div className="flex items-center text-gray-300">
                                <Mail className="h-4 w-4 mr-2" />
                                {userProfile.email}
                              </div>
                            )}
                            {userProfile.phone && (
                              <div className="flex items-center text-gray-300">
                                <Phone className="h-4 w-4 mr-2" />
                                {userProfile.phone}
                              </div>
                            )}
                            {userProfile.timezone && (
                              <div className="flex items-center text-gray-300">
                                <Clock className="h-4 w-4 mr-2" />
                                {userProfile.timezone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-2">Roles</h4>
                          <div className="space-y-1">
                            {userProfile.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className="text-xs"
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="text-white text-sm">
                              Sent a message in #general
                            </p>
                            <p className="text-gray-400 text-xs">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                          <User className="h-4 w-4 text-green-400" />
                          <div>
                            <p className="text-white text-sm">
                              Joined SwiperEmpire server
                            </p>
                            <p className="text-gray-400 text-xs">1 day ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                          <Heart className="h-4 w-4 text-red-400" />
                          <div>
                            <p className="text-white text-sm">
                              Updated profile picture
                            </p>
                            <p className="text-gray-400 text-xs">3 days ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">Social Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userProfile.socialLinks?.github && (
                          <a
                            href={userProfile.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Github className="h-5 w-5 text-gray-400" />
                            <span className="text-white">GitHub</span>
                          </a>
                        )}
                        {userProfile.socialLinks?.twitter && (
                          <a
                            href={userProfile.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Twitter className="h-5 w-5 text-blue-400" />
                            <span className="text-white">Twitter</span>
                          </a>
                        )}
                        {userProfile.socialLinks?.website && (
                          <a
                            href={userProfile.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <Globe className="h-5 w-5 text-green-400" />
                            <span className="text-white">Website</span>
                          </a>
                        )}
                        {(!userProfile.socialLinks ||
                          Object.keys(userProfile.socialLinks).length ===
                            0) && (
                          <p className="text-gray-400 text-center py-8">
                            No social links added yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-800/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {userProfile.stats.messagesCount}
                        </div>
                        <div className="text-sm text-gray-400">
                          Messages Sent
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {userProfile.stats.serversJoined}
                        </div>
                        <div className="text-sm text-gray-400">
                          Servers Joined
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <User className="h-8 w-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {userProfile.stats.friendsCount}
                        </div>
                        <div className="text-sm text-gray-400">Friends</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-600">
                      <CardContent className="p-4 text-center">
                        <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">
                          {userProfile.stats.reputationScore}
                        </div>
                        <div className="text-sm text-gray-400">Reputation</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileViewer;
