import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Papa from "papaparse";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// POST /api/audiences/[id]/import - Bulk import contacts from CSV
export async function POST(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id: audienceId } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const text = await file.text();

        // Parse CSV
        const parseResult = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
            console.error("[CSV_PARSE_ERRORS]", parseResult.errors);
            // We can still proceed if some lines parsed, but let's notify if it's a mess
            if (parseResult.data.length === 0) {
                return new NextResponse("Invalid CSV format", { status: 400 });
            }
        }

        const rawData = parseResult.data as any[];

        // Map common headers to our fields
        const contactsToCreate = rawData
            .map((row) => {
                // Find email (case insensitive search for variations)
                const emailKey = Object.keys(row).find(k => k.toLowerCase() === "email");
                const email = emailKey ? row[emailKey]?.trim() : null;

                if (!email || !email.includes("@")) return null;

                // Find names
                const firstKey = Object.keys(row).find(k => ["firstname", "first name", "name", "first"].includes(k.toLowerCase()));
                const lastKey = Object.keys(row).find(k => ["lastname", "last name", "last"].includes(k.toLowerCase()));

                return {
                    audienceId,
                    email,
                    firstName: firstKey ? row[firstKey]?.trim() : null,
                    lastName: lastKey ? row[lastKey]?.trim() : null,
                    status: "ACTIVE" as const,
                };
            })
            .filter(c => c !== null);

        if (contactsToCreate.length === 0) {
            return new NextResponse("No valid contacts found in CSV", { status: 400 });
        }

        // Bulk insert (using createMany if available, or transaction)
        // Note: createMany with skipDuplicates: true is helpful here
        const result = await db.contact.createMany({
            data: contactsToCreate as any,
            skipDuplicates: true,
        });

        // Update audience contact count
        // Note: result.count might not be accurate if we skipped duplicates 
        // but it's the number of *inserted* records.
        // We should ideally recount or increment by result.count.
        await db.audience.update({
            where: { id: audienceId },
            data: {
                contactCount: {
                    increment: result.count
                }
            }
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully imported ${result.count} contacts.`
        });

    } catch (error) {
        console.error("[CONTACT_IMPORT]", error);
        return new NextResponse("Internal Error during import", { status: 500 });
    }
}
