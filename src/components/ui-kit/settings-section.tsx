"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

export function SettingsSection({
    label,
    children,
    className,
}: SettingsSectionProps) {
    // Count children to apply position prop
    const childrenArray = React.Children.toArray(children);
    const count = childrenArray.length;

    const enhancedChildren = childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;

        let position: "first" | "middle" | "last" | "only" = "only";
        if (count === 1) {
            position = "only";
        } else if (index === 0) {
            position = "first";
        } else if (index === count - 1) {
            position = "last";
        } else {
            position = "middle";
        }

        return React.cloneElement(child as React.ReactElement<any>, {
            position,
        });
    });

    return (
        <div className={cn("space-y-2", className)}>
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wide px-1">
                {label}
            </h3>
            <div className="flex flex-col gap-1">{enhancedChildren}</div>
        </div>
    );
}
