import React, { useState } from "react";
import {
  Crown,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  MessageSquare,
  Plus,
  Home,
  BarChart3,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface NavigationBarProps {
  onProfileClick?: () => void;
  notificationCount?: number;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  onProfileClick,
  notificationCount = 0,
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdminPage = location.pathname === "/admin-dashboard";
  const isChatPage = location.pathname === "/";

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search",
        description: `Searching for: ${searchQuery}`,
      });
      // Implement search functionality here
    }
  };

  if (!currentUser) return null;

  return (
    <nav className="h-16 bg-black/40 backdrop-blur-xl border-b border-purple-500/30 px-4 flex items-center justify-between">
      {/* Left Section - Logo and Navigation */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-purple-400" />
          <span className="text-lg font-bold text-white">SwiperEmpire</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={isChatPage ? "default" : "ghost"}
            size="sm"
            onClick={() => handleNavigation("/")}
            className={
              isChatPage ? "bg-purple-600" : "text-gray-300 hover:text-white"
            }
          >
            <Home className="h-4 w-4 mr-2" />
            Chat
          </Button>

          {currentUser.isAdmin && (
            <Button
              variant={isAdminPage ? "default" : "ghost"}
              size="sm"
              onClick={() => handleNavigation("/admin-dashboard")}
              className={
                isAdminPage ? "bg-yellow-600" : "text-gray-300 hover:text-white"
              }
            >
              <Crown className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, servers, messages..."
            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
          />
        </form>
      </div>

      {/* Right Section - User Actions */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-400 hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </Badge>
          )}
        </Button>

        {/* Quick Stats (Admin Only) */}
        {currentUser.isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() =>
              toast({
                title: "System Status",
                description: "All systems operational",
              })
            }
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-600 text-white">
                  {currentUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-white flex items-center">
                  {currentUser.displayName}
                  {currentUser.isAdmin && (
                    <Crown className="h-3 w-3 ml-1 text-yellow-500" />
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  @{currentUser.username}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 bg-gray-800 border-gray-600"
            align="end"
          >
            <DropdownMenuItem
              className="text-white hover:bg-gray-700"
              onClick={onProfileClick}
            >
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>

            <DropdownMenuItem className="text-white hover:bg-gray-700">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </DropdownMenuItem>

            {currentUser.isAdmin && (
              <>
                <DropdownMenuSeparator className="bg-gray-600" />
                <DropdownMenuItem
                  className="text-yellow-300 hover:bg-yellow-900/20"
                  onClick={() => handleNavigation("/admin-dashboard")}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="text-blue-300 hover:bg-blue-900/20">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Center
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator className="bg-gray-600" />
            <DropdownMenuItem
              className="text-red-400 hover:bg-red-900"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default NavigationBar;
