"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail,
    Users,
    FileText,
    Plus,
    Globe,
    Settings,
    Link as LinkIcon,
    Lock,
    Unlock,
    Calendar,
    AlertCircle,
    ChevronRight,
    CheckCircle,
    XCircle,
    History,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Pencil,
    Copy,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useEffect } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import { CreateAudienceDialog } from "@/components/dashboard/create-entity-dialog";
import { NavigationCard } from "@/components/ui-kit/navigation-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Audience {
    id: string;
    name: string;
    description: string | null;
    contactCount: number;
    createdAt: string;
}

interface Campaign {
    id: string;
    name: string;
    subject: string | null;
    status: string;
    createdAt: string;
}


interface Template {
    id: string;
    name: string;
    description: string | null;
    htmlContent: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SmtpTestLog {
    id: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    success: boolean;
    errorMessage: string | null;
    testedAt: string;
}

interface Client {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors: any | null;
    status?: string;
    active: boolean;
    isPublic: boolean;
    smtpVerified: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        audiences: number;
        campaigns: number;
        templates: number;
        domains: number;
    };
    audiences: Audience[];
    campaigns: Campaign[];
    templates: Template[];
    smtpTestLogs?: SmtpTestLog[];
}

interface ClientDetailClientProps {
    client: Client;
    canEdit: boolean;
}

export function ClientDetailClient({ client, canEdit }: ClientDetailClientProps) {
    const { t } = useI18n();

    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams?.get("tab") || "campaigns";

    const [isPublic, setIsPublic] = useState(client.isPublic);
    const [updating, setUpdating] = useState(false);
    const [isCreateAudienceOpen, setIsCreateAudienceOpen] = useState(false);

    // Template action state
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [editForm, setEditForm] = useState({ name: "", description: "" });
    const [isEditing, setIsEditing] = useState(false);

    const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const fetchActivities = async (templateId: string) => {
        setIsLoadingActivities(true);
        try {
            const res = await fetch(`/api/templates/${templateId}/activities`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            } else {
                toast.error(t.templates.loadActivityFailed);
            }
        } catch (error) {
            console.error("Failed to fetch activities", error);
            toast.error(t.templates.loadActivityFailed);
        } finally {
            setIsLoadingActivities(false);
        }
    };

    const handleEditTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate) return;

        setIsEditing(true);
        try {
            const res = await fetch(`/api/templates/${editingTemplate.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                toast.success(t.templates.updateSuccess);
                setEditingTemplate(null);
                router.refresh();
            } else {
                toast.error(t.templates.updateFailed);
            }
        } catch (error) {
            toast.error(t.templates.updateFailed);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteTemplate = async () => {
        if (!deletingTemplate) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/templates/${deletingTemplate.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success(t.templates.deleteSuccess);
                setDeletingTemplate(null);
                router.refresh();
            } else {
                toast.error(t.templates.deleteFailed);
            }
        } catch (error) {
            toast.error(t.templates.deleteFailed);
        } finally {
            setIsDeleting(false);
        }
    };
    const { setOverride, removeOverride } = useBreadcrumbs();

    useEffect(() => {
        setOverride(client.slug, client.name);
        return () => removeOverride(client.slug);
    }, [client.slug, client.name, setOverride, removeOverride]);

    const togglePrivacy = async () => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: !isPublic }),
            });
            if (res.ok) {
                setIsPublic(!isPublic);
                toast.success(`Portal is now ${!isPublic ? "public" : "private"}`);
            }
        } catch (error) {
            toast.error("Failed to update privacy settings");
        } finally {
            setUpdating(false);
        }
    };

    const copyPortalUrl = () => {
        const url = `${window.location.origin}/portal/${client.slug}`;
        navigator.clipboard.writeText(url);
        toast.success("Portal URL copied to clipboard");
    };

    const initials = client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <PageHeader
                title={client.name}
                showBack
                onBack={() => router.push("/dashboard/clients")}
            >
                <ButtonGroup>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-foreground/80 hover:text-foreground"
                        onClick={copyPortalUrl}
                        disabled={!isPublic}
                    >
                        <LinkIcon className="h-4 w-4" />
                        {t.clients?.copyPortalLink || "Copy Portal Link"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("gap-2", isPublic ? "text-green-500 hover:text-green-600 font-medium" : "text-red-500 hover:text-red-600 font-medium")}
                        onClick={togglePrivacy}
                        disabled={updating}
                    >
                        {updating ? <Spinner /> : isPublic ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {isPublic ? (t.clients?.public || "Public") : (t.clients?.private || "Private")}
                    </Button>
                </ButtonGroup>
            </PageHeader>
            <PageContent>
                <div className="space-y-8">
                    {/* Header with Avatar Only */}
                    <div className="relative">
                        {/* Gradient Cover */}
                        <div
                            className="h-32 rounded-2xl overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${client.brandColors?.primary || '#6366f1'} 0%, ${client.brandColors?.secondary || '#a855f7'} 100%)`
                            }}
                        />

                        {/* Avatar positioned at bottom of cover */}
                        <div className="px-6 -mt-10 relative">
                            <div className="h-20 w-20 rounded-xl bg-background border-2 border-background flex items-center justify-center overflow-hidden shadow-none">
                                {client.logo ? (
                                    <img
                                        src={client.logo}
                                        alt={client.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                        <span className="text-xl font-bold text-muted-foreground">{initials}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="rounded-xl border border-dashed p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <p className="text-lg font-semibold">{client.name}</p>
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                    (client.status?.toLowerCase() === "active" || (!client.status && client.active))
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        : client.status?.toLowerCase() === "suspended"
                                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                            : "bg-red-500/10 text-red-600 border-red-500/20"
                                )}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full",
                                        (client.status?.toLowerCase() === "active" || (!client.status && client.active)) ? "bg-blue-500" :
                                            client.status?.toLowerCase() === "suspended" ? "bg-yellow-500" : "bg-red-500"
                                    )} />
                                    <span className="capitalize">{client.status || (client.active ? (t.clients?.active || "active") : (t.clients?.inactive || "inactive"))}</span>
                                </div>

                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                    client.smtpVerified
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                )}>
                                    {client.smtpVerified ? (
                                        <>
                                            <Mail className="h-3 w-3" />
                                            <span>{t.clients.smtpVerified}</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-3 w-3" />
                                            <span>{t.clients.smtpFixRequired}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Link href={`/dashboard/clients/${client.slug}/edit`}>
                                <Button size="sm" className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    {t.clients.editClient}
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.clients.slug}</p>
                                <p className="font-medium text-muted-foreground">@{client.slug}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.clients.created}</p>
                                <p className="font-medium text-muted-foreground">
                                    {new Date(client.createdAt).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.clients.lastUpdated}</p>
                                <p className="font-medium text-muted-foreground">
                                    {new Date(client.updatedAt).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards with dashed border */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: t.common.campaigns, count: client._count.campaigns, icon: Mail, color: "indigo" },
                            { label: t.common.audiences, count: client._count.audiences, icon: Users, color: "violet" },
                            { label: t.common.templates, count: client._count.templates, icon: FileText, color: "blue" },
                            { label: t.common.domains, count: client._count.domains, icon: Globe, color: "emerald" }
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="relative group rounded-xl border border-dashed border-muted-foreground/30 p-4 transition-all duration-300 hover:border-muted-foreground/50 overflow-hidden"
                            >
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                                    stat.color === "indigo" ? "bg-indigo-500/[0.05]" :
                                        stat.color === "violet" ? "bg-violet-500/[0.05]" :
                                            stat.color === "blue" ? "bg-blue-500/[0.05]" : "bg-emerald-500/[0.05]"
                                )} />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">{stat.label}</p>
                                        <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-2xl font-bold">{stat.count}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Navigation Cards to Sub-Pages */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <NavigationCard
                            href={`/dashboard/clients/${client.slug}/campaigns`}
                            icon={Mail}
                            title={t.common.campaigns}
                            description={t.clients?.campaignsDescription || "Manage email campaigns"}
                            count={client._count.campaigns}
                            color="blue"
                        />
                        <NavigationCard
                            href={`/dashboard/clients/${client.slug}/audiences`}
                            icon={Users}
                            title={t.common.audiences}
                            description={t.clients?.audiencesDescription || "Manage contacts and segments"}
                            count={client._count.audiences}
                            color="purple"
                        />
                        <NavigationCard
                            href={`/dashboard/clients/${client.slug}/templates`}
                            icon={FileText}
                            title={t.common.templates}
                            description={t.clients?.templatesDescription || "Design email templates"}
                            count={client._count.templates}
                            color="green"
                        />
                    </div>
                </div>
            </PageContent>

            <CreateAudienceDialog
                open={isCreateAudienceOpen}
                onOpenChange={setIsCreateAudienceOpen}
                clientId={client.id}
                onSuccess={() => {
                    // Refresh the page data
                    router.refresh();
                }}
            />

            {/* Edit Template Dialog */}
            <Dialog open={editingTemplate !== null} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.templates.editTitle}</DialogTitle>
                        <DialogDescription>{t.templates.editDescription}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditTemplate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t.templates.name}</Label>
                                <Input
                                    id="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">{t.templates.description}</Label>
                                <Textarea
                                    id="description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
                                {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={isEditing}>
                                {isEditing ? <Spinner className="mr-2 h-4 w-4" /> : null}
                                {t.templates.saveChanges}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Template Dialog */}
            <Dialog open={deletingTemplate !== null} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">{t.templates.deleteTitle}</DialogTitle>
                        <DialogDescription>
                            {t.templates.deleteConfirm} <strong>{deletingTemplate?.name}</strong>? {t.templates.deleteWarning}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingTemplate(null)}>
                            {t.common.cancel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTemplate}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                            {t.templates.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Template History Dialog */}
            <Dialog open={activityTemplate !== null} onOpenChange={(open) => !open && setActivityTemplate(null)}>
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
