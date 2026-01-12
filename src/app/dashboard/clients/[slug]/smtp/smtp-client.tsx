"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Server, Pencil, Trash2, Eye, EyeOff, Copy, Shield, ShieldOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { EditProfileNameDialog, DeleteProfileDialog } from "@/components/dashboard/smtp-profile-dialogs";

interface SmtpProfile {
    id: string;
    name: string;
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
    defaultFromEmail: string | null;
    createdAt: string;
    updatedAt: string;
}

interface Client {
    id: string;
    name: string;
    slug: string;
    smtpProfiles: SmtpProfile[];
}

interface SmtpClientProps {
    client: Client;
    canEdit: boolean;
}

export function SmtpClient({ client, canEdit }: SmtpClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [profiles, setProfiles] = useState<SmtpProfile[]>(client.smtpProfiles);
    const [searchValue, setSearchValue] = useState("");

    // Password visibility state (per profile)
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Edit Name Dialog State
    const [editingProfile, setEditingProfile] = useState<SmtpProfile | null>(null);

    // Delete Dialog State
    const [deletingProfile, setDeletingProfile] = useState<SmtpProfile | null>(null);

    // Filtered profiles based on search
    const filteredProfiles = profiles.filter((p) =>
        p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.host.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.user.toLowerCase().includes(searchValue.toLowerCase())
    );

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleCopyPassword = async (profile: SmtpProfile) => {
        try {
            await navigator.clipboard.writeText(profile.password);
            setCopiedId(profile.id);
            toast.success(t.common?.copied || "Copied to clipboard");
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error(t.common?.copyFailed || "Failed to copy");
        }
    };

    const refreshProfiles = () => {
        router.refresh();
    };

    const columns: Column<SmtpProfile>[] = [
        {
            key: "number",
            header: "#",
            render: (_, index) => (
                <span className="text-muted-foreground text-xs">{index + 1}</span>
            ),
        },
        {
            key: "name",
            header: t.clients?.profileName || "Name",
            sortable: true,
            render: (profile) => (
                <div>
                    <span className="font-medium">{profile.name}</span>
                    <p className="text-xs text-muted-foreground font-mono">
                        {profile.host}:{profile.port}
                    </p>
                </div>
            ),
        },
        {
            key: "user",
            header: t.clientDetails?.username || "User",
            render: (profile) => (
                <span className="text-sm text-muted-foreground font-mono truncate max-w-[180px] block">
                    {profile.user}
                </span>
            ),
        },
        {
            key: "password",
            header: t.clientDetails?.password || "Password",
            render: (profile) => {
                const isVisible = visiblePasswords.has(profile.id);
                const isCopied = copiedId === profile.id;
                return (
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-muted-foreground">
                            {isVisible ? profile.password : "••••••••••••"}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => togglePasswordVisibility(profile.id)}
                        >
                            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyPassword(profile)}
                        >
                            {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>
                );
            },
        },
        {
            key: "secure",
            header: t.clientDetails?.secure || "Secure",
            render: (profile) => (
                <CardBadge
                    variant="border"
                    color={profile.secure ? "green" : "gray"}
                    className="text-[10px]"
                >
                    {profile.secure ? (
                        <>
                            <Shield className="h-3 w-3 mr-1" />
                            TLS
                        </>
                    ) : (
                        <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            None
                        </>
                    )}
                </CardBadge>
            ),
        },
        {
            key: "createdAt",
            header: t.tables?.addedAt || "Added At",
            sortable: true,
            render: (profile) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {(() => {
                        const date = new Date(profile.createdAt);
                        return `${date.toLocaleDateString('fr-FR')} - ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                    })()}
                </span>
            ),
        },
    ];

    // Add actions column if user can edit
    if (canEdit) {
        columns.push({
            key: "actions",
            header: "",
            render: (profile) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingProfile(profile)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingProfile(profile)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        });
    }

    return (
        <>
            <PageHeader title={t.clients?.smtpConfiguration || "SMTP Configuration"} showBack>
                <Link href="/dashboard/postal">
                    <Button variant="outline" className="gap-2">
                        <Server className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.clients?.manageProfiles || "Manage All Profiles"}</span>
                    </Button>
                </Link>
            </PageHeader>

            <PageContent>
                <div className="space-y-6">
                    <FilterBar
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        searchPlaceholder={t.clients?.searchProfiles || "Search profiles..."}
                        onClearFilters={() => setSearchValue("")}
                    />

                    <DataTable
                        data={filteredProfiles}
                        columns={columns}
                        currentPage={1}
                        totalItems={filteredProfiles.length}
                        pageSize={filteredProfiles.length || 10}
                        onPageChange={() => { }}
                        onPageSizeChange={() => { }}
                        emptyMessage={t.clients?.noSmtpProfiles || "No SMTP profiles found"}
                        emptyIcon={<Server className="h-10 w-10 text-muted-foreground/40" />}
                    />
                </div>
            </PageContent>

            {/* Edit Name Dialog */}
            <EditProfileNameDialog
                open={!!editingProfile}
                onOpenChange={(open) => !open && setEditingProfile(null)}
                profileId={editingProfile?.id || null}
                currentName={editingProfile?.name || ""}
                onSuccess={refreshProfiles}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteProfileDialog
                open={!!deletingProfile}
                onOpenChange={(open) => !open && setDeletingProfile(null)}
                profileId={deletingProfile?.id || null}
                profileName={deletingProfile?.name || ""}
                onSuccess={refreshProfiles}
            />
        </>
    );
}
