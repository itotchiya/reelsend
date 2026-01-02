import { db } from "@/lib/db";
import { CampaignsClient } from "./campaigns-client";

export default async function CampaignsPage() {
    const [campaigns, clients] = await Promise.all([
        db.campaign.findMany({
            include: {
                client: true,
                template: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                audience: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                startedBy: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                analytics: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        db.client.findMany({
            where: { active: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    // Map campaigns to the format expected by the client component
    const mappedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        client: {
            ...campaign.client,
            smtpVerified: campaign.client.smtpVerified || false,
        }
    }));

    return (
        <CampaignsClient
            initialCampaigns={mappedCampaigns as any}
            clients={clients}
        />
    );
}

