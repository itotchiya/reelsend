import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { MotionTabs } from "@/components/ui-kit/motion-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";

interface ClientTabsProps {
    slug: string;
}

export function ClientTabs({ slug }: ClientTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useI18n();
    const { startLoading } = useTabLoading();

    const tabs = [
        {
            name: t.campaigns?.title || "Campaigns",
            href: `/dashboard/clients/${slug}/campaigns`,
            active: pathname?.startsWith(`/dashboard/clients/${slug}/campaigns`)
        },
        {
            name: t.common?.audiences || "Audiences",
            href: `/dashboard/clients/${slug}/audiences`,
            active: pathname?.startsWith(`/dashboard/clients/${slug}/audiences`)
        },
        {
            name: t.common?.templates || "Templates",
            href: `/dashboard/clients/${slug}/templates`,
            active: pathname?.startsWith(`/dashboard/clients/${slug}/templates`)
        },
        {
            name: "SMTP",
            href: `/dashboard/clients/${slug}/smtp`,
            active: pathname?.startsWith(`/dashboard/clients/${slug}/smtp`)
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

