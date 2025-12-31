"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Row } from "@/lib/email-editor/types";
import { cn } from "@/lib/utils";
import { ColumnRenderer } from "./column-renderer";

interface RowRendererProps {
    row: Row;
}

export function RowRenderer({ row }: RowRendererProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: row.id,
        data: {
            type: "row",
            rowId: row.id,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...row.styles,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative border-2 border-transparent hover:border-primary/50 transition-colors rounded-md",
                isDragging && "opacity-50"
            )}
        >
            {/* Row Toolbar */}
            <div className="absolute -left-10 top-0 hidden group-hover:flex flex-col gap-1">
                <div {...attributes} {...listeners} className="p-2 bg-background border rounded cursor-grab active:cursor-grabbing">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground"><path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM9.5 3C8.67157 3 8 3.67157 8 4.5C8 5.32843 8.67157 6 9.5 6C10.3284 6 11 5.32843 11 4.5C11 3.67157 10.3284 3 9.5 3ZM5.5 9C4.67157 9 4 9.67157 4 10.5C4 11.3284 4.67157 12 5.5 12C6.32843 12 7 11.3284 7 10.5C7 9.67157 6.32843 9 5.5 9ZM9.5 9C8.67157 9 8 9.67157 8 10.5C8 11.3284 8.67157 12 9.5 12C10.3284 12 11 11.3284 11 10.5C11 9.67157 10.3284 9 9.5 9Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </div>
            </div>

            <div className="flex w-full gap-4">
                {row.columns.map((col) => (
                    <ColumnRenderer key={col.id} column={col} />
                ))}
            </div>
        </div>
    );
}
