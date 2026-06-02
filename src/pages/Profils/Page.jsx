"use client"

import { DataTable } from "#components/ui/DataTable"
import { Button } from "#components/ui/button"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import {
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "#components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#components/ui/select"
import { Modal } from "#components/ui/Modal"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import Create from "./Create"
import { useApp } from "#hooks/useApp"
import TableSkeleton from "#components/ui/TableSkeleton"

const Page = () => {
    const [profils, setProfils] = useState([])
    const [currencies, setCurrencies] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Pagination state (Identique pour conserver la structure)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
    const [pageCount, setPageCount] = useState(0)

    // --- ÉTATS POUR LE TRI ET FILTRES ---
    const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }])
    const [filters, setFilters] = useState({ search: '', currency_id: 'all' })
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Debounce pour la recherche textuelle
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
            setPagination(prev => ({ ...prev, pageIndex: 0 })) // Reset à la p.1 sur recherche
        }, 400)
        return () => clearTimeout(timer)
    }, [filters.search])

    const [editProfil, setEditProfil] = useState(null)
    const [deleteProfil, setDeleteProfil] = useState(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ name: '', duration: '', price: '', currency_id: '' })
    const [editErrors, setEditErrors] = useState({})
    const [editIsLoading, setEditIsLoading] = useState(false)
    const [deleteIsLoading, setDeleteIsLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    
    useApp('Profils')

    // Intégration de tous les paramètres dans l'URL de l'API
    const getData = async () => {
        setIsLoading(true)
        try {
            const apiPage = pagination.pageIndex + 1
            const currentSort = sorting[0] || { id: 'created_at', desc: true }
            
            let url = `/profils?page=${apiPage}&per_page=${pagination.pageSize}&sort_by=${currentSort.id}&sort_desc=${currentSort.desc}`
            
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`
            if (filters.currency_id && filters.currency_id !== 'all') url += `&currency_id=${filters.currency_id}`

            const res = await api.get(url)
            setProfils(res.data.data)
            setPageCount(res.data.last_page)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error(err)
        }
    }

    const fetchCurrencies = async () => {
        try {
            const res = await api.get('/currencies')
            const currenciesData = Array.isArray(res.data) ? res.data : (res.data.currencies || [])
            setCurrencies(currenciesData)
        } catch (err) {
            console.error('Error fetching currencies:', err)
            setCurrencies([])
        }
    }

    useEffect(() => {
        fetchCurrencies()
    }, [])

    // Écoute des changements de pagination, tri, et filtres
    useEffect(() => {
        getData()
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch, filters.currency_id])

    const handleProfilCreated = () => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
        getData()
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditFormData(prev => ({ ...prev, [name]: value }))
        if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleEditCurrencyChange = (value) => {
        setEditFormData(prev => ({ ...prev, currency_id: value }))
        if (editErrors.currency_id) setEditErrors(prev => ({ ...prev, currency_id: '' }))
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditIsLoading(true)
        setEditErrors({})
        try {
            await api.put(`/profils/${editProfil.id}`, editFormData)
            setIsEditOpen(false)
            getData()
        } catch (err) {
            if (err.response?.data?.errors) setEditErrors(err.response.data.errors)
            else if (err.response?.data?.message) setEditErrors({ general: err.response.data.message })
            else setEditErrors({ general: 'Une erreur est survenue lors de la mise à jour' })
        } finally {
            setEditIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setDeleteIsLoading(true)
        setDeleteError("")
        try {
            await api.delete(`/profils/${deleteProfil.id}`)
            setIsDeleteOpen(false)
            getData()
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Une erreur est survenue')
        } finally {
            setDeleteIsLoading(false)
        }
    }

    const columns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Nom",
            enableSorting: true,
        },
        {
            accessorKey: "duration",
            header: "Durée",
            enableSorting: true,
        },
        {
            accessorKey: "price",
            header: "Prix",
            enableSorting: true,
            cell: ({ row }) => (
                <span>
                    {row.original.price} {row.original.currency?.code}
                </span>
            )
        },
        {
            accessorKey: "currency.name",
            id: "currency.name", // Indispensable pour l'alignement avec le leftJoin du backend
            header: "Devise",
            enableSorting: true,
        },
        {
            accessorKey: "created_at",
            header: "Date de création",
            enableSorting: true,
            cell: ({ getValue }) => {
                const rawDate = getValue();
                if (!rawDate) return "-";
                return (
                    <span>
                        {format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setEditProfil(row.original)
                            setEditFormData({
                                name: row.original.name,
                                duration: row.original.duration,
                                price: row.original.price,
                                currency_id: String(row.original.currency_id)
                            })
                            setEditErrors({})
                            setIsEditOpen(true)
                        }}
                    >
                        Éditer
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                            setDeleteProfil(row.original)
                            setDeleteError("")
                            setIsDeleteOpen(true)
                        }}
                    >
                        Supprimer
                    </Button>
                </div>
            ),
        },
    ], [])

    // Injection de la barre de filtres (Configurable et alignée sur ton design)
    const filtersBar = useMemo(() => (
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="search-input" className="text-xs font-medium text-stone-500">Rechercher</Label>
                <Input
                    id="search-input"
                    type="text"
                    placeholder="Nom, durée, prix..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-9"
                />
            </div>
            <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="filter-currency" className="text-xs font-medium text-stone-500">Filtrer par Devise</Label>
                <Select
                    value={filters.currency_id}
                    onValueChange={(val) => {
                        setFilters(prev => ({ ...prev, currency_id: val }))
                        setPagination(prev => ({ ...prev, pageIndex: 0 }))
                    }}
                >
                    <SelectTrigger id="filter-currency" className="h-9">
                        <SelectValue placeholder="Toutes les devises" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les devises</SelectItem>
                        {currencies.map(currency => (
                            <SelectItem key={currency.id} value={String(currency.id)}>
                                {currency.name} ({currency.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    ), [filters, currencies])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion des profils
                </h2>
                <Create onProfilCreated={handleProfilCreated} />
            </div>

            {isLoading && profils.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable 
                        columns={columns} 
                        data={profils} 
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

            {/* Edit Modal */}
            {editProfil && (
                <Modal trigger={null} isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogHeader>
                        <DialogTitle>Modifier le profil</DialogTitle>
                        <DialogDescription>Mettez à jour les informations du profil</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                        {editErrors.general && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">
                                {editErrors.general}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom</Label>
                            <Input id="edit-name" name="name" type="text" value={editFormData.name} onChange={handleEditChange} required disabled={editIsLoading} />
                            {editErrors.name && <p className="text-destructive text-xs font-medium mt-1">{editErrors.name[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-duration">Durée</Label>
                            <Input id="edit-duration" name="duration" type="text" value={editFormData.duration} onChange={handleEditChange} required disabled={editIsLoading} />
                            {editErrors.duration && <p className="text-destructive text-xs font-medium mt-1">{editErrors.duration[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-price">Prix</Label>
                            <Input id="edit-price" name="price" type="number" step="any" value={editFormData.price} onChange={handleEditChange} required disabled={editIsLoading} />
                            {editErrors.price && <p className="text-destructive text-xs font-medium mt-1">{editErrors.price[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-currency">Devise</Label>
                            <Select value={editFormData.currency_id} onValueChange={handleEditCurrencyChange} modal={true}>
                                <SelectTrigger id="edit-currency" disabled={editIsLoading}>
                                    <SelectValue placeholder="Sélectionnez une devise" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map(currency => (
                                        <SelectItem key={currency.id} value={String(currency.id)}>{currency.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {editErrors.currency_id && <p className="text-destructive text-xs font-medium mt-1">{editErrors.currency_id[0]}</p>}
                        </div>
                        <div className="flex gap-4 justify-end mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={editIsLoading}>Annuler</Button>
                            <Button type="submit" disabled={editIsLoading}>{editIsLoading ? 'Mise à jour...' : 'Mettre à jour'}</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Modal */}
            {deleteProfil && (
                <Modal trigger={null} isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogHeader>
                        <DialogTitle>Supprimer le profil</DialogTitle>
                        <DialogDescription>Êtes-vous sûr de vouloir supprimer {deleteProfil?.name} ? Cette action ne peut pas être annulée.</DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm mt-4">
                            {deleteError}
                        </div>
                    )}
                    <div className="flex gap-4 justify-end mt-6">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleteIsLoading}>Annuler</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteIsLoading}>{deleteIsLoading ? 'Suppression...' : 'Supprimer'}</Button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default Page