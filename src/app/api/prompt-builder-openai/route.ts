import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

// Available block types for the AI to use
const BLOCK_TYPES_REFERENCE = `
## Available Email Builder Blocks

You can use the following block types in your template. 
IMPORTANT: "Html" block is NOT available. Do not use it.

1. **Heading** - For titles and headings
   - props: { text: string, level: "h1"|"h2"|"h3" }
   - style: { color?: string, textAlign?: "left"|"center"|"right", padding: { top, bottom, left, right } }

2. **Text** - For paragraphs and body text
   - props: { text: string }
   - style: { fontWeight?: "normal"|"bold", color?: string, padding: { top, bottom, left, right } }

3. **Button** - For call-to-action buttons
   - props: { text: string, url: string, buttonBackgroundColor: string, buttonStyle: "rectangle"|"rounded"|"pill" }
   - style: { fontSize?: number, padding: { top, bottom, left, right }, textAlign?: "left"|"center"|"right" }

4. **Image** - For images
   - props: { url: string, alt: string, linkHref?: string, contentAlignment: "middle"|"left"|"right" }
   - style: { padding: { top, bottom, left, right } }

5. **Divider** - For horizontal line separators
   - props: { lineColor?: string, lineHeight?: number }
   - style: { padding: { top, bottom, left, right } }

6. **Spacer** - For vertical spacing
   - props: { height: number }

7. **Avatar** - For profile images/icons
   - props: { imageUrl?: string, size: number, shape: "circle"|"square" }
   - style: { padding: { top, bottom, left, right } }

8. **Container** - A wrapper block for grouping other blocks
   - props: { childrenIds: string[] }
   - style: { backgroundColor?: string, padding: { top, bottom, left, right }, border?: string, borderRadius?: number }

9. **ColumnsContainer** - For multi-column layouts (2 or 3 columns)
   - props: { 
       columnsCount: 2 | 3,
       columnsGap: number,
       columns: [
         { childrenIds: string[] },
         { childrenIds: string[] },
         { childrenIds: string[] } // Must always provide 3 objects, even if columnsCount is 2
       ]
     }
   - style: { padding: { top, bottom, left, right }, backgroundColor?: string }
`;

const PLACEHOLDER_INSTRUCTIONS = `
## IMAGE PLACEHOLDER GUIDELINES (Use placehold.co)

You must use 'https://placehold.co' for ALL dynamic images unless a specific logo is provided.

FORMAT: https://placehold.co/{width}x{height}/{background_hex}/{text_hex}?text={text}&font={font}

1. **Size**: Width x Height is required (e.g. 600x400).
2. **Colors**: You must specify Background and Text colors.
   - **Context-Aware Colors**: Derive shades/variants from the brand colors! 
   - Start with the Primary Brand Color.
   - Create light tints for backgrounds (e.g., #e0f2fe for a blue brand).
   - Create dark shades for text (e.g., #003366).
   - EXAMPLE: If primary is Blue (#0079cc):
     - Hero Image: https://placehold.co/600x300/e6f4ff/0079cc?text=Hero+Image
     - Product: https://placehold.co/400x400/f8fafc/cbd5e1?text=Product
3. **Text**: URL encoded text description (e.g. ?text=Winter+Collection).
4. **Font**: Use 'roboto' or 'lato' (e.g. &font=roboto).

CRITICAL: Do not use generic grey/white for everything. Match the design style (e.g. bold colors for Marketing, soft for Minimal).
`;

const JSON_FORMAT_EXAMPLE = `
## JSON Structure Example

The template must be a JSON object with this structure:
{
  "root": {
    "type": "EmailLayout",
    "data": {
      "backdropColor": "#F5F5F5",
      "canvasColor": "#FFFFFF", 
      "textColor": "#262626",
      "fontFamily": "MODERN_SANS",
      "childrenIds": ["block-1", "block-2", "cols-1"]
    }
  },
  "block-1": {
    "type": "Heading",
    "data": {
      "style": { "padding": { "top": 24, "bottom": 16, "left": 24, "right": 24 }, "textAlign": "center" },
      "props": { "text": "Welcome!", "level": "h1" }
    }
  },
  "cols-1": {
    "type": "ColumnsContainer",
    "data": {
      "style": { "padding": { "top": 16, "bottom": 16, "left": 24, "right": 24 } },
      "props": {
        "columnsCount": 2,
        "columnsGap": 16,
        "columns": [
          { "childrenIds": ["col-1-img", "col-1-txt"] },
          { "childrenIds": ["col-2-img", "col-2-txt"] },
          { "childrenIds": [] }
        ]
      }
    }
  },
  "col-1-img": {
    "type": "Image",
    "data": {
       "props": { "url": "https://placehold.co/600x400/e0e7ff/4f46e5?text=Feature+1", "alt": "Image 1" }
    }
  },
  "col-1-txt": { "type": "Text", "data": { "props": { "text": "Description 1" } } },
  "col-2-img": { "type": "Image", "data": { "props": { "url": "https://placehold.co/600x400", "alt": "Image 2" } } },
  "col-2-txt": { "type": "Text", "data": { "props": { "text": "Description 2" } } }
}

IMPORTANT RULES:
- The "root" block must always exist with type "EmailLayout"
- All top-level blocks must be in "root.childrenIds"
- Nested blocks (inside Columns or Containers) must be in their parent's "childrenIds" or "columns[i].childrenIds"
- DO NOT put nested blocks in "root.childrenIds" if they are already inside a container
- Each block ID must be unique
`;

const STYLE_GUIDELINES: Record<string, string> = {
    default: `STYLE: Default (Clean & Balanced)
    - STRUCTURE: Centered or single-column layout. Header title, 1–2 content sections, One primary CTA button, Simple footer.
    - RULES: Neutral spacing, Standard button size, Soft borders or dividers, No aggressive visuals.
    - TONE: Professional, Friendly, Clear and informative.
    - INSTRUCTION: Build a balanced, professional email with a clean layout. Prioritize clarity and usability. Avoid overly bold visuals or heavy branding.`,

    marketing: `STYLE: Marketing (Bold & Promotional)
    - STRUCTURE: Hero section (large headline/banner), Supporting subtitle, Feature blocks or cards (2–3 max), Strong prominent CTA, Secondary CTA optional.
    - RULES: Strong visual hierarchy, Emphasized CTA button, Use contrast and spacing to drive attention, Sections clearly separated.
    - TONE: Persuasive, Energetic, Action-oriented.
    - INSTRUCTION: Build a high-impact promotional email designed to maximize clicks and conversions. Emphasize the CTA and benefits. Visual structure should guide the reader toward action. Use BOLD colors from the palette.`,

    minimal: `STYLE: Minimal (Plain & Text-Focused)
    - STRUCTURE: No hero section, Mostly text blocks, Natural paragraph flow, CTA as a text link (not a button), Signature-style footer.
    - RULES: Very light styling, No cards, no sections, No background colors, Looks like a personal email.
    - TONE: Human, Conversational, Personal.
    - INSTRUCTION: Generate a minimal, text-first email that feels like a personal message. Avoid visual elements and buttons. Focus on readability and authenticity.`,

    branded: `STYLE: Branded (Custom & Visual)
    - STRUCTURE: Brand header (logo or color bar), Structured sections, Reusable blocks (cards, feature rows), On-brand CTA, Branded footer.
    - RULES: Apply brand colors consistently, Use visual blocks and grids, Maintain design system consistency, Footer is mandatory.
    - TONE: Confident, Consistent, On-brand.
    - INSTRUCTION: Build a structured, brand-consistent email using visual sections and reusable blocks. Apply brand identity strongly while maintaining clarity and readability.`,
};

// Helper to format saved blocks for AI context
async function getSavedBlocksInstructions(clientId: string | null) {
    const savedBlocks = await db.savedBlock.findMany({
        where: {
            OR: [
                { clientId: clientId || undefined },
                { clientId: null }, // Global blocks
            ],
        },
        orderBy: { category: "asc" },
        select: {
            id: true,
            name: true,
            category: true,
            description: true,
            jsonContent: true,
            clientId: true
        }
    });

    if (savedBlocks.length === 0) return "";

    const blocksList = savedBlocks.map(block => {
        const isClientSpecific = block.clientId ? "(Client Specific)" : "(Global)";
        const category = block.category ? `[${block.category}]` : "";
        return `- Name: "${block.name}" ${category} ${isClientSpecific}\n  Description: ${block.description || "No description"}\n  Structure: ${JSON.stringify(block.jsonContent).substring(0, 500)}... (truncated)\n  ID: "${JSON.stringify(block.jsonContent)}"\n  NOTE: To use this block, you MUST copy the exact JSON structure provided in the ID field (the full JSON object) into your template.`;
    }).join("\n\n");

    return `
## AVAILABLE REUSABLE BLOCKS
You have access to the following pre-saved blocks. You SHOULD prioritize using these blocks when they match the user's request, especially for headers, footers, and standard layouts.

${blocksList}

INSTRUCTION FOR USING SAVED BLOCKS:
To use a saved block, you must insert its JSON content (from the "Structure" or "ID" field) directly into your template structure as a new block entry, and add its ID to the parent's childrenIds.
`;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { prompt, style = "default", clientId, model } = body;

        if (!prompt) {
            return new NextResponse("Prompt is required", { status: 400 });
        }

        // Model selection with fallback to gpt-4.1 (Public default)
        const modelName = model || "gpt-4.1";

        // Get client data if provided
        let clientData = null;
        if (clientId) {
            clientData = await db.client.findUnique({
                where: { id: clientId },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    brandColors: true,
                },
            });
        }

        // Get saved blocks instructions
        const savedBlocksInstructions = await getSavedBlocksInstructions(clientId || null);

        // Build the system prompt
        const brandInstructions = clientData?.brandColors
            ? `
## Brand Colors - STRICT ENFORCEMENT
You MUST use these exact colors.
- Primary Color: ${(clientData.brandColors as any)?.primary || "#0079cc"}
- Secondary Color: ${(clientData.brandColors as any)?.secondary || "#6B7280"}

RULES FOR COLORS:
1. ALL Buttons MUST use the Primary Color for "buttonBackgroundColor".
2. Headings should optionally use the Primary Color.
3. Links should use the Primary Color.
4. **Shades & Variants**: When creating placeholder images or backgrounds, DO NOT just use the raw Primary Color. Create lighter tints (e.g. opacity 10%) for backgrounds and darker shades for text to create depth.
`
            : "";

        const systemPrompt = `You are an expert email template designer. Generate a RICH, DETAILED, and COMPREHENSIVE email template based on the user's request.

${BLOCK_TYPES_REFERENCE}

${PLACEHOLDER_INSTRUCTIONS}

${JSON_FORMAT_EXAMPLE}

## Style Guidelines (${style})
${STYLE_GUIDELINES[style] || STYLE_GUIDELINES.default}

${brandInstructions}

${savedBlocksInstructions}

## Context-Aware Overrides
1. **Themes/Moods**: Analyze the User Request for specific themes (e.g. "Christmas", "Black Friday", "Urgent"). If found, adjust the color palette and design mood to match (e.g. Red/Green for Christmas), even if it deviates slightly from strict brand colors.
2. **Structural Hints**: If the user asks for "Team introduction", prioritize Avatar blocks. If "Product list", prioritize ColumnsContainer with Images.
3. **Explicit Colors**: If the user says "Make the background blue", this overrides style defaults.

## Language Detection - CRITICAL
- Detect the language of the 'User Request'.
- If the request is in English, generate ALL content (headings, text, buttons) in English.
- If the request is in French, generate ALL content (headings, text, buttons) in French.
- Use the detected language for the Template Title and Description as well.

## Content Requirements - CRITICAL
- Create a LONG, DETAILED email. Do not create short, empty templates.
- Use at least 8-10 different blocks.
- Use "ColumnsContainer" to create interesting layouts (e.g. side-by-side image and text).
- Use "Container" to group related sections, potentially with background colors.
- Include a Header section (Logo/Brand Name), Introduction, Main Content (using columns), Feature Highlights, and a Footer.
- Write realistic, engaging copy relevant to the prompt. Do not use Lorem Ipsum.
- IF SAVED BLOCKS ARE AVAILABLE (headers, footers), USE THEM!

## Your Response Format
You MUST respond with a valid JSON object ONLY. 
Do NOT include any markdown code blocks, explanations, or additional text.
Your response must be a single JSON object containing:
{
  "title": "Short template title (max 8 words)",
  "description": "Brief description (max 16 words)",
  "template": { /* the TEditorConfiguration JSON object */ }
}
`;

        // Prepare API parameters
        const apiParams: any = {
            model: modelName,
            input: systemPrompt + "\n\nUser Request: " + prompt,
            max_output_tokens: 4096,
        };

        // Only add temperature for non-reasoning models (o-series)
        if (!modelName.startsWith("o")) {
            apiParams.temperature = 0.7;
        }

        // Call OpenAI API using modern responses endpoint
        const response = await (openai as any).responses.create(apiParams);

        // Robustly extract text from Responses API output
        let responseText = "";
        if (response.output_text) {
            responseText = response.output_text;
        } else if (response.output && Array.isArray(response.output)) {
            responseText = response.output
                .flatMap((item: any) => item.content || [])
                .filter((c: any) => c.type === "output_text" || c.type === "text")
                .map((c: any) => c.text)
                .join("\n");
        } else if (response.choices?.[0]?.message?.content) {
            responseText = response.choices[0].message.content;
        }

        // Parse the AI response
        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error("[PROMPT_BUILDER_OPENAI] Failed to parse AI response:", responseText);
            return new NextResponse("AI generated invalid response format", { status: 500 });
        }

        const { title, description, template } = aiResponse;

        if (!template || !template.root) {
            return new NextResponse("AI failed to generate valid template structure", { status: 500 });
        }

        // Render HTML from the template (simplified - the editor will handle full rendering)
        const htmlContent = `<!DOCTYPE html><html><body><p>Template generated by AI (OpenAI)</p></body></html>`;

        // Create the template in the database
        let templateName = title || "AI Generated Template (OpenAI)";
        let uniqueName = templateName;
        let counter = 1;

        // Check for name collision and generate unique name
        while (true) {
            const existingTemplate = await db.template.findFirst({
                where: {
                    name: uniqueName,
                    clientId: clientId || null,
                },
            });

            if (!existingTemplate) {
                break;
            }

            uniqueName = `${templateName} (${counter})`;
            counter++;
        }

        // Verify user exists in DB before creating template (Ghost Session check)
        const dbUser = await db.user.findUnique({
            where: { id: session.user.id }
        });

        if (!dbUser) {
            return new NextResponse("User record missing from database. Please log out and back in.", { status: 401 });
        }

        const newTemplate = await db.template.create({
            data: {
                name: uniqueName,
                description: description || "Created with Prompt Builder",
                htmlContent,
                jsonContent: template,
                isAIGenerated: true,
                clientId: clientId || null,
                createdById: session.user.id,
                updatedById: session.user.id,
            },
            include: {
                client: { select: { id: true, slug: true, name: true } },
            },
        });

        // Determine redirect URL
        let redirectUrl: string;
        if (newTemplate.client) {
            redirectUrl = `/dashboard/clients/${newTemplate.client.slug}/templates/${newTemplate.id}`;
        } else {
            redirectUrl = `/dashboard/templates/${newTemplate.id}`;
        }

        // Revalidate paths to refresh the lists
        revalidatePath("/dashboard/templates");
        if (newTemplate.client?.slug) {
            revalidatePath(`/dashboard/clients/${newTemplate.client.slug}/templates`);
        }

        return NextResponse.json({
            success: true,
            template: newTemplate,
            redirectUrl,
            provider: "openai", // Added to identify which provider was used
        });
    } catch (error: any) {
        console.error("[PROMPT_BUILDER_OPENAI_POST]", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
