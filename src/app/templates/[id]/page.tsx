import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { WaypointEditorClient } from "./editor-client";
import { auth } from "@/lib/auth";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function TemplateEditorPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const { id } = await params;

    const template = await db.template.findUnique({
        where: { id },
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

    if (!template) {
        notFound();
    }

    // If template has a client, redirect to client-scoped URL
    if (template.client) {
        redirect(`/clients/${template.client.slug}/${template.id}`);
    }

    // Get saved blocks
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
        />
    );
}
