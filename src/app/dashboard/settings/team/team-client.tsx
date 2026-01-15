"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
    UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import { TeamMemberCard } from "@/components/ui-kit/team-member-card";
import { toast } from "sonner";

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    status: string;
    roleId: string | null;
    createdAt: string;
    invitationSentAt: string | null;
    joinedAt: string | null;
    role: Role | null;
}

interface TeamClientProps {
    initialUsers: User[];
    roles: Role[];
    currentUserId: string;
}

export function TeamClient({ initialUsers, roles, currentUserId }: TeamClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRoleId, setInviteRoleId] = useState("");
    const [editRoleId, setEditRoleId] = useState("");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, roleId: inviteRoleId }),
            });

            if (res.ok) {
                const data = await res.json();
                const newUser = data.user || data;
                setUsers([newUser, ...users]);
                setIsInviteOpen(false);
                setInviteEmail("");
                setInviteRoleId("");
                toast.success(t.team.invitationSent);

                if (data.warning) {
                    toast.warning(data.warning);
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                if (errorData.error === "EMAIL_EXISTS") {
                    toast.error((t.team as any)?.errorEmailExists || "Email already exists");
                } else {
                    toast.error((t.team as any)?.errorGeneric || "An error occurred");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error((t.team as any).errorGeneric || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/team/${selectedUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleId: editRoleId }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
                setIsEditOpen(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/team/${selectedUser.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setUsers(users.filter((u) => u.id !== selectedUser.id));
                setIsDeleteOpen(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setEditRoleId(user.roleId || "");
        setIsEditOpen(true);
    };

    const openDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-8">


            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{(t.team as any)?.title || "Team Members"}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {(t.team as any)?.description || "Manage your team members and their roles."}
                    </p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">{(t.team as any)?.inviteMember || "Invite Member"}</span>
                </Button>
            </div>

            {/* Team Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                    <TeamMemberCard
                        key={user.id}
                        user={user}
                        isSelf={user.id === currentUserId}
                        onEdit={openEdit}
                        onDelete={openDelete}
                    />
                ))}
            </div>

            {/* Invite Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{(t.team as any)?.inviteTitle || "Invite Team Member"}</DialogTitle>
                        <DialogDescription>
                            {(t.team as any)?.inviteDescription || "Send an invitation to join your team."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{(t.team as any)?.emailAddress || "Email Address"}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={(t.team as any)?.invitePlaceholder || "name@example.com"}
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">{(t.team as any)?.role || "Role"}</Label>
                            <Select value={inviteRoleId} onValueChange={setInviteRoleId} required>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder={(t.team as any)?.selectRole || "Select a role"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {(t.roles.names as any)?.[role.name] || role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">{(t.common as any)?.cancel || "Cancel"}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner className="mr-2" />
                                        {(t.team as any)?.sending || "Sending..."}
                                    </>
                                ) : (
                                    (t.team as any)?.sendInvitation || "Send Invitation"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{(t.team as any)?.changeRoleTitle || "Change Role"}</DialogTitle>
                        <DialogDescription>
                            {(t.team as any)?.changeRoleDesc || "Change role for"} <strong>{selectedUser?.name || selectedUser?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">{(t.team as any)?.role || "Role"}</Label>
                            <Select value={editRoleId} onValueChange={setEditRoleId}>
                                <SelectTrigger id="edit-role">
                                    <SelectValue placeholder={(t.team as any)?.selectRole || "Select a role"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {(t.roles.names as any)?.[role.name] || role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{(t.common as any)?.cancel || "Cancel"}</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateRole} disabled={loading}>
                            {loading ? <Spinner /> : (t.team as any)?.updateRole || "Update Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">{(t.team as any)?.removeMemberTitle || "Remove Member"}</DialogTitle>
                        <DialogDescription>
                            {(t.team as any)?.removeMemberDesc || "Are you sure you want to remove"} <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                            {(t.team as any)?.removeMemberWarning || "This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button variant="outline">{(t.common as any)?.cancel || "Cancel"}</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? <Spinner /> : (t.team as any)?.remove || "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
