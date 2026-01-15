import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    maxPageButtons?: number;
    className?: string;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    totalItems?: number;
}

export function CustomPagination({
    currentPage,
    totalPages,
    onPageChange,
    maxPageButtons = 5,
    className,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 30, 40, 50],
    totalItems,
}: PaginationProps) {
    const { t } = useI18n();

    // Even if no pages, we might want to show "0 results" or similar if totalItems is 0,
    // but typically we return null if no data. However, for 0 items we might still want to show
    // the structure or just null. Let's stick to returning null if totalPages is 0 AND we have no items.
    // But if we have items (e.g. 1 item = 1 page), we show.
    // If no items, show simplified footer with "No results"
    if (totalPages === 0 || (totalItems !== undefined && totalItems === 0)) {
        return (
            <div className={cn("grid grid-cols-1 sm:grid-cols-3 items-center gap-4 w-full", className)}>
                <div className="flex justify-center sm:justify-start order-2 sm:order-1">
                    {/* Empty left side or could show page size if desired even for 0 results, 
                        but usually better to hide controls. Keeping simplified. */}
                </div>
                <div className="flex justify-center order-1 sm:order-2">
                    <span className="text-sm text-muted-foreground">{t.common?.noResults || "No results"}</span>
                </div>
                <div className="flex justify-center sm:justify-end order-3 text-sm text-muted-foreground">
                    {totalItems !== undefined && (
                        <span>
                            0 results
                        </span>
                    )}
                </div>
            </div>
        );
    }

    const getPageNumbers = () => {
        const pages: (number | "ellipsis")[] = [];
        const half = Math.floor(maxPageButtons / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxPageButtons - 1);

        if (end - start + 1 < maxPageButtons) {
            start = Math.max(1, end - maxPageButtons + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("ellipsis");
        }

        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("ellipsis");
            pages.push(totalPages);
        }

        if (totalPages <= maxPageButtons + 2) {
            const allPages = [];
            for (let i = 1; i <= totalPages; i++) allPages.push(i);
            return allPages;
        }

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-3 items-center gap-4 w-full", className)}>
            {/* Left: Page Size Select */}
            <div className="flex justify-center sm:justify-start order-2 sm:order-1">
                {pageSize && onPageSizeChange && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">{t.pagination?.show || "Show"}</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => {
                                onPageSizeChange(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="whitespace-nowrap">{t.pagination?.perPage || "per page"}</span>
                    </div>
                )}
            </div>

            {/* Middle: Pagination Controls */}
            <div className="flex justify-center order-1 sm:order-2">
                <Pagination className={cn("w-auto mx-0")}>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                                className={cn("gap-1 pl-2.5", currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer")}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline-block">{t.pagination?.previous || "Previous"}</span>
                            </PaginationPrevious>
                        </PaginationItem>

                        {pages.map((page, index) => (
                            <PaginationItem key={index} className="hidden sm:block">
                                {page === "ellipsis" ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink
                                        href="#"
                                        isActive={currentPage === page}
                                        onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                                    >
                                        {page}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem className="sm:hidden">
                            <span className="text-sm text-muted-foreground px-2">
                                {currentPage} / {totalPages}
                            </span>
                        </PaginationItem>

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1); }}
                                className={cn("gap-1 pr-2.5", currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer")}
                            >
                                <span className="hidden sm:inline-block">{t.pagination?.next || "Next"}</span>
                                <ChevronRight className="h-4 w-4" />
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            {/* Right: Total Results */}
            <div className="flex justify-center sm:justify-end order-3 text-sm text-muted-foreground">
                {totalItems !== undefined && (
                    <span>
                        {totalItems} results
                    </span>
                )}
            </div>
        </div>
    );
}

export { CustomPagination as Pagination };
