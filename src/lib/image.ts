import sharp from "sharp";

export interface ImageCompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
}

const defaultOptions: ImageCompressionOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 80,
    format: "webp",
};

/**
 * Compress and resize an image
 * @param buffer - The input image buffer
 * @param options - Compression options
 * @returns The compressed image buffer and content type
 */
export async function compressImage(
    buffer: Buffer,
    options: ImageCompressionOptions = {}
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
    const opts = { ...defaultOptions, ...options };

    let pipeline = sharp(buffer)
        .resize(opts.maxWidth, opts.maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
        });

    let contentType: string;
    let extension: string;

    switch (opts.format) {
        case "jpeg":
            pipeline = pipeline.jpeg({ quality: opts.quality });
            contentType = "image/jpeg";
            extension = "jpg";
            break;
        case "png":
            pipeline = pipeline.png({ quality: opts.quality });
            contentType = "image/png";
            extension = "png";
            break;
        case "webp":
        default:
            pipeline = pipeline.webp({ quality: opts.quality });
            contentType = "image/webp";
            extension = "webp";
            break;
    }

    const compressedBuffer = await pipeline.toBuffer();

    return { buffer: compressedBuffer, contentType, extension };
}

/**
 * Compress avatar specifically (smaller size, square)
 */
export async function compressAvatar(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
    const compressedBuffer = await sharp(buffer)
        .resize(400, 400, {
            fit: "cover",
            position: "center",
        })
        .webp({ quality: 80 })
        .toBuffer();

    return {
        buffer: compressedBuffer,
        contentType: "image/webp",
        extension: "webp",
    };
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
    return sharp(buffer).metadata();
}
