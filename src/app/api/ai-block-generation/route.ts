import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Simplified block types for this specific task
const BLOCK_TYPES_REFERENCE = `
## Available Email Builder Blocks
1. **Heading** - { text: string, level: "h1"|"h2"|"h3" }
2. **Text** - { text: string }
3. **Button** - { text: string, url: string, buttonBackgroundColor: string, buttonStyle: "rectangle"|"rounded"|"pill" }
4. **Image** - props: { url: string, alt: string, linkHref?: string, contentAlignment: "middle"|"left"|"right" }
5. **Divider** - { lineColor?: string, lineHeight?: number }
6. **Spacer** - { height: number }
7. **Avatar** - { imageUrl?: string, size: number, shape: "circle"|"square" }
8. **Container** (Wrapper) - { childrenIds: string[] }
9. **ColumnsContainer** (Layout) - { columnsCount: 2 | 3, columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }] }
`;

const PLACEHOLDER_INSTRUCTIONS = `
## IMAGE PLACEHOLDER GUIDELINES (Use placehold.co)
You must use 'https://placehold.co' for ALL dynamic images.
FORMAT: https://placehold.co/{width}x{height}/{background_hex}/{text_hex}?text={text}&font=roboto
- Derive colors from the User Request (e.g. "Christmas" -> Red/Green) or defaults.
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
            "style": { "padding": { "top": 20, "bottom": 20, "left": 20, "right": 20 }, "backgroundColor": "#f9f9f9" }, 
            "props": { "childrenIds": ["img-1", "head-1", "txt-1", "btn-1"] } 
        }
    },
    "img-1": { "type": "Image", "data": { "props": { "url": "...", "alt": "Product" } } },
    "head-1": { "type": "Heading", "data": { "props": { "text": "Product Name", "level": "h2" } } },
    "txt-1": { "type": "Text", "data": { "props": { "text": "Description..." } } },
    "btn-1": { "type": "Button", "data": { "props": { "text": "Buy Now", "buttonBackgroundColor": "#000" } } }
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

        // Optional: Fetch client colors if needed
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

        const systemPrompt = `You are an expert email component designer. 
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

        // Verify user exists in DB before generating (Ghost Session check)
        const dbUser = await db.user.findUnique({
            where: { id: session.user.id }
        });

        if (!dbUser) {
            return new NextResponse("User record missing from database. Please log out and back in.", { status: 401 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Request: " + prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.response.text();
        const jsonResponse = JSON.parse(responseText);

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error("[AI_BLOCK_GEN]", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
