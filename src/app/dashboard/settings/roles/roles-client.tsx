"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Spinner } from "@/components/ui/spinner";
import { RoleCard } from "@/components/ui-kit/role-card";

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

    return (
        <>
            <PageHeader title={t.common.rolesPermissions} />
            <PageContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedRoles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            onClick={() => handleEditRole(role)}
                        />
                    ))}
                </div>

                {/* Edit Role Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[85vh] flex flex-col">
                        {/* Fixed Header */}
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle>
                                {t.roles.permissionsFor} {(t.roles.names as any)?.[selectedRole?.name || ""] || selectedRole?.name}
                            </DialogTitle>
                            <DialogDescription>
                                {t.roles.selectPermissionsDesc}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto">
                            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                <div key={category}>
                                    {/* Category Header */}
                                    <div className="px-6 py-3 bg-muted/50 border-b">
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            {(t.roles.categories as any)?.[category] || category}
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
                                                        <span className="text-sm">
                                                            {(t.roles.permNames as any)?.[perm.key] || perm.name}
                                                        </span>
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
                                        <Spinner className="mr-2" />
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
