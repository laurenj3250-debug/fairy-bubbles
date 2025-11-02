import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import LoginPage from "@/pages/Login";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const session = useSession();
  const queryClient = useQueryClient();

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  if (session.isError) {
    console.error("Failed to load session", session.error);
  }

  // Check if user is authenticated
  const isAuthenticated = session.data?.authenticated === true;

  if (!isAuthenticated) {
    return (
      <LoginPage
        onSuccess={async () => {
          // Refetch session after successful login
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        }}
      />
    );
  }

  return <>{children}</>;
}

export default AuthGate;
