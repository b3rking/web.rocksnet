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
import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import Create from "./Create"
import { useApp } from "#hooks/useApp"

const Page = () => {
    const [profils, setProfils] = useState([])
    const [currencies, setCurrencies] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [editProfil, setEditProfil] = useState(null)
    const [deleteProfil, setDeleteProfil] = useState(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    
    const [editFormData, setEditFormData] = useState({ 
        name: '', 
        duration: '', 
        price: '', 
        currency_id: '' 
    })
    const [editErrors, setEditErrors] = useState({})
    const [editIsLoading, setEditIsLoading] = useState(false)
    const [deleteIsLoading, setDeleteIsLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    // Setting page layout title
    useApp('Profiles')

    const columns = [
        {
            accessorKey: "name",
            header: "Nom",
        },
        {
            accessorKey: "duration",
            header: "Durée",
        },
        {
            accessorKey: "price",
            header: "Prix",
            cell: ({ row }) => {
                const amount = row.original.price;
                const currencyCode = row.original.currency?.code || row.original.currency?.symbol || "";
                if (amount === undefined || amount === null) return "-";
                return `${Number(amount).toLocaleString('fr-FR')} ${currencyCode}`.trim();
            }
        },
        {
            accessorKey: "created_at",
            header: "Date de création",
            cell: ({ getValue }) => {
                const rawDate = getValue();
                if (!rawDate) return "-";
                return format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr });
            },
        },
        {
            id: "actions",
            header: "Actions",
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
                                price: String(row.original.price),
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
    ]

    const getProfilsData = async () => {
        try {
            const res = await api.get('/profils')
            // Fallback strategy depending on API wrapping schemas (data vs data.data)
            const resolvedData = Array.isArray(res.data) ? res.data : res.data.profils || [];
            setProfils(resolvedData)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching profils:', err);
        }
    }

    const fetchCurrencies = async () => {
        try {
            const res = await api.get('/currencies')
            const currencyData = Array.isArray(res.data) ? res.data : res.data.currencies || res.data.data || [];
            setCurrencies(currencyData)
        } catch (err) {
            console.error('Error fetching currencies:', err)
            setCurrencies([])
        }
    }

    useEffect(() => {
        getProfilsData()
        fetchCurrencies()
    }, [])

    const handleProfilCreated = () => {
        getProfilsData()
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (editErrors[name]) {
            setEditErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleEditCurrencyChange = (value) => {
        setEditFormData(prev => ({
            ...prev,
            currency_id: value
        }))
        if (editErrors.currency_id) {
            setEditErrors(prev => ({ ...prev, currency_id: '' }))
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditIsLoading(true)
        setEditErrors({})

        try {
            // Fits Laravel update parameters utilizing PATCH
            await api.patch(`/profils/${editProfil.id}`, editFormData)
            setIsEditOpen(false)
            getProfilsData()
        } catch (err) {
            if (err.response?.data?.errors) {
                setEditErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setEditErrors({ general: err.response.data.message })
            } else {
                setEditErrors({ general: 'Une erreur est survenue lors de la mise à jour' })
            }
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
            getProfilsData()
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Une erreur est survenue lors de la suppression')
        } finally {
            setDeleteIsLoading(false)
        }
    }

    return (
        <div>
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2>Gestion des profils</h2>
                <Create onProfilCreated={handleProfilCreated} />
            </div>

            {isLoading ? 'Chargement en cours...' : <DataTable columns={columns} data={profils} />}

            {/* Edit Profil Modal */}
            {editProfil && (
                <Modal
                    trigger={null}
                    isOpen={isEditOpen}
                    onOpenChange={setIsEditOpen}
                >
                    <DialogHeader>
                        <DialogTitle>Modifier le profil</DialogTitle>
                        <DialogDescription>
                            Mettez à jour les informations du profil technique et de sa tarification
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                        {editErrors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {editErrors.general}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom du profil</Label>
                            <Input
                                id="edit-name"
                                name="name"
                                type="text"
                                placeholder="Ex: Basic, Premium..."
                                value={editFormData.name}
                                onChange={handleEditChange}
                                required
                                disabled={editIsLoading}
                            />
                            {editErrors.name && (
                                <p className="text-red-500 text-sm">{editErrors.name[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-duration">Durée</Label>
                            <Input
                                id="edit-duration"
                                name="duration"
                                type="text"
                                placeholder="Ex: 1 heure, 24 heures..."
                                value={editFormData.duration}
                                onChange={handleEditChange}
                                required
                                disabled={editIsLoading}
                            />
                            {editErrors.duration && (
                                <p className="text-red-500 text-sm">{editErrors.duration[0]}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">Prix</Label>
                                <Input
                                    id="edit-price"
                                    name="price"
                                    type="number"
                                    step="any"
                                    placeholder="Montant"
                                    value={editFormData.price}
                                    onChange={handleEditChange}
                                    required
                                    disabled={editIsLoading}
                                />
                                {editErrors.price && (
                                    <p className="text-red-500 text-sm">{editErrors.price[0]}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-currency">Devise</Label>
                                <Select 
                                    value={editFormData.currency_id} 
                                    onValueChange={handleEditCurrencyChange}
                                    modal={true}
                                >
                                    <SelectTrigger id="edit-currency" disabled={editIsLoading}>
                                        <SelectValue placeholder="Sélectionnez" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map(currency => (
                                            <SelectItem key={currency.id} value={String(currency.id)}>
                                                {currency.name} ({currency.symbol || currency.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editErrors.currency_id && (
                                    <p className="text-red-500 text-sm">{editErrors.currency_id[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={editIsLoading}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={editIsLoading}>
                                {editIsLoading ? 'Mise à jour...' : 'Mettre à jour'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Profil Modal */}
            {deleteProfil && (
                <Modal
                    trigger={null}
                    isOpen={isDeleteOpen}
                    onOpenChange={setIsDeleteOpen}
                >
                    <DialogHeader>
                        <DialogTitle>Supprimer le profil</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le profil &quot;{deleteProfil?.name}&quot;? Cette action ne peut pas être annulée.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {deleteError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
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