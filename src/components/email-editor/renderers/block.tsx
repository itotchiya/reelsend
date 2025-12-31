"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "@/lib/email-editor/types";
import { cn } from "@/lib/utils";
import { useEmailEditorStore } from "@/lib/email-editor/store";

// Specific block components
import { HeadingBlock } from "./blocks/heading";
import { ParagraphBlock } from "./blocks/paragraph";
import { ImageBlock } from "./blocks/image";
import { ButtonBlock } from "./blocks/button";
import { DividerBlock } from "./blocks/divider";
import { SocialBlock } from "./blocks/social";
import { MenuBlock } from "./blocks/menu";
import { VideoBlock } from "./blocks/video";
import { HtmlBlock } from "./blocks/html";

interface BlockRendererProps {
    block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
    const { selectedId, dispatch } = useEmailEditorStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: block.id,
        data: {
            type: "block",
            blockId: block.id,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...block.styles,
    };

    const isSelected = selectedId === block.id;

    const renderContent = () => {
        switch (block.type) {
            case "heading":
                return <HeadingBlock block={block} />;
            case "paragraph":
                return <ParagraphBlock block={block} />;
            case "image":
            case "gif":
                return <ImageBlock block={block} />;
            case "button":
                return <ButtonBlock block={block} />;
            case "divider":
                return <DividerBlock block={block} />;
            case "social":
                return <SocialBlock block={block} />;
            case "menu":
                return <MenuBlock block={block} />;
            case "video":
                return <VideoBlock block={block} />;
            case "html":
                return <HtmlBlock block={block} />;
            default:
                return (
                    <div className="p-4 bg-muted/20 border rounded italic text-muted-foreground text-xs">
                        Unknown block type: {block.type}
                    </div>
                );
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "SELECT_ELEMENT", id: block.id });
            }}
            className={cn(
                "group relative border-2 border-transparent transition-all rounded-md px-1 py-1",
                isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/30",
                isDragging && "opacity-50 grayscale"
            )}
        >
            {/* Block Controls Handle */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "absolute -right-2 top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                    isSelected && "opacity-100"
                )}
            >
                <div className="p-1 bg-primary text-primary-foreground rounded-full shadow-lg cursor-grab active:cursor-grabbing">
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM9.5 3C8.67157 3 8 3.67157 8 4.5C8 5.32843 8.67157 6 9.5 6C10.3284 6 11 5.32843 11 4.5C11 3.67157 10.3284 3 9.5 3ZM5.5 9C4.67157 9 4 9.67157 4 10.5C4 11.3284 4.67157 12 5.5 12C6.32843 12 7 11.3284 7 10.5C7 9.67157 6.32843 9 5.5 9ZM9.5 9C8.67157 9 8 9.67157 8 10.5C8 11.3284 8.67157 12 9.5 12C10.3284 12 11 11.3284 11 10.5C11 9.67157 10.3284 9 9.5 9Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </div>
            </div>

            {renderContent()}
        </div>
    );
}
