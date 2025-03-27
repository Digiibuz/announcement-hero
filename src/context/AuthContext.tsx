
import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "admin" | "editor";

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  impersonateUser: (user: User) => void;
  stopImpersonating: () => void;
  originalUser: User | null;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - in a real app this would come from an API
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
    role: "admin" as Role,
  },
  {
    id: "2",
    email: "editor@example.com",
    password: "editor123",
    name: "Editor User",
    role: "editor" as Role,
    clientId: "client1",
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (via localStorage in this demo)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Check if there's an impersonation session
    const storedOriginalUser = localStorage.getItem("originalUser");
    if (storedOriginalUser) {
      setOriginalUser(JSON.parse(storedOriginalUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    
    if (!foundUser) {
      setIsLoading(false);
      throw new Error("Invalid credentials");
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = foundUser;
    
    // Store user in state and localStorage
    setUser(userWithoutPassword);
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setOriginalUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("originalUser");
  };

  // Admin impersonation functionality
  const impersonateUser = (userToImpersonate: User) => {
    // Only allow admins to impersonate
    if (!user || user.role !== "admin") return;
    
    // Store original user
    setOriginalUser(user);
    localStorage.setItem("originalUser", JSON.stringify(user));
    
    // Set the impersonated user
    setUser(userToImpersonate);
    localStorage.setItem("user", JSON.stringify(userToImpersonate));
  };

  const stopImpersonating = () => {
    if (!originalUser) return;
    
    // Restore original user
    setUser(originalUser);
    localStorage.setItem("user", JSON.stringify(originalUser));
    
    // Clear impersonation state
    setOriginalUser(null);
    localStorage.removeItem("originalUser");
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isEditor: user?.role === "editor",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating: !!originalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
