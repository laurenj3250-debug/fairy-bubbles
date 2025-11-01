export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
}

export async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch("/api/auth/session", { credentials: "include" });

  if (!response.ok) {
    throw new Error("Failed to load session");
  }

  return await response.json();
}

export async function login(email: string, password: string): Promise<SessionResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = (payload as { error?: string }).error;
    throw new Error(error || "Invalid email or password");
  }

  return payload as SessionResponse;
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = (payload as { error?: string }).error;
    throw new Error(error || "Failed to log out");
  }
}
