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
                    segments: {
                        include: {
                            _count: { select: { contacts: true } },
                            campaigns: { select: { id: true, name: true } },
                            createdBy: { select: { id: true, name: true, email: true } },
                        },
                    },
                },
            },
            segment: true,
            analytics: true,
        },
    });

    if (!campaign) {
        notFound();
    }

    // Fetch templates, audiences with segments, and SMTP profiles
    const [templates, audiences, smtpProfiles] = await Promise.all([
        db.template.findMany({
            where: {
                clientId: campaign.clientId,
                // Exclude "Blueprints" (which typically have a category set from the Library)
                category: null,
            },
            orderBy: { createdAt: "desc" },
        }),
        db.audience.findMany({
            where: { clientId: campaign.clientId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                        brandColors: true,
                    },
                },
                _count: {
                    select: { contacts: true, segments: true },
                },
                campaigns: {
                    select: { id: true, name: true },
                },
                segments: {
                    include: {
                        _count: { select: { contacts: true } },
                        campaigns: { select: { id: true, name: true } },
                        createdBy: { select: { id: true, name: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        // Fetch SMTP profiles - client-specific and system-wide
        db.smtpProfile.findMany({
            where: {
                OR: [
                    { clientId: campaign.clientId },
                    { clientId: null }, // System-wide profiles
                ],
            },
            include: {
                campaigns: { select: { id: true, name: true } },
                client: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        brandColors: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return (
        <CampaignClient
            initialCampaign={campaign as any}
            templates={templates}
            audiences={audiences as any}
            smtpProfiles={smtpProfiles as any}
        />
    );
}
