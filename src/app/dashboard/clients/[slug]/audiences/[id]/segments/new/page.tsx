import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateSegmentClient } from "./create-segment-client";

interface CreateSegmentPageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
}

export default async function CreateSegmentPage({ params }: CreateSegmentPageProps) {
    const session = await auth();
    const { slug, id } = await params;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const audience = await db.audience.findUnique({
        where: { id },
        include: {
            client: true,
        }
    });

    if (!audience || audience.client.slug !== slug) {
        redirect(`/dashboard/clients/${slug}`);
    }

    // Fetch all contacts for selection
    const contacts = await db.contact.findMany({
        where: { audienceId: id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <CreateSegmentClient
            audience={JSON.parse(JSON.stringify(audience))}
            contacts={JSON.parse(JSON.stringify(contacts))}
        />
    );
}
