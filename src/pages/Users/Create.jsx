import { useState, useEffect } from "react"
import { Modal } from "#components/ui/Modal"
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
// import { SelectPortal } from "@radix-ui/react-select"
import api from "#lib/axios"
import { toast } from "sonner"

const Create = ({ onUserCreated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: ''
    })
    const [roles, setRoles] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles')

            const rolesData = Array.isArray(res.data.roles) ? res.data.roles : []
            setRoles(rolesData)
            // Set agent as default if available
            const agentRole = rolesData.find(role => role.name.toLowerCase() === 'agent')
            if (agentRole) {
                setFormData(prev => ({
                    ...prev,
                    role_id: String(agentRole.id)
                }))
            }
        } catch (err) {
            console.log('Error fetching roles:', err)
            setRoles([])
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const handleRoleChange = (value) => {
        setFormData(prev => ({
            ...prev,
            role_id: value
        }))
        if (errors.role_id) {
            setErrors(prev => ({
                ...prev,
                role_id: ''
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        try {
            const response = await api.post('/register', formData)

            toast.success('Utilisateur créé avec succès')
            // Reset form
            setFormData({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
                role_id: formData.role_id
            })

            setIsOpen(false)
            if (onUserCreated) {
                onUserCreated(response.data)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la création de l\'utilisateur'
            toast.error(errorMessage)
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: 'Une erreur est survenue lors de la création de l\'utilisateur' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={<Button>Créer un utilisateur</Button>}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                    Remplissez le formulaire pour créer un nouveau compte utilisateur
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {errors.general}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Entrez le nom de l'utilisateur"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Entrez l'email de l'utilisateur"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm">{errors.email[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={formData.role_id} onValueChange={handleRoleChange} modal={false}>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Sélectionnez un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* <SelectPortal> */}
                            {Array.isArray(roles) && roles.map(role => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                    {role.name}
                                </SelectItem>
                            ))}
                            {/* </SelectPortal> */}
                        </SelectContent>
                    </Select>
                    {errors.role_id && (
                        <p className="text-red-500 text-sm">{errors.role_id[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Entrez un mot de passe (min 8 caractères)"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm">{errors.password[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                    <Input
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        placeholder="Confirmez le mot de passe"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                    />
                    {errors.password_confirmation && (
                        <p className="text-red-500 text-sm">{errors.password_confirmation[0]}</p>
                    )}
                </div>

                <div className="flex gap-4 justify-end mt-6">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Création en cours...' : 'Créer l\'utilisateur'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default Create