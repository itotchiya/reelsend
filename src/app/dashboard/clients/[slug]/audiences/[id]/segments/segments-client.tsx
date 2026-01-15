"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, ArrowLeft } from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { SegmentCard } from "./segment-card";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { toast } from "sonner";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import Link from "next/link";

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
}

export function SegmentsClient({ audience, segments: initialSegments }: SegmentsClientProps) {
    const router = useRouter();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();

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
            <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-2" onClick={() => router.push(newSegmentUrl)}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.createSegment || "Create Segment"}</span>
                    </Button>
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-12 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t.audiences?.segments || "Segments"}</h1>
                        <p className="text-muted-foreground">{t.audiences?.segmentsDescription || "Create targeted segments."}</p>
                    </div>

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
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                {t.audiences?.noSegments || "No segments yet"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {t.audiences?.noSegmentsDescription || "Create your first segment to target specific contacts."}
                            </p>
                            <Button className="gap-2" onClick={() => router.push(newSegmentUrl)}>
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">{t.audiences?.createSegment || "Create Segment"}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <div className="shrink-0 border-t bg-background p-4 flex justify-between items-center z-10 min-h-[64px]">
                <div className="text-xs text-muted-foreground">
                    {segments.length} segments found
                </div>
            </div>

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
