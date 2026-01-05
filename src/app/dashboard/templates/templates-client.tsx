"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { TemplateCard, TemplateCardData } from "@/components/ui-kit/template-card";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui-kit/pagination";
import { CreateTemplateDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { ActivityHistoryDialog } from "@/components/dashboard/activity-history-dialog";
import { toast } from "sonner";
import { LayoutTemplate } from "lucide-react";

interface TemplatesClientProps {
    initialTemplates: TemplateCardData[];
    clients: { id: string; name: string; slug: string }[];
}

const ITEMS_PER_PAGE = 12;

export function TemplatesClient({ initialTemplates, clients }: TemplatesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // States
    const [templates, setTemplates] = useState(initialTemplates);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [clientFilter, setClientFilter] = useState<string>(searchParams.get("client") || "all");
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
    const [currentPage, setCurrentPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingTemplate, setDeletingTemplate] = useState<TemplateCardData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Activity Dialog State
    const [activityDialogOpen, setActivityDialogOpen] = useState(false);
    const [activityTemplate, setActivityTemplate] = useState<TemplateCardData | null>(null);

    const [pageSize, setPageSize] = useState(16);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        return templates.filter((template) => {
            const matchesSearch =
                template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesClient = clientFilter === "all" || template.client?.id === clientFilter;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ready" && template.htmlContent) ||
                (statusFilter === "draft" && !template.htmlContent);
            return matchesSearch && matchesClient && matchesStatus;
        });
    }, [templates, searchQuery, clientFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredTemplates.length / pageSize);
    const paginatedTemplates = filteredTemplates.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Sync state with props when router refreshes
    useEffect(() => {
        setTemplates(initialTemplates);
    }, [initialTemplates]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, clientFilter, statusFilter, pageSize]);

    // Handlers
    const handleOpen = (template: TemplateCardData) => {
        if (template.client?.slug) {
            // Ensure ID is a valid string
            const templateId = typeof template.id === 'object' ? (template.id as any)?.id || String(template.id) : template.id;

            if (!templateId || templateId === '[object Object]') {
                toast.error("Error: Invalid template ID");
                return;
            }

            router.push(`/dashboard/clients/${template.client.slug}/templates/${templateId}`);
        }
    };

    const handleDelete = async () => {
        if (!deletingTemplate) return;
        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/templates/${deletingTemplate.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete");
            setTemplates(templates.filter((t) => t.id !== deletingTemplate.id));
            toast.success("Template deleted");
            setDeleteDialogOpen(false);
            setDeletingTemplate(null);
        } catch (error) {
            toast.error("Failed to delete template");
        } finally {
            setDeleteLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setClientFilter("all");
        setStatusFilter("all");
    };

    const hasActiveFilters = searchQuery || clientFilter !== "all" || statusFilter !== "all";

    return (
        <>
            <PageHeader
                title="Templates"
                description="Manage all your email templates across clients"
                action={
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                }
            />
            <PageContent>
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Clients</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="icon" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Results count */}
                    <div className="text-sm text-muted-foreground">
                        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
                    </div>

                    {/* Template Grid */}
                    {paginatedTemplates.length > 0 ? (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {paginatedTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onOpen={() => handleOpen(template)}
                                    onViewActivity={() => {
                                        setActivityTemplate(template);
                                        setActivityDialogOpen(true);
                                    }}
                                    onDelete={() => {
                                        setDeletingTemplate(template);
                                        setDeleteDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                            <p className="text-muted-foreground mb-4">
                                {hasActiveFilters
                                    ? "Try adjusting your filters"
                                    : "Create your first template to get started"}
                            </p>
                            {hasActiveFilters ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Template
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[12, 16, 24, 48]}
                    />
                </div>
            </PageContent>

            {/* Create Dialog */}
            <CreateTemplateDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onTemplateCreated={() => {
                    setCreateDialogOpen(false);
                    router.refresh();
                }}
            />

            {/* Delete Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="Delete Template"
                description={`Are you sure you want to delete "${deletingTemplate?.name}"? This action cannot be undone.`}
            />

            {/* Activity History Dialog */}
            {activityTemplate && (
                <ActivityHistoryDialog
                    open={activityDialogOpen}
                    onOpenChange={setActivityDialogOpen}
                    templateId={typeof activityTemplate.id === 'object' ? (activityTemplate.id as any)?.id || String(activityTemplate.id) : activityTemplate.id}
                    templateName={activityTemplate.name}
                />
            )}
        </>
    );
}
