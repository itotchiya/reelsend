"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    Shield,
    ShieldCheck,
    Users,
    Loader2,
    KeyRound,
    Lock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    userCount: number;
    permissions: string[];
}

interface Permission {
    id: string;
    key: string;
    name: string;
    description: string | null;
    category: string;
}

interface RolesClientProps {
    initialRoles: Role[];
    permissionsByCategory: Record<string, Permission[]>;
}

export function RolesClient({ initialRoles, permissionsByCategory }: RolesClientProps) {
    const { t } = useI18n();
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Sort roles: SUPER_ADMIN first, then alphabetically
    const sortedRoles = [...roles].sort((a, b) => {
        if (a.name === "SUPER_ADMIN") return -1;
        if (b.name === "SUPER_ADMIN") return 1;
        return a.name.localeCompare(b.name);
    });

    const handleEditRole = (role: Role) => {
        if (role.name === "SUPER_ADMIN") return;
        setSelectedRole(role);
        setEditedPermissions([...role.permissions]);
        setIsEditDialogOpen(true);
    };

    const togglePermission = (permKey: string) => {
        setEditedPermissions((prev) =>
            prev.includes(permKey)
                ? prev.filter((p) => p !== permKey)
                : [...prev, permKey]
        );
    };

    const handleSaveRole = async () => {
        if (!selectedRole) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: selectedRole.description,
                    permissions: editedPermissions,
                }),
            });

            if (response.ok) {
                setRoles((prev) =>
                    prev.map((r) =>
                        r.id === selectedRole.id
                            ? { ...r, permissions: editedPermissions }
                            : r
                    )
                );
                setIsEditDialogOpen(false);
            }
        } catch (error) {
            console.error("Failed to save role:", error);
        } finally {
            setSaving(false);
        }
    };

    const isSuperAdmin = (role: Role) => role.name === "SUPER_ADMIN";

    return (
        <>
            <PageHeader title={t.common.rolesPermissions} />
            <PageContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedRoles.map((role) =>
                        isSuperAdmin(role) ? (
                            // SUPER_ADMIN Card - Disabled, non-interactive
                            <Card
                                key={role.id}
                                className="relative opacity-75 cursor-not-allowed"
                            >
                                <div className="absolute top-4 right-4">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500/20 to-neutral-600/20 border border-neutral-500/30 mb-4">
                                            <ShieldCheck className="h-8 w-8 text-foreground" />
                                        </div>

                                        <h3 className="text-xl font-bold mb-1">{role.name}</h3>

                                        <span className="text-sm text-muted-foreground font-medium mb-3">
                                            Full Access
                                        </span>

                                        <p className="text-sm text-muted-foreground mb-4 px-2">
                                            {role.description || "Has all permissions by default"}
                                        </p>

                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                                                <Users className="h-3.5 w-3.5" />
                                                {role.userCount} users
                                            </Badge>
                                            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                                                <KeyRound className="h-3.5 w-3.5" />
                                                All {t.roles.permissions}
                                            </Badge>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Cannot be modified
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            // Regular Role Card - Interactive
                            <InteractiveCard key={role.id} onClick={() => handleEditRole(role)}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500/20 to-neutral-600/20 border border-neutral-500/30 mb-4">
                                        <Shield className="h-8 w-8 text-foreground" />
                                    </div>

                                    <h3 className="text-xl font-bold mb-1">{role.name}</h3>

                                    {role.isSystem && (
                                        <span className="text-sm text-muted-foreground font-medium mb-3">
                                            {t.roles.systemRole}
                                        </span>
                                    )}

                                    <p className="text-sm text-muted-foreground mb-4 px-2">
                                        {role.description || "No description available"}
                                    </p>

                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {role.userCount} users
                                        </Badge>
                                        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                                            <KeyRound className="h-3.5 w-3.5" />
                                            {role.permissions.length} {t.roles.permissions}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {t.roles.editPermissions}
                                    </p>
                                </div>
                            </InteractiveCard>
                        )
                    )}
                </div>

                {/* Edit Role Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[85vh] flex flex-col">
                        {/* Fixed Header */}
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle>{t.roles.permissionsFor} {selectedRole?.name}</DialogTitle>
                            <DialogDescription>
                                Select the permissions for this role.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto">
                            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                <div key={category}>
                                    {/* Category Header */}
                                    <div className="px-6 py-3 bg-muted/50 border-b">
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            {category}
                                        </h4>
                                    </div>

                                    {/* Permissions List */}
                                    <ul className="divide-y">
                                        {perms.map((perm) => {
                                            const isChecked = editedPermissions.includes(perm.key);
                                            return (
                                                <li key={perm.id}>
                                                    <Label
                                                        htmlFor={perm.key}
                                                        className="flex items-center justify-between gap-4 px-6 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                                    >
                                                        <span className="text-sm">{perm.name}</span>
                                                        <Checkbox
                                                            id={perm.key}
                                                            checked={isChecked}
                                                            onCheckedChange={() => togglePermission(perm.key)}
                                                        />
                                                    </Label>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Fixed Footer */}
                        <DialogFooter className="px-6 py-4 border-t">
                            <DialogClose asChild>
                                <Button variant="outline">{t.common.cancel}</Button>
                            </DialogClose>
                            <Button onClick={handleSaveRole} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t.common.loading}
                                    </>
                                ) : (
                                    t.common.save
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageContent>
        </>
    );
}
