"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import {
    Type,
    Image as ImageIcon,
    MousePointer2,
    Minus,
    Layout,
    Columns,
    Grid2X2,
    Table as TableIcon,
    Video,
    Code,
    Share2,
    Menu as MenuIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS = [
    { type: "heading", label: "Heading", icon: Type },
    { type: "paragraph", label: "Text", icon: Type },
    { type: "image", label: "Image", icon: ImageIcon },
    { type: "button", label: "Button", icon: MousePointer2 },
    { type: "divider", label: "Divider", icon: Minus },
    { type: "social", label: "Social", icon: Share2 },
    { type: "menu", label: "Menu", icon: MenuIcon },
    { type: "video", label: "Video", icon: Video },
    { type: "html", label: "HTML", icon: Code },
];

const LAYOUTS = [
    { type: "1-layout", label: "100%", icon: Layout },
    { type: "2-layout", label: "50/50", icon: Columns },
    { type: "3-layout", label: "33/33/33", icon: Grid2X2 },
];

export function Sidebar() {
    return (
        <div className="w-80 border-r bg-background flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Blocks</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
                {TOOLS.map((tool) => (
                    <DraggableItem key={tool.type} tool={tool} />
                ))}
            </div>

            <div className="p-4 border-b border-t mt-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Layouts</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
                {LAYOUTS.map((layout) => (
                    <DraggableItem key={layout.type} tool={layout} />
                ))}
            </div>
        </div>
    );
}

function DraggableItem({ tool }: { tool: any }) {
    const { dispatch } = useEmailEditorStore();
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `sidebar-${tool.type}`,
        data: {
            isSidebar: true,
            type: tool.type,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const Icon = tool.icon;

    const handleClick = () => {
        if (tool.type.includes("-layout")) {
            dispatch({ type: "ADD_ROW", layout: tool.type });
        } else {
            dispatch({ type: "ADD_BLOCK", blockType: tool.type });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={handleClick}
            className={cn(
                "flex flex-col items-center justify-center p-4 border rounded-lg bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-grab active:cursor-grabbing gap-2",
                isDragging && "opacity-50 ring-2 ring-primary"
            )}
        >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] font-medium">{tool.label}</span>
        </div>
    );
}
