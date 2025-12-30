import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { EditClientClient } from "./edit-client-client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
    const session = await auth();
    const { slug } = await params;

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    if (!hasPermission(userPermissions, "clients:edit")) {
        redirect(`/dashboard/clients/${slug}`);
    }

    const client = await db.client.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            brandColors: true,
            active: true,
            status: true,
            isPublic: true,
            smtpHost: true,
            smtpPort: true,
            smtpUser: true,
            smtpPassword: true,
            smtpSecure: true,
            smtpVerified: true,
            smtpLastTested: true,
            createdAt: true,
            updatedAt: true,
            smtpTestLogs: {
                orderBy: { testedAt: "desc" },
                take: 10,
            },
        },
    });

    if (!client) {
        redirect("/dashboard/clients");
    }

    // Serialize dates for client component
    const serializedClient = {
        ...client,
        smtpLastTested: client.smtpLastTested?.toISOString() || null,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        smtpTestLogs: client.smtpTestLogs?.map((log) => ({
            ...log,
            testedAt: log.testedAt.toISOString(),
        })) || [],
    };

    return <EditClientClient client={serializedClient} />;
}
