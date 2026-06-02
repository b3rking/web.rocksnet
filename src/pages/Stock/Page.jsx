"use client"

import { DataTable } from "#components/ui/DataTable"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import CreateStock from "./CreateStock"
import { useAuth } from "#hooks/useAuth"
import SaleStock from "./SaleStock"
import TableSkeleton from "#components/ui/TableSkeleton"

const Page = () => {
    const [stocks, setStocks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // --- ÉTATS POUR LA PAGINATION ---
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    // --- ÉTATS POUR LE TRI ET FILTRES ---
    const [sorting, setSorting] = useState([{ id: 'updated_at', desc: true }])
    const [filters, setFilters] = useState({ search: '' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useApp('Stock')
    const user = useAuth()

    // Debounce pour la recherche (Agent ou Profil)
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

            let url = `/stock?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`

            if (debouncedSearch) {
                url += `&search=${encodeURIComponent(debouncedSearch)}`
            }

            const res = await api.get(url)
            
            // Extraction des données paginées depuis la structure Laravel standard
            const resolvedData = res.data.data || []
            setStocks(resolvedData)
            setPageCount(res.data.last_page || 0)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching stock:', err)
        }
    }

    // Déclenchement de la récupération des données
    useEffect(() => {
        getStockData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch])

    const columns = useMemo(() => [
        {
            id: "user.name",
            accessorKey: "user.name",
            header: "Agent / Utilisateur",
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
                    <span className={`font-bold transition-colors ${
                        qty <= 5 
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
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
                const rowData = row.original
                const canSell = user?.role_id > 1

                if (!canSell) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        <SaleStock 
                            profil={rowData} 
                            onSaleRecorded={getStockData} 
                        />
                    </div>
                )
            },
        },
    ], [user])

    // Barre de recherche intégrée directement à la DataTable
    const filtersBar = useMemo(() => (
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="stock-search" className="text-xs font-medium text-stone-500">Rechercher</Label>
                <Input
                    id="stock-search"
                    type="text"
                    placeholder="Nom de l'agent, profil..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-9"
                />
            </div>
        </div>
    ), [filters])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion du stock des agents
                </h2>
                <div className="flex flex-row">
                    {user?.role_id < 2 && <CreateStock onStockAssigned={getStockData} />}
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
        </div>
    )
}

export default Page