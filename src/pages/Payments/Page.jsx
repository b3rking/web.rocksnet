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
import { useAuth } from "#hooks/useAuth"
import { Button } from "#components/ui/button"
import Create from "./Create" 
import Edit from "./Edit" 
import TableSkeleton from "#components/ui/TableSkeleton"

const Page = () => {
    const [payments, setPayments] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // --- ÉTATS POUR LA PAGINATION ---
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    // --- ÉTATS POUR LE TRI ET FILTRES ---
    const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }])
    const [filters, setFilters] = useState({ search: '', method: 'all', type: 'all' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // --- ÉTATS POUR LA SUPPRESSION (MODAL) ---
    const [deletePayment, setDeletePayment] = useState(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleteIsLoading, setDeleteIsLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    // Set page layout title
    useApp('Paiements')
    const user = useAuth()
    const userRole = user?.role?.name

    // Debounce pour la recherche (Client, Agent, Montant...)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
            setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }, 400)
        return () => clearTimeout(timer)
    }, [filters.search])

    const getPaymentData = async () => {
        setIsLoading(true)
        try {
            const apiPage = pagination.pageIndex + 1
            const currentSort = sorting[0] || { id: 'created_at', desc: true }

            let url = `/payments?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`

            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`
            if (filters.method && filters.method !== 'all') url += `&method=${filters.method}`
            if (filters.type && filters.type !== 'all') url += `&type=${filters.type}`

            const res = await api.get(url)
            
            // Résolution résiliente de l'enveloppe paginée
            const paginationKey = res.data.payments || res.data
            setPayments(paginationKey.data || [])
            setPageCount(paginationKey.last_page || 0)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching payments:', err)
        }
    }

    const handleDelete = async () => {
        if (!deletePayment) return
        setDeleteIsLoading(true)
        setDeleteError("")
        try {
            await api.delete(`/payments/${deletePayment.id}`)
            setIsDeleteOpen(false)
            setDeletePayment(null)
            getPaymentData() 
        } catch (err) {
            console.error('Error deleting payment:', err)
            setDeleteError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression.')
        } finally {
            setDeleteIsLoading(false)
        }
    }

    useEffect(() => {
        getPaymentData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch, filters.method, filters.type])

    const columns = useMemo(() => [
        {
            id: "target_entity",
            header: "Payé par",
            enableSorting: true, // Géré par le backend via leftJoin dynamique
            cell: ({ row }) => {
                const type = row.original.payment_type
                const agent = row.original.agent
                const invoice = row.original.invoice
                
                if (type === 'Subscription') {
                    return (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-stone-900 dark:text-stone-200">
                                {invoice?.client?.name || "-"}
                            </span>
                            {invoice?.period && (
                                <span className="text-xs text-muted-foreground italic">
                                    Période: {invoice.period}
                                </span>
                            )}
                        </div>
                    )
                }

                if (type === 'Ticket') {
                    return (
                        <span className="text-sm text-stone-600 dark:text-stone-300">
                            {agent?.name || "Agent non spécifié"}
                        </span>
                    )
                }

                return <span className="text-xs text-muted-foreground">—</span>
            }
        },
        {
            id: "amount",
            accessorKey: "amount",
            header: "Montant",
            enableSorting: true,
            cell: ({ row }) => {
                const amount = row.original.amount
                const currency = row.original.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                if (amount === undefined || amount === null) return "-"

                return (
                    <span className="whitespace-nowrap font-semibold text-stone-900 dark:text-stone-100">
                        {Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5 font-normal">{currencyStr}</span>
                        )}
                    </span>
                )
            }
        },
        {
            id: "payment_method",
            accessorKey: "payment_method",
            header: "Méthode",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="capitalize text-stone-700 dark:text-stone-300 text-sm font-medium">
                    {getValue()?.toLowerCase() || "-"}
                </span>
            )
        },
        {
            id: "payment_type",
            accessorKey: "payment_type",
            header: "Type de Flux",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="capitalize text-stone-600 dark:text-stone-400 text-sm">
                    {getValue()?.toLowerCase() || "-"}
                </span>
            )
        },
        {
            id: "saved_by",
            header: "Enregistré par",
            enableSorting: false,
            cell: ({ row }) => {
                const operator = row.original.saved_by_user || row.original.saved_by
                return (
                    <span className="text-sm text-stone-700 dark:text-stone-300">
                        {operator?.name || "-"}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date de Transaction",
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

                const canUpdate = ['admin', 'super agent'].includes(userRole)
                const canDelete = userRole === 'admin'

                if (!canUpdate && !canDelete) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        {/* {canUpdate && (
                            <Edit
                                payment={rowData}
                                onPaymentUpdated={getPaymentData}
                            />
                        )} */}

                        {canDelete && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                    setDeletePayment(rowData)
                                    setDeleteError("")
                                    setIsDeleteOpen(true)
                                }}
                            >
                                Supprimer
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ], [userRole]) 

    // Barre d'outils pour la recherche et filtres croisés
    const filtersBar = useMemo(() => (
        <div className="flex flex-col lg:flex-row items-end gap-4 w-full">
            <div className="w-full lg:max-w-xs space-y-1.5">
                <Label htmlFor="pay-search" className="text-xs font-medium text-stone-500">Recherche globale</Label>
                <Input
                    id="pay-search"
                    type="text"
                    placeholder="Client, agent, montant..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-9"
                />
            </div>
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="pay-method" className="text-xs font-medium text-stone-500">Méthode</Label>
                <Select
                    value={filters.method}
                    onValueChange={(val) => {
                        setFilters(prev => ({ ...prev, method: val }))
                        setPagination(prev => ({ ...prev, pageIndex: 0 }))
                    }}
                >
                    <SelectTrigger id="pay-method" className="h-9">
                        <SelectValue placeholder="Toutes les méthodes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les méthodes</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="transfert">Virement Bancaire</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="pay-type" className="text-xs font-medium text-stone-500">Type de flux</Label>
                <Select
                    value={filters.type}
                    onValueChange={(val) => {
                        setFilters(prev => ({ ...prev, type: val }))
                        setPagination(prev => ({ ...prev, pageIndex: 0 }))
                    }}
                >
                    <SelectTrigger id="pay-type" className="h-9">
                        <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="Subscription">Abonnement (Client)</SelectItem>
                        <SelectItem value="Ticket">Ticket (Agent)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    ), [filters])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion des Paiements Comptables
                </h2>
                <div className="flex flex-row">
                    <Create onPaymentCreated={getPaymentData} />
                </div>
            </div>

            {isLoading && payments.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable 
                        columns={columns} 
                        data={payments} 
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

            {/* Modal de Confirmation de Suppression */}
            {deletePayment && (
                <Modal trigger={null} isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'historique de paiement</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer définitivement cette transaction d'un montant de{" "}
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                                {Number(deletePayment.amount).toLocaleString('fr-FR')} {deletePayment.currency?.symbol || deletePayment.currency?.code || ""}
                            </span>{" "}
                            ? Cette action est irréversible.
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