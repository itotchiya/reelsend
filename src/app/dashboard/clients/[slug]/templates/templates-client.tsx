"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { CardBadge, AIGeneratedBadge } from "@/components/ui-kit/card-badge";
import { Plus, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useI18n } from "@/lib/i18n";
import { CreateTemplateDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { TableRowActions, buildTemplateActions } from "@/components/ui-kit/table-row-actions";
import { ActivityHistoryDialog } from "@/components/dashboard/activity-history-dialog";
import { toast } from "sonner";
import Link from "next/link";

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
        <>
            <PageHeader title={t.templates?.title || "Templates"} showBack>
                <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t.templates?.createTemplate || "Create Template"}
                </Button>
            </PageHeader>

            <PageContent>
                <div className="space-y-6">
                    <FilterBar
                        searchValue={searchValue}
                        onSearchChange={handleSearch}
                        searchPlaceholder={t.templates?.searchPlaceholder || "Search templates..."}
                        onClearFilters={handleClearFilters}
                    />

                    <DataTable
                        data={templates}
                        columns={columns}
                        currentPage={currentPage}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[16, 20, 50, 100]}
                        emptyMessage={t.templates?.noTemplates || "No templates found"}
                        emptyIcon={<FileText className="h-10 w-10 text-muted-foreground/40" />}
                    />
                </div>
            </PageContent>

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
        </>
    );
}
