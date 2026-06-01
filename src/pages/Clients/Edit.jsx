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

const Edit = ({ client, onClientUpdated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [subscriptions, setSubscriptions] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        email: '', // Added hydration state
        phone: '',
        adress: '',
        subscription_id: '',
        etat: 'actif'
    })

    useEffect(() => {
        if (isOpen && client) {
            setFormData({
                name: client.name || '',
                email: client.email || '', // Field population logic
                phone: client.phone || '',
                adress: client.adress || '',
                subscription_id: client.subscription_id ? String(client.subscription_id) : '',
                etat: client.etat ? String(client.etat).toLowerCase() : 'actif'
            })
            fetchSubscriptions()
        }
    }, [isOpen, client])

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions')
            const subscriptionData = res.data.subscriptions.data || []
            setSubscriptions(subscriptionData)
        } catch (err) {
            console.error('Error fetching dynamic subscriptions:', err)
            setSubscriptions([])
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

    const handleSelectChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        try {
            const response = await api.put(`/clients/${client.id}`, {
                name: formData.name,
                email: formData.email, // Data collection
                phone: formData.phone,
                adress: formData.adress,
                subscription_id: Number(formData.subscription_id),
                etat: formData.etat
            })

            setIsOpen(false)
            if (onClientUpdated) {
                onClientUpdated(response.data)
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: "Une erreur est survenue lors de la mise à jour du client" })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={
                <Button variant="outline" size="sm">
                    Modifier
                </Button>
            }
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Modifier le profil client</DialogTitle>
                <DialogDescription>
                    Modifiez les informations personnelles ou changez le forfait internet assigné à ce client.
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {errors.general}
                    </div>
                )}

                {/* Name Field */}
                <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom Complet</Label>
                    <Input
                        id="edit-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name[0]}</p>
                    )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="edit-email">Adresse Email</Label>
                    <Input
                        id="edit-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm">{errors.email[0]}</p>
                    )}
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                    <Label htmlFor="edit-phone">Numéro de Téléphone</Label>
                    <Input
                        id="edit-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.phone && (
                        <p className="text-red-500 text-sm">{errors.phone[0]}</p>
                    )}
                </div>

                {/* Address Field */}
                <div className="space-y-2">
                    <Label htmlFor="edit-adress">Adresse Résidentielle</Label>
                    <Input
                        id="edit-adress"
                        name="adress"
                        type="text"
                        value={formData.adress}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.adress && (
                        <p className="text-red-500 text-sm">{errors.adress[0]}</p>
                    )}
                </div>

                {/* Subscription and Status Layout Group */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-subscription_id">Forfait Internet</Label>
                        <Select 
                            value={formData.subscription_id} 
                            onValueChange={(val) => handleSelectChange('subscription_id', val)}
                            modal={true}
                        >
                            <SelectTrigger id="edit-subscription_id" disabled={isLoading}>
                                <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                                {subscriptions.map(sub => {
                                    const currencyStr = sub.currency ? (sub.currency.symbol || sub.currency.code) : ""
                                    return (
                                        <SelectItem key={sub.id} value={String(sub.id)}>
                                            {sub.bandwidth} ({Number(sub.price).toLocaleString('fr-FR')} {currencyStr})
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                        {errors.subscription_id && (
                            <p className="text-red-500 text-sm">{errors.subscription_id[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-etat">État du Compte</Label>
                        <Select 
                            value={formData.etat} 
                            onValueChange={(val) => handleSelectChange('etat', val)}
                            modal={true}
                        >
                            <SelectTrigger id="edit-etat" disabled={isLoading}>
                                <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="actif">Actif</SelectItem>
                                <SelectItem value="inactif">Inactif</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.etat && (
                            <p className="text-red-500 text-sm">{errors.etat[0]}</p>
                        )}
                    </div>
                </div>

                {/* Foot Action Elements */}
                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Mise à jour...' : 'Sauvegarder'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default Edit