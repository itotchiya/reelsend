"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { MotionTabs } from "./motion-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";

interface AudienceTabsProps {
    slug: string;
    id: string;
}

export function AudienceTabs({ slug, id }: AudienceTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useI18n();
    const { startLoading } = useTabLoading();

    const baseUrl = `/dashboard/clients/${slug}/audiences/${id}`;

    const tabs = [
        {
            name: t.common?.contacts || "Contacts",
            href: `${baseUrl}/contacts`,
            active: pathname?.startsWith(`${baseUrl}/contacts`)
        },
        {
            name: t.audiences?.segments || "Segments",
            href: `${baseUrl}/segments`,
            active: pathname?.startsWith(`${baseUrl}/segments`)
        },
        {
            name: t.tables?.campaigns || "Used In",
            href: `${baseUrl}/used-in`,
            active: pathname?.startsWith(`${baseUrl}/used-in`)
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
