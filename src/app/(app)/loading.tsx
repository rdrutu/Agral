import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LoadingSpinner size="xl" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Se încarcă datele fermei...
      </p>
    </div>
  );
}
