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
    ChevronsRight 
} from "lucide-react"
// Importation du Spinner
import { TableSpinner } from "@/components/ui/TableSpinner"

export function DataTable({
    columns,
    data,
    isLoading = false, // <-- Nouvelle prop ici
    manualPagination = false,
    pageCount,
    paginationState,
    onPaginationChange,
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
        manualPagination: manualPagination,
        pageCount: manualPagination ? pageCount : undefined,
        onPaginationChange: onPaginationChange,
        state: {
            pagination: paginationState,
        },
        initialState: !manualPagination ? {
            pagination: {
                pageSize: 10,
            },
        } : undefined,
    })

    const canPreviousPage = manualPagination 
        ? paginationState.pageIndex > 0 
        : table.getCanPreviousPage()

    const canNextPage = manualPagination 
        ? (pageCount ? paginationState.pageIndex < pageCount - 1 : false)
        : table.getCanNextPage()

    const currentPageIndex = manualPagination 
        ? paginationState.pageIndex 
        : table.getState().pagination.pageIndex

    const totalPages = manualPagination 
        ? (pageCount || 1) 
        : (table.getPageCount() || 1)

    const currentPageSize = manualPagination 
        ? paginationState.pageSize 
        : table.getState().pagination.pageSize

    return (
        <div className="space-y-4">
            {/* Table Container - AJOUT de la classe "relative" ici */}
            <div className="overflow-hidden rounded-md border relative">
                
                {/* Si isLoading est vrai, le spinner se déploie par-dessus la table */}
                {isLoading && <TableSpinner />}

                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
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

            {/* Pagination Controls... (inchangé) */}
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
                                <SelectItem key={pageSize} value={String(pageSize)}>
                                    {pageSize}
                                </SelectItem>
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