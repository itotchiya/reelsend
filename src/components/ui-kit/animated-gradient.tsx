"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AnimatedGradient Component
 * 
 * A fully colored animated gradient with smooth flowing blobs.
 * Works in both light and dark mode with vibrant solid colors.
 * 
 * COLORS TO CUSTOMIZE:
 * - Base gradient (line 35): linear-gradient with 4 colors
 * - Blob 1 Cyan (line 47): #53e5ffff
 * - Blob 2 Pink (line 57): #ff5cadff
 * - Blob 3 Purple (line 67): #ac88ffff
 * - Blob 4 Orange (line 77): #ff9f5bff
 */

interface AnimatedGradientProps {
    className?: string;
    variant?: "default" | "active";
    style?: React.CSSProperties;
}

export function AnimatedGradient({
    className,
    variant = "default",
    style
}: AnimatedGradientProps) {
    const isActive = variant === "active";

    return (
        <div
            className={cn("absolute inset-0 overflow-hidden", className)}
            style={style}
        >
            {/* Base gradient - ensures full color coverage */}
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(90deg, rgba(114, 234, 255, 1), rgba(193, 166, 255, 1), rgba(255, 130, 47, 1), rgba(255, 152, 87, 1))",
                    backgroundSize: "200% 100%",
                    animation: isActive
                        ? "gradient-base-active 4s ease infinite"
                        : "gradient-base 6s ease infinite",
                }}
            />

            {/* Blob 1 - Cyan (solid) */}
            <div
                className="absolute w-[80%] h-[150%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(114, 234, 255, 1) 0%, rgba(8, 145, 178, 1) 40%, transparent 70%)",
                    filter: "blur(20px)",
                    animation: isActive
                        ? "blob1-active 4s ease-in-out infinite"
                        : "blob1 8s ease-in-out infinite",
                }}
            />

            {/* Blob 2 - Pink (solid) */}
            <div
                className="absolute w-[70%] h-[140%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(255, 123, 189, 1) 0%, rgba(255, 100, 170, 1) 40%, transparent 70%)",
                    filter: "blur(20px)",
                    animation: isActive
                        ? "blob2-active 5s ease-in-out infinite"
                        : "blob2 10s ease-in-out infinite",
                    animationDelay: "0.5s",
                }}
            />

            {/* Blob 3 - Purple (solid) */}
            <div
                className="absolute w-[60%] h-[130%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(173, 137, 255, 1) 0%, rgba(163, 110, 255, 1) 40%, transparent 70%)",
                    filter: "blur(15px)",
                    animation: isActive
                        ? "blob3-active 3.5s ease-in-out infinite"
                        : "blob3 7s ease-in-out infinite",
                    animationDelay: "1s",
                }}
            />

            {/* Blob 4 - Orange (solid) */}
            <div
                className="absolute w-[50%] h-[120%] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(255, 155, 101, 1) 0%, rgba(255, 149, 93, 1) 40%, transparent 70%)",
                    filter: "blur(15px)",
                    animation: isActive
                        ? "blob4-active 4.5s ease-in-out infinite"
                        : "blob4 9s ease-in-out infinite",
                    animationDelay: "1.5s",
                }}
            />

            {/* CSS Keyframes */}
            <style jsx>{`
                /* Base gradient animation */
                @keyframes gradient-base {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes gradient-base-active {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                /* Default state - slow, smooth movement */
                @keyframes blob1 {
                    0%, 100% { transform: translate(-30%, -25%) scale(1); }
                    33% { transform: translate(40%, 10%) scale(1.1); }
                    66% { transform: translate(10%, -10%) scale(0.95); }
                }
                @keyframes blob2 {
                    0%, 100% { transform: translate(60%, -20%) scale(1); }
                    33% { transform: translate(0%, 20%) scale(1.05); }
                    66% { transform: translate(80%, 10%) scale(0.9); }
                }
                @keyframes blob3 {
                    0%, 100% { transform: translate(20%, -30%) scale(1); }
                    50% { transform: translate(70%, 20%) scale(1.1); }
                }
                @keyframes blob4 {
                    0%, 100% { transform: translate(80%, -20%) scale(1); }
                    50% { transform: translate(30%, 10%) scale(1.05); }
                }

                /* Active state - faster, more dynamic */
                @keyframes blob1-active {
                    0%, 100% { transform: translate(-20%, -20%) scale(1); }
                    25% { transform: translate(50%, 10%) scale(1.2); }
                    50% { transform: translate(20%, -30%) scale(0.9); }
                    75% { transform: translate(70%, 0%) scale(1.1); }
                }
                @keyframes blob2-active {
                    0%, 100% { transform: translate(70%, -10%) scale(1); }
                    25% { transform: translate(10%, 20%) scale(1.1); }
                    50% { transform: translate(50%, -20%) scale(0.95); }
                    75% { transform: translate(0%, 10%) scale(1.05); }
                }
                @keyframes blob3-active {
                    0%, 100% { transform: translate(30%, -20%) scale(1); }
                    33% { transform: translate(80%, 10%) scale(1.15); }
                    66% { transform: translate(10%, 0%) scale(0.9); }
                }
                @keyframes blob4-active {
                    0%, 100% { transform: translate(90%, -10%) scale(1); }
                    50% { transform: translate(20%, 10%) scale(1.1); }
                }
            `}</style>
        </div>
    );
}
