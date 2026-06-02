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
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    
    // 1. Initialisation de l'état de la pagination
    const [pagination, setPagination] = useState({
        pageIndex: 0, // Page 1 pour TanStack
        pageSize: 10,
    })
    const [pageCount, setPageCount] = useState(0) // Nombre total de pages renvoyé par Laravel

    const [editUser, setEditUser] = useState(null)
    const [deleteUser, setDeleteUser] = useState(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role_id: '' })
    const [editErrors, setEditErrors] = useState({})
    const [editIsLoading, setEditIsLoading] = useState(false)
    const [deleteIsLoading, setDeleteIsLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    
    useApp('Utilisateurs')

    // 2. On passe la pagination courante dans la requête API
    const getData = async () => {
        setIsLoading(true) // On remet le loader lors du changement de page
        try {
            const apiPage = pagination.pageIndex + 1; // Correction du décalage (0 -> 1)
            const res = await api.get(`/list/users?page=${apiPage}&per_page=${pagination.pageSize}`)
            
            // Laravel met le tableau d'utilisateurs dans .data sous l'objet paginé
            setUsers(res.data.data)
            // On extrait le nombre total de pages calculé par Laravel
            setPageCount(res.data.last_page)
            
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error(err);
        }
    }

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles')
            const rolesData = Array.isArray(res.data.roles) ? res.data.roles : []
            setRoles(rolesData)
        } catch (err) {
            console.error('Error fetching roles:', err)
            setRoles([])
        }
    }

    // 3. On recharge les rôles une seule fois au montage
    useEffect(() => {
        fetchRoles()
    }, [])

    // 4. On re-déclenche getData() à chaque fois que l'index de page ou la taille change
    useEffect(() => {
        getData()
    }, [pagination.pageIndex, pagination.pageSize])

    const handleUserCreated = () => {
        // Optionnel : Revenir à la page 1 si nécessaire
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
        getData()
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditFormData(prev => ({ ...prev, [name]: value }))
        if (editErrors[name]) {
            setEditErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleEditRoleChange = (value) => {
        setEditFormData(prev => ({ ...prev, role_id: value }))
        if (editErrors.role_id) {
            setEditErrors(prev => ({ ...prev, role_id: '' }))
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditIsLoading(true)
        setEditErrors({})

        try {
            await api.put(`/users/${editUser.id}`, editFormData)
            setIsEditOpen(false)
            getData()
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
            await api.delete(`/users/${deleteUser.id}`)
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
            cell: ({ getValue }) => (
                <span className="font-medium text-stone-900 dark:text-stone-100">
                    {getValue()}
                </span>
            )
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ getValue }) => (
                <span className="text-stone-600 dark:text-stone-400">
                    {getValue()}
                </span>
            )
        },
        {
            accessorKey: "created_at",
            header: "Date de création",
            cell: ({ getValue }) => {
                const rawDate = getValue();
                if (!rawDate) return "-";
                return (
                    <span className="text-stone-500 dark:text-stone-400 text-sm">
                        {format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                );
            },
        },
        {
            accessorKey: "role.name",
            header: "Rôle",
            cell: ({ getValue }) => {
                const roleName = getValue();
                const roleKey = roleName?.toLowerCase();
                if (!roleKey) return "-";
                
                const badgeStyles = {
                    admin: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
                    "super agent": "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50",
                    agent: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
                };

                const currentStyle = badgeStyles[roleKey] || "bg-stone-50 text-stone-800 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800";

                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-wide transition-colors ${currentStyle}`}>
                        {roleName}
                    </span>
                );
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
                            setEditUser(row.original)
                            setEditFormData({
                                name: row.original.name,
                                email: row.original.email,
                                role_id: String(row.original.role_id)
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
                            setDeleteUser(row.original)
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

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion des utilisateurs
                </h2>
                <Create onUserCreated={handleUserCreated} />
            </div>

            {isLoading && users.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    {/* On branche l'état contrôlé par le serveur ici */}
                    <DataTable 
                        columns={columns} 
                        data={users} 
                        manualPagination={true}
                        isLoading={isLoading}
                        pageCount={pageCount}
                        paginationState={pagination}
                        onPaginationChange={setPagination}
                    />
                </div>
            )}

            {/* Edit Modal */}
            {editUser && (
                <Modal trigger={null} isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogHeader>
                        <DialogTitle>Modifier l'utilisateur</DialogTitle>
                        <DialogDescription>Mettez à jour les informations de l'utilisateur</DialogDescription>
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
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" name="email" type="email" value={editFormData.email} onChange={handleEditChange} required disabled={editIsLoading} />
                            {editErrors.email && <p className="text-destructive text-xs font-medium mt-1">{editErrors.email[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Rôle</Label>
                            <Select value={editFormData.role_id} onValueChange={handleEditRoleChange} modal={true}>
                                <SelectTrigger id="edit-role" disabled={editIsLoading}>
                                    <SelectValue placeholder="Sélectionnez un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {editErrors.role_id && <p className="text-destructive text-xs font-medium mt-1">{editErrors.role_id[0]}</p>}
                        </div>
                        <div className="flex gap-4 justify-end mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={editIsLoading}>Annuler</Button>
                            <Button type="submit" disabled={editIsLoading}>{editIsLoading ? 'Mise à jour...' : 'Mettre à jour'}</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Modal */}
            {deleteUser && (
                <Modal trigger={null} isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'utilisateur</DialogTitle>
                        <DialogDescription>Êtes-vous sûr de vouloir supprimer {deleteUser?.name} ? Cette action ne peut pas être annulée.</DialogDescription>
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