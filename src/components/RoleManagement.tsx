import React, { useState, useEffect } from "react";
import {
  Crown,
  Shield,
  User,
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  Verified,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault?: boolean;
}

interface UserRole {
  userId: number;
  username: string;
  displayName: string;
  roles: string[];
}

const DEFAULT_ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    color: "#FFD700",
    position: 100,
    isDefault: true,
  },
  {
    id: "empire-elite",
    name: "Empire Elite",
    color: "#9D4EDD",
    position: 95,
    isDefault: true,
  },
  {
    id: "verified-vendor",
    name: "Verified Vendor",
    color: "#00FF00",
    position: 90,
    isDefault: true,
  },
  {
    id: "vendor",
    name: "Vendor",
    color: "#FFA500",
    position: 80,
    isDefault: true,
  },
  {
    id: "moderator",
    name: "Moderator",
    color: "#0099FF",
    position: 70,
    isDefault: true,
  },
  {
    id: "member",
    name: "Member",
    color: "#888888",
    position: 10,
    isDefault: true,
  },
];

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(() => {
    const savedRoles = localStorage.getItem("swiperEmpire_roles");
    if (savedRoles) {
      try {
        return JSON.parse(savedRoles);
      } catch {
        return DEFAULT_ROLES;
      }
    }
    return DEFAULT_ROLES;
  });

  const [userRoles, setUserRoles] = useState<UserRole[]>(() => {
    const savedUserRoles = localStorage.getItem("swiperEmpire_userRoles");
    if (savedUserRoles) {
      try {
        return JSON.parse(savedUserRoles);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", color: "#888888" });
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { currentUser, getAllUsers } = useAuth();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = () => {
      try {
        setIsLoading(true);
        setError(null);
        if (typeof getAllUsers === "function") {
          const users = getAllUsers();
          setAllUsers(Array.isArray(users) ? users : []);
        } else {
          setAllUsers([]);
        }
      } catch (error) {
        console.error("Error getting users:", error);
        setError("Failed to load users");
        setAllUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [getAllUsers]);

  useEffect(() => {
    localStorage.setItem("swiperEmpire_roles", JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("swiperEmpire_userRoles", JSON.stringify(userRoles));
  }, [userRoles]);

  const createRole = () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Invalid role name",
        description: "Role name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const roleExists = roles.some(
      (r) => r.name.toLowerCase() === newRole.name.toLowerCase(),
    );
    if (roleExists) {
      toast({
        title: "Role exists",
        description: "A role with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const role: Role = {
      id: `role-${Date.now()}`,
      name: newRole.name.trim(),
      color: newRole.color,
      position: 50,
    };

    setRoles((prev) => [...prev, role]);
    setNewRole({ name: "", color: "#888888" });
    setShowCreateRole(false);

    toast({
      title: "Role created",
      description: `Role "${role.name}" has been created`,
    });
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.isDefault) {
      toast({
        title: "Cannot delete",
        description: "Default roles cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setUserRoles((prev) =>
      prev.map((ur) => ({
        ...ur,
        roles: ur.roles.filter((r) => r !== roleId),
      })),
    );

    toast({
      title: "Role deleted",
      description: `Role has been deleted`,
    });
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Invalid selection",
        description: "Please select both user and role",
        variant: "destructive",
      });
      return;
    }

    const user = allUsers.find((u) => u.id.toString() === selectedUser);
    if (!user) return;

    const existingUserRole = userRoles.find((ur) => ur.userId === user.id);

    if (existingUserRole) {
      if (existingUserRole.roles.includes(selectedRole)) {
        toast({
          title: "Role already assigned",
          description: `User already has this role`,
          variant: "destructive",
        });
        return;
      }

      setUserRoles((prev) =>
        prev.map((ur) =>
          ur.userId === user.id
            ? { ...ur, roles: [...ur.roles, selectedRole] }
            : ur,
        ),
      );
    } else {
      const newUserRole: UserRole = {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        roles: [selectedRole],
      };
      setUserRoles((prev) => [...prev, newUserRole]);
    }

    const roleName = roles.find((r) => r.id === selectedRole)?.name;
    toast({
      title: "Role assigned",
      description: `${roleName} role assigned to ${user.displayName}`,
    });

    setSelectedUser("");
    setSelectedRole("");
    setShowAssignRole(false);
  };

  const removeUserRole = (userId: number, roleId: string) => {
    setUserRoles((prev) =>
      prev.map((ur) =>
        ur.userId === userId
          ? { ...ur, roles: ur.roles.filter((r) => r !== roleId) }
          : ur,
      ),
    );

    const roleName = roles.find((r) => r.id === roleId)?.name;
    const user = userRoles.find((ur) => ur.userId === userId);

    toast({
      title: "Role removed",
      description: `${roleName} role removed from ${user?.displayName}`,
    });
  };

  const getRoleColor = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.color || "#888888";
  };

  const getRoleName = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.name || "Unknown";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-black/40 border-red-500/30">
          <CardContent className="p-6">
            <div className="text-center text-red-400">
              <p>Error loading role management: {error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-black/40 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">
              <p>Loading role management...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Management */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Crown className="h-5 w-5 mr-2" />
              Role Management
            </CardTitle>
            <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create New Role
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Role Name</Label>
                    <Input
                      value={newRole.name}
                      onChange={(e) =>
                        setNewRole((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter role name"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Role Color</Label>
                    <Input
                      type="color"
                      value={newRole.color}
                      onChange={(e) =>
                        setNewRole((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="bg-gray-800 border-gray-600 h-10"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateRole(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createRole}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Create Role
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-white font-medium">{role.name}</span>
                  {role.isDefault && (
                    <Badge className="bg-blue-500/20 text-blue-300">
                      Default
                    </Badge>
                  )}
                </div>
                {!role.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRole(role.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Role Assignment */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Role Assignment
            </CardTitle>
            <Dialog open={showAssignRole} onOpenChange={setShowAssignRole}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-purple-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Assign Role to User
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select User</Label>
                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.displayName} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select Role</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignRole(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={assignRole}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Assign Role
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {userRoles.map((userRole) => (
                <div
                  key={userRole.userId}
                  className="p-3 bg-gray-800/30 rounded border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-medium">
                        {userRole.displayName}
                      </span>
                      <span className="text-gray-400 ml-2">
                        @{userRole.username}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userRole.roles.map((roleId) => (
                      <div key={roleId} className="flex items-center space-x-1">
                        <Badge
                          style={{
                            backgroundColor: getRoleColor(roleId) + "20",
                            color: getRoleColor(roleId),
                          }}
                          className="border"
                          style={{ borderColor: getRoleColor(roleId) + "50" }}
                        >
                          {getRoleName(roleId)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeUserRole(userRole.userId, roleId)
                          }
                          className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {userRoles.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p>No role assignments yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;
