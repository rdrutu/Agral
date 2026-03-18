import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ParcelSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 max-w-sm" />
        <Skeleton className="h-11 w-24" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-2 bg-muted" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg mb-3" />
              <div className="flex justify-end gap-2">
                 <Skeleton className="h-8 w-8 rounded-md" />
                 <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
