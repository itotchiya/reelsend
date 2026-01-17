"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, ArrowLeft } from "lucide-react";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { SegmentCard } from "./segment-card";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { toast } from "sonner";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { AudienceTabs } from "@/components/ui-kit/motion-tabs/audience-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";
import { ClientContentSkeleton } from "@/components/skeletons/client-content-skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ListPaginationFooter } from "@/components/ui-kit/list-pagination-footer";

interface Segment {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    createdBy: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    campaigns: { id: string; name: string }[];
    _count: {
        contacts: number;
    };
}

interface Audience {
    id: string;
    name: string;
    client: {
        id: string;
        name: string;
        slug: string;
    };
}

interface SegmentsClientProps {
    audience: Audience;
    segments: Segment[];
    pageSize: number;
    currentPage: number;
}

export function SegmentsClient({ audience, segments: initialSegments, pageSize, currentPage }: SegmentsClientProps) {
    const router = useRouter();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();
    const { isLoading } = useTabLoading();

    const [segments, setSegments] = useState(initialSegments);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingSegment, setDeletingSegment] = useState<Segment | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const newSegmentUrl = `/dashboard/clients/${audience.client.slug}/audiences/${audience.id}/segments/new`;

    // Sync segments with props
    useEffect(() => {
        setSegments(initialSegments);
    }, [initialSegments]);

    // Breadcrumbs
    useEffect(() => {
        setOverride(audience.client.slug, audience.client.name);
        setOverride(audience.id, audience.name);
        return () => {
            removeOverride(audience.client.slug);
            removeOverride(audience.id);
        };
    }, [audience.client.slug, audience.client.name, audience.id, audience.name, setOverride, removeOverride]);

    const updateUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams(window.location.search);
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "all") {
                searchParams.set(key, value);
            } else {
                searchParams.delete(key);
            }
        });
        const queryString = searchParams.toString();
        router.push(queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname);
    };

    const handlePageChange = (page: number) => {
        updateUrl({ page: page.toString() });
    };

    const handlePageSizeChange = (size: number) => {
        updateUrl({ pageSize: size.toString(), page: "1" });
    };

    const handleDelete = async () => {
        if (!deletingSegment) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/segments/${deletingSegment.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(t.common?.success || "Segment deleted");
                setDeleteDialogOpen(false);
                setDeletingSegment(null);
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || t.common?.error || "Failed to delete");
            }
        } catch (error) {
            toast.error(t.common?.error || "Failed to delete");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <AudienceTabs slug={audience.client.slug} id={audience.id} />
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-2" onClick={() => router.push(newSegmentUrl)} disabled={isLoading}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.createSegment || "Create Segment"}</span>
                    </Button>
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            {isLoading ? (
                <ClientContentSkeleton hasTable={false} hasFilters={false} rowCount={0} />
            ) : (
                <>
                    <main className="flex-1 flex flex-col overflow-y-auto">
                        <div className={cn(
                            "p-6 md:p-12 space-y-6 flex flex-col",
                            segments.length === 0 ? "flex-1 justify-center" : ""
                        )}>
                            {segments.length > 0 && (
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">{t.audiences?.segments || "Segments"}</h1>
                                    <p className="text-muted-foreground">{t.audiences?.segmentsDescription || "Create targeted segments."}</p>
                                </div>
                            )}

                            {segments.length > 0 ? (
                                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {segments.map((segment) => (
                                        <SegmentCard
                                            key={segment.id}
                                            segment={segment}
                                            onEdit={() => {
                                                // TODO: Implement edit page
                                                toast.info("Edit coming soon");
                                            }}
                                            onDelete={() => {
                                                setDeletingSegment(segment);
                                                setDeleteDialogOpen(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <InteractiveDashedCard
                                        title={t.audiences?.noSegments || "No Segments"}
                                        description={t.audiences?.noSegmentsDescription || "Create your first segment to target specific contacts."}
                                        actionTitle={t.audiences?.createSegment || "Create Segment"}
                                        icon={LayoutGrid}
                                        color="purple"
                                        href={newSegmentUrl}
                                    />
                                </div>
                            )}
                        </div>
                    </main>

                    <ListPaginationFooter
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={segments.length}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </>
            )}

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                title={`${t.common?.delete || "Delete"} "${deletingSegment?.name}"?`}
                description={t.audiences?.deleteSegmentConfirm || "This action cannot be undone. Contacts will not be deleted."}
                loading={deleteLoading}
            />
        </div>
    );
}
