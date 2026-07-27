"use client"

import { DataTable } from "#components/ui/DataTable"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import {
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "#components/ui/dialog"
import { Modal } from "#components/ui/Modal"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import CreateMainStock from "./CreateMainStock"
import { useAuth } from "#hooks/useAuth"
import TableSkeleton from "#components/ui/TableSkeleton"
import { Button } from "#components/ui/button"

const Page = () => {
    const [stocks, setStocks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    const [sorting, setSorting] = useState([{ id: 'updated_at', desc: true }])
    const [filters, setFilters] = useState({ search: '' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    const [deleteStock, setDeleteStock] = useState(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleteIsLoading, setDeleteIsLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    useApp('Stock Principal')
    const user = useAuth()

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
            setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }, 400)
        return () => clearTimeout(timer)
    }, [filters.search])

    const getStockData = async () => {
        setIsLoading(true)
        try {
            const apiPage = pagination.pageIndex + 1
            const currentSort = sorting[0] || { id: 'updated_at', desc: true }

            let url = `/main-stocks?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`

            if (debouncedSearch) {
                url += `&search=${encodeURIComponent(debouncedSearch)}`
            }

            const res = await api.get(url)

            const resolvedData = res.data.data || []
            setStocks(resolvedData)
            setPageCount(res.data.last_page || 0)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching main stock:', err)
        }
    }

    const handleDelete = async () => {
        if (!deleteStock) return
        setDeleteIsLoading(true)
        setDeleteError("")
        try {
            await api.delete(`/main-stocks/${deleteStock.id}`)
            setIsDeleteOpen(false)
            setDeleteStock(null)
            getStockData()
        } catch (err) {
            console.error('Error deleting main stock:', err)
            setDeleteError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression.')
        } finally {
            setDeleteIsLoading(false)
        }
    }

    useEffect(() => {
        getStockData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch])

    const columns = useMemo(() => [
        {
            id: "user.name",
            accessorKey: "user.name",
            header: "Créé par",
            enableSorting: true,
            cell: ({ row }) => {
                const userObj = row.original.user
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                            {userObj?.name || "Inconnu"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {userObj?.email || "-"}
                        </span>
                    </div>
                )
            }
        },
        {
            id: "profil.name",
            accessorKey: "profil.name",
            header: "Profil Technique",
            enableSorting: true,
            cell: ({ row }) => (
                <span className="font-medium text-stone-800 dark:text-stone-200">
                    {row.original.profil?.name || "-"}
                </span>
            )
        },
        {
            id: "profil_duration",
            header: "Durée du Profil",
            enableSorting: false,
            cell: ({ row }) => (
                <span className="text-stone-700 dark:text-stone-300">
                    {row.original.profil?.duration || "-"}
                </span>
            )
        },
        {
            id: "profil_price",
            header: "Prix unitaire",
            enableSorting: false,
            cell: ({ row }) => {
                const profil = row.original.profil
                const amount = profil?.price
                const currencyObj = profil?.currency
                const currencyStr = currencyObj
                    ? (currencyObj.symbol || currencyObj.code || currencyObj.name)
                    : ""

                if (amount === undefined || amount === null) return "-"

                return (
                    <span className="whitespace-nowrap font-semibold text-stone-900 dark:text-stone-100">
                        {Number(amount).toLocaleString('fr-FR')}
                        {currencyStr && (
                            <span className="text-muted-foreground/90 text-xs ml-1 font-medium tracking-wide">
                                &nbsp;{currencyStr}
                            </span>
                        )}
                    </span>
                )
            }
        },
        {
            id: "quantity",
            accessorKey: "quantity",
            header: "Quantité en Stock",
            enableSorting: true,
            cell: ({ getValue }) => {
                const qty = getValue()
                return (
                    <span className={`font-bold transition-colors ${qty <= 5
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                        {qty} {qty > 1 ? "tickets" : "ticket"}
                    </span>
                )
            }
        },
        {
            id: "updated_at",
            accessorKey: "updated_at",
            header: "Dernière Mise à jour",
            enableSorting: true,
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-"
                return (
                    <span className="text-stone-600 dark:text-stone-400 text-sm">
                        {format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const rowData = row.original
                const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role_id === 1

                if (!isAdmin) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                setDeleteStock(rowData)
                                setDeleteError("")
                                setIsDeleteOpen(true)
                            }}
                        >
                            Supprimer
                        </Button>
                    </div>
                )
            },
        },
    ], [user])

    const filtersBar = useMemo(() => (
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="stock-search" className="text-xs font-medium text-stone-500">Rechercher</Label>
                <Input
                    id="stock-search"
                    type="text"
                    placeholder="Profil, créateur..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-9"
                />
            </div>
        </div>
    ), [filters.search])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion du stock principal
                </h2>
                <div className="flex flex-row">
                    {user?.role_id < 2 && <CreateMainStock onStockAssigned={getStockData} />}
                </div>
            </div>

            {isLoading && stocks.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable
                        columns={columns}
                        data={stocks}
                        manualPagination={true}
                        isLoading={isLoading}
                        pageCount={pageCount}
                        paginationState={pagination}
                        onPaginationChange={setPagination}
                        sortingState={sorting}
                        onSortingChange={setSorting}
                        filtersComponent={filtersBar}
                    />
                </div>
            )}

            {deleteStock && (
                <Modal trigger={null} isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogHeader>
                        <DialogTitle>Supprimer la ligne de stock</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le stock de <span className="font-semibold text-stone-900 dark:text-stone-100">{deleteStock.profil?.name}</span> ? Cette action ne peut pas être annulée.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {deleteError && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm mt-4">
                            {deleteError}
                        </div>
                    )}
                    
                    <div className="flex gap-4 justify-end mt-6">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleteIsLoading}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteIsLoading}>
                            {deleteIsLoading ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default Page