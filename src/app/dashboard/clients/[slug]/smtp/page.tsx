import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { SmtpClient } from "./smtp-client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ClientSmtpPage({ params }: PageProps) {
    const session = await auth();
    const { slug } = await params;

    if (!session) {
        redirect("/login");
    }

    const userPermissions = (session.user as any)?.permissions as string[] | undefined;

    if (!userPermissions?.includes("clients:view")) {
        redirect("/dashboard");
    }

    // Fetch client with SMTP profiles
    const clientData = await (db.client as any).findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            smtpProfiles: {
                select: {
                    id: true,
                    name: true,
                    host: true,
                    port: true,
                    user: true,
                    password: true,
                    secure: true,
                    defaultFromEmail: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!clientData) {
        notFound();
    }

    // Serialize dates
    const client = {
        ...clientData,
        smtpProfiles: clientData.smtpProfiles.map((p: any) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        })),
    };

    const canEdit = userPermissions?.includes("clients:edit") ?? false;

    return <SmtpClient client={client} canEdit={canEdit} />;
}
