import { User, Message, Server, Channel } from "@/contexts/ChatContext";

class RealDatabaseService {
  private baseUrl = "/.netlify/functions";

  private async apiCall(endpoint: string, method: string = "GET", data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  // User Management
  async createUser(userData: {
    username: string;
    displayName: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    bio?: string;
    profilePicture?: string;
    isAdmin?: boolean;
  }): Promise<User> {
    return this.apiCall("/users", "POST", userData);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.apiCall(`/users/${username}`);
    } catch (error) {
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.apiCall("/users");
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    return this.apiCall(`/users/${userId}`, "PUT", updates);
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}`, "DELETE");
      return true;
    } catch (error) {
      return false;
    }
  }

  async banUser(
    userId: number,
    reason: string,
    adminId: number,
  ): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}/ban`, "POST", { reason, adminId });
      return true;
    } catch (error) {
      return false;
    }
  }

  async unbanUser(userId: number, adminId: number): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}/unban`, "POST", { adminId });
      return true;
    } catch (error) {
      return false;
    }
  }

  async muteUser(
    userId: number,
    duration: number,
    adminId: number,
  ): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}/mute`, "POST", {
        duration,
        adminId,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async unmuteUser(userId: number, adminId: number): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}/unmute`, "POST", { adminId });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Message Management
  async createMessage(messageData: {
    content: string;
    userId: number;
    channelId?: number;
    serverId?: number;
    recipientId?: number;
    isDisappearing?: boolean;
    isDm?: boolean;
    requiresMutualConsent?: boolean;
  }): Promise<Message> {
    return this.apiCall("/messages", "POST", messageData);
  }

  async getMessages(
    channelId?: number,
    serverId?: number,
    isDm?: boolean,
    userId?: number,
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    if (channelId) params.append("channelId", channelId.toString());
    if (serverId) params.append("serverId", serverId.toString());
    if (isDm) params.append("isDm", "true");
    if (userId) params.append("userId", userId.toString());

    return this.apiCall(`/messages?${params.toString()}`);
  }

  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    try {
      await this.apiCall(`/messages/${messageId}`, "DELETE", { userId });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Server Management
  async createServer(serverData: {
    name: string;
    description?: string;
    ownerId: number;
    iconUrl?: string;
  }): Promise<Server> {
    return this.apiCall("/servers", "POST", serverData);
  }

  async getAllServers(): Promise<Server[]> {
    return this.apiCall("/servers");
  }

  async updateServer(
    serverId: number,
    updates: Partial<Server>,
  ): Promise<Server> {
    return this.apiCall(`/servers/${serverId}`, "PUT", updates);
  }

  async deleteServer(serverId: number, userId: number): Promise<boolean> {
    try {
      await this.apiCall(`/servers/${serverId}`, "DELETE", { userId });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Channel Management
  async createChannel(channelData: {
    name: string;
    serverId: number;
    type?: string;
    description?: string;
  }): Promise<Channel> {
    return this.apiCall("/channels", "POST", channelData);
  }

  async getChannelsByServer(serverId: number): Promise<Channel[]> {
    return this.apiCall(`/channels?serverId=${serverId}`);
  }

  // Admin Operations
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalMessages: number;
    totalServers: number;
    activeUsers: number;
    systemUptime: string;
    databaseSize: string;
  }> {
    return this.apiCall("/admin/stats");
  }

  async getAuditLogs(limit: number = 50): Promise<any[]> {
    return this.apiCall(`/admin/audit-logs?limit=${limit}`);
  }

  async createAuditLog(logData: {
    userId: number;
    action: string;
    targetId?: number;
    targetType?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.apiCall("/admin/audit-logs", "POST", logData);
  }

  async executeBotCommand(
    command: string,
    args: string[],
    userId: number,
  ): Promise<{
    success: boolean;
    response: string;
    data?: any;
  }> {
    return this.apiCall("/admin/bot-command", "POST", {
      command,
      args,
      userId,
    });
  }

  // Database Operations
  async getDatabaseTables(): Promise<string[]> {
    return this.apiCall("/admin/database/tables");
  }

  async getTableData(tableName: string, limit: number = 50): Promise<any[]> {
    return this.apiCall(`/admin/database/table/${tableName}?limit=${limit}`);
  }

  async executeQuery(query: string): Promise<any> {
    return this.apiCall("/admin/database/query", "POST", { query });
  }

  // Backup Operations
  async createBackup(): Promise<{
    success: boolean;
    backupId: string;
    url?: string;
  }> {
    return this.apiCall("/admin/backup", "POST");
  }

  async listBackups(): Promise<any[]> {
    return this.apiCall("/admin/backups");
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      await this.apiCall(`/admin/backup/${backupId}/restore`, "POST");
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const realDatabaseService = new RealDatabaseService();
