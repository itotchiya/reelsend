"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

interface HeadingBlockProps {
    block: Block;
}

export function HeadingBlock({ block }: HeadingBlockProps) {
    const { text = "New Heading", level = "h1" } = block.content;

    const Tag = level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

    return (
        <div style={{ textAlign: block.content.align || "left" }}>
            <Tag
                style={{
                    margin: 0,
                    fontSize: block.styles.fontSize || (level === "h1" ? 32 : 24),
                    fontWeight: "bold",
                }}
                dangerouslySetInnerHTML={{ __html: text }}
            />
        </div>
    );
}
