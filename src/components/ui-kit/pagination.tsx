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
}

export function CustomPagination({
    currentPage,
    totalPages,
    onPageChange,
    maxPageButtons = 5,
    className,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
    const { t } = useI18n();

    if (totalPages === 0) return null;

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
        <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 w-full", className)}>
            {pageSize && onPageSizeChange && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground order-2 sm:order-1">
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

            <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center sm:justify-end">
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
                                {t.pagination?.page || "Page"} {currentPage} {t.pagination?.of || "of"} {totalPages}
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
        </div>
    );
}

export { CustomPagination as Pagination };
