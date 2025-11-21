import { Spinner } from "./Spinner";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Spinner size="xl" label={message} />
      <p className="mt-4 text-foreground/70 text-lg animate-pulse">
        {message}
      </p>
    </div>
  );
}
