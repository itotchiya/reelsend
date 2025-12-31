import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split(".").pop();
        const fileName = `${nanoid()}.${fileExtension}`;
        const contentType = file.type;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileName,
                Body: buffer,
                ContentType: contentType,
                // ACL: "public-read", // R2 buckets are usually private by default, usually handled by worker or public bucket setting
            })
        );

        const url = `${R2_PUBLIC_URL}/${fileName}`;

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return new NextResponse("Internal API Error", { status: 500 });
    }
}
