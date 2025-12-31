"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

interface ButtonBlockProps {
    block: Block;
}

export function ButtonBlock({ block }: ButtonBlockProps) {
    const {
        text = "Click Here",
        url = "#",
        backgroundColor = "#3b82f6",
        textColor = "#ffffff",
        borderRadius = 4,
    } = block.content;

    return (
        <div style={{ textAlign: block.content.align || "center" }}>
            <a
                href={url}
                style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    backgroundColor,
                    color: textColor,
                    borderRadius: `${borderRadius}px`,
                    textDecoration: "none",
                    fontWeight: 600,
                    ...block.styles,
                }}
                onClick={(e) => e.preventDefault()}
            >
                {text}
            </a>
        </div>
    );
}
