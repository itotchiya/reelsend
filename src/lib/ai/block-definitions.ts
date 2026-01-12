/**
 * Block Definitions for AI Model Access
 * 
 * @path src/lib/ai/block-definitions.ts
 * 
 * This file exports functions to access saved email blocks
 * for use by the AI model in the prompt builder.
 * 
 * The AI can use these blocks to construct templates based on
 * existing, proven block designs.
 */

import { db } from "@/lib/db";

export interface BlockDefinition {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    jsonContent: any;
    clientId: string | null;
    clientName: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface BlockCategory {
    name: string;
    blocks: BlockDefinition[];
}

/**
 * Get all saved blocks from the database
 * Used by AI to access the full block library for template generation
 */
export async function getAllBlockDefinitions(): Promise<BlockDefinition[]> {
    const blocks = await db.savedBlock.findMany({
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: [
            { category: "asc" },
            { name: "asc" },
        ],
    });

    return blocks.map((block) => ({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        jsonContent: block.jsonContent,
        clientId: block.clientId,
        clientName: block.client?.name || null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
    }));
}

/**
 * Get blocks filtered by category
 * Useful for AI to find specific types of blocks (headers, footers, etc.)
 */
export async function getBlocksByCategory(category: string): Promise<BlockDefinition[]> {
    const blocks = await db.savedBlock.findMany({
        where: { category },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { name: "asc" },
    });

    return blocks.map((block) => ({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        jsonContent: block.jsonContent,
        clientId: block.clientId,
        clientName: block.client?.name || null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
    }));
}

/**
 * Get only global blocks (available to all clients)
 * These are reusable across any client's templates
 */
export async function getGlobalBlocks(): Promise<BlockDefinition[]> {
    const blocks = await db.savedBlock.findMany({
        where: { clientId: null },
        orderBy: [
            { category: "asc" },
            { name: "asc" },
        ],
    });

    return blocks.map((block) => ({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        jsonContent: block.jsonContent,
        clientId: null,
        clientName: null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
    }));
}

/**
 * Get blocks for a specific client
 * Includes both client-specific and global blocks
 */
export async function getBlocksForClient(clientId: string): Promise<BlockDefinition[]> {
    const blocks = await db.savedBlock.findMany({
        where: {
            OR: [
                { clientId: clientId },
                { clientId: null }, // Include global blocks
            ],
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: [
            { category: "asc" },
            { name: "asc" },
        ],
    });

    return blocks.map((block) => ({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        jsonContent: block.jsonContent,
        clientId: block.clientId,
        clientName: block.client?.name || null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
    }));
}

/**
 * Get blocks organized by category
 * Useful for AI to understand the block library structure
 */
export async function getBlocksGroupedByCategory(): Promise<BlockCategory[]> {
    const blocks = await getAllBlockDefinitions();

    const categoryMap = new Map<string, BlockDefinition[]>();

    blocks.forEach((block) => {
        const category = block.category || "Uncategorized";
        if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(block);
    });

    return Array.from(categoryMap.entries()).map(([name, blocks]) => ({
        name,
        blocks,
    }));
}

/**
 * Get a single block by ID
 * Used when AI needs to reference a specific block
 */
export async function getBlockById(id: string): Promise<BlockDefinition | null> {
    const block = await db.savedBlock.findUnique({
        where: { id },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!block) return null;

    return {
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        jsonContent: block.jsonContent,
        clientId: block.clientId,
        clientName: block.client?.name || null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
    };
}

/**
 * Get block summary for AI context
 * Returns a simplified list suitable for including in prompts
 */
export async function getBlockSummaryForAI(): Promise<string> {
    const categorized = await getBlocksGroupedByCategory();

    if (categorized.length === 0) {
        return "No saved blocks available in the library.";
    }

    let summary = "Available Email Blocks:\n\n";

    categorized.forEach((category) => {
        summary += `## ${category.name}\n`;
        category.blocks.forEach((block) => {
            summary += `- **${block.name}**`;
            if (block.description) {
                summary += `: ${block.description}`;
            }
            if (block.clientName) {
                summary += ` (${block.clientName})`;
            } else {
                summary += ` (Global)`;
            }
            summary += `\n`;
        });
        summary += "\n";
    });

    return summary;
}

/**
 * Export all block JSON content for AI training
 * This provides the raw block structures for the AI to learn from
 */
export async function getBlockContentForTraining(): Promise<{
    blocks: Array<{
        name: string;
        category: string | null;
        description: string | null;
        content: any;
    }>;
}> {
    const blocks = await getAllBlockDefinitions();

    return {
        blocks: blocks.map((block) => ({
            name: block.name,
            category: block.category,
            description: block.description,
            content: block.jsonContent,
        })),
    };
}
