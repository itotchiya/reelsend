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
                where: { category: null },
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    htmlContent: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            smtpTestLogs: {
                take: 10,
                orderBy: { testedAt: "desc" },
            },
            smtpProfiles: {
                select: {
                    id: true,
                    name: true,
                    host: true,
                    port: true,
                    user: true,
                    password: true,
                    secure: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!client) {
        notFound();
    }

    // Serialize dates
    const clientData = client as any;
    const serializedClient = {
        ...clientData,
        createdAt: clientData.createdAt.toISOString(),
        updatedAt: clientData.updatedAt.toISOString(),
        audiences: clientData.audiences.map((a: any) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
        })),
        campaigns: clientData.campaigns.map((c: any) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            scheduledAt: c.scheduledAt?.toISOString() || null,
            sentAt: c.sentAt?.toISOString() || null,
        })),
        templates: clientData.templates.map((t: any) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        })),
        smtpTestLogs: clientData.smtpTestLogs.map((log: any) => ({
            ...log,
            testedAt: log.testedAt.toISOString(),
        })),
        smtpProfiles: clientData.smtpProfiles.map((p: any) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        })),
        _count: clientData._count,
    };

    // Check user permissions for actions
    const canEdit = userPermissions?.includes("clients:edit") ?? false;

    return <ClientDetailClient client={serializedClient} canEdit={canEdit} />;
}
