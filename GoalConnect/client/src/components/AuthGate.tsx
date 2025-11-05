import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/Login";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AuthGateProps {
  children: ReactNode;
}

function SetupRequired() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="pointer-events-none absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-md border-border/60 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <CardTitle className="text-xl">Setup Required</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Supabase authentication is not configured. The app requires Supabase to be set up before it can be used.
          </p>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-semibold">Quick Setup:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Create a free Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
              <li>Get your API keys from Settings → API</li>
              <li>Add environment variables to Vercel:
                <ul className="ml-6 mt-1 space-y-1 text-xs">
                  <li>• <code className="bg-background px-1 py-0.5 rounded">VITE_SUPABASE_URL</code></li>
                  <li>• <code className="bg-background px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code></li>
                  <li>• <code className="bg-background px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code></li>
                </ul>
              </li>
              <li>Redeploy the application</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground">
            See <code className="bg-muted px-1 py-0.5 rounded">SUPABASE_SETUP.md</code> in the repository for detailed instructions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();

  // Show setup message if Supabase is not configured
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

export default AuthGate;
