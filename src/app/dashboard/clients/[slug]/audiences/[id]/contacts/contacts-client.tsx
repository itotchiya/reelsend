"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, UserCircle } from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { TableRowActions } from "@/components/ui-kit/table-row-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddContactDialog } from "../components/add-contact-dialog";
import { ImportContactsDialog } from "../components/import-contacts-dialog";
import { ContactDetailDialog } from "../components/contact-detail-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";

interface Contact {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
    street: string | null;
    birthday: string | null;
    gender: string | null;
    maritalStatus: string | null;
    status: string;
    metadata: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
}

interface Audience {
    id: string;
    name: string;
    client: {
        id: string;
        name: string;
        slug: string;
    };
}

interface ContactsClientProps {
    audience: Audience;
    contacts: Contact[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchValue: string;
    statusFilter: string;
}

export function ContactsClient({
    audience,
    contacts,
    totalCount,
    currentPage,
    pageSize,
    searchValue,
    statusFilter,
}: ContactsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        setOverride(audience.client.slug, audience.client.name);
        return () => removeOverride(audience.client.slug);
    }, [audience.client.slug, audience.client.name, setOverride, removeOverride]);

    const updateUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "1" && value !== "all") {
                searchParams.set(key, value);
            }
        });
        const queryString = searchParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const handleSearch = (value: string) => {
        updateUrl({ search: value, page: "1", status: statusFilter });
    };

    const handlePageChange = (page: number) => {
        updateUrl({ search: searchValue, page: page.toString(), status: statusFilter });
    };

    const handlePageSizeChange = (size: number) => {
        updateUrl({ search: searchValue, page: "1", status: statusFilter });
    };

    const handleClearFilters = () => {
        router.push(pathname);
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`/api/audiences/${audience.id}/contacts/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${audience.name.replace(/\s+/g, "_")}_contacts.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success(t.audiences?.exportSuccess || "Contacts exported");
            } else {
                toast.error(t.audiences?.exportFailed || "Export failed");
            }
        } catch (error) {
            toast.error(t.audiences?.exportFailed || "Export failed");
        }
    };

    const handleDeleteContact = async () => {
        if (!deletingContact) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/contacts/${deletingContact.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(t.common?.success || "Contact deleted");
                setDeleteDialogOpen(false);
                setDeletingContact(null);
                router.refresh();
            } else {
                toast.error(t.common?.error || "Failed to delete");
            }
        } catch (error) {
            toast.error(t.common?.error || "Failed to delete");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRowClick = (contact: Contact) => {
        setSelectedContact(contact);
        setIsDetailOpen(true);
    };

    const columns: Column<Contact>[] = [
        {
            key: "contact",
            header: t.common?.contacts || "Contact",
            render: (contact) => (
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => handleRowClick(contact)}
                >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                            {contact.firstName || contact.lastName
                                ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                : "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "phone",
            header: "Phone",
            render: (contact) => (
                <span className="text-sm text-muted-foreground">
                    {contact.phone || "—"}
                </span>
            ),
        },
        {
            key: "country",
            header: "Country",
            render: (contact) => (
                <span className="text-sm text-muted-foreground">
                    {contact.country || "—"}
                </span>
            ),
        },
        {
            key: "status",
            header: t.contacts?.status || "Status",
            render: (contact) => (
                <Badge
                    variant="outline"
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        contact.status === "ACTIVE" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                            contact.status === "UNSUBSCRIBED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                "bg-muted text-muted-foreground"
                    )}
                >
                    {contact.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: t.contacts?.createdAt || "Added",
            sortable: true,
            render: (contact) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(contact.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (contact) => (
                <TableRowActions
                    actions={[
                        {
                            type: "view",
                            label: "View Details",
                            onClick: () => handleRowClick(contact),
                        },
                        {
                            type: "delete",
                            label: t.common?.delete || "Delete",
                            onClick: () => {
                                setDeletingContact(contact);
                                setDeleteDialogOpen(true);
                            },
                            danger: true,
                            separatorBefore: true,
                        },
                    ]}
                />
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={t.common?.contacts || "Contacts"}
                showBack
                onBack={() => router.push(`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`)}
            >
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.exportContacts || "Export CSV"}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.details?.importContacts || "Import CSV"}</span>
                    </Button>
                    <Button size="sm" className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.details?.addContact || "Add Contact"}</span>
                    </Button>
                </div>
            </PageHeader>

            <PageContent>
                <div className="space-y-6">
                    <FilterBar
                        searchValue={searchValue}
                        onSearchChange={handleSearch}
                        searchPlaceholder={t.audiences?.details?.searchContacts || "Search contacts..."}
                        onClearFilters={handleClearFilters}
                    />

                    <DataTable
                        data={contacts}
                        columns={columns}
                        currentPage={currentPage}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[20, 50, 100]}
                        emptyMessage={t.audiences?.noContactsFound || "No contacts found"}
                        emptyIcon={<UserCircle className="h-10 w-10 text-muted-foreground/40" />}
                    />
                </div>
            </PageContent>

            <AddContactDialog
                audienceId={audience.id}
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => router.refresh()}
            />

            <ImportContactsDialog
                audienceId={audience.id}
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onSuccess={() => router.refresh()}
            />

            <ContactDetailDialog
                contact={selectedContact}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                onSuccess={() => router.refresh()}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteContact}
                title={`${t.common?.delete || "Delete"} "${deletingContact?.email}"?`}
                description={t.audiences?.deleteContactConfirm || "This action cannot be undone."}
                loading={deleteLoading}
            />
        </>
    );
}
