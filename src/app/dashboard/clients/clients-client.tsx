"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Building2,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Users,
    Mail,
    FileText,
    Upload,
    Lock,
    Unlock,
    Globe,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface Client {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors: any | null;
    active: boolean;
    status: string;
    isPublic: boolean;
    smtpVerified: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        audiences: number;
        campaigns: number;
        templates: number;
    };
}

interface ClientsClientProps {
    initialClients: Client[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export function ClientsClient({
    initialClients,
    canCreate,
    canEdit,
    canDelete,
}: ClientsClientProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formLogo, setFormLogo] = useState<string | null>(null);

    const resetForm = () => {
        setFormName("");
        setFormSlug("");
        setFormLogo(null);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("clientId", selectedClient.id);

            const res = await fetch("/api/upload/client-logo", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const { url } = await res.json();
                setFormLogo(url);
                toast.success("Logo uploaded successfully");
            } else {
                const error = await res.text();
                toast.error(error || "Failed to upload logo");
            }
        } catch (error) {
            toast.error("Failed to upload logo");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleEditClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/clients/${selectedClient.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    slug: formSlug,
                    logo: formLogo,
                }),
            });

            if (res.ok) {
                const updatedClient = await res.json();
                setClients(clients.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c)));
                setIsEditOpen(false);
                resetForm();
                toast.success("Client updated successfully");
            } else {
                toast.error("Failed to update client");
            }
        } catch (error) {
            toast.error("Failed to update client");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!selectedClient) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/clients/${selectedClient.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setClients(clients.filter((c) => c.id !== selectedClient.id));
                setIsDeleteOpen(false);
                toast.success("Client deleted successfully");
            } else {
                toast.error("Failed to delete client");
            }
        } catch (error) {
            toast.error("Failed to delete client");
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (client: Client) => {
        setSelectedClient(client);
        setFormName(client.name);
        setFormSlug(client.slug);
        setFormLogo(client.logo);
        setIsEditOpen(true);
    };

    const openDelete = (client: Client) => {
        setSelectedClient(client);
        setIsDeleteOpen(true);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            {/* Sticky Page Header */}
            <PageHeader title={t.common.clients}>
                {canCreate && (
                    <Link href="/dashboard/clients/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t.clients?.addClient || "Add Client"}
                        </Button>
                    </Link>
                )}
            </PageHeader>

            {/* Page Content */}
            <PageContent>
                {clients.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {t.clients?.noClients || "No clients yet"}
                            </h3>
                            <p className="text-muted-foreground text-center mb-4 max-w-md">
                                {t.clients?.addFirstClient || "Add your first client to start managing their email campaigns."}
                            </p>
                            {canCreate && (
                                <Link href="/dashboard/clients/new">
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        {t.clients?.addFirstClientBtn || "Add Your First Client"}
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    /* Client Grid */
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {clients.map((client) => (
                            <InteractiveCard
                                key={client.id}
                                onClick={() => router.push(`/dashboard/clients/${client.slug}`)}
                                className="group h-full"
                            >
                                <div className="flex flex-col h-full space-y-5">
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="h-14 w-14 rounded-2xl border-2 border-background shadow-sm">
                                                    <AvatarImage src={client.logo || ""} className="object-cover" />
                                                    <AvatarFallback className="rounded-2xl bg-muted text-lg font-bold">
                                                        {getInitials(client.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Status Indicator Color Dot */}
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                                                    (client.status?.toLowerCase() === "active" || (!client.status && client.active)) ? "bg-blue-500" :
                                                        client.status?.toLowerCase() === "suspended" ? "bg-yellow-500" : "bg-red-500"
                                                )} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg truncate leading-tight">{client.name}</h3>
                                                <p className="text-sm text-muted-foreground/80 font-medium">@{client.slug}</p>
                                            </div>
                                        </div>

                                        {(canEdit || canDelete) && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50">
                                                            <MoreVertical className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-muted/20">
                                                        {canEdit && (
                                                            <DropdownMenuItem onClick={() => openEdit(client)} className="py-2.5 rounded-lg cursor-pointer">
                                                                <Pencil className="mr-3 h-4 w-4 opacity-70" />
                                                                <span className="font-medium">{t.common.edit}</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canDelete && (
                                                            <DropdownMenuItem
                                                                onClick={() => openDelete(client)}
                                                                className="py-2.5 rounded-lg text-destructive focus:text-destructive cursor-pointer"
                                                            >
                                                                <Trash2 className="mr-3 h-4 w-4 opacity-70" />
                                                                <span className="font-medium">{t.common.delete}</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle Section: Badges (Modern) */}
                                    <div className="flex items-center gap-2">
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

                                        {/* Portal Privacy Badge */}
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                            client.isPublic
                                                ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                                                : "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                                        )}>
                                            {client.isPublic ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                            {client.isPublic ? t.clients.public : t.clients.private}
                                        </div>

                                        {/* SMTP Status Badge */}
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                            client.smtpVerified
                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                        )}>
                                            {client.smtpVerified ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{t.clients.smtpVerified}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span>{t.clients.smtpFixRequired}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* KPI Section - Interactive Badges */}
                                    <div className="grid grid-cols-3 gap-3 pt-2 mt-auto">
                                        {[
                                            {
                                                label: t.common.campaigns,
                                                count: client._count.campaigns,
                                                icon: Mail,
                                                tab: "campaigns",
                                                color: "indigo"
                                            },
                                            {
                                                label: t.common.audiences,
                                                count: client._count.audiences,
                                                icon: Users,
                                                tab: "audiences",
                                                color: "violet"
                                            },
                                            {
                                                label: t.common.templates,
                                                count: client._count.templates,
                                                icon: FileText,
                                                tab: "templates",
                                                color: "blue"
                                            }
                                        ].map((kpi) => (
                                            <div
                                                key={kpi.tab}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/clients/${client.slug}?tab=${kpi.tab}`);
                                                }}
                                                className="relative group/kpi flex flex-col items-center justify-center p-3 rounded-2xl border border-dotted border-muted/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300 overflow-hidden cursor-pointer active:scale-95 hover:border-muted/60 hover:-translate-y-0.5"
                                            >
                                                {/* Beautiful Blur Overlay */}
                                                <div className={cn(
                                                    "absolute inset-0 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-300",
                                                    kpi.color === "indigo" ? "bg-indigo-500/[0.12]" :
                                                        kpi.color === "violet" ? "bg-violet-500/[0.12]" : "bg-blue-500/[0.12]"
                                                )} />

                                                <div className="relative flex flex-col items-center space-y-1">
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight group-hover/kpi:text-muted-foreground transition-colors">
                                                        {kpi.label}
                                                    </span>
                                                    <span className="text-xl font-black tabular-nums tracking-tight">
                                                        {kpi.count}
                                                    </span>
                                                </div>

                                                {/* Subtle Background Icon */}
                                                <kpi.icon className="absolute -bottom-1 -right-1 h-10 w-10 text-muted-foreground/5 opacity-0 group-hover/kpi:opacity-10 transition-all duration-500 rotate-12 group-hover/kpi:rotate-0 group-hover/kpi:scale-110" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </InteractiveCard>
                        ))}
                    </div>
                )}

                {/* Edit Client Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t.clients?.editClient || "Edit Client"}</DialogTitle>
                            <DialogDescription>
                                {t.clients?.editClientDesc || "Update client information."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditClient} className="space-y-4 py-4">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label>Logo</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16 rounded-lg">
                                        <AvatarImage src={formLogo || ""} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-muted text-lg font-semibold">
                                            {getInitials(formName || "C")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                        >
                                            {uploadingLogo ? (
                                                <Spinner className="h-4 w-4" />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                            Upload Logo
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PNG, JPG, WebP or SVG. Max 10MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-name">{t.clients?.clientName || "Client Name"}</Label>
                                <Input
                                    id="edit-name"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-slug">{t.clients?.slug || "Slug"}</Label>
                                <Input
                                    id="edit-slug"
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                    <Button variant="outline" type="button">{t.common.cancel}</Button>
                                </DialogClose>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Spinner /> : t.common.save}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Client Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-destructive">
                                {t.clients?.deleteClient || "Delete Client"}
                            </DialogTitle>
                            <DialogDescription>
                                {t.clients?.deleteConfirm || "Are you sure you want to delete"}{" "}
                                <strong>{selectedClient?.name}</strong>?{" "}
                                {t.clients?.deleteWarning || "This will also delete all associated campaigns, audiences, and templates."}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="outline">{t.common.cancel}</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleDeleteClient} disabled={loading}>
                                {loading ? <Spinner /> : t.common.delete}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageContent>
        </>
    );
}
