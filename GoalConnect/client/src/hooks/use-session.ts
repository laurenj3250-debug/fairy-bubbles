import { useQuery } from "@tanstack/react-query";
import { fetchSession, type SessionResponse } from "@/lib/auth";

export function useSession() {
  return useQuery<SessionResponse>({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
