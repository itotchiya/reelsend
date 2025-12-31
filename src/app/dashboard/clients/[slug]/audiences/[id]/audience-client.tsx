"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Users,
    Plus,
    Upload,
    Search,
    MoreVertical,
    Trash2,
    Mail,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { AddContactDialog } from "./components/add-contact-dialog";
import { ImportContactsDialog } from "./components/import-contacts-dialog";
import { CreateSegmentDialog } from "./components/create-segment-dialog";

interface Contact {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
    createdAt: string;
}

interface Segment {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

interface Audience {
    id: string;
    name: string;
    description: string | null;
    contactCount: number;
    client: {
        id: string;
        name: string;
        slug: string;
    };
    _count: {
        contacts: number;
    };
}

interface AudienceClientProps {
    audience: Audience;
}

export function AudienceClient({ audience: initialAudience }: AudienceClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const { setOverride, removeOverride } = useBreadcrumbs();

    // State
    const [audience, setAudience] = useState(initialAudience);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [segmentsLoading, setSegmentsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalContacts, setTotalContacts] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isCreateSegmentOpen, setIsCreateSegmentOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("contacts");

    // Setup Breadcrumbs
    useEffect(() => {
        setOverride(audience.client.slug, audience.client.name);
        return () => removeOverride(audience.client.slug);
    }, [audience.client.slug, audience.client.name, setOverride, removeOverride]);

    // Fetch Contacts
    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audience.id}/contacts?page=${page}&search=${search}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts);
                setTotalPages(data.pages);
                setTotalContacts(data.total);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    }, [audience.id, page, search, t.common.error]);

    useEffect(() => {
        if (activeTab === "contacts") {
            const timer = setTimeout(() => {
                fetchContacts();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [fetchContacts, activeTab]);

    // Fetch Segments
    const fetchSegments = useCallback(async () => {
        setSegmentsLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audience.id}/segments`);
            if (res.ok) {
                const data = await res.json();
                setSegments(data);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setSegmentsLoading(false);
        }
    }, [audience.id, t.common.error]);

    useEffect(() => {
        if (activeTab === "segments") {
            fetchSegments();
        }
    }, [fetchSegments, activeTab]);

    const handleDeleteContact = async (contactId: string) => {
        if (!confirm(t.audiences.deleteContactConfirm)) return;

        setDeletingId(contactId);
        try {
            const res = await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(t.common.success);
                fetchContacts();
                setAudience(prev => ({ ...prev, contactCount: prev.contactCount - 1 }));
            } else {
                toast.error(t.common.error);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <PageHeader
                title={audience.name}
                showBack
                onBack={() => router.push(`/dashboard/clients/${audience.client.slug}?tab=audiences`)}
            >
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsImportDialogOpen(true)}
                    >
                        <Upload className="h-4 w-4" />
                        {t.audiences.details.importContacts}
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        {t.audiences.details.addContact}
                    </Button>
                </div>
            </PageHeader>

            <PageContent>
                <div className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger value="contacts" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    {t.common.contacts}
                                </TabsTrigger>
                                <TabsTrigger value="segments" className="gap-2">
                                    <LayoutGrid className="h-4 w-4" />
                                    {t.audiences.segments}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="contacts" className="space-y-6 mt-0">
                            {/* Stats Header */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Card className="bg-dashboard-surface/50 border-none shadow-none">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">{t.audiences.totalContacts}</p>
                                                <p className="text-2xl font-bold">{totalContacts}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contacts List */}
                            <Card className="border-none shadow-none bg-dashboard-surface/30">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-lg">{t.contacts.title}</CardTitle>
                                        <CardDescription>{t.audiences.description}</CardDescription>
                                    </div>
                                    <div className="relative w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t.audiences.details.searchContacts}
                                            className="pl-9 bg-muted/50 border-none h-9"
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border border-dashed border-border/60 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="border-border/60">
                                                    <TableHead>{t.common.contacts}</TableHead>
                                                    <TableHead>{t.contacts.status}</TableHead>
                                                    <TableHead>{t.contacts.createdAt}</TableHead>
                                                    <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-48">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <Spinner />
                                                                <p className="text-sm text-muted-foreground">{t.audiences.loadingContacts}</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : contacts.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-48">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <UserCircle className="h-10 w-10 text-muted-foreground/30" />
                                                                <p className="text-muted-foreground font-medium">{t.audiences.noContactsFound}</p>
                                                                {search && (
                                                                    <Button
                                                                        variant="link"
                                                                        size="sm"
                                                                        onClick={() => setSearch("")}
                                                                    >
                                                                        {t.audiences.clearSearch}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    contacts.map((contact) => (
                                                        <TableRow key={contact.id} className="border-border/60 hover:bg-muted/10 transition-colors">
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
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
                                                            </TableCell>
                                                            <TableCell>
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
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                                {new Date(contact.createdAt).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            className="text-red-500 focus:text-red-500 cursor-pointer"
                                                                            onClick={() => handleDeleteContact(contact.id)}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            {t.audiences.deleteContact}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-end space-x-2 pt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1 || loading}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="text-xs font-medium">
                                                Page {page} of {totalPages}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === totalPages || loading}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="segments" className="mt-0">
                            <Card className="border-none shadow-none bg-dashboard-surface/30">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">{t.audiences.segments}</CardTitle>
                                        <CardDescription>Target specific groups within your audience.</CardDescription>
                                    </div>
                                    <Button size="sm" className="gap-2" onClick={() => setIsCreateSegmentOpen(true)}>
                                        <Plus className="h-4 w-4" />
                                        Create Segment
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border border-dashed border-border/60 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="border-border/60">
                                                    <TableHead>{t.common.name}</TableHead>
                                                    <TableHead>{t.common.description}</TableHead>
                                                    <TableHead>{t.common.createdAt}</TableHead>
                                                    <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {segmentsLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-48">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <Spinner />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : segments.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-48">
                                                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                                                                <LayoutGrid className="h-10 w-10 text-muted-foreground/30" />
                                                                <p className="text-muted-foreground font-medium">No segments created yet</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    segments.map((segment) => (
                                                        <TableRow key={segment.id} className="border-border/60 hover:bg-muted/10 transition-colors">
                                                            <TableCell className="font-semibold">{segment.name}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {segment.description || "No description"}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                                {new Date(segment.createdAt).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </PageContent>

            <AddContactDialog
                audienceId={audience.id}
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => {
                    fetchContacts();
                    setAudience(prev => ({ ...prev, contactCount: prev.contactCount + 1 }));
                }}
            />

            <ImportContactsDialog
                audienceId={audience.id}
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                onSuccess={() => {
                    fetchContacts();
                    router.refresh();
                }}
            />

            <CreateSegmentDialog
                audienceId={audience.id}
                open={isCreateSegmentOpen}
                onOpenChange={setIsCreateSegmentOpen}
                onSuccess={() => {
                    fetchSegments();
                    router.refresh();
                }}
            />
        </>
    );
}
