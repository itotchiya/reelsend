"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

interface ParagraphBlockProps {
    block: Block;
}

export function ParagraphBlock({ block }: ParagraphBlockProps) {
    const { text = "Start typing..." } = block.content;

    return (
        <div
            style={{
                textAlign: block.content.align || "left",
                lineHeight: 1.5,
            }}
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
}
