import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Crown, MessageSquare, Settings, LogOut } from "lucide-react";
import MainChatApp from "./MainChatApp";
import EnhancedAdminDashboard from "./EnhancedAdminDashboard";
import NavigationBar from "./NavigationBar";

type ViewType = "chat" | "admin";

const EnhancedMainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const { currentUser, logout } = useAuth();

  const switchView = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
              <span className="text-lg font-bold text-white">SwiperEmpire</span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={currentView === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => switchView("chat")}
                className={
                  currentView === "chat"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }
              >
                <Home className="h-4 w-4 mr-2" />
                Chat
              </Button>

              {currentUser?.isAdmin && (
                <Button
                  variant={currentView === "admin" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => switchView("admin")}
                  className={
                    currentView === "admin"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
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
              </div>

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
    </div>
  );
};

export default EnhancedMainApp;
