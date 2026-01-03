"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination } from "./pagination";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

/**
 * DataTable Component
 * 
 * @path src/components/ui-kit/data-table.tsx
 * 
 * A reusable data table with sorting and pagination.
 */

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    currentPage?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    onSort?: (key: string, direction: "asc" | "desc") => void;
    sortKey?: string;
    sortDirection?: "asc" | "desc";
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    className?: string;
    isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    pageSize = 16,
    currentPage = 1,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 16, 20, 50, 100],
    onSort,
    sortKey,
    sortDirection,
    emptyMessage = "No data available",
    emptyIcon,
    className,
    isLoading,
}: DataTableProps<T>) {
    const total = totalItems ?? data.length;
    const totalPages = Math.ceil(total / pageSize);

    const handleSort = (key: string) => {
        if (!onSort) return;
        const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc";
        onSort(key, newDirection);
    };

    const getSortIcon = (key: string) => {
        if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
        return sortDirection === "asc"
            ? <ArrowUp className="h-4 w-4 ml-1" />
            : <ArrowDown className="h-4 w-4 ml-1" />;
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        "font-semibold text-xs uppercase tracking-wider",
                                        column.sortable && "cursor-pointer select-none hover:bg-muted/80",
                                        column.className
                                    )}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center">
                                        {column.header}
                                        {column.sortable && getSortIcon(column.key)}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        Loading...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        {emptyIcon}
                                        <span>{emptyMessage}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow key={item.id ?? index}>
                                    {columns.map((column) => (
                                        <TableCell key={column.key} className={column.className}>
                                            {column.render
                                                ? column.render(item, index)
                                                : item[column.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {onPageChange && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    pageSize={pageSize}
                    onPageSizeChange={onPageSizeChange}
                    pageSizeOptions={pageSizeOptions}
                />
            )}
        </div>
    );
}
