"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, UserCircle, ArrowLeft, Users } from "lucide-react";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { TableRowActions } from "@/components/ui-kit/table-row-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddContactDialog } from "../components/add-contact-dialog";
import { ImportContactsDialog } from "../components/import-contacts-dialog";
import { ContactDetailDialog } from "../components/contact-detail-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { Pagination } from "@/components/ui-kit/pagination";
import { ListPaginationFooter } from "@/components/ui-kit/list-pagination-footer";
import { AudienceTabs } from "@/components/ui-kit/motion-tabs/audience-tabs";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";
import { ClientContentSkeleton } from "@/components/skeletons/client-content-skeleton";
import Link from "next/link";

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
    const { isLoading } = useTabLoading();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        setOverride(audience.client.slug, audience.client.name);
        setOverride(audience.id, audience.name);
        return () => {
            removeOverride(audience.client.slug);
            removeOverride(audience.id);
        };
    }, [audience.client.slug, audience.client.name, audience.id, audience.name, setOverride, removeOverride]);

    const updateUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams(window.location.search);
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "all") {
                searchParams.set(key, value);
            } else {
                searchParams.delete(key);
            }
        });

        // Always reset to page 1 if search or status changes, unless page is explicitly provided
        if ((params.search !== undefined || params.status !== undefined) && params.page === undefined) {
            searchParams.set("page", "1");
        }

        const queryString = searchParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const handleSearch = (value: string) => {
        updateUrl({ search: value, page: "1", status: statusFilter });
    };

    const handlePageChange = (page: number) => {
        updateUrl({ page: page.toString() });
    };

    const handlePageSizeChange = (size: number) => {
        updateUrl({ pageSize: size.toString(), page: "1" });
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

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <AudienceTabs slug={audience.client.slug} id={audience.id} />
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-2" onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.audiences?.details?.addContact || "Add Contact"}</span>
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
                            contacts.length === 0 ? "flex-1 justify-center" : ""
                        )}>
                            {contacts.length > 0 && (
                                <>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">{t.common?.contacts || "Contacts"}</h1>
                                        <p className="text-muted-foreground">{t.audiences?.contactsDescription || "Manage your contact list."}</p>
                                    </div>

                                    <FilterBar
                                        searchValue={searchValue}
                                        onSearchChange={handleSearch}
                                        searchPlaceholder={t.audiences?.details?.searchContacts || "Search contacts..."}
                                        onClearFilters={handleClearFilters}
                                        className="w-full"
                                    >
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleExport} disabled={isLoading}>
                                                <Download className="h-4 w-4" />
                                                <span className="hidden sm:inline">{t.audiences?.exportContacts || "Export CSV"}</span>
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => setIsImportDialogOpen(true)} disabled={isLoading}>
                                                <Upload className="h-4 w-4" />
                                                <span className="hidden sm:inline">{t.audiences?.details?.importContacts || "Import CSV"}</span>
                                            </Button>
                                        </div>
                                    </FilterBar>
                                </>
                            )}

                            {contacts.length > 0 ? (
                                <DataTable
                                    data={contacts}
                                    columns={columns}
                                    currentPage={currentPage}
                                    totalItems={totalCount}
                                    pageSize={pageSize}
                                    // onPageChange={handlePageChange}
                                    pageSizeOptions={[10, 20, 30, 40, 50]}
                                    emptyMessage={t.audiences?.noContactsFound || "No contacts found"}
                                    emptyIcon={<UserCircle className="h-10 w-10 text-muted-foreground/40" />}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <InteractiveDashedCard
                                        title={t.audiences?.noContacts || "No Contacts"}
                                        description={t.audiences?.noContactsDescription || "Your audience is empty. Add your first contact to get started."}
                                        actionTitle={t.audiences?.details?.addContact || "Add Contact"}
                                        icon={Users}
                                        color="blue"
                                        onClick={() => {
                                            setIsAddDialogOpen(true);
                                        }}
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
        </div>
    );
}
