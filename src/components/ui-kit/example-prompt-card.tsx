"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Mail, FileText, Megaphone, ShoppingCart, Key } from "lucide-react";

/**
 * ExamplePromptCard Component
 * 
 * A clickable card for displaying example prompts in the Prompt Builder.
 * Follows existing card styling patterns.
 */

interface ExamplePromptCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    onClick?: () => void;
    className?: string;
}

export function ExamplePromptCard({
    title,
    description,
    icon: Icon = Mail,
    onClick,
    className,
}: ExamplePromptCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group flex flex-col items-start gap-3 p-4 rounded-xl cursor-pointer",
                "border border-dashed border-border/60 bg-transparent hover:bg-card/50",
                "hover:border-primary/40",
                "transition-all duration-200 text-left w-full",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                className
            )}
        >
            <p className="text-sm text-foreground/80 group-hover:text-foreground line-clamp-2">
                {title}
            </p>
            {description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                    {description}
                </p>
            )}
            <div className="mt-auto pt-2">
                <Icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" />
            </div>
        </button>
    );
}

/**
 * Pre-configured example prompts with icons
 */
export const EXAMPLE_PROMPTS = [
    {
        title: "Create a welcome email for a hair salon with a friendly tone...",
        fullText: "Create a welcome email for a hair salon with a friendly tone and a call-to-action to book an appointment",
        icon: Mail,
    },
    {
        title: "Design a product launch announcement email for a tech startup...",
        fullText: "Design a product launch announcement email for a tech startup with exciting visuals and a pre-order button",
        icon: Megaphone,
    },
    {
        title: "Generate a monthly newsletter template for a fitness center",
        fullText: "Generate a monthly newsletter template for a fitness center with workout tips and class schedules",
        icon: FileText,
    },
    {
        title: "Create an order confirmation email for an e-commerce store",
        fullText: "Create an order confirmation email for an e-commerce store with order details and tracking information",
        icon: ShoppingCart,
    },
];
