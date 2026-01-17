"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { CardBadge, AIGeneratedBadge } from "@/components/ui-kit/card-badge";
import { Plus, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import { ListPaginationFooter } from "@/components/ui-kit/list-pagination-footer";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useI18n } from "@/lib/i18n";
import { CreateTemplateDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { TableRowActions, buildTemplateActions } from "@/components/ui-kit/table-row-actions";
import { ActivityHistoryDialog } from "@/components/dashboard/activity-history-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";

import { ClientTabs } from "@/components/ui-kit/motion-tabs/client-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";
import { ClientContentSkeleton } from "@/components/skeletons/client-content-skeleton";

interface Template {
    id: string;
    name: string;
    description: string | null;
    htmlContent: string | null;
    createdAt: string;
    updatedAt: string;
    campaigns: { id: string; name: string }[];
    isAIGenerated?: boolean;
}

interface TemplatesClientProps {
    client: { id: string; name: string; slug: string; brandColors: any };
    templates: Template[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchValue: string;
}

export function TemplatesClient({
    client,
    templates,
    totalCount,
    currentPage,
    pageSize,
    searchValue,
}: TemplatesClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { isLoading } = useTabLoading();

    // Edit Details State
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    // Duplicate State
    const [isDuplicating, setIsDuplicating] = useState(false);

    // Activity Dialog State
    const [activityDialogOpen, setActivityDialogOpen] = useState(false);
    const [activityTemplate, setActivityTemplate] = useState<Template | null>(null);

    useEffect(() => {
        setOverride(client.slug, client.name);

        // Only refresh if we're coming back from the editor (flag set by editor on mount)
        if (typeof window !== 'undefined' && sessionStorage.getItem('editor-session-active')) {
            sessionStorage.removeItem('editor-session-active');
            router.refresh();
        }

        return () => removeOverride(client.slug);
    }, [client.slug, client.name, setOverride, removeOverride, router]);

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

    const handleConfirmDelete = async () => {
        if (!deletingTemplate) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/templates/${deletingTemplate.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Template deleted successfully");
                setDeleteDialogOpen(false);
                setDeletingTemplate(null);
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || "Failed to delete template");
            }
        } catch (error) {
            toast.error("Failed to delete template");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDuplicate = async (template: Template) => {
        setIsDuplicating(true);
        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${template.name} (Copy)`,
                    description: template.description,
                    clientId: client.id,
                    duplicateFromId: template.id,
                    htmlContent: template.htmlContent,
                }),
            });

            if (res.ok) {
                toast.success("Template duplicated");
                router.refresh();
            } else {
                toast.error("Failed to duplicate template");
            }
        } catch (error) {
            toast.error("Failed to duplicate template");
        } finally {
            setIsDuplicating(false);
        }
    };

    const columns: Column<Template>[] = [
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
            render: (template) => (
                <div>
                    <Link
                        href={`/dashboard/clients/${client.slug}/templates/${template.id}`}
                        className="font-medium hover:underline"
                    >
                        {template.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {template.description || "No description"}
                    </p>
                </div>
            ),
        },
        {
            key: "status",
            header: t.tables?.status || "Status",
            render: (template) => (
                <div className="flex flex-wrap gap-1">
                    {template.isAIGenerated && (
                        <AIGeneratedBadge size="sm" />
                    )}
                    {template.htmlContent ? (
                        <CardBadge variant="border" color="green" className="text-[10px]">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                        </CardBadge>
                    ) : (
                        <CardBadge variant="border" color="orange" className="text-[10px]">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Edited
                        </CardBadge>
                    )}
                </div>
            ),
        },
        {
            key: "campaigns",
            header: t.tables?.campaigns || "Used In",
            render: (template) => (
                template.campaigns.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {template.campaigns.slice(0, 2).map((c) => (
                            <CardBadge key={c.id} variant="border" color="green" className="text-[10px]">
                                {c.name}
                            </CardBadge>
                        ))}
                        {template.campaigns.length > 2 && (
                            <CardBadge variant="border" color="gray" className="text-[10px]">
                                +{template.campaigns.length - 2}
                            </CardBadge>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                )
            ),
        },
        {
            key: "updatedAt",
            header: t.tables?.updatedAt || "Last Updated",
            sortable: true,
            render: (template) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(template.updatedAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (template) => (
                <TableRowActions
                    disabled={isDuplicating}
                    actions={buildTemplateActions({
                        template,
                        onOpenEditor: () => router.push(`/dashboard/clients/${client.slug}/templates/${template.id}`),
                        onEdit: () => {
                            setEditingTemplate(template);
                            setIsCreateDialogOpen(true);
                        },
                        onDuplicate: () => handleDuplicate(template),
                        onViewActivity: () => {
                            setActivityTemplate(template);
                            setActivityDialogOpen(true);
                        },
                        onDelete: () => {
                            setDeletingTemplate(template);
                            setDeleteDialogOpen(true);
                        },
                    })}
                />
            ),
        },
    ];

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
                        <span className="hidden sm:inline">{t.templates?.createTemplate || "Create Template"}</span>
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
                            templates.length === 0 ? "flex-1 justify-center" : ""
                        )}>
                            {templates.length > 0 && (
                                <>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">{t.templates?.title || "Templates"}</h1>
                                        <p className="text-muted-foreground">{t.templates?.description || "Manage your email templates."}</p>
                                    </div>

                                    <FilterBar
                                        searchValue={searchValue}
                                        onSearchChange={handleSearch}
                                        searchPlaceholder={t.templates?.searchPlaceholder || "Search templates..."}
                                        onClearFilters={handleClearFilters}
                                    />
                                </>
                            )}

                            {templates.length > 0 ? (
                                <DataTable
                                    data={templates}
                                    columns={columns}
                                    currentPage={currentPage}
                                    totalItems={totalCount}
                                    pageSize={pageSize}
                                    pageSizeOptions={[10, 20, 30, 40, 50]}
                                    emptyMessage={t.templates?.noTemplates || "No templates found"}
                                    emptyIcon={<FileText className="h-10 w-10 text-muted-foreground/40" />}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <InteractiveDashedCard
                                        title={t.templates?.noTemplates || "No Templates"}
                                        description={t.templates?.noTemplatesDesc || "Create your first template to start designing your emails."}
                                        actionTitle={t.templates?.createTemplate || "Create Template"}
                                        icon={FileText}
                                        color="green"
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

            <CreateTemplateDialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) setEditingTemplate(null);
                }}
                clientId={client.id}
                initialData={editingTemplate ? {
                    id: editingTemplate.id,
                    name: editingTemplate.name,
                    description: editingTemplate.description,
                    client: { id: client.id }
                } : null}
                onTemplateCreated={() => {
                    setEditingTemplate(null);
                    router.refresh();
                }}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title={`Delete "${deletingTemplate?.name}"?`}
                description="This action cannot be undone. This will permanently delete the template."
                loading={deleteLoading}
            />

            {/* Activity History Dialog */}
            {activityTemplate && (
                <ActivityHistoryDialog
                    open={activityDialogOpen}
                    onOpenChange={setActivityDialogOpen}
                    templateId={activityTemplate.id}
                    templateName={activityTemplate.name}
                />
            )}
        </div>
    );
}
