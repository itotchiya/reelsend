import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function stripHtml(text: string) {
    if (typeof text !== 'string') return text;
    // Remove HTML tags but keep content
    return text.replace(/<[^>]*>?/gm, '');
}

function deepStripHtml(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => deepStripHtml(item));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = deepStripHtml(obj[key]);
        }
        return newObj;
    } else if (typeof obj === 'string') {
        return stripHtml(obj);
    }
    return obj;
}

// Simplified block types for this specific task
const BLOCK_TYPES_REFERENCE = `
## Available Email Builder Blocks
1. **Heading** - { text: string, level: "h1"|"h2"|"h3" }
2. **Text** - { text: string }
3. **Button** - { text: string, url: string, buttonBackgroundColor: string, buttonStyle: "rectangle"|"rounded"|"pill", textColor: string }
4. **Image** - props: { url: string, alt: string, linkHref?: string, contentAlignment: "middle"|"left"|"right" }
5. **Divider** - { lineColor?: string, lineHeight?: number }
6. **Spacer** - { height: number }
7. **Avatar** - { imageUrl?: string, size: number, shape: "circle"|"square" }
8. **Container** (Wrapper) - { childrenIds: string[] }
9. **ColumnsContainer** (Layout) - { columnsCount: 2 | 3, columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }] }
`;

const PLACEHOLDER_INSTRUCTIONS = `
- For all images, use placeholders: https://placehold.co/[WIDTH]x[HEIGHT]?text=[SIZE]
- Hero: 600x400
- Product: 400x400
- Logo: 200x100
- NEVER use titles or HTML in content.
`;

const SYSTEM_PROMPT_CONSTRAINTS = `
You are an AI that generates single email content blocks.
- **THEME**: Always use LIGHT THEME colors as the builder UI is strictly light.
- **RESPONSE**: ONLY return valid JSON.
- **CONTENT**: Keep text short, simple, and clean. 
- **STRICT PROHIBITION**: NEVER include HTML tags (no <a>, <span>, <br>, etc.). **PLAIN TEXT ONLY**.
- **NO LINKS**: Even for footers or unsubscribe sections, DO NOT use <a> tags. Use plain text like "Unsubscribe here".
- **IMAGES**: Use placeholders: https://placehold.co/[WIDTH]x[HEIGHT]?text=[SIZE] (e.g. 600x400).
- **DIVIDERS**: Use light, subtle colors (e.g., #e9ecef).
- **TYPEFACE**: Match requested tone (MODERN_SANS for modern, SERIF for elegant).
- **CONTRAST**: Ensure dark text on light backgrounds.

### NEGATIVE CONSTRAINTS (NEVER DO THESE):
1. NEVER output <a href="...">text</a>.
2. NEVER output <br/> or <p> tags inside the JSON strings.
3. NEVER output <span> or <div> tags inside the content strings.
4. If a piece of text requires a link, just write the text. The user will add the link later.
`;

const JSON_FORMAT_EXAMPLE = `
## JSON Response Format
You must return a JSON object representing a SINGLE top-level block (usually a Container or ColumnsContainer) that contains the requested content.

Example for "Product Card":
{
    "rootBlockId": "container-1",
    "blocks": {
        "container-1": {
            "type": "Container",
            "data": {
                "style": { 
                    "padding": { "top": 20, "bottom": 20, "left": 20, "right": 20 }, 
                    "backgroundColor": "#ffffff",
                    "dividerColor": "#e9ecef"
                },
                "props": { "childrenIds": ["img-1", "head-1", "txt-1", "btn-1"] }
            }
        },
        "img-1": { "type": "Image", "data": { "props": { "url": "https://placehold.co/400x400?text=400x400", "alt": "400x400" } } },
        "head-1": { "type": "Heading", "data": { "props": { "text": "Product Name", "level": "h2" } } },
        "txt-1": { "type": "Text", "data": { "props": { "text": "Professional and clean description." } } },
        "btn-1": { "type": "Button", "data": { "props": { "text": "Buy Now", "buttonBackgroundColor": "#000000", "textColor": "#ffffff" } } }
    }
}
`;

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { prompt, clientSlug } = body;

        if (!prompt) {
            return new NextResponse("Prompt is required", { status: 400 });
        }

        let clientData = null;
        if (clientSlug) {
            clientData = await db.client.findUnique({
                where: { slug: clientSlug },
                select: { brandColors: true }
            });
        }

        const brandInstructions = clientData?.brandColors
            ? `
## Brand Colors - USE THESE
- Primary: ${(clientData.brandColors as any)?.primary || "#0079cc"}
- Secondary: ${(clientData.brandColors as any)?.secondary || "#6B7280"}
`
            : "";

        const systemPrompt = `
${SYSTEM_PROMPT_CONSTRAINTS}

You are an expert email component designer. 
Your task is to generate a SINGLE, standalone email block (often a Container or Layout) based on the user's request.

${BLOCK_TYPES_REFERENCE}
${PLACEHOLDER_INSTRUCTIONS}
${brandInstructions}
${JSON_FORMAT_EXAMPLE}

## Instructions
1. Analyze the request (e.g. "Hero Section", "Product List", "Footer").
2. Choose the best Top-Level Block (usually 'Container' to wrap elements, or 'ColumnsContainer' for grids).
3. Generate all child blocks referenced in 'childrenIds'.
4. Return a clean, valid JSON object with "rootBlockId" and a map of "blocks".
5. DO NOT use the Html block.
6. Use elegant, modern padding and spacing.
`;

        const dbUser = await db.user.findUnique({
            where: { id: session.user.id }
        });

        if (!dbUser) {
            return new NextResponse("User record missing from database. Please log out and back in.", { status: 401 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Request: " + prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.response.text();
        const jsonResponse = JSON.parse(responseText);

        // Sanitize response to remove any stubborn HTML tags
        const sanitizedResponse = deepStripHtml(jsonResponse);

        return NextResponse.json(sanitizedResponse);

    } catch (error: any) {
        console.error("[AI_BLOCK_GEN]", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
