"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { Plus, Users, ArrowLeft } from "lucide-react";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import { ListPaginationFooter } from "@/components/ui-kit/list-pagination-footer";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useI18n } from "@/lib/i18n";
import { CreateAudienceDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { TableRowActions, buildAudienceActions } from "@/components/ui-kit/table-row-actions";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";

import { ClientTabs } from "@/components/ui-kit/motion-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";
import { ClientContentSkeleton } from "@/components/skeletons/client-content-skeleton";

interface Audience {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: { contacts: number; segments: number };
    campaigns: { id: string; name: string }[];
}

interface AudiencesClientProps {
    client: { id: string; name: string; slug: string; brandColors: any };
    audiences: Audience[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchValue: string;
}

export function AudiencesClient({
    client,
    audiences,
    totalCount,
    currentPage,
    pageSize,
    searchValue,
}: AudiencesClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingAudience, setDeletingAudience] = useState<Audience | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { isLoading } = useTabLoading();

    useEffect(() => {
        setOverride(client.slug, client.name);
        return () => removeOverride(client.slug);
    }, [client.slug, client.name, setOverride, removeOverride]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const updateUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "1") {
                searchParams.set(key, value);
            }
        });
        const queryString = searchParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const handleSearch = (value: string) => {
        updateUrl({ search: value, page: "1" });
    };

    const handlePageChange = (page: number) => {
        updateUrl({ search: searchValue, page: page.toString(), pageSize: pageSize.toString() });
    };

    const handlePageSizeChange = (size: number) => {
        updateUrl({ search: searchValue, page: "1", pageSize: size.toString() });
    };

    const handleClearFilters = () => {
        router.push(pathname);
    };

    const columns: Column<Audience>[] = [
        {
            key: "number",
            header: t.tables?.number || "#",
            render: (_, index) => (
                <span className="text-muted-foreground text-xs">
                    {(currentPage - 1) * pageSize + index + 1}
                </span>
            ),
        },
        {
            key: "name",
            header: t.tables?.name || "Name",
            sortable: true,
            render: (audience) => (
                <div>
                    <Link
                        href={`/dashboard/clients/${client.slug}/audiences/${audience.id}`}
                        className="font-medium hover:underline"
                    >
                        {audience.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {audience.description || "No description"}
                    </p>
                </div>
            ),
        },
        {
            key: "contacts",
            header: t.tables?.contacts || "Contacts",
            render: (audience) => (
                <span className="text-sm font-medium">
                    {audience._count.contacts.toLocaleString()}
                </span>
            ),
        },
        {
            key: "segments",
            header: t.tables?.segments || "Segments",
            render: (audience) => (
                <span className="text-sm">
                    {audience._count.segments}
                </span>
            ),
        },
        {
            key: "campaigns",
            header: t.tables?.campaigns || "Used In",
            render: (audience) => (
                audience.campaigns.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {audience.campaigns.slice(0, 2).map((c) => (
                            <CardBadge key={c.id} variant="border" color="green" className="text-[10px]">
                                {c.name}
                            </CardBadge>
                        ))}
                        {audience.campaigns.length > 2 && (
                            <CardBadge variant="border" color="gray" className="text-[10px]">
                                +{audience.campaigns.length - 2}
                            </CardBadge>
                        )}
                    </div>
                ) : (
                    <CardBadge variant="border" color="orange" className="text-[10px]">
                        {t.audiences?.notUsedBadge || "Not Used"}
                    </CardBadge>
                )
            ),
        },
        {
            key: "createdAt",
            header: t.tables?.createdAt || "Created",
            sortable: true,
            render: (audience) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(audience.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (audience) => (
                <TableRowActions
                    actions={buildAudienceActions({
                        audience,
                        onView: () => router.push(`/dashboard/clients/${client.slug}/audiences/${audience.id}`),
                        onDelete: () => {
                            setDeletingAudience(audience);
                            setDeleteDialogOpen(true);
                        },
                    })}
                />
            ),
        },
    ];

    const handleConfirmDelete = async () => {
        if (!deletingAudience) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/audiences/${deletingAudience.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Audience deleted successfully");
                setDeleteDialogOpen(false);
                setDeletingAudience(null);
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || "Failed to delete audience");
            }
        } catch (error) {
            toast.error("Failed to delete audience");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${client.slug}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <ClientTabs slug={client.slug} />
                </div>

                <div className="flex items-center gap-2">
                    <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)} disabled={isLoading}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.createAudience || "Create Audience"}</span>
                    </Button>
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            {isLoading ? (
                <ClientContentSkeleton />
            ) : (
                <>
                    <main className="flex-1 flex flex-col overflow-y-auto">
                        <div className={cn(
                            "p-6 md:p-12 space-y-6 flex flex-col",
                            audiences.length === 0 ? "flex-1 justify-center" : ""
                        )}>
                            {audiences.length > 0 && (
                                <>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">{t.audiences?.title || "Audiences"}</h1>
                                        <p className="text-muted-foreground">{t.audiences?.description || "Manage your contacts and audiences."}</p>
                                    </div>

                                    <FilterBar
                                        searchValue={searchValue}
                                        onSearchChange={handleSearch}
                                        searchPlaceholder={t.audiences?.searchPlaceholder || "Search audiences..."}
                                        onClearFilters={handleClearFilters}
                                    />
                                </>
                            )}

                            {audiences.length > 0 ? (
                                <DataTable
                                    data={audiences}
                                    columns={columns}
                                    currentPage={currentPage}
                                    totalItems={totalCount}
                                    pageSize={pageSize}
                                    pageSizeOptions={[10, 20, 30, 40, 50]}
                                    emptyMessage={t.audiences?.noAudiences || "No audiences found"}
                                    emptyIcon={<Users className="h-10 w-10 text-muted-foreground/40" />}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <InteractiveDashedCard
                                        title={t.audiences?.noAudiences || "No Audiences"}
                                        description={t.audiences?.noAudiencesDescription || "Create your first audience to start managing your contacts."}
                                        actionTitle={t.audiences?.createAudience || "Create Audience"}
                                        icon={Users}
                                        color="purple"
                                        onClick={() => setIsCreateDialogOpen(true)}
                                    />
                                </div>
                            )}
                        </div>
                    </main>

                    <ListPaginationFooter
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </>
            )}

            <CreateAudienceDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                clientId={client.id}
                onSuccess={() => router.refresh()}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title={`Delete "${deletingAudience?.name}"?`}
                description="This action cannot be undone. This will permanently delete the audience and all associated contacts."
                loading={deleteLoading}
            />
        </div>
    );
}
