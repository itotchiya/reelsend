"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
    Users,
    LayoutGrid,
    Settings,
    Calendar,
    ArrowLeft,
} from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { NavigationCard } from "@/components/ui-kit/navigation-card";
import { EditAudienceDialog } from "./components/edit-audience-dialog";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import Link from "next/link";

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
    };
    segments: {
        id: string;
        name: string;
        campaigns?: { id: string; name: string }[];
    }[];
    campaigns?: {
        id: string;
        name: string;
    }[];
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
        setOverride(audience.id, audience.name);
        return () => {
            removeOverride(audience.client.slug);
            removeOverride(audience.id);
        };
    }, [audience.client.slug, audience.client.name, audience.id, audience.name, setOverride, removeOverride]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} - ${hours}:${minutes}`;
    };

    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${audience.client.slug}/audiences`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setIsEditDialogOpen(true)}
                    >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.editDetails || "Edit Details"}</span>
                    </Button>
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-12 space-y-8">
                    {/* Audience Details Section */}
                    <div className="rounded-xl border border-dashed p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">{audience.name}</h1>
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
                                <p className="font-medium text-sm">
                                    {formatDate(audience.createdAt)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {t.common?.updatedAt || "Updated"}
                                </p>
                                <p className="font-medium text-sm">
                                    {formatDate(audience.updatedAt)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {t.audiences?.createdBy || "Created By"}
                                </p>
                                <p className="font-medium text-sm">
                                    {audience.createdBy?.name || audience.createdBy?.email || "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {t.common?.client || "Client"}
                                </p>
                                <p className="font-medium text-sm">
                                    {audience.client.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <NavigationCard
                            href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}/contacts`}
                            icon={Users}
                            title={t.common?.contacts || "Contacts"}
                            description={t.audiences?.contactsDescription || "Manage your contact list"}
                            count={audience._count.contacts}
                            color="blue"
                            variant="minimal"
                            supportingText={t.audiences?.manageContactsImport || "Import, export or add contacts manually"}
                        />
                        <NavigationCard
                            href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}/segments`}
                            icon={LayoutGrid}
                            title={t.audiences?.segments || "Segments"}
                            description={t.audiences?.segmentsDescription || "Create targeted segments"}
                            count={audience.segments?.length || 0}
                            color="purple"
                            variant="minimal"
                            items={audience.segments?.map(s => ({ id: s.id, name: s.name })) || []}
                            emptyLabel={t.audiences?.noSegments || "No segments yet"}
                        />
                        <NavigationCard
                            href="#"
                            icon={Calendar}
                            title={t.tables?.campaigns || "Used In"}
                            description="Campaigns using this audience"
                            count={audience.campaigns?.length || 0}
                            color="orange"
                            variant="minimal"
                            items={
                                // Show segments that are used in campaigns
                                audience.segments
                                    ?.filter(s => s.campaigns && s.campaigns.length > 0)
                                    .map(s => ({ id: s.id, name: s.name })) || []
                            }
                            emptyLabel={t.audiences?.notUsedBadge || "Not used"}
                        />
                    </div>
                </div>
            </main>

            <EditAudienceDialog
                audience={audience}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}
