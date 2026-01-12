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
            smtpProfiles: {
                select: {
                    id: true,
                    name: true,
                },
            },
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

    // Serialize dates and ensure types match
    const serializedClients = clients.map((client: any) => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        brandColors: client.brandColors as { primary?: string; secondary?: string } | null,
        smtpProfiles: client.smtpProfiles,
        _count: client._count,
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
