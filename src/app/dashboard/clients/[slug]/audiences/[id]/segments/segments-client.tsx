"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { SegmentCard } from "./segment-card";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { toast } from "sonner";

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
        return () => removeOverride(audience.client.slug);
    }, [audience.client.slug, audience.client.name, setOverride, removeOverride]);

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
        <>
            <PageHeader
                title={t.audiences?.segments || "Segments"}
                showBack
                onBack={() => router.push(`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`)}
            >
                <Button size="sm" className="gap-2" onClick={() => router.push(newSegmentUrl)}>
                    <Plus className="h-4 w-4" />
                    {t.audiences?.createSegment || "Create Segment"}
                </Button>
            </PageHeader>

            <PageContent>
                <div className="space-y-6">
                    {segments.length > 0 ? (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {segments.map((segment) => (
                                <SegmentCard
                                    key={segment.id}
                                    segment={segment}
                                    clientSlug={audience.client.slug}
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
                            <Button onClick={() => router.push(newSegmentUrl)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t.audiences?.createSegment || "Create Segment"}
                            </Button>
                        </div>
                    )}
                </div>
            </PageContent>

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                title={`${t.common?.delete || "Delete"} "${deletingSegment?.name}"?`}
                description={t.audiences?.deleteSegmentConfirm || "This action cannot be undone. Contacts will not be deleted."}
                loading={deleteLoading}
            />
        </>
    );
}

