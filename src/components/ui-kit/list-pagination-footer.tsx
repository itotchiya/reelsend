"use client";

import React from "react";
import { Pagination } from "@/components/ui-kit/pagination";
import { cn } from "@/lib/utils";

interface ListPaginationFooterProps {
    currentPage?: number;
    totalPages?: number;
    pageSize?: number;
    totalItems: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    className?: string;
    pageSizeOptions?: number[];
}

/**
 * A unified footer component for list/table pages that handles pagination
 * and result summaries in a mobile-friendly way.
 */
export function ListPaginationFooter({
    currentPage = 1,
    totalPages = 1,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    className,
    pageSizeOptions = [10, 20, 50]
}: ListPaginationFooterProps) {
    if (totalItems === 0) return null;

    return (
        <div className={cn(
            "shrink-0 border-t bg-background p-4 flex items-center w-full z-10 min-h-[64px]",
            className
        )}>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange || (() => { })}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={pageSizeOptions}
            />
        </div>
    );
}
