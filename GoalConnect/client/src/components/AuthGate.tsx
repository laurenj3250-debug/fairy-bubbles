import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import LoginPage from "@/pages/Login";

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

  if (!session.data?.authenticated) {
    return <LoginPage onSuccess={() => session.refetch()} />;
  }

  return <>{children}</>;
}

export default AuthGate;
