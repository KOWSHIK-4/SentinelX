import { Shield } from 'lucide-react';

export function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4" role="status" aria-label="Loading">
      <div className="relative">
        <Shield className="h-12 w-12 text-primary animate-pulse" />
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-ping" />
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}