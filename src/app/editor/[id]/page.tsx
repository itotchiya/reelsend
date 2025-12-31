import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { EmailEditorClient } from "./editor-client";
import { auth } from "@/lib/auth";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EmailEditorPage({ params }: Props) {
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
                    logo: true,
                    brandColors: true,
                    fonts: true,
                    slug: true,
                },
            },
        },
    });

    if (!template) {
        notFound();
    }

    // Get saved blocks for this client (and global blocks)
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
        <EmailEditorClient
            template={template}
            savedBlocks={savedBlocks}
        />
    );
}
