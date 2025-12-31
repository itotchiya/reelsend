"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

export function SocialBlock({ block }: { block: Block }) {
    const {
        icons = [
            { name: "Facebook", url: "#", icon: "fb" },
            { name: "Twitter", url: "#", icon: "tw" },
            { name: "LinkedIn", url: "#", icon: "li" }
        ],
        align = "center"
    } = block.content;

    return (
        <div style={{ textAlign: align }}>
            <div style={{ display: "inline-flex", gap: "10px" }}>
                {icons.map((icon: any, i: number) => (
                    <a key={i} href={icon.url} style={{ textDecoration: "none" }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#333",
                            color: "white",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold"
                        }}>
                            {icon.name.substring(0, 1)}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
