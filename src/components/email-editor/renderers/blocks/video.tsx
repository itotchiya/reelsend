"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";
import { Play } from "lucide-react";

export function VideoBlock({ block }: { block: Block }) {
    const {
        thumbnail = "https://via.placeholder.com/600x337?text=Video+Thumbnail",
        url = "#",
        align = "center"
    } = block.content;

    return (
        <div style={{ textAlign: align }}>
            <a href={url} style={{ display: "inline-block", position: "relative", width: "100%", maxWidth: "100%" }}>
                <img src={thumbnail} alt="Video" style={{ width: "100%", display: "block", borderRadius: "8px" }} />
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: "50%",
                    padding: "15px"
                }}>
                    <Play fill="white" color="white" size={40} />
                </div>
            </a>
        </div>
    );
}
