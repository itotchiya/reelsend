import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ClientDetailClient } from "./client-detail-client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
    const session = await auth();
    const { slug } = await params;

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    // Check if user has permission to view clients
    if (!userPermissions?.includes("clients:view")) {
        redirect("/dashboard");
    }

    // Fetch client with related data
    const client = await db.client.findUnique({
        where: { slug },
        include: {
            _count: {
                select: {
                    audiences: true,
                    campaigns: true,
                    templates: true,
                    domains: true,
                },
            },
            audiences: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            campaigns: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            templates: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            smtpTestLogs: {
                take: 10,
                orderBy: { testedAt: "desc" },
            },
        },
    });

    if (!client) {
        notFound();
    }

    // Serialize dates
    const serializedClient = {
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        audiences: client.audiences.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
        })),
        campaigns: client.campaigns.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            scheduledAt: c.scheduledAt?.toISOString() || null,
            sentAt: c.sentAt?.toISOString() || null,
        })),
        templates: client.templates.map((t) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        })),
        smtpTestLogs: client.smtpTestLogs.map((log) => ({
            ...log,
            testedAt: log.testedAt.toISOString(),
        })),
    };

    // Check user permissions for actions
    const canEdit = userPermissions?.includes("clients:edit") ?? false;

    return <ClientDetailClient client={serializedClient} canEdit={canEdit} />;
}
