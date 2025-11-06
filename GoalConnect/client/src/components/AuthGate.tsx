import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  console.log("AuthGate render:", { loading, user: user?.email, location });

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log("AuthGate useEffect:", { loading, user: user?.email, willRedirect: !loading && !user });
    if (!loading && !user) {
      console.log("AuthGate redirecting to /login");
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Show loading while redirecting
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGate;
