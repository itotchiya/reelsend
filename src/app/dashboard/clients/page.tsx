import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientsClient } from "./clients-client";

export default async function ClientsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    // Check if user has permission to view clients
    if (!userPermissions?.includes("clients:view")) {
        redirect("/dashboard");
    }

    // Fetch all clients with counts
    const clients = await db.client.findMany({
        include: {
            _count: {
                select: {
                    audiences: true,
                    campaigns: true,
                    templates: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Serialize dates
    const serializedClients = clients.map((client) => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
    }));

    // Check user permissions for actions
    const canCreate = userPermissions?.includes("clients:create") ?? false;
    const canEdit = userPermissions?.includes("clients:edit") ?? false;
    const canDelete = userPermissions?.includes("clients:delete") ?? false;

    return (
        <ClientsClient
            initialClients={serializedClients}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    );
}
