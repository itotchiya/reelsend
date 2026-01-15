"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar, FilterConfig } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { Plus, Mail, Clock, CheckCircle, AlertCircle, Send, Ban, ArrowLeft } from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useI18n } from "@/lib/i18n";
import { CreateCampaignDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { TableRowActions, buildCampaignActions } from "@/components/ui-kit/table-row-actions";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { Pagination } from "@/components/ui-kit/pagination";

interface Campaign {
    id: string;
    name: string;
    subject: string | null;
    status: string;
    createdAt: string;
    sentAt: string | null;
    template: { id: string; name: string } | null;
    audience: { id: string; name: string } | null;
}

interface CampaignsClientProps {
    client: { id: string; name: string; slug: string; brandColors: any };
    campaigns: Campaign[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchValue: string;
    statusFilter: string;
}

const statusConfig: Record<string, { label: string; color: "orange" | "blue" | "green" | "red" | "gray"; icon: any }> = {
    DRAFT: { label: "Draft", color: "orange", icon: Clock },
    SCHEDULED: { label: "Scheduled", color: "blue", icon: Clock },
    SENDING: { label: "Sending", color: "blue", icon: Send },
    COMPLETED: { label: "Completed", color: "green", icon: CheckCircle },
    FAILED: { label: "Failed", color: "red", icon: AlertCircle },
    CANCELLED: { label: "Cancelled", color: "gray", icon: Ban },
};

export function CampaignsClient({
    client,
    campaigns,
    totalCount,
    currentPage,
    pageSize,
    searchValue,
    statusFilter,
}: CampaignsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setOverride(client.slug, client.name);
        return () => removeOverride(client.slug);
    }, [client.slug, client.name, setOverride, removeOverride]);

    const updateUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "all" && value !== "1") {
                searchParams.set(key, value);
            }
        });
        const queryString = searchParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const handleSearch = (value: string) => {
        updateUrl({ search: value, status: statusFilter, page: "1" });
    };

    const handleFilterChange = (key: string, value: string) => {
        updateUrl({ search: searchValue, [key]: value, page: "1" });
    };

    const handlePageChange = (page: number) => {
        updateUrl({ search: searchValue, status: statusFilter, page: page.toString(), pageSize: pageSize.toString() });
    };

    const handlePageSizeChange = (size: number) => {
        updateUrl({ search: searchValue, status: statusFilter, page: "1", pageSize: size.toString() });
    };

    const handleClearFilters = () => {
        router.push(pathname);
    };

    const filters: FilterConfig[] = [
        {
            key: "status",
            label: "Status",
            options: [
                { value: "draft", label: "Draft" },
                { value: "scheduled", label: "Scheduled" },
                { value: "sending", label: "Sending" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
                { value: "cancelled", label: "Cancelled" },
            ],
        },
    ];

    const columns: Column<Campaign>[] = [
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
            render: (campaign) => (
                <div>
                    <Link
                        href={`/dashboard/clients/${client.slug}/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                    >
                        {campaign.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {campaign.subject || "No subject"}
                    </p>
                </div>
            ),
        },
        {
            key: "status",
            header: t.tables?.status || "Status",
            render: (campaign) => {
                const config = statusConfig[campaign.status] || statusConfig.DRAFT;
                const Icon = config.icon;
                return (
                    <CardBadge variant="border" color={config.color} className="text-[10px]">
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                    </CardBadge>
                );
            },
        },
        {
            key: "template",
            header: t.tables?.template || "Template",
            render: (campaign) => (
                campaign.template ? (
                    <Link
                        href={`/dashboard/clients/${client.slug}/templates/${campaign.template.id}`}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {campaign.template.name}
                    </Link>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                )
            ),
        },
        {
            key: "audience",
            header: t.tables?.audience || "Audience",
            render: (campaign) => (
                campaign.audience ? (
                    <Link
                        href={`/dashboard/clients/${client.slug}/audiences/${campaign.audience.id}`}
                        className="text-sm text-purple-600 hover:underline"
                    >
                        {campaign.audience.name}
                    </Link>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                )
            ),
        },
        {
            key: "createdAt",
            header: t.tables?.createdAt || "Created",
            sortable: true,
            render: (campaign) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (campaign) => (
                <TableRowActions
                    actions={buildCampaignActions({
                        campaign,
                        onView: () => router.push(`/dashboard/clients/${client.slug}/campaigns/${campaign.id}`),
                        onEdit: () => setEditingCampaign(campaign),
                        onDelete: () => {
                            setDeletingCampaign(campaign);
                            setDeleteDialogOpen(true);
                        },
                    })}
                />
            ),
        },
    ];

    const handleConfirmDelete = async () => {
        if (!deletingCampaign) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${deletingCampaign.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Campaign deleted successfully");
                setDeleteDialogOpen(false);
                setDeletingCampaign(null);
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || "Failed to delete campaign");
            }
        } catch (error) {
            toast.error("Failed to delete campaign");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${client.slug}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>
                <div className="flex items-center gap-2">
                    <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.campaigns?.createCampaign || "Create Campaign"}</span>
                    </Button>
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-12 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t.campaigns?.title || "Campaigns"}</h1>
                        <p className="text-muted-foreground">{t.campaigns?.description || "Manage your email campaigns."}</p>
                    </div>

                    <FilterBar
                        searchValue={searchValue}
                        onSearchChange={handleSearch}
                        searchPlaceholder={t.campaigns?.searchPlaceholder || "Search campaigns..."}
                        filters={filters}
                        filterValues={{ status: statusFilter }}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />

                    <DataTable
                        data={campaigns}
                        columns={columns}
                        currentPage={currentPage}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        // We do NOT pass onPageChange here to avoid double pagination
                        // onPageChange={handlePageChange}
                        // onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[10, 20, 30, 40, 50]}
                        emptyMessage={t.campaigns?.noCampaigns || "No campaigns found"}
                        emptyIcon={<Mail className="h-10 w-10 text-muted-foreground/40" />}
                    />
                </div>
            </main>

            <div className="shrink-0 border-t bg-background p-4 flex justify-between items-center z-10">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / pageSize)}
                    onPageChange={handlePageChange}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 20, 30, 40, 50]}
                    totalItems={totalCount}
                />
            </div>

            <CreateCampaignDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                clientId={client.id}
                onCampaignCreated={() => router.refresh()}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title={`Delete "${deletingCampaign?.name}"?`}
                description="This action cannot be undone. This will permanently delete the campaign."
                loading={deleteLoading}
            />

            {/* Edit Campaign Dialog */}
            <CreateCampaignDialog
                open={!!editingCampaign}
                onOpenChange={(open) => !open && setEditingCampaign(null)}
                clientId={client.id}
                initialData={editingCampaign ? {
                    id: editingCampaign.id,
                    name: editingCampaign.name,
                    description: editingCampaign.subject || null,
                    client: { id: client.id }
                } : undefined}
                onCampaignCreated={() => {
                    setEditingCampaign(null);
                    router.refresh();
                }}
            />
        </div>
    );
}
