import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { WaypointEditorClient } from "./editor-client";
import { auth } from "@/lib/auth";

interface Props {
    params: Promise<{ slug: string; templateId: string }>;
}

export default async function ClientTemplateEditorPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const { slug, templateId } = await params;

    // Verify the client exists and the template belongs to it
    const client = await db.client.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true },
    });

    if (!client) {
        notFound();
    }

    const template = await db.template.findUnique({
        where: { id: templateId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true,
                    brandColors: true,
                    fonts: true,
                },
            },
        },
    });

    if (!template || (template.clientId && template.clientId !== client.id)) {
        notFound();
    }

    const savedBlocks = await db.savedBlock.findMany({
        where: {
            OR: [
                { clientId: template.clientId },
                { clientId: null },
            ],
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <WaypointEditorClient
            template={template}
            savedBlocks={savedBlocks}
            clientSlug={slug}
        />
    );
}
