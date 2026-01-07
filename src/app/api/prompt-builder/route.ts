import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Available block types for the AI to use
const BLOCK_TYPES_REFERENCE = `
## Available Email Builder Blocks

You can use the following block types in your template:

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
       columns: { childrenIds: string[] }[] 
     }
   - style: { padding: { top, bottom, left, right }, backgroundColor?: string }
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
          { "childrenIds": ["col-2-img", "col-2-txt"] }
        ]
      }
    }
  },
  "col-1-img": {
    "type": "Image",
    "data": {
       "props": { "url": "https://placehold.co/600x400", "alt": "Image 1" }
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
    default: "Clean, professional layout with moderate spacing. Use a white canvas and light gray backdrop.",
    colored: "Use vibrant, branded colors throughout. Apply the primary color to all headings and buttons aggressively. Use secondary color for accents and backgrounds.",
    bento: "Use a structured grid-like layout with ColumnsContainer and Container blocks. Group related content visually with borders and background colors. Modern and organized.",
    simple: "Minimalist design with ample whitespace. Focus on typography and a single accent color for CTAs.",
    minimal: "Ultra-clean design. Very few elements, maximum whitespace, understated styling.",
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
        const { prompt, style = "default", clientId } = body;

        if (!prompt) {
            return new NextResponse("Prompt is required", { status: 400 });
        }

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
`
            : "";

        const systemPrompt = `You are an expert email template designer. Generate a RICH, DETAILED, and COMPREHENSIVE email template based on the user's request.

${BLOCK_TYPES_REFERENCE}

${JSON_FORMAT_EXAMPLE}

## Style Guidelines (${style})
${STYLE_GUIDELINES[style] || STYLE_GUIDELINES.default}

${brandInstructions}

${savedBlocksInstructions}

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
You must respond with a valid JSON object containing:
{
  "title": "Short template title (max 8 words)",
  "description": "Brief description (max 16 words)",
  "template": { /* the TEditorConfiguration JSON object */ }
}
`;

        // Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nUser Request: " + prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            },
        });

        const responseText = result.response.text();

        // Parse the AI response
        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error("[PROMPT_BUILDER] Failed to parse AI response:", responseText);
            return new NextResponse("AI generated invalid response format", { status: 500 });
        }

        const { title, description, template } = aiResponse;

        if (!template || !template.root) {
            return new NextResponse("AI failed to generate valid template structure", { status: 500 });
        }

        // Render HTML from the template (simplified - the editor will handle full rendering)
        const htmlContent = `<!DOCTYPE html><html><body><p>Template generated by AI</p></body></html>`;

        // Create the template in the database
        let templateName = title || "AI Generated Template";
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
        });
    } catch (error: any) {
        console.error("[PROMPT_BUILDER_POST]", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
