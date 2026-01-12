import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Papa from "papaparse";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// Standard fields that can be mapped
const STANDARD_FIELDS = [
    "email", "firstName", "lastName", "phone",
    "country", "city", "street", "birthday",
    "gender", "maritalStatus"
];

// POST /api/audiences/[id]/import - Bulk import contacts from CSV with column mapping
export async function POST(req: Request, { params }: RouteParams) {
    const session = await auth();
    const { id: audienceId } = await params;

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const mappingStr = formData.get("mapping") as string;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        // Verify audience exists
        const audience = await db.audience.findUnique({
            where: { id: audienceId },
            select: { id: true }
        });

        if (!audience) {
            return new NextResponse("Audience not found", { status: 404 });
        }

        // Parse mapping (if provided by new UI)
        let columnMapping: Record<string, string> = {};
        if (mappingStr) {
            try {
                columnMapping = JSON.parse(mappingStr);
            } catch {
                // Ignore invalid mapping, will use auto-detection
            }
        }

        const text = await file.text();

        // Parse CSV
        const parseResult = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
            return new NextResponse("Invalid CSV format", { status: 400 });
        }

        const rawData = parseResult.data as any[];
        const headers = parseResult.meta.fields || [];

        // If no mapping provided, auto-detect email column
        if (Object.keys(columnMapping).length === 0) {
            headers.forEach(header => {
                const normalized = header.toLowerCase().replace(/[_\s-]/g, "");
                if (normalized === "email") columnMapping[header] = "email";
                else if (["firstname", "first"].includes(normalized)) columnMapping[header] = "firstName";
                else if (["lastname", "last"].includes(normalized)) columnMapping[header] = "lastName";
                else if (["phone", "telephone", "mobile"].includes(normalized)) columnMapping[header] = "phone";
                else if (normalized === "country") columnMapping[header] = "country";
                else if (normalized === "city") columnMapping[header] = "city";
                else if (["street", "address"].includes(normalized)) columnMapping[header] = "street";
                else if (["birthday", "birthdate", "dob", "dateofbirth"].includes(normalized)) columnMapping[header] = "birthday";
                else if (normalized === "gender") columnMapping[header] = "gender";
                else if (["maritalstatus", "relationship", "status"].includes(normalized)) columnMapping[header] = "maritalStatus";
            });
        }

        // Find email column
        const emailHeader = Object.keys(columnMapping).find(k => columnMapping[k] === "email");
        if (!emailHeader) {
            return new NextResponse("Email column not found or not mapped", { status: 400 });
        }

        // Build contacts data
        const contactsToCreate = rawData
            .map((row) => {
                const email = row[emailHeader]?.trim();
                if (!email || !email.includes("@")) return null;

                const contact: any = {
                    audienceId,
                    email,
                    status: "ACTIVE",
                };

                // Map standard fields
                headers.forEach(header => {
                    const mappedField = columnMapping[header];
                    const value = row[header]?.trim();

                    if (mappedField && STANDARD_FIELDS.includes(mappedField) && value) {
                        if (mappedField === "birthday") {
                            // Try to parse date
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                                contact[mappedField] = date.toISOString();
                            }
                        } else if (mappedField === "gender") {
                            // Normalize gender values
                            const normalized = value.toUpperCase();
                            if (["MALE", "M", "HOMME"].includes(normalized)) contact[mappedField] = "MALE";
                            else if (["FEMALE", "F", "FEMME"].includes(normalized)) contact[mappedField] = "FEMALE";
                            else if (["OTHER", "AUTRE"].includes(normalized)) contact[mappedField] = "OTHER";
                        } else if (mappedField === "maritalStatus") {
                            // Normalize marital status
                            const normalized = value.toUpperCase();
                            if (["SINGLE", "CELIBATAIRE"].includes(normalized)) contact[mappedField] = "SINGLE";
                            else if (["MARRIED", "MARIE", "MARIEE"].includes(normalized)) contact[mappedField] = "MARRIED";
                            else if (["DIVORCED", "DIVORCE", "DIVORCEE"].includes(normalized)) contact[mappedField] = "DIVORCED";
                            else if (["WIDOWED", "VEUF", "VEUVE"].includes(normalized)) contact[mappedField] = "WIDOWED";
                            else if (["SEPARATED", "SEPARE", "SEPAREE"].includes(normalized)) contact[mappedField] = "SEPARATED";
                        } else {
                            contact[mappedField] = value;
                        }
                    }
                });

                // Store unmapped columns as metadata
                const metadata: Record<string, string> = {};
                headers.forEach(header => {
                    if (!columnMapping[header] && row[header]?.trim()) {
                        metadata[header] = row[header].trim();
                    }
                });
                if (Object.keys(metadata).length > 0) {
                    contact.metadata = metadata;
                }

                return contact;
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);

        if (contactsToCreate.length === 0) {
            return new NextResponse("No valid contacts found in CSV", { status: 400 });
        }

        // Bulk insert
        const result = await db.contact.createMany({
            data: contactsToCreate,
            skipDuplicates: true,
        });

        // Update audience contact count
        await db.audience.update({
            where: { id: audienceId },
            data: {
                contactCount: { increment: result.count }
            }
        });

        return NextResponse.json({
            success: true,
            imported: result.count,
            total: contactsToCreate.length,
            message: `Successfully imported ${result.count} contacts.`
        });

    } catch (error) {
        console.error("[CONTACT_IMPORT]", error);
        return new NextResponse("Internal Error during import", { status: 500 });
    }
}
