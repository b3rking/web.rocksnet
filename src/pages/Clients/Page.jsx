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
import { Button } from "#components/ui/button"
import Create from "./Create"
import Edit from "./Edit"
import TableSkeleton from "#components/ui/TableSkeleton"

const Page = () => {
    const [clients, setClients] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // --- ÉTATS POUR LA PAGINATION ---
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    // --- ÉTATS POUR LE TRI ET FILTRES ---
    const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }])
    const [filters, setFilters] = useState({ search: '', etat: 'all' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Set page layout title
    useApp('Clients')
    const user = useAuth()
    const userRole = user?.role?.name

    // Debounce pour la recherche globale (Nom, Phone, Email...)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
            setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }, 400)
        return () => clearTimeout(timer)
    }, [filters.search])

    const getClientData = async () => {
        setIsLoading(true)
        try {
            const apiPage = pagination.pageIndex + 1
            const currentSort = sorting[0] || { id: 'created_at', desc: true }

            let url = `/clients?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`

            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`
            if (filters.etat && filters.etat !== 'all') url += `&etat=${filters.etat}`

            const res = await api.get(url)
            
            // Résolution de l'enveloppe de pagination
            const paginationKey = res.data.clients || res.data
            setClients(paginationKey.data || [])
            setPageCount(paginationKey.last_page || 0)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching clients:', err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer ce profil client ?')) return

        try {
            await api.delete(`/clients/${id}`)
            getClientData() 
        } catch (err) {
            console.error('Error deleting client:', err)
            alert('Une erreur est survenue lors de la suppression.')
        }
    }

    useEffect(() => {
        getClientData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch, filters.etat])

    const columns = useMemo(() => [
        {
            id: "name",
            accessorKey: "name",
            header: "Nom Complet",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {getValue() || "-"}
                </span>
            )
        },
        {
            id: "phone",
            accessorKey: "phone",
            header: "Téléphone",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="text-sm text-stone-600 dark:text-stone-400">
                    {getValue() || "-"}
                </span>
            )
        },
        {
            id: "email",
            accessorKey: "email",
            header: "Email",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="text-sm text-stone-600 dark:text-stone-400">
                    {getValue() || "-"}
                </span>
            )
        },
        {
            id: "adress",
            accessorKey: "adress",
            header: "Adresse",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1">
                    {getValue() || "-"}
                </span>
            )
        },
        {
            id: "subscription.bandwidth",
            accessorKey: "subscription.bandwidth",
            header: "Forfait Souscrit",
            enableSorting: true,
            cell: ({ row }) => {
                const subscription = row.original.subscription
                if (!subscription) return <span className="text-muted-foreground text-xs">Aucun forfait</span>

                const price = subscription.price
                const currency = subscription.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-stone-800 dark:text-stone-200">
                            {subscription.bandwidth || "Vitesse inconnue"}
                        </span>
                        {price !== undefined && price !== null && (
                            <span className="text-xs text-muted-foreground">
                                {Number(price).toLocaleString('fr-FR')} {currencyStr}
                            </span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "etat",
            accessorKey: "etat",
            header: "État",
            enableSorting: true,
            cell: ({ getValue }) => {
                const status = getValue()
                if (!status) return "-"

                return (
                    <span className="capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                        {status.toLowerCase()}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date d'Inscription",
            enableSorting: true,
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-"
                return (
                    <span className="text-stone-600 dark:text-stone-400 text-sm">
                        {format(parseISO(rawDate), "dd/MM/yyyy", { locale: fr })}
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

                const canUpdate = ['admin', 'super agent'].includes(userRole)
                const canDelete = userRole === 'admin'

                if (!canUpdate && !canDelete) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        {canUpdate && (
                            <Edit
                                client={rowData}
                                onClientUpdated={getClientData}
                            />
                        )}

                        {canDelete && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(rowData.id)}
                            >
                                Supprimer
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ], [userRole]) 

    // Barre d'outils de filtres et recherche
    const filtersBar = useMemo(() => (
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="client-search" className="text-xs font-medium text-stone-500">Rechercher</Label>
                <Input
                    id="client-search"
                    type="text"
                    placeholder="Nom, téléphone, email, adresse..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-9"
                />
            </div>
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="client-etat" className="text-xs font-medium text-stone-500">État du compte</Label>
                <Select
                    value={filters.etat}
                    onValueChange={(val) => {
                        setFilters(prev => ({ ...prev, etat: val }))
                        setPagination(prev => ({ ...prev, pageIndex: 0 }))
                    }}
                >
                    <SelectTrigger id="client-etat" className="h-9">
                        <SelectValue placeholder="Tous les états" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les états</SelectItem>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    ), [filters])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion des Profils Clients
                </h2>
                <div className="flex flex-row">
                    <Create onClientCreated={getClientData} />
                </div>
            </div>

            {isLoading && clients.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable 
                        columns={columns} 
                        data={clients} 
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