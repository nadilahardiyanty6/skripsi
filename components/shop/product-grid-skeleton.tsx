import { Skeleton } from "@/components/ui/skeleton";

export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-black/5 bg-white">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
