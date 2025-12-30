import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 client configuration
export const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Upload a file to R2
 * @param key - The path/filename in R2 (e.g., "avatars/user-123.jpg")
 * @param body - The file content as Buffer
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await r2Client.send(command);

    // Return the public URL
    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from R2
 * @param key - The path/filename in R2
 */
export async function deleteFromR2(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
    });

    await r2Client.send(command);
}

/**
 * Extract the R2 key from a public URL
 * @param url - The full public URL
 * @returns The R2 key or null if not an R2 URL
 */
export function getR2KeyFromUrl(url: string): string | null {
    if (!url.startsWith(R2_PUBLIC_URL)) return null;
    return url.replace(`${R2_PUBLIC_URL}/`, "");
}
