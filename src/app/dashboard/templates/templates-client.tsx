"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, LayoutTemplate, Mail, Copy, Calendar, Clock, Send, CheckCircle2, History } from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CreateTemplateDialog } from "@/components/dashboard/create-template-dialog";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
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
}

interface Campaign {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string | null;
}

interface Template {
    id: string;
    name: string;
    description: string | null;
    htmlContent: string | null;
    client: Client | null;
    campaigns: Campaign[];
    createdBy: User | null;
    updatedBy: User | null;
    createdAt: Date;
    updatedAt: Date;
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

    // Update local state when initialTemplates changes (e.g., after a navigation or router.refresh())
    useEffect(() => {
        setTemplates(initialTemplates);
    }, [initialTemplates]);

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
                ) : (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
                            >
                                {/* Email Preview Area - Fixed height showing top portion of email */}
                                <div
                                    className="relative h-64 bg-muted/30 overflow-hidden cursor-pointer"
                                    onClick={() => handleOpenEditor(template)}
                                >
                                    {template.htmlContent ? (
                                        <div className="absolute inset-0 overflow-hidden">
                                            <iframe
                                                srcDoc={template.htmlContent}
                                                className="w-full h-[500px] border-0 pointer-events-none"
                                                title={`Preview of ${template.name}`}
                                                sandbox="allow-same-origin"
                                                scrolling="no"
                                                style={{
                                                    transform: 'scale(0.5)',
                                                    transformOrigin: 'top left',
                                                    width: '200%',
                                                    overflow: 'hidden'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <Mail className="h-10 w-10 text-muted-foreground/40" />
                                            <span className="text-xs text-muted-foreground">{t.templates.noPreview}</span>
                                        </div>
                                    )}

                                    {/* Hover overlay with solid white button */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors shadow-lg cursor-pointer"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            {t.templates.openEditor}
                                        </button>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">
                                                {template.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {template.description || "No description"}
                                            </p>
                                        </div>

                                        {/* More Options Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEditor(template)}>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    {t.templates.openEditor}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    {t.templates.editDetails}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDuplicate(template)}
                                                    disabled={isDuplicating}
                                                >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    {t.templates.duplicate}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openActivityDialog(template)}>
                                                    <History className="h-4 w-4 mr-2" />
                                                    {t.templates.viewActivity}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingTemplate(template)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {t.templates.delete}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Metadata Section - Clean list layout */}
                                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                                        {/* Client & Status Row */}
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] uppercase font-medium tracking-wider"
                                            >
                                                {template.client?.name || t.templates.unassigned}
                                            </Badge>
                                            {template.campaigns && template.campaigns.length > 0 ? (
                                                <Badge variant="default" className="text-[9px] bg-green-600 hover:bg-green-600">
                                                    {t.templates.inUse}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[9px]">
                                                    {t.templates.notUsed}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Details List */}
                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span className="text-foreground/60">{t.templates.created}</span>
                                                <span>{new Date(template.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-foreground/60">{t.templates.createdBy}</span>
                                                <span>{template.createdBy?.name || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-foreground/60">{t.templates.lastEdited}</span>
                                                <span>{new Date(template.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-foreground/60">{t.templates.editedBy}</span>
                                                <span>{template.updatedBy?.name || "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PageContent>

            {/* Create Template Dialog */}
            <CreateTemplateDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Template Details</DialogTitle>
                        <DialogDescription>
                            Update the name, description, and client assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Template Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Enter template name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Enter template description"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <Select
                                value={editForm.clientId || "unassigned"}
                                onValueChange={(value) => setEditForm({ ...editForm, clientId: value === "unassigned" ? "" : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
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
                            Cancel
                        </Button>
                        <Button onClick={handleEditSubmit} disabled={isEditing || !editForm.name}>
                            {isEditing && <Spinner className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Spinner className="h-4 w-4 mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Activities History Dialog */}
            <Dialog open={!!activityTemplate} onOpenChange={(open) => !open && setActivityTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t.templates.activitiesHistory}</DialogTitle>
                        <DialogDescription>
                            {t.templates.activitiesHistoryDesc} "{activityTemplate?.name}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        {isLoadingActivities ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner className="h-6 w-6" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t.templates.noActivity}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">{t.templates.action}</TableHead>
                                        <TableHead className="w-[180px]">{t.templates.user}</TableHead>
                                        <TableHead className="w-[150px]">{t.templates.date}</TableHead>
                                        <TableHead>{t.templates.description}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.map((activity) => (
                                        <TableRow key={activity.id}>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                                    {getActionLabel(activity.action)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {activity.user?.name || activity.user?.email || "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                {new Date(activity.createdAt).toLocaleString([], {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {activity.description || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActivityTemplate(null)}>
                            {t.templates.close}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
