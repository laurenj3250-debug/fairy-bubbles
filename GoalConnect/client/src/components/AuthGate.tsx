import type { ReactNode } from "react";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  // TEMPORARY: Skip all authentication checks - just render the app
  return <>{children}</>;
}

export default AuthGate;
