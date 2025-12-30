import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AudienceClient } from "./audience-client";

interface AudiencePageProps {
    params: Promise<{
        slug: string;
        id: string;
    }>;
}

export default async function AudiencePage({ params }: AudiencePageProps) {
    const session = await auth();
    const { slug, id } = await params;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const audience = (await db.audience.findUnique({
        where: { id },
        include: {
            client: true,
            _count: {
                select: { contacts: true }
            }
        }
    })) as any;

    if (!audience || audience.client.slug !== slug) {
        redirect(`/dashboard/clients/${slug}`);
    }

    return (
        <AudienceClient
            audience={JSON.parse(JSON.stringify(audience))}
        />
    );
}
