"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, LayoutTemplate, History, Search as SearchIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CreateTemplateDialog } from "@/components/dashboard/create-template-dialog";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import { TemplateCard } from "@/components/ui-kit/template-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Client {
    id: string;
    name: string;
    slug: string;
    brandColors?: { primary?: string; secondary?: string; cta?: string } | null;
}

interface Campaign {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string | null;
}

export interface Template {
    id: string;
    name: string;
    description: string | null;
    htmlContent: string | null;
    client: Client | null;
    campaigns: Campaign[];
    createdBy: User | null;
    updatedBy: User | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

interface TemplatesClientProps {
    initialTemplates: Template[];
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [templates, setTemplates] = useState(initialTemplates);
    const [clients, setClients] = useState<Client[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [clientFilter, setClientFilter] = useState<string>("all");
    const [editStatusFilter, setEditStatusFilter] = useState<string>("all");
    const [usageFilter, setUsageFilter] = useState<string>("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Compute filtered templates
    const filteredTemplates = useMemo(() => {
        return templates.filter((template) => {
            // Search filter
            const matchesSearch = searchQuery === "" ||
                template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.description?.toLowerCase().includes(searchQuery.toLowerCase());

            // Client filter
            const matchesClient = clientFilter === "all" ||
                (clientFilter === "unassigned" && !template.client) ||
                template.client?.id === clientFilter;

            // Edit status filter
            const matchesEditStatus = editStatusFilter === "all" ||
                (editStatusFilter === "edited" && template.htmlContent) ||
                (editStatusFilter === "not-edited" && !template.htmlContent);

            // Usage filter
            const matchesUsage = usageFilter === "all" ||
                (usageFilter === "in-use" && template.campaigns.length > 0) ||
                (usageFilter === "not-used" && template.campaigns.length === 0);

            return matchesSearch && matchesClient && matchesEditStatus && matchesUsage;
        });
    }, [templates, searchQuery, clientFilter, editStatusFilter, usageFilter]);

    // Get unique clients for filter dropdown
    const uniqueClients = useMemo(() => {
        const clientMap = new Map<string, Client>();
        templates.forEach((t) => {
            if (t.client) {
                clientMap.set(t.client.id, t.client);
            }
        });
        return Array.from(clientMap.values());
    }, [templates]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredTemplates.length / pageSize);
    const paginatedTemplates = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredTemplates.slice(startIndex, startIndex + pageSize);
    }, [filteredTemplates, currentPage, pageSize]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, clientFilter, editStatusFilter, usageFilter, pageSize]);

    // Update local state when initialTemplates changes (e.g., after a navigation or router.refresh())
    useEffect(() => {
        setTemplates(initialTemplates);
    }, [initialTemplates]);

    // Refresh data when page becomes visible (e.g., after browser back navigation)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                router.refresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [router]);

    // Edit dialog state
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [editForm, setEditForm] = useState({ name: "", description: "", clientId: "" });
    const [isEditing, setIsEditing] = useState(false);

    // Delete dialog state
    const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Duplicate state
    const [isDuplicating, setIsDuplicating] = useState(false);

    // Activity log state
    interface Activity {
        id: string;
        action: string;
        description: string | null;
        createdAt: string;
        user: { id: string; name: string | null; email: string } | null;
    }
    const [activityTemplate, setActivityTemplate] = useState<Template | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);

    // Fetch clients for the edit dialog
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/clients");
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (error) {
                console.error("Failed to fetch clients", error);
            }
        };
        fetchClients();
    }, []);

    const handleOpenEditor = (template: Template) => {
        if (template.client) {
            router.push(`/clients/${template.client.slug}/${template.id}`);
        } else {
            router.push(`/templates/${template.id}`);
        }
    };

    const openEditDialog = (template: Template) => {
        setEditingTemplate(template);
        setEditForm({
            name: template.name,
            description: template.description || "",
            clientId: template.client?.id || "",
        });
    };

    const handleEditSubmit = async () => {
        if (!editingTemplate) return;

        setIsEditing(true);
        try {
            const res = await fetch(`/api/templates/${editingTemplate.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editForm.name,
                    description: editForm.description,
                    clientId: editForm.clientId || null,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                // Find the client object for the updated template
                const updatedClient = clients.find(c => c.id === editForm.clientId) || null;
                setTemplates(prev => prev.map(t =>
                    t.id === editingTemplate.id
                        ? { ...t, name: editForm.name, description: editForm.description, client: updatedClient }
                        : t
                ));
                toast.success("Template updated successfully");
                setEditingTemplate(null);
            } else {
                toast.error("Failed to update template");
            }
        } catch (error) {
            toast.error("Failed to update template");
        } finally {
            setIsEditing(false);
        }
    };

    const handleDuplicate = async (template: Template) => {
        setIsDuplicating(true);
        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `Copy of ${template.name}`,
                    description: template.description,
                    clientId: template.client?.id,
                    htmlContent: template.htmlContent,
                    // We'll need to fetch the jsonContent from the original template
                    duplicateFromId: template.id,
                }),
            });

            if (res.ok) {
                const newTemplate = await res.json();
                // Add client info to the new template
                const client = clients.find(c => c.id === newTemplate.clientId) || template.client;
                setTemplates(prev => [{ ...newTemplate, client }, ...prev]);
                router.refresh(); // Sync server state
                toast.success("Template duplicated successfully");
            } else {
                toast.error("Failed to duplicate template");
            }
        } catch (error) {
            toast.error("Failed to duplicate template");
        } finally {
            setIsDuplicating(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTemplate) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/templates/${deletingTemplate.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id));
                toast.success("Template deleted successfully");
                setDeletingTemplate(null);
            } else {
                toast.error("Failed to delete template");
            }
        } catch (error) {
            toast.error("Failed to delete template");
        } finally {
            setIsDeleting(false);
        }
    };

    const openActivityDialog = async (template: Template) => {
        setActivityTemplate(template);
        setIsLoadingActivities(true);
        try {
            const res = await fetch(`/api/templates/${template.id}/activities`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            } else {
                toast.error("Failed to load activity log");
            }
        } catch (error) {
            toast.error("Failed to load activity log");
        } finally {
            setIsLoadingActivities(false);
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case "created": return t.templates.actionCreated;
            case "updated": return t.templates.actionContentUpdated;
            case "details_updated": return t.templates.actionDetailsUpdated;
            case "duplicated": return t.templates.actionDuplicated;
            default: return action;
        }
    };

    return (
        <>
            <PageHeader title={t.templates.title}>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t.templates.newTemplate}
                </Button>
            </PageHeader>
            <PageContent>
                {/* Filter Bar */}
                {templates.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {/* Search Input - Full width */}
                        <div className="relative w-full">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t.templates.searchPlaceholder || "Search templates..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-9 w-full"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Dropdowns - Grid layout, responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Client Filter */}
                            <Select value={clientFilter} onValueChange={setClientFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t.templates.filterByClient || "Client"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.templates.allClients || "All Clients"}</SelectItem>
                                    <SelectItem value="unassigned">{t.templates.unassigned || "Unassigned"}</SelectItem>
                                    {uniqueClients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Edit Status Filter */}
                            <Select value={editStatusFilter} onValueChange={setEditStatusFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t.templates.editStatus || "Status"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.templates.allStatus || "All Status"}</SelectItem>
                                    <SelectItem value="edited">{t.templates.edited || "Edited"}</SelectItem>
                                    <SelectItem value="not-edited">{t.templates.notEdited || "Not Edited"}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Usage Filter */}
                            <Select value={usageFilter} onValueChange={setUsageFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t.templates.usage || "Usage"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.templates.allUsage || "All"}</SelectItem>
                                    <SelectItem value="in-use">{t.templates.inUse || "In Use"}</SelectItem>
                                    <SelectItem value="not-used">{t.templates.notUsed || "Not Used"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Results count - Below filters */}
                        <div className="text-sm text-muted-foreground text-right">
                            {filteredTemplates.length} {t.templates.templatesCount || "templates"}
                        </div>
                    </div>
                )}

                {templates.length === 0 ? (
                    <div className="border border-dashed rounded-lg">
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.templates.noTemplates}</h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                {t.templates.noTemplatesDesc}
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)} size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                {t.templates.createFirst}
                            </Button>
                        </div>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="border border-dashed rounded-lg py-12 text-center">
                        <SearchIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="font-semibold mb-1">{t.templates.noResults || "No templates found"}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t.templates.noResultsDesc || "Try adjusting your filters or search query"}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                setClientFilter("all");
                                setEditStatusFilter("all");
                                setUsageFilter("all");
                            }}
                        >
                            {t.templates.clearFilters || "Clear Filters"}
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {paginatedTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={{
                                        ...template,
                                        client: template.client ? {
                                            id: template.client.id,
                                            name: template.client.name,
                                            slug: template.client.slug,
                                            primaryColor: template.client.brandColors?.primary,
                                        } : null,
                                    }}
                                    onOpen={handleOpenEditor}
                                    onEdit={openEditDialog}
                                    onDuplicate={handleDuplicate}
                                    onDelete={setDeletingTemplate}
                                    onViewActivity={openActivityDialog}
                                    labels={{
                                        openEditor: t.templates.openEditor,
                                        editDetails: t.templates.editDetails,
                                        duplicate: t.templates.duplicate,
                                        viewActivity: t.templates.viewActivity,
                                        delete: t.templates.delete,
                                        noPreview: t.templates.noPreview,
                                        noDescription: t.templates.noDescription,
                                        notYetEdited: t.templates.notYetEdited,
                                        unassigned: t.templates.unassigned,
                                        createdBy: t.templates.createdBy,
                                        editedBy: t.templates.editedBy,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls - Stacked layout */}
                        <div className="mt-6 border-t pt-4 space-y-3">
                            {/* Page Size Selector - Top row */}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t.templates.showPerPage || "Show"}
                                </span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(val) => setPageSize(Number(val))}
                                >
                                    <SelectTrigger className="w-[80px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="8">8</SelectItem>
                                        <SelectItem value="12">12</SelectItem>
                                        <SelectItem value="24">24</SelectItem>
                                        <SelectItem value="48">48</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">
                                    {t.templates.perPage || "per page"}
                                </span>
                            </div>

                            {/* Page Navigation - Bottom row, centered */}
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <span>{t.templates.page || "Page"}</span>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={Math.max(1, totalPages)}
                                        value={currentPage}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                                setCurrentPage(val);
                                            }
                                        }}
                                        className="w-14 h-8 text-center px-1"
                                    />
                                    <span>/ {Math.max(1, totalPages)}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages || totalPages <= 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </PageContent>

            {/* Create Template Dialog */}
            <CreateTemplateDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onTemplateCreated={(template) => {
                    // Find client info and add to local state for instant display
                    const client = clients.find(c => c.id === template.clientId) || null;
                    setTemplates(prev => [{ ...template, client, campaigns: [], createdBy: null, updatedBy: null }, ...prev]);
                }}
            />

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t.templates.editTitle}</DialogTitle>
                        <DialogDescription>
                            {t.templates.editDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">{t.templates.name}</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder={t.templates.createDialog.namePlaceholder}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">{t.templates.description}</Label>
                            <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder={t.templates.createDialog.descPlaceholder}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.templates.client}</Label>
                            <Select
                                value={editForm.clientId || "unassigned"}
                                onValueChange={(value) => setEditForm({ ...editForm, clientId: value === "unassigned" ? "" : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t.templates.selectClient} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">{t.templates.unassigned}</SelectItem>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditingTemplate(null)} disabled={isEditing}>
                            {t.common.cancel}
                        </Button>
                        <Button onClick={handleEditSubmit} disabled={isEditing || !editForm.name}>
                            {isEditing && <Spinner className="h-4 w-4 mr-2" />}
                            {t.templates.saveChanges}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.templates.deleteTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.templates.deleteConfirm} "{deletingTemplate?.name}"? {t.templates.deleteWarning}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Spinner className="h-4 w-4 mr-2" />}
                            {t.templates.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Activities History Dialog */}
            <Dialog open={!!activityTemplate} onOpenChange={(open) => !open && setActivityTemplate(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t.templates.activitiesHistory}</DialogTitle>
                        <DialogDescription>
                            {t.templates.activitiesHistoryDesc} {activityTemplate?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 h-[400px]">
                        {isLoadingActivities ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Spinner className="h-8 w-8" />
                                <p className="text-sm text-muted-foreground">{t.common.loading}</p>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4 border border-dashed rounded-xl">
                                <History className="h-12 w-12 text-muted-foreground/30" />
                                <p className="text-muted-foreground">{t.templates.noActivity}</p>
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto pr-4 space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="relative pl-6 pb-6 border-l last:pb-0">
                                        <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-4 border-background" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-sm">
                                                    {activity.action === "CREATED" ? t.templates.actionCreated :
                                                        activity.action === "CONTENT_UPDATED" ? t.templates.actionContentUpdated :
                                                            activity.action === "DETAILS_UPDATED" ? t.templates.actionDetailsUpdated :
                                                                activity.action === "DUPLICATED" ? t.templates.actionDuplicated :
                                                                    activity.action}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                                                    {new Date(activity.createdAt).toLocaleString('fr-FR', {
                                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            {activity.description && (
                                                <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 pl-2 mt-1">
                                                    {activity.description}
                                                </p>
                                            )}
                                            {activity.user && (
                                                <div className="flex items-center gap-1.5 mt-2 opacity-70">
                                                    <div className="h-4 w-4 bg-muted border rounded-full flex items-center justify-center overflow-hidden">
                                                        <span className="text-[8px] font-bold">{(activity.user.name || activity.user.email)[0].toUpperCase()}</span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-muted-foreground">
                                                        {activity.user.name || activity.user.email}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
