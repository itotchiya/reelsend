import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as acelle from "@/lib/acelle";
import { revalidatePath } from "next/cache";

// POST /api/audiences/[id]/sync - Sync all contacts to Acelle
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get audience with contacts
        const audience = await db.audience.findUnique({
            where: { id },
            include: {
                contacts: {
                    where: {
                        acelleSubscriberId: null // Only unsynced contacts
                    }
                },
                client: { select: { slug: true } }
            }
        });

        if (!audience) {
            return NextResponse.json({ error: "Audience not found" }, { status: 404 });
        }

        if (!audience.acelleListUid) {
            return NextResponse.json(
                { error: "Audience is not synced with Acelle. Please recreate the audience." },
                { status: 400 }
            );
        }

        const results = {
            total: audience.contacts.length,
            synced: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Sync each contact to Acelle
        for (const contact of audience.contacts) {
            try {
                const acelleResult = await acelle.createSubscriber({
                    list_uid: audience.acelleListUid,
                    email: contact.email,
                    FIRST_NAME: contact.firstName || undefined,
                    LAST_NAME: contact.lastName || undefined,
                    PHONE: contact.phone || undefined,
                    COUNTRY: contact.country || undefined,
                    CITY: contact.city || undefined,
                    ADDRESS: contact.street || undefined,
                    status: "subscribed"
                });

                // Parse the response - Acelle returns subscriber_id (numeric)
                const responseData = acelleResult.data as Record<string, any> | undefined;
                const subscriberUid = responseData?.subscriber_uid ||
                    responseData?.subscriber_id?.toString() ||
                    responseData?.uid ||
                    responseData?.subscriber?.uid;

                if (acelleResult.success && subscriberUid) {
                    await db.contact.update({
                        where: { id: contact.id },
                        data: { acelleSubscriberId: subscriberUid }
                    });
                    results.synced++;
                    console.log(`[ACELLE_SYNC] Synced contact ${contact.email} -> ${subscriberUid}`);
                } else {
                    results.failed++;
                    results.errors.push(`${contact.email}: ${acelleResult.error || "Unknown error"}`);
                    console.warn(`[ACELLE_SYNC] Failed to sync ${contact.email}:`, acelleResult.error);
                }
            } catch (error: any) {
                results.failed++;
                results.errors.push(`${contact.email}: ${error.message}`);
                console.error(`[ACELLE_SYNC] Error syncing ${contact.email}:`, error);
            }
        }

        // Revalidate paths
        revalidatePath(`/dashboard/clients/${audience.client.slug}/audiences/${id}`);
        revalidatePath(`/dashboard/clients/${audience.client.slug}/audiences/${id}/contacts`);

        return NextResponse.json({
            success: true,
            message: `Synced ${results.synced} of ${results.total} contacts`,
            ...results
        });

    } catch (error: any) {
        console.error("[AUDIENCE_SYNC] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to sync contacts" },
            { status: 500 }
        );
    }
}
