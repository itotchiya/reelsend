import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    // Check if user has permission to manage users
    if (!userPermissions?.includes("users:manage")) {
        redirect("/dashboard");
    }

    // Fetch all users with their roles
    const users = await db.user.findMany({
        include: {
            role: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Fetch all roles for the invitation/edit forms
    const roles = await db.role.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    // Serialize dates for Client Component
    const serializedUsers = users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        inviteExpires: user.inviteExpires?.toISOString() || null,
        emailVerified: user.emailVerified?.toISOString() || null,
        updatedAt: user.updatedAt.toISOString(),
    }));

    return (
        <TeamClient
            initialUsers={serializedUsers as any}
            roles={roles}
            currentUserId={session.user?.id || ""}
        />
    );
}
