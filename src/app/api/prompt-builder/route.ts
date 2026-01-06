import { NextRequest, NextResponse } from "next/server";
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
      "childrenIds": ["block-1", "block-2", "block-3"]
    }
  },
  "block-1": {
    "type": "Heading",
    "data": {
      "style": { "padding": { "top": 24, "bottom": 16, "left": 24, "right": 24 }, "textAlign": "center" },
      "props": { "text": "Welcome!", "level": "h1" }
    }
  },
  "block-2": {
    "type": "Text",
    "data": {
      "style": { "fontWeight": "normal", "padding": { "top": 0, "bottom": 16, "left": 24, "right": 24 } },
      "props": { "text": "Thank you for joining us..." }
    }
  },
  "block-3": {
    "type": "Button",
    "data": {
      "style": { "fontSize": 14, "padding": { "top": 16, "bottom": 24, "left": 24, "right": 24 }, "textAlign": "center" },
      "props": { "buttonBackgroundColor": "#0079cc", "buttonStyle": "rectangle", "text": "Get Started", "url": "#" }
    }
  }
}

IMPORTANT RULES:
- The "root" block must always exist with type "EmailLayout"
- All child blocks must be listed in the "childrenIds" array
- Each block ID must be unique (use format "block-1", "block-2", etc.)
- Use placeholder URLs like "https://placehold.co/600x200" for images
- Use "#" for button URLs as placeholders
`;

const STYLE_GUIDELINES: Record<string, string> = {
    default: "Clean, professional layout with moderate spacing. Use a white canvas and light gray backdrop.",
    colored: "Use vibrant, branded colors throughout. Apply the primary color to headings and buttons. Use secondary color for accents.",
    bento: "Use a structured grid-like layout with containers. Group related content visually. Modern and organized.",
    simple: "Minimalist design with ample whitespace. Focus on typography and a single accent color for CTAs.",
    minimal: "Ultra-clean design. Very few elements, maximum whitespace, understated styling.",
};

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

        // Build the system prompt
        const brandInstructions = clientData?.brandColors
            ? `
## Brand Colors
Use these colors for the template:
- Primary Color: ${(clientData.brandColors as any)?.primary || "#0079cc"}
- Secondary Color: ${(clientData.brandColors as any)?.secondary || "#6B7280"}
- CTA Color: ${(clientData.brandColors as any)?.cta || "#0079cc"}
`
            : "";

        const systemPrompt = `You are an expert email template designer. Generate a complete email template based on the user's request.

${BLOCK_TYPES_REFERENCE}

${JSON_FORMAT_EXAMPLE}

## Style Guidelines (${style})
${STYLE_GUIDELINES[style] || STYLE_GUIDELINES.default}

${brandInstructions}

## Your Response Format
You must respond with a valid JSON object containing:
{
  "title": "Short template title (max 8 words)",
  "description": "Brief description (max 16 words)",
  "template": { /* the TEditorConfiguration JSON object */ }
}

IMPORTANT:
- The title should be concise and descriptive (maximum 8 words)
- The description should summarize the email purpose (maximum 16 words)
- The template must be a valid JSON object following the structure above
- Only use the block types listed above
- Make the content relevant to the user's request
- Include appropriate padding and spacing for good visual appearance
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
        const newTemplate = await db.template.create({
            data: {
                name: title || "AI Generated Template",
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
