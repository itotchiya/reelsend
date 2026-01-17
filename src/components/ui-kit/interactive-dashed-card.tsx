"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InteractiveDashedCardProps {
    href?: string;
    onClick?: () => void;
    title: string;
    description: string;
    actionTitle: string;
    color?: "orange" | "blue" | "purple" | "green" | "pink" | "indigo" | "red" | "cyan";
    preview?: React.ReactNode;
    icon?: LucideIcon;
    className?: string;
    iconClassName?: string;
}

const colorMap = {
    orange: {
        border: "hover:border-orange-500",
        bg: "hover:bg-orange-500/[0.03]",
        previewBg: "bg-orange-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
        actionText: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
        iconBg: "bg-orange-500/10",
        iconText: "text-orange-600"
    },
    blue: {
        border: "hover:border-blue-500",
        bg: "hover:bg-blue-500/[0.03]",
        previewBg: "bg-blue-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        actionText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        iconBg: "bg-blue-500/10",
        iconText: "text-blue-600"
    },
    purple: {
        border: "hover:border-purple-500",
        bg: "hover:bg-purple-500/[0.03]",
        previewBg: "bg-purple-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
        actionText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
        iconBg: "bg-purple-500/10",
        iconText: "text-purple-600"
    },
    green: {
        border: "hover:border-green-500",
        bg: "hover:bg-green-500/[0.03]",
        previewBg: "bg-green-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-green-600 dark:group-hover:text-green-400",
        actionText: "group-hover:text-green-600 dark:group-hover:text-green-400",
        iconBg: "bg-green-500/10",
        iconText: "text-green-600"
    },
    pink: {
        border: "hover:border-pink-500",
        bg: "hover:bg-pink-500/[0.03]",
        previewBg: "bg-pink-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
        actionText: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
        iconBg: "bg-pink-500/10",
        iconText: "text-pink-600"
    },
    indigo: {
        border: "hover:border-indigo-500",
        bg: "hover:bg-indigo-500/[0.03]",
        previewBg: "bg-indigo-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
        actionText: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
        iconBg: "bg-indigo-500/10",
        iconText: "text-indigo-600"
    },
    red: {
        border: "hover:border-red-500",
        bg: "hover:bg-red-500/[0.03]",
        previewBg: "bg-red-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-red-600 dark:group-hover:text-red-400",
        actionText: "group-hover:text-red-600 dark:group-hover:text-red-400",
        iconBg: "bg-red-500/10",
        iconText: "text-red-600"
    },
    cyan: {
        border: "hover:border-cyan-500",
        bg: "hover:bg-cyan-500/[0.03]",
        previewBg: "bg-cyan-500/[0.08] dark:bg-transparent",
        text: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
        actionText: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
        iconBg: "bg-cyan-500/10",
        iconText: "text-cyan-600"
    }
};

export function InteractiveDashedCard({
    href,
    onClick,
    title,
    description,
    actionTitle,
    color = "orange",
    preview,
    icon: Icon,
    className,
    iconClassName
}: InteractiveDashedCardProps) {
    const theme = colorMap[color];

    const content = (
        <Card className={cn(
            "p-0 overflow-hidden border-2 border-dashed border-border/60 transition-all duration-500 h-full bg-card dark:bg-transparent relative group",
            theme.border,
            theme.bg
        )}>
            <div className="p-10 flex flex-col items-center text-center space-y-8 h-full">
                {/* Icon/Preview Area */}
                <div className="group-hover:scale-[1.1] transition-all duration-500 ease-out">
                    {preview ? (
                        preview
                    ) : Icon ? (
                        <div className={cn("h-24 w-24 rounded-full flex items-center justify-center", theme.iconBg)}>
                            <Icon className={cn("h-12 w-12", theme.iconText, iconClassName)} />
                        </div>
                    ) : null}
                </div>

                <div className="space-y-4 w-full px-4">
                    <h3 className={cn(
                        "font-bold text-3xl transition-colors tracking-tight italic",
                        theme.text
                    )}>
                        {title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed mx-auto max-w-xl">
                        {description}
                    </p>
                </div>

                <div className="pt-2">
                    <div className={cn(
                        "flex items-center gap-2 font-bold text-lg transition-all duration-500 ease-out",
                        "text-muted-foreground",
                        theme.actionText
                    )}>
                        {actionTitle}
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div className={cn("w-full max-w-2xl mx-auto", className)}>
            {href ? (
                <Link href={href} className="block group h-full cursor-pointer">
                    {content}
                </Link>
            ) : (
                <button
                    onClick={onClick}
                    className="block group h-full text-left w-full outline-none cursor-pointer"
                >
                    {content}
                </button>
            )}
        </div>
    );
}
