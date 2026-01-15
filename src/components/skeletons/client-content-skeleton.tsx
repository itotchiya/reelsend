"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ClientContentSkeletonProps {
    hasFilters?: boolean;
    hasTable?: boolean;
    rowCount?: number;
    className?: string;
}

export function ClientContentSkeleton({
    hasFilters = true,
    hasTable = true,
    rowCount = 5,
    className
}: ClientContentSkeletonProps) {
    return (
        <div className={cn("p-6 md:p-8 space-y-6 animate-in fade-in duration-500 overflow-hidden", className)}>
            {/* Title & Description Skeleton */}
            <div className="space-y-3">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-96 max-w-full rounded-md" />
            </div>

            {/* Filter Bar Skeleton */}
            {hasFilters && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Skeleton className="h-10 w-24 rounded-xl flex-1 sm:flex-none" />
                        <Skeleton className="h-10 w-24 rounded-xl flex-1 sm:flex-none" />
                    </div>
                </div>
            )}

            {/* Table Skeleton */}
            {hasTable && (
                <div className="rounded-2xl border border-dashed overflow-hidden bg-muted/5">
                    <div className="h-12 bg-muted/30 border-b border-dashed px-6 flex items-center gap-4">
                        {/* Header cells */}
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="h-4 w-48 rounded" />
                        <Skeleton className="h-4 w-32 rounded hidden md:block" />
                        <Skeleton className="h-4 w-32 rounded hidden lg:block" />
                        <Skeleton className="h-4 w-24 rounded ml-auto" />
                    </div>
                    <div className="divide-y divide-dashed">
                        {Array.from({ length: rowCount }).map((_, i) => (
                            <div key={i} className="h-16 px-6 flex items-center gap-4">
                                <Skeleton className="h-4 w-8 rounded" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40 rounded" />
                                    <Skeleton className="h-3 w-24 rounded opacity-60" />
                                </div>
                                <Skeleton className="h-4 w-24 rounded hidden md:block ml-12" />
                                <Skeleton className="h-6 w-20 rounded-full hidden lg:block ml-12" />
                                <div className="ml-auto">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
