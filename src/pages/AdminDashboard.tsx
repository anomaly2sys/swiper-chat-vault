import React, { useState, useEffect } from "react";
import {
  Crown,
  Users,
  Server,
  Shield,
  BarChart3,
  Settings,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Eye,
  Lock,
  Globe,
  UserCheck,
  UserX,
  Ban,
  Volume2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalServers: number;
  totalMessages: number;
  bannedUsers: number;
  mutedUsers: number;
  securityAlerts: number;
  systemUptime: string;
}

interface SystemActivity {
  id: string;
  type: "login" | "registration" | "message" | "server_create" | "admin_action";
  user: string;
  action: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

const AdminDashboard: React.FC = () => {
  const { currentUser, getAllUsers } = useAuth();
  const { servers, messages } = useChat();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalServers: 0,
    totalMessages: 0,
    bannedUsers: 0,
    mutedUsers: 0,
    securityAlerts: 0,
    systemUptime: "15d 8h 42m",
  });

  const [recentActivity, setRecentActivity] = useState<SystemActivity[]>([
    {
      id: "1",
      type: "login",
      user: "TestUser1",
      action: "Successful login from 192.168.1.100",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      severity: "low",
    },
    {
      id: "2",
      type: "admin_action",
      user: "BlankBank",
      action: "Executed /users list command",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      severity: "medium",
    },
    {
      id: "3",
      type: "registration",
      user: "NewUser2024",
      action: "New user registration completed",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      severity: "low",
    },
    {
      id: "4",
      type: "server_create",
      user: "TestUser2",
      action: 'Created new server "Gaming Hub"',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      severity: "medium",
    },
  ]);

  useEffect(() => {
    // Update stats based on current data
    const users = getAllUsers();
    setStats((prev) => ({
      ...prev,
      totalUsers: users.length,
      onlineUsers: users.filter((u) => u.status === "online").length,
      totalServers: servers.length,
      totalMessages: messages.length,
      bannedUsers: 3, // Mock data
      mutedUsers: 1, // Mock data
      securityAlerts: 0,
    }));
  }, [getAllUsers, servers, messages]);

  const getActivityIcon = (type: SystemActivity["type"]) => {
    switch (type) {
      case "login":
        return <UserCheck className="h-4 w-4" />;
      case "registration":
        return <Users className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "server_create":
        return <Server className="h-4 w-4" />;
      case "admin_action":
        return <Crown className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: SystemActivity["severity"]) => {
    switch (severity) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-300">Administrator privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Crown className="h-8 w-8 mr-3 text-yellow-500" />
                SwiperEmpire Admin Dashboard
              </h1>
              <p className="text-gray-300 mt-2">
                Welcome back, {currentUser.displayName}. System status: All
                operational
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                System Online
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Shield className="h-3 w-3 mr-1" />
                Security Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalUsers}
                  </p>
                  <p className="text-sm text-green-400 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% this week
                  </p>
                </div>
                <Users className="h-12 w-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Online Now</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.onlineUsers}
                  </p>
                  <p className="text-sm text-blue-400">Active sessions</p>
                </div>
                <Activity className="h-12 w-12 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Servers</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalServers}
                  </p>
                  <p className="text-sm text-yellow-400">Communities active</p>
                </div>
                <Server className="h-12 w-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Messages Today</p>
                  <p className="text-3xl font-bold text-white">1,337</p>
                  <p className="text-sm text-purple-400">Encrypted & secure</p>
                </div>
                <MessageSquare className="h-12 w-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-black/40 border-purple-500/30">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-purple-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-purple-600"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="servers"
              className="data-[state=active]:bg-purple-600"
            >
              Servers
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-purple-600"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-purple-600"
            >
              System
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50"
                        >
                          <div
                            className={`mt-1 ${getSeverityColor(activity.severity)}`}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">
                              {activity.user}
                            </p>
                            <p className="text-xs text-gray-400">
                              {activity.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">CPU Usage</span>
                    <Badge className="bg-green-500/20 text-green-300">
                      12%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "12%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Memory Usage</span>
                    <Badge className="bg-yellow-500/20 text-yellow-300">
                      34%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: "34%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Database Size</span>
                    <Badge className="bg-blue-500/20 text-blue-300">
                      2.4 GB
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Uptime</span>
                    <Badge className="bg-purple-500/20 text-purple-300">
                      {stats.systemUptime}
                    </Badge>
                  </div>

                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-green-400 text-sm font-medium">
                        All systems operational
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    User Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total Users</span>
                    <span className="text-white font-bold">
                      {stats.totalUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Online Users</span>
                    <span className="text-green-400 font-bold">
                      {stats.onlineUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Banned Users</span>
                    <span className="text-red-400 font-bold">
                      {stats.bannedUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Muted Users</span>
                    <span className="text-orange-400 font-bold">
                      {stats.mutedUsers}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-black/40 border-purple-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">
                    Recent User Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-4 w-4 text-green-400" />
                        <span className="text-white">TestUser1 logged in</span>
                      </div>
                      <span className="text-xs text-gray-400">5 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Ban className="h-4 w-4 text-red-400" />
                        <span className="text-white">SpamUser was banned</span>
                      </div>
                      <span className="text-xs text-gray-400">1 hour ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-4 w-4 text-orange-400" />
                        <span className="text-white">ToxicUser was muted</span>
                      </div>
                      <span className="text-xs text-gray-400">2 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Servers Tab */}
          <TabsContent value="servers" className="space-y-6">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Server Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servers.map((server) => (
                    <div
                      key={server.id}
                      className="p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">
                          {server.name}
                        </h3>
                        <Badge className="bg-green-500/20 text-green-300">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {server.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{server.members.length} members</span>
                        <span>
                          {server.categories.reduce(
                            (acc, cat) => acc + cat.channels.length,
                            0,
                          )}{" "}
                          channels
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Encryption Status</span>
                    <Badge className="bg-green-500/20 text-green-300">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Failed Login Attempts</span>
                    <Badge className="bg-green-500/20 text-green-300">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Security Alerts</span>
                    <Badge className="bg-green-500/20 text-green-300">
                      {stats.securityAlerts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Backup Status</span>
                    <Badge className="bg-green-500/20 text-green-300">
                      Up to date
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Security Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Audit Logs
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Run Security Scan
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">
                      Database Settings
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size:</span>
                        <span className="text-white">2.4 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tables:</span>
                        <span className="text-white">8 active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Connections:</span>
                        <span className="text-white">12/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-medium">
                      Performance Metrics
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response Time:</span>
                        <span className="text-white">45ms avg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Throughput:</span>
                        <span className="text-white">1.2k req/min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Error Rate:</span>
                        <span className="text-white">0.01%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
