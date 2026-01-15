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
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    icon?: string | null;
    color?: string | null;
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Protected roles that cannot be deleted
    const protectedRoles = ["SUPER_ADMIN", "ADMIN", "MARKETER"];

    // Sort roles: SUPER_ADMIN, ADMIN, MARKETER first, then alphabetically
    const roleOrder: Record<string, number> = {
        SUPER_ADMIN: 0,
        ADMIN: 1,
        MARKETER: 2,
    };
    const sortedRoles = [...roles].sort((a, b) => {
        const orderA = roleOrder[a.name] ?? 999;
        const orderB = roleOrder[b.name] ?? 999;
        if (orderA !== orderB) return orderA - orderB;
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

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/roles/${roleToDelete.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
                setIsDeleteDialogOpen(false);
                setRoleToDelete(null);
                toast.success(t.common.success);
            } else {
                const data = await response.json();
                toast.error(data.error || t.common.error);
            }
        } catch (error) {
            console.error("Failed to delete role:", error);
            toast.error(t.common.error);
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteDialog = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-8">


            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{(t.common as any)?.rolesPermissions || "Roles & Permissions"}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {(t as any)?.roles?.description || "Manage user roles and their permissions."}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/settings/roles/new" className="gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">{(t as any)?.roles?.newRole || "New Role"}</span>
                    </Link>
                </Button>
            </div>

            {/* Roles Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedRoles.map((role) => (
                    <RoleCard
                        key={role.id}
                        role={role}
                        onClick={() => handleEditRole(role)}
                        onDelete={() => openDeleteDialog(role)}
                        canDelete={!protectedRoles.includes(role.name)}
                    />
                ))}
            </div>

            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[85vh] flex flex-col">
                    {/* Fixed Header */}
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>
                            {(t as any)?.roles?.permissionsFor || "Permissions for"} {(t.roles as any)?.names?.[selectedRole?.name || ""] || selectedRole?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {(t as any)?.roles?.selectPermissionsDesc || "Select the permissions for this role."}
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">{(t as any)?.roles?.deleteRoleTitle || "Delete Role"}</DialogTitle>
                        <DialogDescription>
                            {(t as any)?.roles?.deleteRoleConfirm || "Are you sure you want to delete"} <strong>{roleToDelete?.name}</strong>?{" "}
                            {(t as any)?.roles?.deleteRoleWarning || "This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t.common.cancel}</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteRole}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Spinner className="mr-2" />
                                    {(t as any)?.roles?.deleting || "Deleting..."}
                                </>
                            ) : (
                                (t as any)?.roles?.deleteRoleTitle || "Delete Role"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
