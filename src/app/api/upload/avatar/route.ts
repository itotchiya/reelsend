import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";
import { db } from "@/lib/db";
import { compressAvatar } from "@/lib/image";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return new NextResponse("Invalid file type. Allowed: JPEG, PNG, WebP, GIF", { status: 400 });
        }

        // Validate file size (max 10MB before compression)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return new NextResponse("File too large. Max 10MB", { status: 400 });
        }

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Compress the image (400x400, WebP, quality 80)
        const { buffer: compressedBuffer, extension, contentType } = await compressAvatar(buffer);

        // Generate unique filename
        const key = `avatars/${session.user.id}-${Date.now()}.${extension}`;

        // Upload to R2
        const publicUrl = await uploadToR2(key, compressedBuffer, contentType);

        // Update user's image in database
        await db.user.update({
            where: { id: session.user.id },
            data: { image: publicUrl },
        });

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("[UPLOAD_AVATAR_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
