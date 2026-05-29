"use client"

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
import api from "#lib/axios"

const CreateStock = ({ onStockAssigned }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [agents, setAgents] = useState([])
    const [profils, setProfils] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        user_id: '',
        profil_id: '',
        quantity: ''
    })

    // Fetch dependencies needed to build the attribution payload
    const fetchRelations = async () => {
        try {
            // Fetch agents list
            const agentsRes = await api.get('/list/agents')
            const agentsData = Array.isArray(agentsRes.data) ? agentsRes.data : agentsRes.data.agents || agentsRes.data.data || []
            setAgents(agentsData)

            // Fetch profiles list
            const profilsRes = await api.get('/profils')
            const profilsData = Array.isArray(profilsRes.data) ? profilsRes.data : profilsRes.data.profils || profilsRes.data.data || []
            setProfils(profilsData)
        } catch (err) {
            console.error('Error fetching data relations for stock attribution:', err)
            setAgents([])
            setProfils([])
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchRelations()
        }
    }, [isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleSelectChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        try {
            // Payload explicitly structure matches backend rules: user_id, profil_id, quantity
            const response = await api.post('/stock/attribute', {
                user_id: Number(formData.user_id),
                profil_id: formData.profil_id,
                quantity: Number(formData.quantity)
            })

            // Reset form fields tracking state variables
            setFormData({
                user_id: '',
                profil_id: '',
                quantity: ''
            })

            setIsOpen(false)
            if (onStockAssigned) {
                onStockAssigned(response.data)
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: "Une erreur est survenue lors de l'attribution des tickets" })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={<Button>Attribuer des tickets</Button>}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Attribuer des tickets à un agent</DialogTitle>
                <DialogDescription>
                    Créez ou incrémentez le stock de tickets d'un profil technique spécifique pour un agent.
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {errors.general}
                    </div>
                )}

                {/* Agent Selection Row */}
                <div className="space-y-2">
                    <Label htmlFor="user_id">Agent / Utilisateur</Label>
                    <Select 
                        value={formData.user_id} 
                        onValueChange={(val) => handleSelectChange('user_id', val)}
                        modal={true}
                    >
                        <SelectTrigger id="user_id" disabled={isLoading}>
                            <SelectValue placeholder="Sélectionnez l'agent" />
                        </SelectTrigger>
                        <SelectContent>
                            {agents.map(agent => (
                                <SelectItem key={agent.id} value={String(agent.id)}>
                                    {agent.name} ({agent.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.user_id && (
                        <p className="text-red-500 text-sm">{errors.user_id[0]}</p>
                    )}
                </div>

                {/* Profile Selection Row */}
                <div className="space-y-2">
                    <Label htmlFor="profil_id">Profil Technique</Label>
                    <Select 
                        value={formData.profil_id} 
                        onValueChange={(val) => handleSelectChange('profil_id', val)}
                        modal={true}
                    >
                        <SelectTrigger id="profil_id" disabled={isLoading}>
                            <SelectValue placeholder="Sélectionnez le profil" />
                        </SelectTrigger>
                        <SelectContent>
                            {profils.map(profil => (
                                <SelectItem key={profil.id} value={profil.id}>
                                    {profil.name} — {profil.duration} ({Number(profil.price).toLocaleString('fr-FR')} {profil.currency?.code || ''})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.profil_id && (
                        <p className="text-red-500 text-sm">{errors.profil_id[0]}</p>
                    )}
                </div>

                {/* Quantity Field */}
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité de tickets</Label>
                    <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        placeholder="Ex: 50"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.quantity && (
                        <p className="text-red-500 text-sm">{errors.quantity[0]}</p>
                    )}
                </div>

                {/* Footer Modal Actions */}
                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Attribution...' : 'Valider l\'attribution'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default CreateStock