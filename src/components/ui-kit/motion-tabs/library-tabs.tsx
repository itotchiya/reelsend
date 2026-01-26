"use client";

import { usePathname } from "next/navigation";
import { MotionTabs, TabItem } from "./motion-tabs";
import { useI18n } from "@/lib/i18n";

export function LibraryTabs() {
    const pathname = usePathname();
    const { t } = useI18n();

    const tabs: TabItem[] = [
        {
            name: "Blocks", // simple string fallback if translation missing, ideally t.library.blocks
            href: "/dashboard/library/blocks",
            active: pathname === "/dashboard/library/blocks" || pathname.startsWith("/dashboard/library/blocks/"),
        },
        {
            name: "Blueprints", // simple string fallback
            href: "/dashboard/library/templates",
            active: pathname === "/dashboard/library/templates" || pathname.startsWith("/dashboard/library/templates/"),
        },
    ];

    return <MotionTabs tabs={tabs} />;
}
