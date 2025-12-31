"use client";

import { EmailDocument, Row, Column, Block } from "./types";
import { v4 as uuidv4 } from "uuid";

export const createId = () => uuidv4();

export function moveItem(
    document: EmailDocument,
    activeId: string,
    overId: string
): EmailDocument {
    // 1. Deep clone the document
    const nextDoc = JSON.parse(JSON.stringify(document));

    // 2. Find the items and their parents
    let draggedItem: any = null;
    let draggedParent: any = null;
    let draggedIndex: number = -1;

    let targetParent: any = null;
    let targetIndex: number = -1;

    // Search rows
    const rowIndex = nextDoc.rows.findIndex((r: any) => r.id === activeId);
    if (rowIndex !== -1) {
        draggedItem = nextDoc.rows[rowIndex];
        draggedParent = nextDoc.rows;
        draggedIndex = rowIndex;
    }

    // Search blocks nested in columns
    nextDoc.rows.forEach((row: Row) => {
        row.columns.forEach((col: Column) => {
            const bIndex = col.blocks.findIndex((b) => b.id === activeId);
            if (bIndex !== -1) {
                draggedItem = col.blocks[bIndex];
                draggedParent = col.blocks;
                draggedIndex = bIndex;
            }
        });
    });

    if (!draggedItem) return document;

    // Find target position
    const targetRowIndex = nextDoc.rows.findIndex((r: any) => r.id === overId);
    if (targetRowIndex !== -1) {
        targetParent = nextDoc.rows;
        targetIndex = targetRowIndex;
    }

    nextDoc.rows.forEach((row: Row) => {
        row.columns.forEach((col: Column) => {
            if (col.id === overId) {
                targetParent = col.blocks;
                targetIndex = col.blocks.length; // Drop at end of column
            }
            const bIndex = col.blocks.findIndex((b) => b.id === overId);
            if (bIndex !== -1) {
                targetParent = col.blocks;
                targetIndex = bIndex;
            }
        });
    });

    if (!targetParent || targetIndex === -1) return document;

    // Perform the move
    draggedParent.splice(draggedIndex, 1);
    targetParent.splice(targetIndex, 0, draggedItem);

    return nextDoc;
}

export function createInitialBlock(type: Block["type"]): Block {
    return {
        id: createId(),
        type,
        content: {},
        styles: {},
    };
}

export function createInitialRow(columnCount: number = 1): Row {
    const columns: Column[] = Array.from({ length: columnCount }, () => ({
        id: createId(),
        width: 100 / columnCount,
        blocks: [],
        styles: {},
    }));

    return {
        id: createId(),
        columns,
        styles: {
            padding: "20px 0",
        },
    };
}
