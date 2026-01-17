"use client";

import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { InteractiveSkeletonDashedCard } from "@/components/ui-kit/interactive-skeleton-dashed-card";

export default function LibraryPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <PageHeader
                title="Library"
                description="Manage your email blocks and full-page blueprints"
            />
            <PageContent className="flex-1 flex items-center justify-center -mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    {/* Blocks Card */}
                    <InteractiveSkeletonDashedCard
                        href="/dashboard/library/blocks"
                        title="Blocks Library"
                        description="Manage reusable content blocks like headers, footers, and product cards."
                        actionTitle="Manage Blocks"
                        color="orange"
                        skeleton={
                            <div className="w-64 space-y-4">
                                <div className="h-8 w-full bg-orange-500/80 dark:bg-orange-500/90 rounded-md" />
                                <div className="h-8 w-full bg-orange-500/60 dark:bg-orange-500/70 rounded-md" />
                                <div className="h-8 w-full bg-orange-500/40 dark:bg-orange-500/50 rounded-md" />
                            </div>
                        }
                    />

                    {/* Blueprints Card */}
                    <InteractiveSkeletonDashedCard
                        href="/dashboard/library/templates"
                        title="Blueprints Library"
                        description="Manage full-page blueprints saved from the editor."
                        actionTitle="Manage Blueprints"
                        color="blue"
                        skeleton={
                            <div className="w-64 space-y-4">
                                {/* Row 1: Header style */}
                                <div className="h-6 w-full bg-blue-500/80 dark:bg-blue-500/90 rounded-md" />

                                {/* Row 2: Multi-box */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="h-14 col-span-2 bg-blue-500/60 dark:bg-blue-500/70 rounded-md" />
                                    <div className="h-14 col-span-1 bg-blue-500/40 dark:bg-blue-500/50 rounded-md" />
                                </div>

                                {/* Row 3: Footer style */}
                                <div className="h-8 w-full bg-blue-500/30 dark:bg-blue-500/40 rounded-md" />
                            </div>
                        }
                    />
                </div>
            </PageContent>
        </div>
    );
}
