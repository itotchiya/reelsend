"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

interface ImageBlockProps {
    block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
    const {
        src = "https://via.placeholder.com/600x300",
        alt = "Image",
        width = "100%",
    } = block.content;

    return (
        <div style={{ textAlign: block.content.align || "center" }}>
            <img
                src={src}
                alt={alt}
                style={{
                    maxWidth: "100%",
                    width: width === "auto" ? "auto" : `${width}%`,
                    display: "block",
                    margin: block.content.align === "center" ? "0 auto" : "0",
                    borderRadius: block.styles.borderRadius ? `${block.styles.borderRadius}px` : "0",
                }}
            />
        </div>
    );
}
