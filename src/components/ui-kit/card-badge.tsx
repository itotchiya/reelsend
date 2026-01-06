"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { getContrastColor } from "@/lib/colors";
import { useI18n } from "@/lib/i18n";

/**
 * CardBadge Component
 * 
 * A reusable badge component for use in cards (ClientCard, TemplateCard, AudienceCard).
 * Provides consistent sizing and styling across all card components.
 */

const badgeVariants = cva(
    "inline-flex items-center gap-1 font-medium transition-colors h-fit",
    {
        variants: {
            variant: {
                flat: "bg-opacity-10",
                border: "ring-1 ring-inset",
                pill: "rounded-full",
                "pill-border": "rounded-full ring-1 ring-inset",
            },
            color: {
                gray: "",
                green: "",
                red: "",
                orange: "",
                blue: "",
                purple: "",
                pink: "",
                cyan: "",
            },
            size: {
                sm: "px-2 py-0.5 text-[11px] rounded-md",
                default: "px-2.5 py-1 text-xs rounded-md",
                lg: "px-3 py-1.5 text-sm rounded-md",
            },
        },
        compoundVariants: [
            // Flat variants
            { variant: "flat", color: "gray", className: "bg-zinc-400/10 text-zinc-600 dark:text-zinc-400" },
            { variant: "flat", color: "green", className: "bg-green-400/10 text-green-600 dark:text-green-400" },
            { variant: "flat", color: "red", className: "bg-red-400/10 text-red-600 dark:text-red-400" },
            { variant: "flat", color: "orange", className: "bg-orange-400/10 text-orange-600 dark:text-orange-400" },
            { variant: "flat", color: "blue", className: "bg-blue-400/10 text-blue-600 dark:text-blue-400" },
            { variant: "flat", color: "purple", className: "bg-purple-400/10 text-purple-600 dark:text-purple-400" },
            { variant: "flat", color: "pink", className: "bg-pink-400/10 text-pink-600 dark:text-pink-400" },
            { variant: "flat", color: "cyan", className: "bg-cyan-400/10 text-cyan-600 dark:text-cyan-400" },
            // Border variants
            { variant: "border", color: "gray", className: "bg-zinc-400/10 text-zinc-600 ring-zinc-400/20 dark:text-zinc-400" },
            { variant: "border", color: "green", className: "bg-green-400/10 text-green-600 ring-green-400/20 dark:text-green-400" },
            { variant: "border", color: "red", className: "bg-red-400/10 text-red-600 ring-red-400/20 dark:text-red-400" },
            { variant: "border", color: "orange", className: "bg-orange-400/10 text-orange-600 ring-orange-400/20 dark:text-orange-400" },
            { variant: "border", color: "blue", className: "bg-blue-400/10 text-blue-600 ring-blue-400/20 dark:text-blue-400" },
            { variant: "border", color: "purple", className: "bg-purple-400/10 text-purple-600 ring-purple-400/20 dark:text-purple-400" },
            { variant: "border", color: "pink", className: "bg-pink-400/10 text-pink-600 ring-pink-400/20 dark:text-pink-400" },
            { variant: "border", color: "cyan", className: "bg-cyan-400/10 text-cyan-600 ring-cyan-400/20 dark:text-cyan-400" },
            // Pill variants
            { variant: "pill", color: "gray", className: "bg-zinc-400/10 text-zinc-600 dark:text-zinc-400" },
            { variant: "pill", color: "green", className: "bg-green-400/10 text-green-600 dark:text-green-400" },
            { variant: "pill", color: "red", className: "bg-red-400/10 text-red-600 dark:text-red-400" },
            { variant: "pill", color: "orange", className: "bg-orange-400/10 text-orange-600 dark:text-orange-400" },
            { variant: "pill", color: "blue", className: "bg-blue-400/10 text-blue-600 dark:text-blue-400" },
            { variant: "pill", color: "purple", className: "bg-purple-400/10 text-purple-600 dark:text-purple-400" },
            { variant: "pill", color: "pink", className: "bg-pink-400/10 text-pink-600 dark:text-pink-400" },
            { variant: "pill", color: "cyan", className: "bg-cyan-400/10 text-cyan-600 dark:text-cyan-400" },
            // Pill border variants
            { variant: "pill-border", color: "gray", className: "bg-zinc-400/10 text-zinc-600 ring-zinc-400/20 dark:text-zinc-400" },
            { variant: "pill-border", color: "green", className: "bg-green-400/10 text-green-600 ring-green-400/20 dark:text-green-400" },
            { variant: "pill-border", color: "red", className: "bg-red-400/10 text-red-600 ring-red-400/20 dark:text-red-400" },
            { variant: "pill-border", color: "orange", className: "bg-orange-400/10 text-orange-600 ring-orange-400/20 dark:text-orange-400" },
            { variant: "pill-border", color: "blue", className: "bg-blue-400/10 text-blue-600 ring-blue-400/20 dark:text-blue-400" },
            { variant: "pill-border", color: "purple", className: "bg-purple-400/10 text-purple-600 ring-purple-400/20 dark:text-purple-400" },
            { variant: "pill-border", color: "pink", className: "bg-pink-400/10 text-pink-600 ring-pink-400/20 dark:text-pink-400" },
            { variant: "pill-border", color: "cyan", className: "bg-cyan-400/10 text-cyan-600 ring-cyan-400/20 dark:text-cyan-400" },
        ],
        defaultVariants: {
            variant: "border",
            color: "gray",
            size: "default",
        },
    }
);

const dotColors = {
    gray: "bg-zinc-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
};

export interface CardBadgeProps
    extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
    icon?: React.ReactNode;
    showDot?: boolean;
    removable?: boolean;
    onRemove?: () => void;
}

export function CardBadge({
    className,
    variant,
    color,
    size,
    icon,
    showDot,
    removable,
    onRemove,
    children,
    ...props
}: CardBadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant, color: color as any, size }), className)}
            onClick={(e) => {
                if (props.onClick) {
                    e.stopPropagation();
                    props.onClick(e);
                }
            }}
            {...props}
        >
            {showDot && (
                <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[(color as keyof typeof dotColors) || "gray"])} />
            )}
            {icon}
            {children}
            {removable && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </span>
    );
}

// Clickable badge variant as a span (role="button")
export interface CardBadgeButtonProps
    extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
    icon?: React.ReactNode;
    showDot?: boolean;
}

export function CardBadgeButton({
    className,
    variant,
    color,
    size,
    icon,
    showDot,
    children,
    ...props
}: CardBadgeButtonProps) {
    return (
        <span
            className={cn(
                badgeVariants({ variant, color: color as any, size }),
                "cursor-pointer hover:opacity-80 transition-opacity",
                className
            )}
            role="button"
            tabIndex={0}
            onClick={(e) => {
                if (props.onClick) {
                    e.stopPropagation();
                    props.onClick(e);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    (props.onClick as any)?.(e);
                }
            }}
            {...props}
        >
            {showDot && (
                <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[(color as keyof typeof dotColors) || "gray"])} />
            )}
            {icon}
            {children}
        </span>
    );
}

// Helper function to get contrasting text color based on background
// Kept for backward compatibility but using centralized logic
function getContrastTextColor(hexColor: string): string {
    return getContrastColor(hexColor);
}

// Pre-configured badge types for common use cases
export function ClientBadge({
    clientName,
    primaryColor,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children"> & {
    clientName: string;
    primaryColor?: string | null;
}) {
    if (primaryColor) {
        return (
            <CardBadge
                variant="border"
                style={{
                    backgroundColor: `${primaryColor}1A`, // 10% opacity
                    color: primaryColor,
                    borderColor: `${primaryColor}33`, // 20% opacity
                }}
                {...props}
            >
                {clientName}
            </CardBadge>
        );
    }

    // Fallback to default gray style if no primary color
    return (
        <CardBadge variant="border" color="gray" {...props}>
            {clientName}
        </CardBadge>
    );
}

/**
 * ClientBadgeSolid Component
 * A version of ClientBadge that uses a solid background color (good for template cards)
 */
export function ClientBadgeSolid({
    clientName,
    primaryColor,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children"> & {
    clientName: string;
    primaryColor?: string | null;
}) {
    const bgColor = primaryColor || '#6366f1';
    return (
        <CardBadge
            variant="border"
            style={{
                backgroundColor: bgColor,
                color: getContrastColor(bgColor),
                borderColor: 'transparent'
            }}
            {...props}
        >
            {clientName}
        </CardBadge>
    );
}

export function CampaignBadge({
    campaignName,
    campaignIcon,
    ...props
}: Omit<CardBadgeButtonProps, "variant" | "color" | "children"> & {
    campaignName: string;
    campaignIcon?: React.ReactNode;
}) {
    return (
        <CardBadgeButton variant="border" color="green" icon={campaignIcon} {...props}>
            {campaignName}
        </CardBadgeButton>
    );
}

export function NotUsedBadge({
    label,
    badgeIcon,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children"> & {
    label?: string;
    badgeIcon?: React.ReactNode;
}) {
    const { t } = useI18n();
    return (
        <CardBadge variant="border" color="orange" icon={badgeIcon} {...props}>
            {label || t.cards?.audience?.notUsed || "Not Used"}
        </CardBadge>
    );
}

export function StatusBadge({
    status,
    children,
    ...props
}: Omit<CardBadgeProps, "variant" | "showDot"> & {
    status: "active" | "inactive" | "pending" | "error" | "success" | "draft" | "scheduled" | "sending" | "failed" | "cancelled";
}) {
    const statusColors: Record<string, CardBadgeProps["color"]> = {
        active: "green",
        inactive: "gray",
        pending: "orange",
        error: "red",
        success: "green",
        draft: "orange",
        scheduled: "blue",
        sending: "blue",
        failed: "red",
        cancelled: "gray",
    };
    return (
        <CardBadge variant="border" color={statusColors[status]} showDot {...props}>
            {children}
        </CardBadge>
    );
}

export function AudienceBadge({
    audienceName,
    audienceIcon,
    ...props
}: Omit<CardBadgeButtonProps, "variant" | "color" | "children"> & {
    audienceName: string;
    audienceIcon?: React.ReactNode;
}) {
    return (
        <CardBadgeButton variant="border" color="purple" icon={audienceIcon} {...props}>
            {audienceName}
        </CardBadgeButton>
    );
}

export function TemplateBadge({
    templateName,
    templateIcon,
    ...props
}: Omit<CardBadgeButtonProps, "variant" | "color" | "children"> & {
    templateName: string;
    templateIcon?: React.ReactNode;
}) {
    return (
        <CardBadgeButton variant="border" color="blue" icon={templateIcon} {...props}>
            {templateName}
        </CardBadgeButton>
    );
}

export function SmtpBadge({
    verified,
    verifiedLabel,
    unverifiedLabel,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children" | "showDot"> & {
    verified: boolean;
    verifiedLabel?: string;
    unverifiedLabel?: string;
}) {
    const { t } = useI18n();
    const vLabel = verifiedLabel || t.cards?.client?.smtpVerified || "SMTP Verified";
    const uvLabel = unverifiedLabel || t.cards?.client?.smtpRequired || "SMTP Not Verified";

    return (
        <CardBadge
            variant="border"
            color={verified ? "green" : "red"}
            showDot
            {...props}
        >
            {verified ? vLabel : uvLabel}
        </CardBadge>
    );
}

export function CountBadge({
    count,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children"> & { count: number }) {
    return (
        <CardBadge variant="border" color="green" {...props}>
            +{count}
        </CardBadge>
    );
}

/**
 * AIGeneratedBadge Component
 * A badge to indicate AI-generated content with a sparkles icon
 */
export function AIGeneratedBadge({
    label,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children"> & {
    label?: string;
}) {
    const { t } = useI18n();
    return (
        <CardBadge
            variant="border"
            color="purple"
            className={cn("gap-1", props.className)}
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
            >
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 006.913 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
            </svg>
            {label || t.cards?.template?.aiGenerated || "AI Generated"}
        </CardBadge>
    );
}

/**
 * UnassignedDashedBadge Component
 * A badge with dashed border to indicate unassigned/no client templates
 */
export function UnassignedDashedBadge({
    label,
    ...props
}: Omit<CardBadgeProps, "variant" | "color" | "children"> & {
    label?: string;
}) {
    const { t } = useI18n();
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md",
                "border border-dashed border-zinc-400/50 dark:border-zinc-500/50",
                "text-zinc-500 dark:text-zinc-400",
                "bg-transparent",
                props.className
            )}
        >
            {label || t.cards?.template?.notAssigned || "Not Assigned"}
        </span>
    );
}

