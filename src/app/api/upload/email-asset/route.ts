import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const templateId = formData.get("templateId") as string;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return new NextResponse("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed", { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return new NextResponse("File too large. Maximum size is 5MB", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split(".").pop() || "jpg";
        const fileName = `${nanoid()}.${fileExtension}`;

        // Store under emails/templates/{templateId}/ or emails/assets/ for general use
        const key = templateId
            ? `emails/templates/${templateId}/${fileName}`
            : `emails/assets/${fileName}`;

        const publicUrl = await uploadToR2(key, buffer, file.type);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("[EMAIL_ASSET_UPLOAD]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
