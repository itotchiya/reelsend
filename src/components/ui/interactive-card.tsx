"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InteractiveCardProps extends React.ComponentProps<"div"> {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

function InteractiveCard({
    children,
    onClick,
    className,
    ...props
}: InteractiveCardProps) {
    const [visible, setVisible] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const divRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current) return;
        const bounds = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onClick={onClick}
            className={cn(
                "relative rounded-xl p-px bg-slate-200 dark:bg-slate-800 backdrop-blur-md overflow-hidden cursor-pointer",
                className
            )}
            {...props}
        >
            {/* Gradient glow blob - follows mouse */}
            <div
                className={cn(
                    "pointer-events-none blur-3xl rounded-full absolute z-0 transition-opacity duration-500",
                    "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-300",
                    "size-60",
                    visible ? "opacity-100" : "opacity-0"
                )}
                style={{
                    top: position.y - 120,
                    left: position.x - 120,
                }}
            />

            {/* Card content with semi-transparent background - allows gradient to show through */}
            <div className="relative z-10 bg-white/90 dark:bg-slate-900/75 p-6 h-full w-full rounded-[11px]">
                {children}
            </div>
        </div>
    );
}

export { InteractiveCard };
