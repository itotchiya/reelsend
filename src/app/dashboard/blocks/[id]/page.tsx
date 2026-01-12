import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlockEditorClient } from "./block-editor-client";

interface BlockEditorPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function BlockEditorPage({ params }: BlockEditorPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const blockRaw = await db.savedBlock.findUnique({
        where: { id },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    brandColors: true,
                },
            },
        },
    });

    if (!blockRaw) {
        redirect("/dashboard/blocks");
    }

    // Transform to include primaryColor extracted from brandColors
    const block = {
        ...blockRaw,
        client: blockRaw.client ? {
            ...blockRaw.client,
            primaryColor: (blockRaw.client.brandColors as any)?.primary || null,
        } : null,
    };

    return (
        <BlockEditorClient
            block={JSON.parse(JSON.stringify(block))}
        />
    );
}
