import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const session = useSession();

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

  return <>{children}</>;
}

export default AuthGate;
