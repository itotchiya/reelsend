"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

export function MenuBlock({ block }: { block: Block }) {
    const {
        items = [
            { label: "Home", url: "#" },
            { label: "Products", url: "#" },
            { label: "About", url: "#" }
        ],
        align = "center",
        textColor = "#333333"
    } = block.content;

    return (
        <div style={{ textAlign: align }}>
            <div style={{ display: "inline-flex", gap: "20px", flexWrap: "wrap", justifyContent: align }}>
                {items.map((item: any, i: number) => (
                    <a key={i} href={item.url} style={{
                        color: textColor,
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "medium"
                    }}>
                        {item.label}
                    </a>
                ))}
            </div>
        </div>
    );
}
