import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";
import { nanoid } from "nanoid";
import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const templateId = formData.get("templateId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is 5MB (your file: ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
                { status: 400 }
            );
        }

        let buffer: Buffer = Buffer.from(await file.arrayBuffer());
        let contentType = file.type;
        let fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";

        // Compress images (except GIFs to preserve animation)
        if (file.type !== "image/gif") {
            try {
                const image = sharp(buffer);
                const metadata = await image.metadata();

                // Resize if too large (max 1200px width for email compatibility)
                let processor = image;
                if (metadata.width && metadata.width > 1200) {
                    processor = processor.resize(1200, undefined, { withoutEnlargement: true });
                }

                // Compress based on format - output as WebP for best compression
                buffer = await processor
                    .webp({ quality: 80 })
                    .toBuffer() as Buffer;

                contentType = "image/webp";
                fileExtension = "webp";
            } catch (compressionError) {
                console.error("[IMAGE_COMPRESSION_ERROR]", compressionError);
                // Fall back to original if compression fails
            }
        }

        const fileName = `${nanoid()}.${fileExtension}`;

        // Store under emails/templates/{templateId}/ or emails/assets/ for general use
        const key = templateId
            ? `emails/templates/${templateId}/${fileName}`
            : `emails/assets/${fileName}`;

        const publicUrl = await uploadToR2(key, buffer, contentType);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("[EMAIL_ASSET_UPLOAD]", error);
        return NextResponse.json(
            { error: "Upload failed. Please try again." },
            { status: 500 }
        );
    }
}
