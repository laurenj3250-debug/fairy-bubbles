import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    console.log("checkSession starting...");
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      console.log("checkSession response:", { ok: response.ok, status: response.status });

      if (response.ok) {
        const data = await response.json();
        console.log("checkSession data:", data);
        if (data.authenticated && data.user) {
          setUser(data.user);
          console.log("checkSession: user authenticated:", data.user.email);
        } else {
          console.log("checkSession: no user authenticated");
        }
      } else {
        console.log("checkSession: response not ok");
      }
    } catch (error) {
      console.error("Failed to check session:", error);
    } finally {
      console.log("checkSession complete, setting loading=false");
      setLoading(false);
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to create account" };
      }

      if (data.user) {
        setUser(data.user);
      }

      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to create account" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Invalid email or password" };
      }

      if (data.user) {
        setUser(data.user);
      }

      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to sign in" };
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
