import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { WaypointEditorClient } from "@/components/dashboard/waypoint-editor-client";
import { auth } from "@/lib/auth";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function LibraryTemplateEditorPage({ params }: Props) {
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

    // For library templates, we load global blocks and client specific blocks if any
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
