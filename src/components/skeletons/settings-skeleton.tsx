"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSection } from "@/components/ui-kit/settings-section";
import { useI18n } from "@/lib/i18n";

function SettingsActionItemSkeleton({ position = "only" }: { position?: "first" | "middle" | "last" | "only" }) {
    let radiusClass = "rounded-[20px]";
    if (position === "first") radiusClass = "rounded-t-[20px] rounded-b-[4px]";
    if (position === "middle") radiusClass = "rounded-[4px]";
    if (position === "last") radiusClass = "rounded-t-[4px] rounded-b-[20px]";

    return (
        <div className={`flex items-center gap-4 px-4 py-4 bg-card ${radiusClass} relative`}>
            {/* Icon Skeleton */}
            <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full" />

            {/* Text Skeleton */}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
            </div>

            {/* Action Skeleton */}
            <Skeleton className="h-5 w-5 rounded-full" />
        </div>
    );
}

export function SettingsSkeleton() {
    const { t } = useI18n();
    const settings = (t as any)?.settings;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            <div className="max-w-[720px] space-y-8">
                {/* Account Section Skeleton */}
                <SettingsSection label={settings?.categories?.account || "Account"}>
                    <SettingsActionItemSkeleton position="first" />
                    <SettingsActionItemSkeleton position="middle" />
                    <SettingsActionItemSkeleton position="middle" />
                    <SettingsActionItemSkeleton position="last" />
                </SettingsSection>

                {/* Preferences Section Skeleton */}
                <SettingsSection label={settings?.categories?.preferences || "Preferences"}>
                    <SettingsActionItemSkeleton position="first" />
                    <SettingsActionItemSkeleton position="last" />
                </SettingsSection>
            </div>
        </div>
    );
}
