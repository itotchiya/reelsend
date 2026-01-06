import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { WaypointEditorClient } from "@/app/dashboard/clients/[slug]/templates/[id]/editor-client";
import { auth } from "@/lib/auth";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function GlobalTemplateEditorPage({ params }: Props) {
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

    // If template has a client, redirect to the client-specific editor
    if (template.client) {
        redirect(`/dashboard/clients/${template.client.slug}/templates/${id}`);
    }

    const savedBlocks = await db.savedBlock.findMany({
        where: {
            clientId: null,
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
