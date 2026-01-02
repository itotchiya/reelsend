"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
    Building2,
    Plus,
    Upload,
    Search as SearchIcon,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ClientCard, type ClientCardData } from "@/components/ui-kit/client-card";

interface Client extends ClientCardData {
    createdAt: string;
    updatedAt: string;
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

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [smtpFilter, setSmtpFilter] = useState("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, smtpFilter, pageSize]);

    // Filtered clients
    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            // Search filter
            const searchMatch =
                searchQuery === "" ||
                client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.slug.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            let statusMatch = true;
            if (statusFilter !== "all") {
                const clientStatus = client.status?.toLowerCase() || (client.active ? "active" : "deactivated");
                statusMatch = clientStatus === statusFilter;
            }

            // SMTP filter
            let smtpMatch = true;
            if (smtpFilter === "verified") {
                smtpMatch = client.smtpVerified === true;
            } else if (smtpFilter === "notVerified") {
                smtpMatch = client.smtpVerified === false;
            }

            return searchMatch && statusMatch && smtpMatch;
        });
    }, [clients, searchQuery, statusFilter, smtpFilter]);

    // Paginated clients
    const totalPages = Math.ceil(filteredClients.length / pageSize);
    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredClients.slice(startIndex, startIndex + pageSize);
    }, [filteredClients, currentPage, pageSize]);

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

    const handleView = (client: ClientCardData) => {
        router.push(`/dashboard/clients/${client.slug}`);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const hasActiveFilters = searchQuery || statusFilter !== "all" || smtpFilter !== "all";

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setSmtpFilter("all");
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
                {/* Filter Bar - One row on desktop, stacked on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t.clients?.searchPlaceholder || "Search clients..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t.clients?.filterByStatus || "Status"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.clients?.allStatus || "All Status"}</SelectItem>
                            <SelectItem value="active">{t.clients?.active || "Active"}</SelectItem>
                            <SelectItem value="suspended">{t.clients?.suspended || "Suspended"}</SelectItem>
                            <SelectItem value="deactivated">{t.clients?.deactivated || "Deactivated"}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* SMTP Filter */}
                    <Select value={smtpFilter} onValueChange={setSmtpFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t.clients?.filterBySmtp || "SMTP Status"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.clients?.allSmtp || "All SMTP"}</SelectItem>
                            <SelectItem value="verified">{t.clients?.verified || "Verified"}</SelectItem>
                            <SelectItem value="notVerified">{t.clients?.notVerified || "Not Verified"}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Results Count */}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {filteredClients.length} {t.clients?.clientsCount || "clients"}
                    </span>
                </div>

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
                ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {t.clients?.noResults || "No clients found"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {t.clients?.noResultsDesc || "Try adjusting your search or filter criteria."}
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            {t.clients?.clearFilters || "Clear Filters"}
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Client Grid */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {paginatedClients.map((client) => (
                                <ClientCard
                                    key={client.id}
                                    client={client}
                                    onView={handleView}
                                    onEdit={(c) => openEdit(c as Client)}
                                    onDelete={(c) => openDelete(c as Client)}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    labels={{
                                        viewClient: t.clients?.viewClient || "View Client",
                                        edit: t.common.edit,
                                        delete: t.common.delete,
                                        active: t.clients?.active || "Active",
                                        suspended: t.clients?.suspended || "Suspended",
                                        deactivated: t.clients?.deactivated || "Deactivated",
                                        public: t.clients?.public || "Public",
                                        private: t.clients?.private || "Private",
                                        smtpVerified: t.clients?.smtpVerified || "SMTP Verified",
                                        smtpNotVerified: t.clients?.smtpFixRequired || "SMTP Required",
                                        campaigns: t.common.campaigns,
                                        audiences: t.common.audiences,
                                        templates: t.common.templates,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls - Horizontal on desktop, stacked on mobile */}
                        <div className="mt-6 border-t pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                {/* Page Size Selector - Left on desktop */}
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t.clients?.showPerPage || "Show"}
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
                                        {t.clients?.perPage || "per page"}
                                    </span>
                                </div>

                                {/* Page Navigation - Right on desktop */}
                                <div className="flex items-center justify-center sm:justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>{t.clients?.page || "Page"}</span>
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
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages || totalPages <= 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
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
