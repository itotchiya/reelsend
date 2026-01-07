"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedGradient } from "./animated-gradient";

/**
 * GradientInputContainer Component
 * 
 * An animated gradient border container using the reusable AnimatedGradient.
 */

interface GradientInputContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function GradientInputContainer({
    children,
    className,
}: GradientInputContainerProps) {
    return (
        <div className={cn("relative w-full", className)}>
            {/* Animated gradient border */}
            <div className="absolute -inset-[2px] rounded-xl overflow-hidden">
                <AnimatedGradient />
            </div>

            {/* Inner content container */}
            <div className="relative rounded-xl bg-card overflow-hidden">
                {children}
            </div>
        </div>
    );
}

/**
 * PromptInputArea Component
 */

interface PromptInputAreaProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    disabled?: boolean;
    buttonLabel?: string;
}

export function PromptInputArea({
    value,
    onChange,
    onSubmit,
    placeholder,
    disabled,
    buttonLabel = "Generate",
}: PromptInputAreaProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
        }
    };

    const isEnabled = value.trim() && !disabled;

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "w-full min-h-[140px] resize-none text-base p-4 pr-36",
                    "border-none outline-none",
                    "bg-transparent",
                    "placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-0",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            />

            {/* Generate Button - Gray when disabled, gradient when enabled */}
            <div className="absolute bottom-3 right-3">
                <button
                    onClick={onSubmit}
                    disabled={!isEnabled}
                    className={cn(
                        "relative px-4 py-2 rounded-full overflow-hidden",
                        "flex items-center gap-2 text-sm font-medium",
                        isEnabled
                            ? "text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] hover:shadow-purple-500/40 transition-transform cursor-pointer"
                            : "bg-secondary/50 text-muted-foreground/40 cursor-not-allowed"
                    )}
                >
                    {/* Animated gradient background for button when enabled */}
                    {isEnabled && (
                        <AnimatedGradient className="rounded-full" />
                    )}

                    {/* Button content */}
                    <span className="relative z-10 flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                        >
                            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 006.913 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
                        </svg>
                        {buttonLabel}
                    </span>
                </button>
            </div>
        </div>
    );
}
