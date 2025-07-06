import React, { useState, useEffect } from "react";
import {
  Users,
  Database,
  Activity,
  Shield,
  MessageSquare,
  Ban,
  Volume2,
  VolumeX,
  UserX,
  Mail,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Search,
  Filter,
  Settings,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { realDatabaseService } from "@/services/realDatabaseService";
import UnifiedAdminBot from "./UnifiedAdminBot";

interface SystemStats {
  totalUsers: number;
  totalMessages: number;
  totalServers: number;
  activeUsers: number;
  systemUptime: string;
  databaseSize: string;
}

interface DatabaseTable {
  name: string;
  rowCount: number;
  data: any[];
}

const EnhancedAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, tablesData] = await Promise.all([
        realDatabaseService.getSystemStats(),
        realDatabaseService.getAllUsers(),
        realDatabaseService.getDatabaseTables(),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setTables(tablesData);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    if (!tableName) return;

    try {
      const data = await realDatabaseService.getTableData(tableName, 100);
      setTableData(data);
      setSelectedTable(tableName);
    } catch (error: any) {
      toast({
        title: "Error loading table data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const banUser = async (userId: number, reason: string) => {
    try {
      await realDatabaseService.banUser(userId, reason, currentUser?.id || 0);
      await loadDashboardData();
      toast({
        title: "User banned",
        description: `User has been banned successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error banning user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unbanUser = async (userId: number) => {
    try {
      await realDatabaseService.unbanUser(userId, currentUser?.id || 0);
      await loadDashboardData();
      toast({
        title: "User unbanned",
        description: "User has been unbanned successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error unbanning user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const muteUser = async (userId: number, duration: number) => {
    try {
      await realDatabaseService.muteUser(
        userId,
        duration,
        currentUser?.id || 0,
      );
      await loadDashboardData();
      toast({
        title: "User muted",
        description: `User has been muted for ${duration / 1000 / 60} minutes`,
      });
    } catch (error: any) {
      toast({
        title: "Error muting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unmuteUser = async (userId: number) => {
    try {
      await realDatabaseService.unmuteUser(userId, currentUser?.id || 0);
      await loadDashboardData();
      toast({
        title: "User unmuted",
        description: "User has been unmuted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error unmuting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportTableData = () => {
    if (!tableData.length) return;

    const csv = [
      Object.keys(tableData[0]).join(","),
      ...tableData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTable}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: `${selectedTable} data exported to CSV`,
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="h-full p-6 space-y-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowBotConsole(true)}
            className="bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Bot Console
          </Button>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="border-gray-600 hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 transition-transform ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalUsers}
                  </p>
                  <p className="text-sm text-gray-400">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.activeUsers}
                  </p>
                  <p className="text-sm text-gray-400">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalMessages}
                  </p>
                  <p className="text-sm text-gray-400">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Database className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.databaseSize}
                  </p>
                  <p className="text-sm text-gray-400">Database Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Management
              </CardTitle>
              <div className="flex space-x-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 bg-gray-800 border-gray-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div>
                            <p className="text-white font-medium">
                              {user.display_name}
                            </p>
                            <p className="text-gray-400 text-sm">
                              @{user.username}
                            </p>
                          </div>
                          {user.is_admin && (
                            <Badge className="bg-yellow-500/20 text-yellow-300">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge
                            variant={
                              user.status === "online" ? "default" : "secondary"
                            }
                            className={
                              user.status === "online"
                                ? "bg-green-500/20 text-green-300"
                                : ""
                            }
                          >
                            {user.status}
                          </Badge>
                          {user.is_banned && (
                            <Badge className="bg-red-500/20 text-red-300">
                              Banned
                            </Badge>
                          )}
                          {user.is_muted && (
                            <Badge className="bg-orange-500/20 text-orange-300">
                              Muted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black/90 border-purple-500/30">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  User Details
                                </DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4 text-white">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-gray-400">ID</p>
                                      <p>{selectedUser.id}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Username</p>
                                      <p>@{selectedUser.username}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">
                                        Display Name
                                      </p>
                                      <p>{selectedUser.display_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Email</p>
                                      <p>
                                        {selectedUser.email || "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Joined</p>
                                      <p>
                                        {new Date(
                                          selectedUser.joined_at,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Last Seen</p>
                                      <p>
                                        {new Date(
                                          selectedUser.last_seen,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2 pt-4">
                                    {selectedUser.is_banned ? (
                                      <Button
                                        onClick={() =>
                                          unbanUser(selectedUser.id)
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Unban
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          banUser(
                                            selectedUser.id,
                                            "Banned by admin",
                                          )
                                        }
                                        variant="destructive"
                                      >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Ban
                                      </Button>
                                    )}
                                    {selectedUser.is_muted ? (
                                      <Button
                                        onClick={() =>
                                          unmuteUser(selectedUser.id)
                                        }
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        <Volume2 className="h-4 w-4 mr-2" />
                                        Unmute
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          muteUser(selectedUser.id, 3600000)
                                        } // 1 hour
                                        variant="outline"
                                      >
                                        <VolumeX className="h-4 w-4 mr-2" />
                                        Mute
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Database Viewer */}
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Viewer
              </CardTitle>
              <div className="flex space-x-2">
                <Select value={selectedTable} onValueChange={loadTableData}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTable && (
                  <Button
                    onClick={exportTableData}
                    variant="outline"
                    size="sm"
                    className="border-gray-600"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {tableData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(tableData[0]).map((column) => (
                        <TableHead key={column} className="text-gray-300">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.slice(0, 20).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <TableCell key={cellIndex} className="text-white">
                            {typeof value === "object" && value !== null
                              ? JSON.stringify(value)
                              : String(value || "").substring(0, 50)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Select a table to view its data
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
