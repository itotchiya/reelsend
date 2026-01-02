import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CampaignClient } from "./campaign-client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({
        where: { id },
        include: {
            client: true,
            template: true,
            audience: {
                include: {
                    _count: {
                        select: { contacts: true },
                    },
                },
            },
            analytics: true,
        },
    });

    if (!campaign) {
        notFound();
    }

    const [templates, audiences] = await Promise.all([
        db.template.findMany({
            where: { clientId: campaign.clientId },
            orderBy: { createdAt: "desc" },
        }),
        db.audience.findMany({
            where: { clientId: campaign.clientId },
            include: {
                _count: {
                    select: { contacts: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return (
        <CampaignClient
            initialCampaign={campaign}
            templates={templates}
            audiences={audiences}
        />
    );
}
