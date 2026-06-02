"use client"

import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react"
import { TableSpinner } from "@/components/ui/TableSpinner"

export function DataTable({
    columns,
    data,
    isLoading = false,
    manualPagination = false,
    pageCount,
    paginationState,
    onPaginationChange,
    // --- NOUVELLES PROPS POUR LE TRI ET FILTRES ---
    sortingState,
    onSortingChange,
    filtersComponent, 
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
        manualPagination: manualPagination,
        pageCount: manualPagination ? pageCount : undefined,
        onPaginationChange: onPaginationChange,
        // Intégration du Tri contrôlé par le serveur
        manualSorting: true,
        onSortingChange: onSortingChange,
        state: {
            pagination: paginationState,
            sorting: sortingState, // <-- Branchement de l'état du tri
        },
        initialState: !manualPagination ? {
            pagination: { pageSize: 10 },
        } : undefined,
    })

    const canPreviousPage = manualPagination ? paginationState.pageIndex > 0 : table.getCanPreviousPage()
    const canNextPage = manualPagination ? (pageCount ? paginationState.pageIndex < pageCount - 1 : false) : table.getCanNextPage()
    const currentPageIndex = manualPagination ? paginationState.pageIndex : table.getState().pagination.pageIndex
    const totalPages = manualPagination ? (pageCount || 1) : (table.getPageCount() || 1)
    const currentPageSize = manualPagination ? paginationState.pageSize : table.getState().pagination.pageSize

    return (
        <div className="space-y-4">
            
            {/* Conteneur de filtres dynamique fourni par la page hôte */}
            {filtersComponent && (
                <div className="p-4 bg-stone-50/50 dark:bg-stone-900/30 rounded-t-lg border-b border-border">
                    {filtersComponent}
                </div>
            )}

            <div className="overflow-hidden rounded-md border relative">
                {isLoading && <TableSpinner />}

                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    // Vérifier si la colonne est triable
                                    const isSortable = header.column.getCanSort();
                                    const sortDir = header.column.getIsSorted();

                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                isSortable ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="-ml-3 h-8 data-[state=open]:bg-accent font-semibold text-current"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                        {sortDir === "desc" ? (
                                                            <ArrowDown className="ml-2 h-4 w-4 text-primary" />
                                                        ) : sortDir === "asc" ? (
                                                            <ArrowUp className="ml-2 h-4 w-4 text-primary" />
                                                        ) : (
                                                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                                        )}
                                                    </Button>
                                                ) : (
                                                    flexRender(header.column.columnDef.header, header.getContext())
                                                )
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-muted-foreground">Lignes par page</p>
                    <Select
                        value={String(currentPageSize)}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue value={currentPageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={String(pageSize)}>{pageSize}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium text-muted-foreground">
                        Page {currentPageIndex + 1} sur {totalPages}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!canPreviousPage || isLoading}>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!canPreviousPage || isLoading}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!canNextPage || isLoading}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!canNextPage || isLoading}>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}