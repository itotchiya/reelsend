"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function TeamSkeleton() {
    const { t } = useI18n();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Button disabled className="gap-2 opacity-50">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">{(t.team as any)?.inviteMember || "Invite Member"}</span>
                </Button>
            </div>

            {/* Team Grid Skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-none space-y-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2 text-center w-full flex flex-col items-center">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex gap-2 w-full justify-center pt-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="pt-4 w-full flex justify-center gap-2">
                            <Skeleton className="h-9 w-full rounded-md" />
                            <Skeleton className="h-9 w-10 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
