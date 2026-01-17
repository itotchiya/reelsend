"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSection } from "@/components/ui-kit/settings-section";

function SmtpProfileSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/50">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
        </div>
    );
}

export function SmtpSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            <div className="max-w-[720px] space-y-8">
                {/* SMTP Profiles Section */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-3">
                        <SmtpProfileSkeleton />
                        <SmtpProfileSkeleton />
                    </div>
                </div>

                {/* Configuration Form Logic Skeleton */}
                <div className="space-y-6 pt-6 border-t border-dashed">
                    <Skeleton className="h-6 w-40" />
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
