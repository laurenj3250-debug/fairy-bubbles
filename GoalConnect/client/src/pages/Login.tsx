import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Github } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [, setLocation] = useLocation();
  const { signIn, user } = useAuth();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user) {
      console.log("[Login] User already authenticated, redirecting to /");
      setLocation("/");
    }
  }, [user, setLocation]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log("[Login] Calling signIn...");
      const result = await signIn(email, password);
      console.log("[Login] signIn returned:", result);

      if (result.error) {
        console.log("[Login] Error from signIn:", result.error);
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success - the useEffect will handle navigation when user state updates
      console.log("[Login] Login successful, waiting for user state to update");
      // Note: Don't set isSubmitting to false here - keep the loading state
      // until the redirect happens via useEffect
    } catch (err) {
      console.error("[Login] Exception during handleSubmit:", err);
      const message = err instanceof Error ? err.message : "Unable to sign in";
      setError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="pointer-events-none absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <Card className="bg-card/40 backdrop-blur-sm border border-card-border shadow-lg topo-pattern relative z-10 w-full max-w-sm">
        <CardHeader className="relative z-10">
          <CardTitle className="text-center text-2xl">Sign in to Mountain Habit</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Enter your email and password to continue
          </p>
        </CardHeader>
        <CardContent className="relative z-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                ref={emailRef}
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/api/auth/github'}
            >
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Button>
          </form>
        </CardContent>
        <CardFooter className="relative z-10 flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
