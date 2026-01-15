"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function WizardSkeleton() {
    return (
        <div className="h-dvh bg-background flex flex-col overflow-hidden">
            {/* Header Skeleton */}
            <header className="shrink-0 h-24 flex items-center justify-between px-4 md:px-12 lg:px-24 border-b border-border bg-background">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <div className="flex gap-4">
                    <Skeleton className="h-2 w-20 rounded-full" />
                    <Skeleton className="h-2 w-20 rounded-full" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
            </header>

            {/* Content Skeleton */}
            <main className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-8">
                <div className="max-w-2xl mx-auto h-full flex flex-col space-y-8">
                    <div className="text-center space-y-4">
                        <Skeleton className="h-8 w-64 mx-auto" />
                        <Skeleton className="h-4 w-96 mx-auto" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-full rounded-md" />
                        <Skeleton className="h-32 w-full rounded-md" />
                        <Skeleton className="h-12 w-full rounded-md" />
                    </div>
                </div>
            </main>

            {/* Footer Skeleton */}
            <footer className="shrink-0 flex items-center justify-between px-4 md:px-12 lg:px-24 py-4 border-t border-border bg-background">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
            </footer>
        </div>
    );
}
