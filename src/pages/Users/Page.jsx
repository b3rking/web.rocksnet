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
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Create from "./Create"
import { useApp } from "#hooks/useApp"

const Page = () => {
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [editUser, setEditUser] = useState(null)
    const [deleteUser, setDeleteUser] = useState(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role_id: '' })
    const [editErrors, setEditErrors] = useState({})
    const [editIsLoading, setEditIsLoading] = useState(false)
    const [deleteIsLoading, setDeleteIsLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    // setting the page title
    useApp('Utilisateurs')

    const columns = [
        {
            accessorKey: "name",
            header: "Nom",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "created_at",
            header: "Date de creation",
            cell: ({ getValue }) => {
                const rawDate = getValue();
                if (!rawDate) return "-";
                
                return format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr });
            },
        },
        {
            accessorKey: "role.name",
            header: "Role",
            cell: ({ getValue }) => {
                const role = getValue()?.toLowerCase();
                if (!role) return "-";
                
                // Define colors for each role
                const badgeStyles = {
                    admin: "bg-red-100 text-red-800 border-red-200",
                    "super agent": "bg-purple-100 text-purple-800 border-purple-200",
                    agent: "bg-blue-100 text-blue-800 border-blue-200",
                };

                // Fallback to gray if it doesn't match
                const currentStyle = badgeStyles[role] || "bg-gray-100 text-gray-800 border-gray-200";

                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${currentStyle}`}>
                        {getValue()}
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
    ]

    const getData = async () => {
        try {
            const res = await api.get('/list/users')
            setUsers(res.data.data)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.log(err);
        }
    }

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles')
            const rolesData = Array.isArray(res.data.roles) ? res.data.roles : []
            setRoles(rolesData)
        } catch (err) {
            console.log('Error fetching roles:', err)
            setRoles([])
        }
    }

    useEffect(() => {
        getData()
        fetchRoles()
    }, [])

    const handleUserCreated = (newUser) => {
        getData()
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (editErrors[name]) {
            setEditErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const handleEditRoleChange = (value) => {
        setEditFormData(prev => ({
            ...prev,
            role_id: value
        }))
        if (editErrors.role_id) {
            setEditErrors(prev => ({
                ...prev,
                role_id: ''
            }))
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

    return (
        <div>
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2>Gestion des utilisateurs</h2>
                <Create onUserCreated={handleUserCreated} />
            </div>
            {isLoading ? 'loading...' : <DataTable columns={columns} data={users} />}

            {/* Edit Modal */}
            {editUser && (
                <Modal
                    trigger={null}
                    isOpen={isEditOpen}
                    onOpenChange={setIsEditOpen}
                >
                    <DialogHeader>
                        <DialogTitle>Modifier l'utilisateur</DialogTitle>
                        <DialogDescription>
                            Mettez à jour les informations de l'utilisateur
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {editErrors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {editErrors.general}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom</Label>
                            <Input
                                id="edit-name"
                                name="name"
                                type="text"
                                placeholder="Nom de l'utilisateur"
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
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                name="email"
                                type="email"
                                placeholder="Email de l'utilisateur"
                                value={editFormData.email}
                                onChange={handleEditChange}
                                required
                                disabled={editIsLoading}
                            />
                            {editErrors.email && (
                                <p className="text-red-500 text-sm">{editErrors.email[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Rôle</Label>
                            <Select value={editFormData.role_id} onValueChange={handleEditRoleChange}>
                                <SelectTrigger id="edit-role" disabled={editIsLoading}>
                                    <SelectValue placeholder="Sélectionnez un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(roles) && roles.map(role => (
                                        <SelectItem key={role.id} value={String(role.id)}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {editErrors.role_id && (
                                <p className="text-red-500 text-sm">{editErrors.role_id[0]}</p>
                            )}
                        </div>

                        <div className="flex gap-4 justify-end mt-6">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={editIsLoading}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={editIsLoading}>
                                {editIsLoading ? 'Mise à jour...' : 'Mettre à jour'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Modal */}
            {deleteUser && (
                <Modal
                    trigger={null}
                    isOpen={isDeleteOpen}
                    onOpenChange={setIsDeleteOpen}
                >
                    <DialogHeader>
                        <DialogTitle>Supprimer l'utilisateur</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer {deleteUser?.name}? Cette action ne peut pas être annulée.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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