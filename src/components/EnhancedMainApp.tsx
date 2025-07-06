import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Crown,
  MessageSquare,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import MainChatApp from "./MainChatApp";
import EnhancedAdminDashboard from "./EnhancedAdminDashboard";
import EnhancedProfilePopup from "./EnhancedProfilePopup";

type ViewType = "chat" | "admin";

const EnhancedMainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const [showProfile, setShowProfile] = useState(false);
  const { currentUser, logout } = useAuth();

  const switchView = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SwiperEmpire</span>
            </div>

            {/* Center Welcome Message */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-sm font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Welcome to Swiper Empire Messager
              </h1>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2 mr-4">
              <Button
                variant={currentView === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => switchView("chat")}
                className={`transition-all duration-200 ${
                  currentView === "chat"
                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Chat
              </Button>

              {currentUser?.isAdmin && (
                <Button
                  variant={currentView === "admin" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => switchView("admin")}
                  className={`transition-all duration-200 ${
                    currentView === "admin"
                      ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {currentUser?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white text-sm font-medium">
                  {currentUser?.displayName}
                </span>
                {currentUser?.isAdmin && (
                  <Crown className="h-4 w-4 text-yellow-400" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-300 hover:text-white hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-[calc(100vh-80px)]">
        {currentView === "chat" ? <MainChatApp /> : <EnhancedAdminDashboard />}
      </div>

      {/* Profile Popup */}
      <EnhancedProfilePopup
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};

export default EnhancedMainApp;
