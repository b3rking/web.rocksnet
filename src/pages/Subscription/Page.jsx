"use client"

import { DataTable } from "#components/ui/DataTable"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import { useAuth } from "#hooks/useAuth"
import Create from "./Create"
import Edit from "./Edit" 
import { Button } from "#components/ui/button"
import TableSkeleton from "#components/ui/TableSkeleton"

const Page = () => {
    const [subscriptions, setSubscriptions] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // --- ÉTATS POUR LA PAGINATION ---
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    // --- ÉTATS POUR LE TRI ET FILTRES ---
    const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }])
    const [filters, setFilters] = useState({ search: '' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useApp('Abonnements')
    const user = useAuth()

    // Debounce pour la recherche de bande passante / profil
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
            setPagination(prev => ({ ...prev, pageIndex: 0 })) // Reset à la première page
        }, 400)
        return () => clearTimeout(timer)
    }, [filters.search])

    const getSubscriptionData = async () => {
        setIsLoading(true)
        try {
            const apiPage = pagination.pageIndex + 1
            const currentSort = sorting[0] || { id: 'created_at', desc: true }

            let url = `/subscriptions?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`

            if (debouncedSearch) {
                url += `&search=${encodeURIComponent(debouncedSearch)}`
            }

            const res = await api.get(url)
            
            // Résolution flexible du format de données paginées
            const paginationKey = res.data.subscriptions || res.data
            setSubscriptions(paginationKey.data || [])
            setPageCount(paginationKey.last_page || 0)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching subscriptions:', err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cet abonnement ?')) return

        try {
            await api.delete(`/subscriptions/${id}`)
            getSubscriptionData() 
        } catch (err) {
            console.error('Error deleting subscription:', err)
            alert('Une erreur est survenue lors de la suppression.')
        }
    }

    useEffect(() => {
        getSubscriptionData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch])

    const columns = useMemo(() => [
        {
            id: "bandwidth",
            accessorKey: "bandwidth",
            header: "Bande passante / Profil",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="font-medium text-stone-900 dark:text-stone-100">
                    {getValue() || "-"}
                </span>
            )
        },
        {
            id: "price",
            accessorKey: "price",
            header: "Tarif",
            enableSorting: true,
            cell: ({ row }) => {
                const amount = row.original.price
                const currency = row.original.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                if (amount === undefined || amount === null) return "-"

                return (
                    <span className="whitespace-nowrap font-semibold text-stone-900 dark:text-stone-100">
                        {Number(amount).toLocaleString('fr-FR')}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5 font-normal">
                                {currencyStr}
                            </span>
                        )}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date de création",
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

                if (user?.role_id >= 2) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        <Edit
                            subscription={rowData}
                            onSubscriptionUpdated={getSubscriptionData}
                        />
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(rowData.id)}
                        >
                            Supprimer
                        </Button>
                    </div>
                )
            },
        },
    ], [user]) 

    // Barre d'outils pour la recherche
    const filtersBar = useMemo(() => (
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="sub-search" className="text-xs font-medium text-stone-500">Rechercher</Label>
                <Input
                    id="sub-search"
                    type="text"
                    placeholder="Profil, vitesse, tarif..."
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
                    Gestion des Forfaits d'Abonnement
                </h2>
                <div className="flex flex-row">
                    {user?.role_id < 2 && <Create onSubscriptionCreated={getSubscriptionData} />}
                </div>
            </div>

            {isLoading && subscriptions.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable 
                        columns={columns} 
                        data={subscriptions} 
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