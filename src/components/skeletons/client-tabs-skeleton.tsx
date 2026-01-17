"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ClientTabsSkeleton() {
    return (
        <div className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-1 px-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-3 relative">
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}
