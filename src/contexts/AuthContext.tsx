import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const mockUsers: User[] = [
  {
    id: "admin-1",
    username: "BlankBank",
    displayName: "BlankBank",
    email: "admin@swiperempire.com",
    bio: "System Administrator - SwiperEmpire Founder",
    profilePicture: "",
    isAdmin: true,
    joinedAt: new Date("2024-01-01"),
    lastSeen: new Date(),
    status: "online",
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
    }
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    // Check admin credentials
    if (username === "BlankBank" && password === "TheRomanDoctor213*") {
      const adminUser = users.find((u) => u.username === "BlankBank");
      if (adminUser) {
        setCurrentUser(adminUser);
        localStorage.setItem("currentUser", JSON.stringify(adminUser));
        return true;
      }
    }

    // Check regular users
    const user = users.find((u) => u.username === username);
    if (user) {
      // In a real app, verify password hash here
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return true;
    }

    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    // Check if username already exists
    if (users.some((u) => u.username === userData.username)) {
      return false;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      bio: "",
      profilePicture: "",
      isAdmin: false,
      joinedAt: new Date(),
      lastSeen: new Date(),
      status: "online",
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  const updateProfile = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? updatedUser : u)),
      );
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
        isAuthenticated: !!currentUser,
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
