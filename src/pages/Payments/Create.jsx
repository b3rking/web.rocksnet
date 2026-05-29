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

const Create = ({ onSubscriptionCreated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currencies, setCurrencies] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        bandwidth: '',
        price: '',
        currency_id: ''
    })

    const fetchCurrencies = async () => {
        try {
            const res = await api.get('/currencies')
            const currencyData = Array.isArray(res.data) ? res.data : res.data.currencies || res.data.data || []
            setCurrencies(currencyData)
            
            // Automatically select the first available currency fallback if none has been specified yet
            if (currencyData.length > 0 && !formData.currency_id) {
                setFormData(prev => ({
                    ...prev,
                    currency_id: String(currencyData[0].id)
                }))
            }
        } catch (err) {
            console.error('Error fetching currencies:', err)
            setCurrencies([])
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchCurrencies()
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

    const handleCurrencyChange = (value) => {
        setFormData(prev => ({
            ...prev,
            currency_id: value
        }))
        if (errors.currency_id) {
            setErrors(prev => ({
                ...prev,
                currency_id: ''
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        try {
            // Payload explicitly matches target backend API Subscription validation payload layout 
            const response = await api.post('/subscriptions', {
                bandwidth: formData.bandwidth,
                price: Number(formData.price).toFixed(2), // Match decimal:2 database structure constraint rules
                currency_id: Number(formData.currency_id)
            })

            // Reset specific input text fields but retain currency configuration choices
            setFormData({
                bandwidth: '',
                price: '',
                currency_id: formData.currency_id
            })

            setIsOpen(false)
            if (onSubscriptionCreated) {
                onSubscriptionCreated(response.data)
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: "Une erreur est survenue lors de la création de l'abonnement" })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={<Button>Créer un abonnement</Button>}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Créer un nouvel abonnement</DialogTitle>
                <DialogDescription>
                    Remplissez le formulaire ci-dessous pour configurer un nouveau forfait d'abonnement internet.
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {errors.general}
                    </div>
                )}

                {/* Bandwidth Field */}
                <div className="space-y-2">
                    <Label htmlFor="bandwidth">Bande passante / Vitesse</Label>
                    <Input
                        id="bandwidth"
                        name="bandwidth"
                        type="text"
                        placeholder="Ex: 10 Mbps, Premium Illimité, etc."
                        value={formData.bandwidth}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.bandwidth && (
                        <p className="text-red-500 text-sm">{errors.bandwidth[0]}</p>
                    )}
                </div>

                {/* Price and Currency Layout Group */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Prix</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 50.00"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        {errors.price && (
                            <p className="text-red-500 text-sm">{errors.price[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency_id">Devise</Label>
                        <Select 
                            value={formData.currency_id} 
                            onValueChange={handleCurrencyChange}
                            modal={true}
                        >
                            <SelectTrigger id="currency_id" disabled={isLoading}>
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
                        {errors.currency_id && (
                            <p className="text-red-500 text-sm">{errors.currency_id[0]}</p>
                        )}
                    </div>
                </div>

                {/* Foot Action Elements */}
                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Création en cours...' : "Créer l'abonnement"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default Create