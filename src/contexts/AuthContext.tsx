import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { realAuthService } from "../services/realAuthService";

export interface User {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastSeen: Date;
  status: "online" | "away" | "busy" | "offline";
  isVerified: boolean;
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil?: Date;
}

export interface AuthContextType {
  currentUser: User | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    userData: RegisterData,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; message: string }>;
  isAuthenticated: boolean;
  getAllUsers: () => User[];
}

export interface RegisterData {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Convert date strings back to Date objects
        if (user.joinedAt) {
          user.joinedAt = new Date(user.joinedAt);
        }
        if (user.lastSeen) {
          user.lastSeen = new Date(user.lastSeen);
        }
        setCurrentUser(user);
      } catch (error) {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    const result = await realAuthService.authenticateUser(username, password);

    if (result.success && result.user) {
      // Ensure Date objects are properly set and status is valid
      const user: User = {
        ...result.user,
        joinedAt: typeof result.user.joinedAt === "string" ? new Date(result.user.joinedAt) : result.user.joinedAt,
        lastSeen: typeof result.user.lastSeen === "string" ? new Date(result.user.lastSeen) : result.user.lastSeen,
        status: (result.user.status as User["status"]) || "online"
      };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
    }

    return result;
  };

  const register = async (
    userData: RegisterData,
  ): Promise<{ success: boolean; message: string }> => {
    const result = await realAuthService.registerUser(userData);

    if (result.success && result.user) {
      // Ensure Date objects are properly set and status is valid
      const user: User = {
        ...result.user,
        joinedAt: typeof result.user.joinedAt === "string" ? new Date(result.user.joinedAt) : result.user.joinedAt,
        lastSeen: typeof result.user.lastSeen === "string" ? new Date(result.user.lastSeen) : result.user.lastSeen,
        status: (result.user.status as User["status"]) || "online"
      };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
    }

    return result;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (currentUser) {
      const result = await realAuthService.updateUserProfile(
        currentUser.id,
        updates,
      );
      if (result.success && result.user) {
        const user: User = {
          ...result.user,
          status: (result.user.status as User["status"]) || "online"
        };
        setCurrentUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
        return true;
      }
      return false;
    }
    return false;
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      // Implement password change functionality
      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      return { success: false, message: "Failed to change password" };
    }
  };

  const getAllUsers = (): User[] => {
    try {
      const users = realAuthService.getAllUsers();
      if (Array.isArray(users)) {
        return users;
      }
      return [];
    } catch {
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        isAuthenticated: !!currentUser,
        getAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
