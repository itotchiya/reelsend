"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

interface DividerBlockProps {
    block: Block;
}

export function DividerBlock({ block }: DividerBlockProps) {
    const {
        color = "#e5e7eb",
        thickness = 1,
        padding = 20,
    } = block.content;

    return (
        <div style={{ padding: `${padding}px 0` }}>
            <hr
                style={{
                    border: "none",
                    borderTop: `${thickness}px solid ${color}`,
                    margin: 0,
                }}
            />
        </div>
    );
}
