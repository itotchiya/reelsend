"use client";

import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { LayoutTemplate, Layers, Briefcase } from "lucide-react";
import Link from "next/link";

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
                    <Link href="/dashboard/library/blocks" className="block group h-full">
                        <Card className="p-0 overflow-hidden border-2 border-dashed border-border/60 hover:border-orange-500 transition-all duration-500 h-full bg-card hover:bg-orange-500/[0.03] relative group">
                            <div className="p-10 flex flex-col items-center text-center space-y-8 h-full">
                                {/* Block Skeleton Visual - 3 Wide Boxes */}
                                <div className="w-full h-48 flex items-center justify-center bg-orange-500/[0.08] dark:bg-orange-500/[0.12] rounded-2xl group-hover:scale-[1.05] transition-all duration-500 ease-out">
                                    <div className="w-64 space-y-4">
                                        <div className="h-8 w-full bg-orange-500/80 dark:bg-orange-500/90 rounded-md" />
                                        <div className="h-8 w-full bg-orange-500/60 dark:bg-orange-500/70 rounded-md" />
                                        <div className="h-8 w-full bg-orange-500/40 dark:bg-orange-500/50 rounded-md" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-3xl group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors tracking-tight italic">Blocks Library</h3>
                                    <p className="text-muted-foreground text-lg max-w-[300px] leading-relaxed">
                                        Manage reusable content blocks like headers, footers, and product cards.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-lg opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 ease-out">
                                        Manage Blocks
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    {/* Blueprints Card */}
                    <Link href="/dashboard/library/templates" className="block group h-full">
                        <Card className="p-0 overflow-hidden border-2 border-dashed border-border/60 hover:border-blue-500 transition-all duration-500 h-full bg-card hover:bg-blue-500/[0.03] relative group">
                            <div className="p-10 flex flex-col items-center text-center space-y-8 h-full">
                                {/* Template Skeleton Visual - 3 Rows, Multi-box */}
                                <div className="w-full h-48 flex items-center justify-center bg-blue-500/[0.08] dark:bg-blue-500/[0.12] rounded-2xl group-hover:scale-[1.05] transition-all duration-500 ease-out">
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
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-3xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight italic">Blueprints Library</h3>
                                    <p className="text-muted-foreground text-lg max-w-[300px] leading-relaxed">
                                        Manage full-page blueprints saved from the editor.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 ease-out">
                                        Manage Blueprints
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </PageContent>
        </div>
    );
}
