"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
    Users,
    LayoutGrid,
    Settings,
    Calendar,
} from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { NavigationCard } from "@/components/ui-kit/navigation-card";
import { EditAudienceDialog } from "./components/edit-audience-dialog";

interface Audience {
    id: string;
    name: string;
    description: string | null;
    contactCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    client: {
        id: string;
        name: string;
        slug: string;
    };
    _count: {
        contacts: number;
        segments: number;
    };
}

interface AudienceClientProps {
    audience: Audience;
}

export function AudienceClient({ audience: initialAudience }: AudienceClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const { setOverride, removeOverride } = useBreadcrumbs();

    const [audience, setAudience] = useState(initialAudience);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Sync state with props
    useEffect(() => {
        setAudience(initialAudience);
    }, [initialAudience]);

    // Setup Breadcrumbs
    useEffect(() => {
        setOverride(audience.client.slug, audience.client.name);
        return () => removeOverride(audience.client.slug);
    }, [audience.client.slug, audience.client.name, setOverride, removeOverride]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <PageHeader
                title={audience.name}
                showBack
                onBack={() => router.push(`/dashboard/clients/${audience.client.slug}`)}
            >
                <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditDialogOpen(true)}
                >
                    <Settings className="h-4 w-4" />
                    {t.audiences?.editDetails || "Edit Details"}
                </Button>
            </PageHeader>

            <PageContent>
                <div className="space-y-8">
                    {/* Audience Details Section */}
                    <div className="rounded-xl border border-dashed p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-lg font-semibold">{audience.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {audience.description || t.audiences?.noDescription || "No description"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {t.common?.createdAt || "Created"}
                                </p>
                                <p className="font-medium text-muted-foreground text-sm">
                                    {formatDate(audience.createdAt)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {t.common?.updatedAt || "Updated"}
                                </p>
                                <p className="font-medium text-muted-foreground text-sm">
                                    {formatDate(audience.updatedAt)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {t.audiences?.createdBy || "Created By"}
                                </p>
                                <p className="font-medium text-muted-foreground text-sm">
                                    {audience.createdBy?.name || audience.createdBy?.email || "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {t.common?.client || "Client"}
                                </p>
                                <p className="font-medium text-muted-foreground text-sm">
                                    {audience.client.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative group rounded-xl border border-dashed border-muted-foreground/30 p-4 transition-all duration-300 hover:border-muted-foreground/50 overflow-hidden">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-blue-500/[0.05]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                                        {t.common?.contacts || "Contacts"}
                                    </p>
                                    <Users className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                                <p className="text-2xl font-bold">{audience._count.contacts}</p>
                            </div>
                        </div>
                        <div className="relative group rounded-xl border border-dashed border-muted-foreground/30 p-4 transition-all duration-300 hover:border-muted-foreground/50 overflow-hidden">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-violet-500/[0.05]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                                        {t.audiences?.segments || "Segments"}
                                    </p>
                                    <LayoutGrid className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                                <p className="text-2xl font-bold">{audience._count.segments}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <NavigationCard
                            href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}/contacts`}
                            icon={Users}
                            title={t.common?.contacts || "Contacts"}
                            description={t.audiences?.contactsDescription || "Manage audience contacts"}
                            count={audience._count.contacts}
                            color="blue"
                        />
                        <NavigationCard
                            href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}/segments`}
                            icon={LayoutGrid}
                            title={t.audiences?.segments || "Segments"}
                            description={t.audiences?.segmentsDescription || "Target specific groups"}
                            count={audience._count.segments}
                            color="purple"
                        />
                    </div>
                </div>
            </PageContent>

            <EditAudienceDialog
                audience={audience}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={() => router.refresh()}
            />
        </>
    );
}
