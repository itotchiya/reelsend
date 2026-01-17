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
    pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
    const { t } = useI18n();

    if (totalPages < 1) return null;

    const getPageNumbers = () => {
        const pages: (number | "ellipsis")[] = [];

        // Always show first and last
        // Show context around current page

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        if (currentPage > 3) {
            pages.push("ellipsis");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push("ellipsis");
        }

        pages.push(totalPages);
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <nav
            aria-label="Pagination"
            className={cn("flex flex-col sm:flex-row items-center justify-center gap-6 w-full", className)}
        >
            {/* Pagination Controls */}
            <ul className="flex -space-x-px text-sm">
                <li>
                    <button
                        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={cn(
                            "flex items-center justify-center text-muted-foreground bg-secondary/50 border border-border hover:bg-secondary hover:text-foreground font-medium rounded-s-md px-3 h-9 transition-colors",
                            currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">{t.pagination?.previous || "Previous"}</span>
                    </button>
                </li>

                {pages.map((page, index) => (
                    <li key={index}>
                        {page === "ellipsis" ? (
                            <span className="flex items-center justify-center text-muted-foreground bg-secondary/50 border border-border w-9 h-9">
                                ...
                            </span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page)}
                                className={cn(
                                    "flex items-center justify-center border border-border font-medium text-sm w-9 h-9 transition-colors cursor-pointer",
                                    currentPage === page
                                        ? "bg-accent text-primary z-10"
                                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {page}
                            </button>
                        )}
                    </li>
                ))}

                <li>
                    <button
                        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={cn(
                            "flex items-center justify-center text-muted-foreground bg-secondary/50 border border-border hover:bg-secondary hover:text-foreground font-medium rounded-e-md px-3 h-9 transition-colors",
                            currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        )}
                    >
                        <span className="hidden sm:inline">{t.pagination?.next || "Next"}</span>
                        <ChevronRight className="h-4 w-4 sm:ml-1" />
                    </button>
                </li>
            </ul>

            {/* Page Size Select */}
            {pageSize && onPageSizeChange && (
                <div className="w-full sm:w-auto">
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                        <SelectTrigger className="h-9 w-40 bg-secondary/50 border-border text-foreground text-sm hover:bg-secondary transition-colors">
                            <SelectValue placeholder={`${pageSize} ${t.pagination?.perPage || "per page"}`} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size} {t.pagination?.perPage || "per page"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </nav>
    );
}

export { CustomPagination as Pagination };
