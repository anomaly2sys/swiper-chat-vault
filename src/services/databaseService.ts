// Real database service using IndexedDB for client-side storage
// In production, this would connect to a real database like PostgreSQL

interface DBUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastSeen: Date;
  status: "online" | "away" | "busy" | "offline";
  roles: string[];
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface DBMessage {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId?: string;
  timestamp: Date;
  editedAt?: Date;
  isDisappearing: boolean;
  disappearAt?: Date;
  requiresMutualConsent: boolean;
  isEncrypted: boolean;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  attachments?: string[];
}

interface DBServer {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  icon?: string;
  inviteCode: string;
  createdAt: Date;
  members: string[];
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private dbName = "SwiperEmpireDB";
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users table
        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "id" });
          userStore.createIndex("username", "username", { unique: true });
          userStore.createIndex("email", "email", { unique: false });
        }

        // Messages table
        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messageStore.createIndex("channelId", "channelId", { unique: false });
          messageStore.createIndex("authorId", "authorId", { unique: false });
          messageStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // Servers table
        if (!db.objectStoreNames.contains("servers")) {
          const serverStore = db.createObjectStore("servers", {
            keyPath: "id",
          });
          serverStore.createIndex("ownerId", "ownerId", { unique: false });
        }

        // Roles table
        if (!db.objectStoreNames.contains("roles")) {
          const roleStore = db.createObjectStore("roles", { keyPath: "id" });
          roleStore.createIndex("serverId", "serverId", { unique: false });
        }

        // Sessions table
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", {
            keyPath: "id",
          });
          sessionStore.createIndex("userId", "userId", { unique: false });
        }

        // Audit logs table
        if (!db.objectStoreNames.contains("audit_logs")) {
          const auditStore = db.createObjectStore("audit_logs", {
            keyPath: "id",
          });
          auditStore.createIndex("userId", "userId", { unique: false });
          auditStore.createIndex("action", "action", { unique: false });
          auditStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  async createUser(user: DBUser): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readwrite");
      const store = transaction.objectStore("users");
      const request = store.add(user);

      request.onsuccess = () => {
        this.logAction(
          "user_created",
          user.id,
          `User ${user.username} created`,
        );
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByUsername(username: string): Promise<DBUser | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readonly");
      const store = transaction.objectStore("users");
      const index = store.index("username");
      const request = index.get(username.toLowerCase());

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<DBUser[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readonly");
      const store = transaction.objectStore("users");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(userId: string, updates: Partial<DBUser>): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["users"], "readwrite");
      const store = transaction.objectStore("users");
      const getRequest = store.get(userId);

      getRequest.onsuccess = () => {
        const user = getRequest.result;
        if (!user) {
          reject(new Error("User not found"));
          return;
        }

        const updatedUser = { ...user, ...updates };
        const putRequest = store.put(updatedUser);

        putRequest.onsuccess = () => {
          this.logAction(
            "user_updated",
            userId,
            `User ${user.username} updated`,
          );
          resolve(true);
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async createMessage(message: DBMessage): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["messages"], "readwrite");
      const store = transaction.objectStore("messages");
      const request = store.add(message);

      request.onsuccess = () => {
        this.logAction(
          "message_created",
          message.authorId,
          `Message sent in ${message.channelId}`,
        );
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getMessagesByChannel(
    channelId: string,
    limit = 50,
  ): Promise<DBMessage[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["messages"], "readonly");
      const store = transaction.objectStore("messages");
      const index = store.index("channelId");
      const request = index.getAll(channelId);

      request.onsuccess = () => {
        const messages = request.result
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, limit);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["messages"], "readwrite");
      const store = transaction.objectStore("messages");
      const request = store.delete(messageId);

      request.onsuccess = () => {
        this.logAction("message_deleted", "", `Message ${messageId} deleted`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async logAction(
    action: string,
    userId: string,
    description: string,
  ): Promise<void> {
    if (!this.db) return;

    const auditLog = {
      id: `audit-${Date.now()}-${Math.random()}`,
      userId,
      action,
      description,
      timestamp: new Date(),
      ipAddress: "client-side",
      userAgent: navigator.userAgent,
    };

    const transaction = this.db.transaction(["audit_logs"], "readwrite");
    const store = transaction.objectStore("audit_logs");
    store.add(auditLog);
  }

  async getAuditLogs(limit = 100): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["audit_logs"], "readonly");
      const store = transaction.objectStore("audit_logs");
      const index = store.index("timestamp");
      const request = index.getAll();

      request.onsuccess = () => {
        const logs = request.result
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, limit);
        resolve(logs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async searchUsers(query: string): Promise<DBUser[]> {
    const users = await this.getAllUsers();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase()),
    );
  }

  async getUserStats(): Promise<any> {
    const users = await this.getAllUsers();
    return {
      total: users.length,
      online: users.filter((u) => u.status === "online").length,
      admins: users.filter((u) => u.isAdmin).length,
      verified: users.filter((u) => u.isVerified).length,
    };
  }

  async backupDatabase(): Promise<string> {
    const data = {
      users: await this.getAllUsers(),
      timestamp: new Date().toISOString(),
      version: this.version,
    };

    const backup = JSON.stringify(data);
    this.logAction("database_backup", "system", "Database backup created");
    return backup;
  }
}

export const databaseService = new DatabaseService();
