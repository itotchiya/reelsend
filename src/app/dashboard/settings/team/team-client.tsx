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
                    toast.error((t.team as any).errorEmailExists || "Email already exists");
                } else {
                    toast.error((t.team as any).errorGeneric || "An error occurred");
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
        <>
            <PageHeader title={t.team.title}>
                <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.team.inviteMember}</span>
                </Button>
            </PageHeader>
            <PageContent>
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
                            <DialogTitle>{t.team.inviteTitle}</DialogTitle>
                            <DialogDescription>
                                {t.team.inviteDescription}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t.team.emailAddress}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t.team.invitePlaceholder}
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">{t.team.role}</Label>
                                <Select value={inviteRoleId} onValueChange={setInviteRoleId} required>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder={t.team.selectRole} />
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
                                    <Button variant="outline" type="button">{t.common.cancel}</Button>
                                </DialogClose>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner className="mr-2" />
                                            {t.team.sending}
                                        </>
                                    ) : (
                                        t.team.sendInvitation
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
                            <DialogTitle>{t.team.changeRoleTitle}</DialogTitle>
                            <DialogDescription>
                                {t.team.changeRoleDesc} <strong>{selectedUser?.name || selectedUser?.email}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">{t.team.role}</Label>
                                <Select value={editRoleId} onValueChange={setEditRoleId}>
                                    <SelectTrigger id="edit-role">
                                        <SelectValue placeholder={t.team.selectRole} />
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
                                <Button variant="outline">{t.common.cancel}</Button>
                            </DialogClose>
                            <Button onClick={handleUpdateRole} disabled={loading}>
                                {loading ? <Spinner /> : t.team.updateRole}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-destructive">{t.team.removeMemberTitle}</DialogTitle>
                            <DialogDescription>
                                {t.team.removeMemberDesc} <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                                {t.team.removeMemberWarning}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="outline">{t.common.cancel}</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                {loading ? <Spinner /> : t.team.remove}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageContent>
        </>
    );
}
