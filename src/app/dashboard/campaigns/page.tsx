import { db } from "@/lib/db";
import { Suspense } from "react";
import { CampaignsClient } from "./campaigns-client";

export default async function CampaignsPage() {
    const [campaigns, clients] = await Promise.all([
        db.campaign.findMany({
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                        brandColors: true,
                        smtpVerified: true,
                    },
                },
                template: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                audience: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                analytics: {
                    select: {
                        sent: true,
                        opened: true,
                        clicked: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        db.client.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    // Transform campaigns to match CampaignCardData interface
    const transformedCampaigns = campaigns.map((campaign) => ({
        ...campaign,
        client: {
            ...campaign.client,
            brandColors: campaign.client.brandColors as any,
        },
    })) as any[];

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CampaignsClient initialCampaigns={transformedCampaigns} clients={clients} />
        </Suspense>
    );
}
