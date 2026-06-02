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
import { toast } from "sonner"

const Create = ({ onClientCreated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [subscriptions, setSubscriptions] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '', // Added field state
        phone: '',
        adress: '',
        subscription_id: '',
        etat: 'actif'
    })

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions')
            const subscriptionData = res.data.subscriptions.data || []
            setSubscriptions(subscriptionData)

            if (subscriptionData.length > 0 && !formData.subscription_id) {
                setFormData(prev => ({
                    ...prev,
                    subscription_id: String(subscriptionData[0].id)
                }))
            }
        } catch (err) {
            console.error('Error fetching dynamic subscriptions:', err)
            setSubscriptions([])
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchSubscriptions()
        }
    }, [isOpen])

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
            const response = await api.post('/clients', {
                name: formData.name,
                email: formData.email, // Sent payload field
                phone: formData.phone,
                adress: formData.adress,
                subscription_id: Number(formData.subscription_id),
                etat: formData.etat
            })

            setFormData({
                name: '',
                email: '', // Reset logic
                phone: '',
                adress: '',
                subscription_id: formData.subscription_id,
                etat: 'actif'
            })

            toast.success('Client créé avec succès')
            setIsOpen(false)
            if (onClientCreated) {
                onClientCreated(response.data)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement du client"
            toast.error(errorMessage)
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: "Une erreur est survenue lors de l'enregistrement du client" })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={<Button>Ajouter un client</Button>}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Créer un nouveau profil client</DialogTitle>
                <DialogDescription>
                    Remplissez le formulaire ci-dessous pour enregistrer un nouveau client et lui assigner un forfait internet.
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
                    <Label htmlFor="name">Nom Complet</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Ex: Jean Dupont"
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
                    <Label htmlFor="email">Adresse Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Ex: jean.dupont@example.com"
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
                    <Label htmlFor="phone">Numéro de Téléphone</Label>
                    <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Ex: +257 ...."
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
                    <Label htmlFor="adress">Adresse Résidentielle</Label>
                    <Input
                        id="adress"
                        name="adress"
                        type="text"
                        placeholder="Ex: Quartier Asiatique, Avenue de la JRR"
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
                        <Label htmlFor="subscription_id">Forfait Internet</Label>
                        <Select
                            value={formData.subscription_id}
                            onValueChange={(val) => handleSelectChange('subscription_id', val)}
                            modal={true}
                        >
                            <SelectTrigger id="subscription_id" disabled={isLoading}>
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
                        <Label htmlFor="etat">État du Compte</Label>
                        <Select
                            value={formData.etat}
                            onValueChange={(val) => handleSelectChange('etat', val)}
                            modal={true}
                        >
                            <SelectTrigger id="etat" disabled={isLoading}>
                                <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Actif">Actif</SelectItem>
                                <SelectItem value="Inactif">Inactif</SelectItem>
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
                        {isLoading ? 'Enregistrement...' : "Créer le profil"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default Create