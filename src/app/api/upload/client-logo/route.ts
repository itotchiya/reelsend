import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";
import { compressImage } from "@/lib/image";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const clientId = formData.get("clientId") as string;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        if (!clientId) {
            return new NextResponse("No client ID provided", { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
        if (!allowedTypes.includes(file.type)) {
            return new NextResponse("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG", { status: 400 });
        }

        // Validate file size (max 10MB before compression)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return new NextResponse("File too large. Max 10MB", { status: 400 });
        }

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let finalBuffer = buffer;
        let contentType = file.type;
        let extension = file.type.split("/")[1];

        // Compress if not SVG
        if (file.type !== "image/svg+xml") {
            const compressed = await compressImage(buffer, {
                maxWidth: 500,
                maxHeight: 500,
                quality: 85,
                format: "webp",
            });
            finalBuffer = Buffer.from(compressed.buffer);
            contentType = compressed.contentType;
            extension = compressed.extension;
        }

        // Generate unique filename
        const key = `clients/${clientId}/logo-${Date.now()}.${extension}`;

        // Upload to R2
        const publicUrl = await uploadToR2(key, finalBuffer, contentType);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("[UPLOAD_CLIENT_LOGO_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
