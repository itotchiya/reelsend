"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatedGradient } from "./animated-gradient";

/**
 * AISphere Component
 * 
 * A flat circle with vibrant animated gradient.
 * Two states: 'idle' (soft movement) and 'active' (more dynamic/dancy)
 */

interface AISphereProps {
    state?: "idle" | "active";
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeMap = {
    sm: 64,
    md: 96,
    lg: 128,
};

export function AISphere({ state = "idle", size = "md", className }: AISphereProps) {
    const sphereSize = sizeMap[size];
    const isActive = state === "active";

    return (
        <div
            className={cn("relative flex items-center justify-center", className)}
            style={{ width: sphereSize * 1.5, height: sphereSize * 1.5 }}
        >
            {/* Outer glow */}
            <div
                className="absolute rounded-full blur-3xl opacity-40"
                style={{
                    width: sphereSize * 1.3,
                    height: sphereSize * 1.3,
                    background: "radial-gradient(circle, rgba(255,0,128,0.5) 0%, rgba(0,212,255,0.3) 50%, transparent 70%)",
                }}
            />

            {/* Main sphere - flat circle with gradient */}
            <div
                className="relative rounded-full overflow-hidden"
                style={{
                    width: sphereSize,
                    height: sphereSize,
                    boxShadow: "0 0 40px rgba(255,0,128,0.3), 0 0 60px rgba(0,212,255,0.2)",
                }}
            >
                <AnimatedGradient
                    variant={isActive ? "active" : "default"}
                    className="rounded-full"
                />

                {/* Highlight overlay */}
                <div
                    className="absolute top-3 left-4 rounded-full bg-white/40 blur-sm"
                    style={{
                        width: sphereSize * 0.15,
                        height: sphereSize * 0.15,
                    }}
                />
            </div>

            {/* Active state: orbiting particles */}
            {isActive && (
                <>
                    <div
                        className="absolute w-2 h-2 rounded-full blur-[1px]"
                        style={{
                            background: "#ff0080",
                            boxShadow: "0 0 10px #ff0080",
                            animation: `orbit ${1.5}s linear infinite`
                        }}
                    />
                    <div
                        className="absolute w-1.5 h-1.5 rounded-full blur-[1px]"
                        style={{
                            background: "#00d4ff",
                            boxShadow: "0 0 10px #00d4ff",
                            animation: `orbit ${2}s linear infinite reverse`
                        }}
                    />
                </>
            )}

            {/* CSS Keyframes */}
            <style jsx>{`
                @keyframes orbit {
                    0% { transform: rotate(0deg) translateX(${sphereSize * 0.6}px) rotate(0deg); }
                    100% { transform: rotate(360deg) translateX(${sphereSize * 0.6}px) rotate(-360deg); }
                }
            `}</style>
        </div>
    );
}
