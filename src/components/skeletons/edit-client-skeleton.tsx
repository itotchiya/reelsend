"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function EditClientSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            <div className="space-y-8 bg-card rounded-xl border border-border/40 p-6">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>

                    {/* Full width fields */}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>

                    {/* Logo/Brand Color Area */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-32 w-32 rounded-lg" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <div className="flex gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <Skeleton className="h-12 w-12 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
            </div>
        </div>
    );
}
