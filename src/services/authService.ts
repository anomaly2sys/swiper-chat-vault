import bcrypt from "bcryptjs";

interface UserCredentials {
  username: string;
  passwordHash: string;
  email?: string;
  phone?: string;
  displayName: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastSeen: Date;
  status: "online" | "away" | "busy" | "offline";
  bio?: string;
  profilePicture?: string;
}

// Secure user database (in production, this would be a real database)
let userDatabase: Map<string, UserCredentials> = new Map();

// Initialize admin user with hashed password
const initializeAdminUser = async () => {
  const adminPasswordHash = await bcrypt.hash("TheRomanDoctor213*", 12);
  userDatabase.set("blankbank", {
    username: "BlankBank",
    passwordHash: adminPasswordHash,
    email: "admin@swiperempire.com",
    displayName: "BlankBank",
    isAdmin: true,
    joinedAt: new Date("2024-01-01"),
    lastSeen: new Date(),
    status: "online",
    bio: "System Administrator - SwiperEmpire Founder",
    profilePicture: "",
  });
};

// Initialize admin user
initializeAdminUser();

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  },

  async registerUser(userData: {
    username: string;
    password: string;
    displayName: string;
    email?: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string; user?: any }> {
    const userKey = userData.username.toLowerCase();

    if (userDatabase.has(userKey)) {
      return { success: false, message: "Username already exists" };
    }

    // Validate password strength
    if (userData.password.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
      };
    }

    try {
      const passwordHash = await this.hashPassword(userData.password);

      const newUser: UserCredentials = {
        username: userData.username,
        passwordHash,
        email: userData.email,
        phone: userData.phone,
        displayName: userData.displayName,
        isAdmin: false,
        joinedAt: new Date(),
        lastSeen: new Date(),
        status: "online",
        bio: "",
        profilePicture: "",
      };

      userDatabase.set(userKey, newUser);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return {
        success: true,
        message: "User registered successfully",
        user: { ...userWithoutPassword, id: `user-${Date.now()}` },
      };
    } catch (error) {
      return { success: false, message: "Registration failed" };
    }
  },

  async authenticateUser(
    username: string,
    password: string,
  ): Promise<{ success: boolean; message: string; user?: any }> {
    const userKey = username.toLowerCase();
    const user = userDatabase.get(userKey);

    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }

    try {
      const isPasswordValid = await this.verifyPassword(
        password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        return { success: false, message: "Invalid credentials" };
      }

      // Update last seen
      user.lastSeen = new Date();
      user.status = "online";
      userDatabase.set(userKey, user);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      return {
        success: true,
        message: "Authentication successful",
        user: {
          ...userWithoutPassword,
          id: userKey === "blankbank" ? "admin-1" : `user-${Date.now()}`,
        },
      };
    } catch (error) {
      return { success: false, message: "Authentication failed" };
    }
  },

  async updateUser(
    username: string,
    updates: Partial<UserCredentials>,
  ): Promise<boolean> {
    const userKey = username.toLowerCase();
    const user = userDatabase.get(userKey);

    if (!user) return false;

    // Don't allow updating password hash directly
    const { passwordHash, ...allowedUpdates } = updates;

    const updatedUser = { ...user, ...allowedUpdates };
    userDatabase.set(userKey, updatedUser);
    return true;
  },

  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const userKey = username.toLowerCase();
    const user = userDatabase.get(userKey);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const isOldPasswordValid = await this.verifyPassword(
      oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: "New password must be at least 8 characters long",
      };
    }

    try {
      const newPasswordHash = await this.hashPassword(newPassword);
      user.passwordHash = newPasswordHash;
      userDatabase.set(userKey, user);

      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      return { success: false, message: "Password update failed" };
    }
  },

  getAllUsers(): Array<Omit<UserCredentials, "passwordHash"> & { id: string }> {
    return Array.from(userDatabase.entries()).map(([key, user]) => {
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: key === "blankbank" ? "admin-1" : key,
      };
    });
  },

  getUserByUsername(
    username: string,
  ): (Omit<UserCredentials, "passwordHash"> & { id: string }) | null {
    const userKey = username.toLowerCase();
    const user = userDatabase.get(userKey);

    if (!user) return null;

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      id: userKey === "blankbank" ? "admin-1" : userKey,
    };
  },

  deleteUser(username: string): boolean {
    const userKey = username.toLowerCase();
    if (userKey === "blankbank") return false; // Can't delete admin
    return userDatabase.delete(userKey);
  },
};
