"use client";

import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Settings, Server } from "lucide-react";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import { useI18n } from "@/lib/i18n";

export default function PostalPage() {
    const { t } = useI18n();

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <PageHeader
                title={t.postal?.title || "Postal"}
                description={t.postal?.description || "Manage your SMTP configurations and saved profiles"}
            />
            <PageContent className="flex-1 flex items-center justify-center -mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                    {/* Configure SMTP Card */}
                    <InteractiveDashedCard
                        href="/dashboard/postal/config"
                        title={t.postal?.currentConfig?.title || "Configure SMTP"}
                        description={t.postal?.currentConfig?.description || "Test and configure your SMTP settings for sending emails"}
                        actionTitle={t.postal?.openConfig || "Open Configuration"}
                        icon={Settings}
                        color="orange"
                    />

                    {/* Saved Profiles Card */}
                    <InteractiveDashedCard
                        href="/dashboard/postal/saved"
                        title={t.postal?.profiles?.title || "Saved Profiles"}
                        description={t.postal?.profiles?.description || "Manage your saved SMTP profiles for quick access"}
                        actionTitle={t.postal?.viewProfiles || "View Profiles"}
                        icon={Server}
                        color="blue"
                    />
                </div>
            </PageContent>
        </div>
    );
}
