import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { realAuthService } from "../services/realAuthService";

export interface User {
  id: string;
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
    const result = await authService.authenticateUser(username, password);

    if (result.success && result.user) {
      // Ensure Date objects are properly set
      if (result.user.joinedAt && typeof result.user.joinedAt === "string") {
        result.user.joinedAt = new Date(result.user.joinedAt);
      }
      if (result.user.lastSeen && typeof result.user.lastSeen === "string") {
        result.user.lastSeen = new Date(result.user.lastSeen);
      }
      setCurrentUser(result.user);
      localStorage.setItem("currentUser", JSON.stringify(result.user));
    }

    return result;
  };

  const register = async (
    userData: RegisterData,
  ): Promise<{ success: boolean; message: string }> => {
    const result = await authService.registerUser(userData);

    if (result.success && result.user) {
      // Ensure Date objects are properly set
      if (result.user.joinedAt && typeof result.user.joinedAt === "string") {
        result.user.joinedAt = new Date(result.user.joinedAt);
      }
      if (result.user.lastSeen && typeof result.user.lastSeen === "string") {
        result.user.lastSeen = new Date(result.user.lastSeen);
      }
      setCurrentUser(result.user);
      localStorage.setItem("currentUser", JSON.stringify(result.user));
    }

    return result;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (currentUser) {
      const success = await authService.updateUser(
        currentUser.username,
        updates,
      );
      if (success) {
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
      return success;
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

    return await authService.changePassword(
      currentUser.username,
      oldPassword,
      newPassword,
    );
  };

  const getAllUsers = (): User[] => {
    return authService.getAllUsers();
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
