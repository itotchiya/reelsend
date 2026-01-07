"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";

/**
 * FilterBar Component
 * 
 * @path src/components/ui-kit/filter-bar.tsx
 * 
 * A reusable filter bar with search and dropdown filters.
 */

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
    defaultValue?: string;
}

export interface FilterBarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: FilterConfig[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;
    onClearFilters?: () => void;
    showClearButton?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export function FilterBar({
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    filters = [],
    filterValues = {},
    onFilterChange,
    onClearFilters,
    showClearButton = true,
    className,
    children,
}: FilterBarProps) {
    const hasActiveFilters = searchValue || Object.values(filterValues).some(v => v && v !== "all");

    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center gap-3", className)}>
            {onSearchChange && (
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-9 w-full"
                    />
                    {searchValue && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {filters.map((filter) => (
                <Select
                    key={filter.key}
                    value={filterValues[filter.key] || filter.defaultValue || "all"}
                    onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue placeholder={filter.label} />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All {filter.label}</SelectItem>
                        {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}

            {showClearButton && hasActiveFilters && onClearFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}

            {children}
        </div>
    );
}
