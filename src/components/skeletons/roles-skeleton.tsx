"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function RolesSkeleton() {
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
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{(t as any)?.roles?.newRole || "New Role"}</span>
                </Button>
            </div>

            {/* Roles Grid Skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col p-6 bg-card rounded-xl border shadow-none space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-4/5" />
                        </div>
                        <div className="pt-4 flex items-center justify-between mt-auto">
                            <Skeleton className="h-8 w-24 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
