"use client";

import React from "react";
import { Block } from "@/lib/email-editor/types";

export function HtmlBlock({ block }: { block: Block }) {
    const { html = "<div style='padding: 20px; text-align: center; background: #eee;'>Custom HTML</div>" } = block.content;

    return (
        <div dangerouslySetInnerHTML={{ __html: html }} />
    );
}
