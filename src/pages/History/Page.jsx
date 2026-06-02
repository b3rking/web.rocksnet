"use client"

import { DataTable } from "#components/ui/DataTable"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#components/ui/select"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import { useAuth } from "#hooks/useAuth"
import TableSkeleton from "#components/ui/TableSkeleton"

const Page = () => {
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // --- ÉTATS POUR LA PAGINATION ---
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    // --- ÉTATS POUR LE TRI ET FILTRES ---
    const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }])
    const [filters, setFilters] = useState({ search: '', action: 'all' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useApp('Historique')
    const user = useAuth()

    // Debounce pour la recherche (Agent ou Profil)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
            setPagination(prev => ({ ...prev, pageIndex: 0 })) // Reset page index
        }, 400)
        return () => clearTimeout(timer)
    }, [filters.search])

    const getHistoryData = async () => {
        setIsLoading(true)
        try {
            const apiPage = pagination.pageIndex + 1
            const currentSort = sorting[0] || { id: 'created_at', desc: true }

            let url = `/stock/history?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`

            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`
            if (filters.action && filters.action !== 'all') url += `&action=${filters.action}`

            const res = await api.get(url)
            
            // Récupération des données paginées depuis l'enveloppe standard Laravel
            setHistory(res.data.data || [])
            setPageCount(res.data.last_page || 0)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching stock history:', err)
        }
    }

    // Déclenchement au changement d'état de la table ou des filtres
    useEffect(() => {
        getHistoryData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch, filters.action])

    const columns = useMemo(() => [
        {
            id: "agent.name",
            accessorKey: "agent.name",
            header: "Agent / Utilisateur",
            enableSorting: true,
            cell: ({ row }) => {
                const agentObj = row.original.agent
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                            {agentObj?.name || "Inconnu"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {agentObj?.email || "-"}
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
            id: "action",
            accessorKey: "action",
            header: "Opération",
            enableSorting: true,
            cell: ({ getValue }) => {
                const action = (getValue() || "").toLowerCase()
                const isReduction = action === 'reduction' || action === 'sale' || action === 'vente'
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        isReduction 
                            ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200/20" 
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/20"
                    }`}>
                        {isReduction ? "Vente" : "Attribution"}
                    </span>
                )
            }
        },
        {
            id: "quantity",
            accessorKey: "quantity",
            header: "Quantité",
            enableSorting: true,
            cell: ({ row, getValue }) => {
                const qty = getValue()
                const action = (row.original.action || "").toLowerCase()
                const isReduction = action === 'reduction' || action === 'sale' || action === 'vente'

                return (
                    <span className={`font-bold transition-colors ${
                        isReduction 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                        {isReduction ? "-" : "+"}{qty} {qty > 1 ? "tickets" : "ticket"}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date de l'opération",
            enableSorting: true,
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-";
                return (
                    <span className="text-stone-600 dark:text-stone-400 text-sm">
                        {format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                )
            },
        },
    ], [user])

    // Barre d'outils de filtres injectée
    const filtersBar = useMemo(() => (
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="history-search" className="text-xs font-medium text-stone-500">Rechercher</Label>
                <Input
                    id="history-search"
                    type="text"
                    placeholder="Nom d'agent, profil..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-9"
                />
            </div>
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="history-action" className="text-xs font-medium text-stone-500">Opération</Label>
                <Select
                    value={filters.action}
                    onValueChange={(val) => {
                        setFilters(prev => ({ ...prev, action: val }))
                        setPagination(prev => ({ ...prev, pageIndex: 0 }))
                    }}
                >
                    <SelectTrigger id="history-action" className="h-9">
                        <SelectValue placeholder="Toutes les opérations" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les opérations</SelectItem>
                        <SelectItem value="attribution">Attributions (+)</SelectItem>
                        <SelectItem value="reduction">Ventes (-)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    ), [filters])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Historique des mouvements du stock
                </h2>
                <div className="flex flex-row" />
            </div>

            {isLoading && history.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable 
                        columns={columns} 
                        data={history} 
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