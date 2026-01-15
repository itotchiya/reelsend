"use client";

import { usePathname } from "next/navigation";
import { SettingsHeader } from "@/components/ui-kit/settings-header";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Full-page wizard routes that need their own layout
    const isWizardRoute = pathname?.includes("/roles/new");

    // For wizard routes, render children directly without any wrapper
    if (isWizardRoute) {
        return <>{children}</>;
    }

    return (
        <div className="h-dvh bg-background flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="shrink-0 sticky top-0 z-50 bg-background border-b border-border/40">
                <SettingsHeader />
            </div>
            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="w-full px-4 md:px-12 lg:px-24 py-6 md:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
