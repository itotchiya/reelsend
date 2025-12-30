"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InteractiveCard } from "@/components/ui/interactive-card";
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
import {
    Building2,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Users,
    Mail,
    FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Spinner } from "@/components/ui/spinner";

interface Client {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors: any | null;
    active: boolean;
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
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");

    const resetForm = () => {
        setFormName("");
        setFormSlug("");
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
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
                }),
            });

            if (res.ok) {
                const updatedClient = await res.json();
                setClients(clients.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
                setIsEditOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error(error);
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
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (client: Client) => {
        setSelectedClient(client);
        setFormName(client.name);
        setFormSlug(client.slug);
        setIsEditOpen(true);
    };

    const openDelete = (client: Client) => {
        setSelectedClient(client);
        setIsDeleteOpen(true);
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
                        {clients.map((client) => {
                            const initials = client.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);

                            return (
                                <InteractiveCard
                                    key={client.id}
                                    className="h-full"
                                    onClick={() => router.push(`/dashboard/clients/${client.slug}`)}
                                >
                                    <div className="flex flex-col h-full relative">
                                        {/* Actions Dropdown */}
                                        {(canEdit || canDelete) && (
                                            <div className="absolute top-0 right-0" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {canEdit && (
                                                            <DropdownMenuItem onClick={() => openEdit(client)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                {t.common.edit}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canDelete && (
                                                            <DropdownMenuItem
                                                                onClick={() => openDelete(client)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t.common.delete}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}

                                        {/* Logo/Avatar */}
                                        <div className="flex items-center gap-4 mb-4">
                                            {client.logo ? (
                                                <img
                                                    src={client.logo}
                                                    alt={client.name}
                                                    className="h-14 w-14 rounded-xl object-cover border"
                                                />
                                            ) : (
                                                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                                                    <span className="text-xl font-bold text-foreground">{initials}</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold truncate">{client.name}</h3>
                                                <p className="text-sm text-muted-foreground">@{client.slug}</p>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-4">
                                            <Badge variant={client.active ? "default" : "secondary"}>
                                                {client.active ? (t.clients?.active || "Active") : (t.clients?.inactive || "Inactive")}
                                            </Badge>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5" />
                                                <span>{client._count.campaigns} {t.common.campaigns?.toLowerCase() || "campaigns"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5" />
                                                <span>{client._count.audiences} {t.common.audiences?.toLowerCase() || "audiences"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5" />
                                                <span>{client._count.templates} {t.common.templates?.toLowerCase() || "templates"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </InteractiveCard>
                            );
                        })}
                    </div>
                )}

                {/* Edit Client Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t.clients?.editClient || "Edit Client"}</DialogTitle>
                            <DialogDescription>
                                {t.clients?.editClientDesc || "Update client information."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditClient} className="space-y-4 py-4">
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
                    <DialogContent className="sm:max-w-[425px]">
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
            </PageContent >
        </>
    );
}
