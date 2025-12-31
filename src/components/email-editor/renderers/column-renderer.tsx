"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Column } from "@/lib/email-editor/types";
import { cn } from "@/lib/utils";
import { BlockRenderer } from "./block";

interface ColumnRendererProps {
    column: Column;
}

export function ColumnRenderer({ column }: ColumnRendererProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: {
            type: "column",
            columnId: column.id,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-1 min-h-[100px] transition-colors rounded p-2 border border-dashed border-transparent",
                isOver && "bg-primary/5 border-primary/30"
            )}
            style={{
                flexBasis: `${column.width}%`,
                ...column.styles,
            }}
        >
            {column.blocks.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Empty Column</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {column.blocks.map((block) => (
                        <BlockRenderer key={block.id} block={block} />
                    ))}
                </div>
            )}
        </div>
    );
}
