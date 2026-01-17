"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { MotionTabs } from "./motion-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";

interface PostalTabsProps {
    profileCount?: number;
}

export function PostalTabs({ profileCount = 0 }: PostalTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useI18n();
    const { startLoading } = useTabLoading();

    const tabs = [
        {
            name: t.postal?.currentConfig?.title || "Configure SMTP",
            href: "/dashboard/postal/config",
            active: pathname?.startsWith("/dashboard/postal/config")
        },
        {
            name: t.postal?.profiles?.title || "Saved Profiles",
            href: "/dashboard/postal/saved",
            active: pathname?.startsWith("/dashboard/postal/saved"),
            count: profileCount
        }
    ];

    const handleTabClick = (href: string) => {
        if (pathname === href) return;
        startLoading(() => {
            router.push(href);
        });
    };

    return (
        <div className="hidden md:block">
            <MotionTabs
                tabs={tabs.map(tab => ({
                    ...tab,
                    onClick: () => handleTabClick(tab.href)
                }))}
            />
        </div>
    );
}
