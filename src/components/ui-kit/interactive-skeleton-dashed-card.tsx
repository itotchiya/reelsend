"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InteractiveSkeletonDashedCardProps {
    href?: string;
    onClick?: () => void;
    title: string;
    description: string;
    actionTitle: string;
    color?: "orange" | "blue" | "purple" | "green" | "pink" | "indigo" | "red" | "cyan";
    skeleton: React.ReactNode;
    className?: string;
}

const colorMap = {
    orange: {
        border: "hover:border-orange-500",
        bg: "hover:bg-orange-500/[0.03]",
        skeletonBg: "bg-orange-500/[0.08] dark:bg-orange-500/[0.12]",
        text: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
        actionText: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
    },
    blue: {
        border: "hover:border-blue-500",
        bg: "hover:bg-blue-500/[0.03]",
        skeletonBg: "bg-blue-500/[0.08] dark:bg-blue-500/[0.12]",
        text: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        actionText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    },
    purple: {
        border: "hover:border-purple-500",
        bg: "hover:bg-purple-500/[0.03]",
        skeletonBg: "bg-purple-500/[0.08] dark:bg-purple-500/[0.12]",
        text: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
        actionText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    },
    green: {
        border: "hover:border-green-500",
        bg: "hover:bg-green-500/[0.03]",
        skeletonBg: "bg-green-500/[0.08] dark:bg-green-500/[0.12]",
        text: "group-hover:text-green-600 dark:group-hover:text-green-400",
        actionText: "group-hover:text-green-600 dark:group-hover:text-green-400",
    },
    pink: {
        border: "hover:border-pink-500",
        bg: "hover:bg-pink-500/[0.03]",
        skeletonBg: "bg-pink-500/[0.08] dark:bg-pink-500/[0.12]",
        text: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
        actionText: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
    },
    indigo: {
        border: "hover:border-indigo-500",
        bg: "hover:bg-indigo-500/[0.03]",
        skeletonBg: "bg-indigo-500/[0.08] dark:bg-indigo-500/[0.12]",
        text: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
        actionText: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
    },
    red: {
        border: "hover:border-red-500",
        bg: "hover:bg-red-500/[0.03]",
        skeletonBg: "bg-red-500/[0.08] dark:bg-red-500/[0.12]",
        text: "group-hover:text-red-600 dark:group-hover:text-red-400",
        actionText: "group-hover:text-red-600 dark:group-hover:text-red-400",
    },
    cyan: {
        border: "hover:border-cyan-500",
        bg: "hover:bg-cyan-500/[0.03]",
        skeletonBg: "bg-cyan-500/[0.08] dark:bg-cyan-500/[0.12]",
        text: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
        actionText: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
    }
};

export function InteractiveSkeletonDashedCard({
    href,
    onClick,
    title,
    description,
    actionTitle,
    color = "orange",
    skeleton,
    className
}: InteractiveSkeletonDashedCardProps) {
    const theme = colorMap[color];

    const content = (
        <Card className={cn(
            "p-0 overflow-hidden border-2 border-dashed border-border/60 transition-all duration-500 h-full bg-card dark:bg-transparent relative group",
            theme.border,
            theme.bg
        )}>
            <div className="p-10 flex flex-col items-center text-center space-y-8 h-full">
                {/* Skeleton Visual Area */}
                <div className={cn(
                    "w-full h-48 flex items-center justify-center rounded-2xl group-hover:scale-[1.05] transition-all duration-500 ease-out",
                    theme.skeletonBg
                )}>
                    {skeleton}
                </div>

                <div className="space-y-4 w-full px-4">
                    <h3 className={cn(
                        "font-bold text-3xl transition-colors tracking-tight italic",
                        theme.text
                    )}>
                        {title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed mx-auto max-w-[300px]">
                        {description}
                    </p>
                </div>

                <div className="pt-2">
                    <div className={cn(
                        "flex items-center gap-2 font-bold text-lg transition-transform duration-500 ease-out",
                        "translate-y-0 text-muted-foreground", // visible by default, colored on hover
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
