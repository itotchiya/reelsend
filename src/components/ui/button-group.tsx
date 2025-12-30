import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> { }

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center -space-x-px rounded-lg border overflow-hidden",
                "flex-wrap md:flex-nowrap",
                "[&>button]:rounded-none [&>button]:border-none [&>button]:shadow-none",
                "[&>button:first-child]:rounded-l-inherit",
                "[&>button:last-child]:rounded-r-inherit",
                "[&>button:not(:last-child)]:border-r",
                className
            )}
            {...props}
        />
    )
}
