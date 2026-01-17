"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { TabCountBadge } from "@/components/ui-kit/card-badge";

export interface TabItem {
    name: string;
    href: string;
    active: boolean;
    onClick?: () => void;
    count?: number;
}

interface MotionTabsProps {
    tabs?: TabItem[];
    className?: string;
}

export function MotionTabs({ tabs: customTabs, className }: MotionTabsProps) {
    const pathname = usePathname();
    const { t } = useI18n();
    const settings = (t as any).settings;

    const defaultTabs: TabItem[] = [
        {
            name: settings?.tabs?.general || "General",
            href: "/dashboard/settings",
            active: pathname === "/dashboard/settings" || pathname === "/dashboard/settings/"
        },
        {
            name: settings?.tabs?.roles || "Roles & Permissions",
            href: "/dashboard/settings/roles",
            active: pathname?.startsWith("/dashboard/settings/roles")
        },
        {
            name: settings?.tabs?.team || "Team",
            href: "/dashboard/settings/team",
            active: pathname?.startsWith("/dashboard/settings/team")
        }
    ];

    const tabs = customTabs || defaultTabs;

    return (
        <nav className="relative flex items-center justify-center">
            <div className="flex items-center gap-1 p-1 bg-muted/100 rounded-full">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={(e) => {
                            if (tab.onClick) {
                                e.preventDefault();
                                tab.onClick();
                            }
                        }}
                        className={cn(
                            "relative px-4 py-2 text-sm font-medium rounded-full transition-colors z-10",
                            tab.active
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground/80"
                        )}
                    >
                        {tab.active && (
                            <motion.div
                                layoutId="settings-tab-bg"
                                className="absolute inset-0 bg-background dark:bg-white/10 rounded-full shadow-none border border-border/50 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {tab.name}
                        {tab.count !== undefined && tab.count > 0 && (
                            <TabCountBadge count={tab.count} className="ml-1.5" />
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
