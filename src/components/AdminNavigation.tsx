import React, { useState } from "react";
import {
  Users,
  Shield,
  Crown,
  Bitcoin,
  HelpCircle,
  Activity,
  Database,
  Star,
  Settings,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnhancedAdminDashboard from "./EnhancedAdminDashboard";
import RoleManagement from "./RoleManagement";
import EscrowSystem from "./EscrowSystem";
import SupportSystem from "./SupportSystem";
import UnifiedAdminBot from "./UnifiedAdminBot";
import EmpireEliteBadge from "./EmpireEliteBadge";

type AdminTab = "dashboard" | "roles" | "escrow" | "support" | "bot";

const AdminNavigation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const tabs = [
    {
      id: "dashboard" as AdminTab,
      label: "Dashboard",
      icon: Activity,
      description: "System overview and user management",
    },
    {
      id: "roles" as AdminTab,
      label: "Role Management",
      icon: Crown,
      description: "Manage user roles and permissions",
    },
    {
      id: "escrow" as AdminTab,
      label: "Bitcoin Escrow",
      icon: Bitcoin,
      description: "Advanced escrow system for secure transactions",
    },
    {
      id: "support" as AdminTab,
      label: "Support System",
      icon: HelpCircle,
      description: "User support tickets and communication",
    },
    {
      id: "bot" as AdminTab,
      label: "Admin Bot",
      icon: MessageSquare,
      description: "AI-powered admin console",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EnhancedAdminDashboard />;
      case "roles":
        return (
          <div className="space-y-6">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  Empire Elite System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <EmpireEliteBadge size="lg" />
                    <div>
                      <p className="text-white font-medium">
                        Empire Elite Membership
                      </p>
                      <p className="text-gray-400 text-sm">
                        $25 in Bitcoin - Zero fees on all purchases
                      </p>
                    </div>
                  </div>

                  <FeeManagementSystem />
                </div>
              </CardContent>
            </Card>
            <RoleManagement />
          </div>
        );
      case "escrow":
        return <EscrowSystem serverId="server-1" />;
      case "support":
        return <SupportSystem />;
      case "bot":
        return <UnifiedAdminBot />;
      default:
        return <EnhancedAdminDashboard />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      {/* Navigation Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Empire Admin Console
          </h1>
          <div className="flex items-center space-x-2">
            <EmpireEliteBadge size="sm" />
            <Badge className="bg-green-500/20 text-green-300">
              LIVE SYSTEM
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Tab Description */}
        <div className="mt-2">
          <p className="text-gray-400 text-sm">
            {tabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  );
};

export default AdminNavigation;
