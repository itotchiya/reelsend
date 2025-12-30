"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InteractiveCard } from "@/components/ui/interactive-card";
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
import {
    Users,
    Mail,
    Shield,
    Plus,
    UserPlus,
    Trash2,
    Calendar,
    CheckCircle2,
    Clock,
    MoreVertical,
    UserCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Spinner } from "@/components/ui/spinner";

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
    role: Role | null;
}

interface TeamClientProps {
    initialUsers: User[];
    roles: Role[];
    currentUserId: string;
}

export function TeamClient({ initialUsers, roles, currentUserId }: TeamClientProps) {
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
                const newUser = data.user || data; // Handle wrapped response with warning
                setUsers([newUser, ...users]);
                setIsInviteOpen(false);
                setInviteEmail("");
                setInviteRoleId("");

                if (data.warning) {
                    alert(data.warning);
                }
            }
        } catch (error) {
            console.error(error);
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
            <PageHeader title="Team">
                <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                </Button>
            </PageHeader>
            <PageContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => {
                        const initials = user.name
                            ? user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : user.email?.slice(0, 2).toUpperCase() || "??";

                        const isSelf = user.id === currentUserId;

                        return (
                            <InteractiveCard key={user.id} className="h-full">
                                <div className="flex flex-col items-center text-center relative h-full">
                                    {/* Actions Dropdown */}
                                    {!isSelf && (
                                        <div className="absolute top-0 right-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(user)}>
                                                        <UserCog className="mr-2 h-4 w-4" />
                                                        Change Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openDelete(user)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove Member
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="relative mb-4">
                                        <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                                            <AvatarImage src={user.image || ""} />
                                            <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        {user.status === "ACTIVE" ? (
                                            <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 border-2 border-background rounded-full" title="Active" />
                                        ) : user.status === "INVITED" ? (
                                            <div className="absolute bottom-0 right-0 h-5 w-5 bg-amber-500 border-2 border-background rounded-full" title="Invited" />
                                        ) : null}
                                    </div>

                                    {/* Info */}
                                    <h3 className="text-xl font-bold truncate w-full px-2">
                                        {user.name || "Unnamed User"} {isSelf && "(You)"}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate max-w-[200px]">{user.email}</span>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                                        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                                            <Shield className="h-3.5 w-3.5 text-indigo-500" />
                                            {user.role?.name || "No Role"}
                                        </Badge>
                                        {user.status === "INVITED" && (
                                            <Badge variant="outline" className="gap-1.5 px-3 py-1 border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-500/10">
                                                <Clock className="h-3.5 w-3.5" />
                                                Pending
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
                                        <Calendar className="h-3 w-3" />
                                        Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </div>
                                </div>
                            </InteractiveCard>
                        );
                    })}
                </div>

                {/* Invite Dialog */}
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation email to a new team member. They will receive a link to set up their account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={inviteRoleId} onValueChange={setInviteRoleId} required>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                    <Button variant="outline" type="button">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner className="mr-2" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Invitation"
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
                            <DialogTitle>Change Role</DialogTitle>
                            <DialogDescription>
                                Update the role for <strong>{selectedUser?.name || selectedUser?.email}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={editRoleId} onValueChange={setEditRoleId}>
                                    <SelectTrigger id="edit-role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleUpdateRole} disabled={loading}>
                                {loading ? <Spinner /> : "Update Role"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-destructive">Remove Team Member</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                                This action cannot be undone and they will lose all access.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                {loading ? <Spinner /> : "Remove Member"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageContent>
        </>
    );
}
