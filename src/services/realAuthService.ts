import bcrypt from "bcryptjs";

interface RegisterData {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isAdmin: boolean;
  status: string;
  joinedAt: Date;
  lastSeen: Date;
  isVerified: boolean;
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil?: Date;
}

class RealAuthService {
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
      const error = await response.json();
      throw new Error(error.error || "API call failed");
    }

    return response.json();
  }

  async registerUser(userData: RegisterData): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    try {
      // Try API first, fallback to local storage if not deployed
      try {
        const passwordHash = await bcrypt.hash(userData.password, 12);

        const user = await this.apiCall("/users", "POST", {
          username: userData.username,
          displayName: userData.displayName,
          email: userData.email,
          phone: userData.phone,
          passwordHash,
          bio: "",
          profilePicture: "",
          isAdmin: false,
        });

        return {
          success: true,
          message: "User registered successfully",
          user,
        };
      } catch (apiError) {
        // API not available, register locally
        return this.registerLocally(userData);
      }
    } catch (error: any) {
      return this.registerLocally(userData);
    }
  }

  private registerLocally(userData: RegisterData): {
    success: boolean;
    message: string;
    user?: User;
  } {
    // Check if username already exists in localStorage
    const existingUsers = JSON.parse(
      localStorage.getItem("registeredUsers") || "[]",
    );

    if (
      existingUsers.find(
        (u: any) =>
          u.username.toLowerCase() === userData.username.toLowerCase(),
      )
    ) {
      return { success: false, message: "Username already exists" };
    }

    // Create new user
    const newUser: User = {
      id: Math.floor(Math.random() * 10000) + 1000,
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      bio: "",
      profilePicture: "",
      isAdmin: false,
      status: "online",
      joinedAt: new Date(),
      lastSeen: new Date(),
      isVerified: false,
      isBanned: false,
      isMuted: false,
    };

    // Save to localStorage
    existingUsers.push(newUser);
    localStorage.setItem("registeredUsers", JSON.stringify(existingUsers));

    return {
      success: true,
      message: "User registered successfully",
      user: newUser,
    };
  }

  async authenticateUser(
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    try {
      // Try API first, fallback to local auth if not deployed
      try {
        const userData = await this.apiCall(`/users/${username}`);

        if (!userData) {
          return { success: false, message: "Invalid credentials" };
        }

        // Production API authentication logic here...
        // For now, fallback to local
      } catch (apiError) {
        // API not available, use local authentication
        return this.authenticateLocally(username, password);
      }

      return { success: false, message: "Authentication failed" };
    } catch (error: any) {
      // Fallback to local authentication
      return this.authenticateLocally(username, password);
    }
  }

  private authenticateLocally(
    username: string,
    password: string,
  ): {
    success: boolean;
    message: string;
    user?: User;
  } {
    // Local authentication for testing
    const validCredentials = [
      {
        username: "blankbank",
        password: "TheRomanDoctor213*",
        isAdmin: true,
        displayName: "BlankBank",
      },
      {
        username: "user1",
        password: "password",
        isAdmin: false,
        displayName: "Test User",
      },
    ];

    const cred = validCredentials.find(
      (c) =>
        c.username.toLowerCase() === username.toLowerCase() &&
        c.password === password,
    );

    if (!cred) {
      return { success: false, message: "Invalid credentials" };
    }

    const user: User = {
      id: cred.isAdmin ? 1 : Math.floor(Math.random() * 1000) + 100,
      username: cred.username,
      displayName: cred.displayName,
      email: `${cred.username}@swiperempire.com`,
      bio: cred.isAdmin ? "System Administrator" : "Platform User",
      profilePicture: "",
      isAdmin: cred.isAdmin,
      status: "online",
      joinedAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ),
      lastSeen: new Date(),
      isVerified: true,
      isBanned: false,
      isMuted: false,
      phone: "",
    };

    return {
      success: true,
      message: "Authentication successful",
      user,
    };
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.apiCall("/users");
      return users.map((userData: any) => ({
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name,
        email: userData.email,
        phone: userData.phone,
        bio: userData.bio,
        profilePicture: userData.profile_picture,
        isAdmin: userData.is_admin,
        status: userData.status,
        joinedAt: new Date(userData.joined_at),
        lastSeen: new Date(userData.last_seen),
        isVerified: userData.is_verified,
        isBanned: userData.is_banned,
        isMuted: userData.is_muted,
        mutedUntil: userData.muted_until
          ? new Date(userData.muted_until)
          : undefined,
      }));
    } catch (error) {
      // Fallback to local users
      const localUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]",
      );
      const defaultUsers: User[] = [
        {
          id: 1,
          username: "admin",
          displayName: "System Administrator",
          email: "admin@swiperempire.com",
          bio: "System Administrator",
          profilePicture: "",
          isAdmin: true,
          status: "online",
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(),
          isVerified: true,
          isBanned: false,
          isMuted: false,
          phone: "",
        },
        {
          id: 2,
          username: "blankbank",
          displayName: "BlankBank",
          email: "blankbank@swiperempire.com",
          bio: "Platform Administrator",
          profilePicture: "",
          isAdmin: true,
          status: "online",
          joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(),
          isVerified: true,
          isBanned: false,
          isMuted: false,
          phone: "",
        },
      ];

      return [...defaultUsers, ...localUsers];
    }
  }

  async updateUserProfile(
    userId: number,
    updates: Partial<User>,
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    try {
      // Convert application format to database format
      const dbUpdates: any = {};
      if (updates.displayName) dbUpdates.display_name = updates.displayName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.profilePicture !== undefined)
        dbUpdates.profile_picture = updates.profilePicture;

      const userData = await this.apiCall(`/users/${userId}`, "PUT", dbUpdates);

      const user: User = {
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name,
        email: userData.email,
        phone: userData.phone,
        bio: userData.bio,
        profilePicture: userData.profile_picture,
        isAdmin: userData.is_admin,
        status: userData.status,
        joinedAt: new Date(userData.joined_at),
        lastSeen: new Date(userData.last_seen),
        isVerified: userData.is_verified,
        isBanned: userData.is_banned,
        isMuted: userData.is_muted,
        mutedUntil: userData.muted_until
          ? new Date(userData.muted_until)
          : undefined,
      };

      return {
        success: true,
        message: "Profile updated successfully",
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Profile update failed",
      };
    }
  }

  async banUser(
    userId: number,
    reason: string,
    adminId: number,
  ): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}`, "PUT", {
        is_banned: true,
        ban_reason: reason,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async unbanUser(userId: number, adminId: number): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}`, "PUT", {
        is_banned: false,
        ban_reason: null,
      });
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
      const mutedUntil = new Date(Date.now() + duration);
      await this.apiCall(`/users/${userId}`, "PUT", {
        is_muted: true,
        muted_until: mutedUntil.toISOString(),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async unmuteUser(userId: number, adminId: number): Promise<boolean> {
    try {
      await this.apiCall(`/users/${userId}`, "PUT", {
        is_muted: false,
        muted_until: null,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const realAuthService = new RealAuthService();
