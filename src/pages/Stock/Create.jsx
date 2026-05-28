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

const Create = ({ onProfilCreated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currencies, setCurrencies] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        duration: '',
        price: '',
        currency_id: ''
    })

    const fetchCurrencies = async () => {
        try {
            const res = await api.get('/currencies')
            const currencyData = Array.isArray(res.data) ? res.data : res.data.currencies || res.data.data || []
            setCurrencies(currencyData)
            
            // Optional: Automatically auto-select the first available currency if none is set
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
            const response = await api.post('/profils', formData)

            // Reset form fields but preserve the chosen currency for consecutive entries
            setFormData({
                name: '',
                duration: '',
                price: '',
                currency_id: formData.currency_id
            })

            setIsOpen(false)
            if (onProfilCreated) {
                onProfilCreated(response.data)
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: 'Une erreur est survenue lors de la création du profil' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={<Button>Créer un profil</Button>}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Créer un nouveau profil</DialogTitle>
                <DialogDescription>
                    Remplissez le formulaire ci-dessous pour configurer un nouveau forfait technique
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {errors.general}
                    </div>
                )}

                {/* Name Field */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nom du profil</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Ex: Forfait Basic, Premium, etc."
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name[0]}</p>
                    )}
                </div>

                {/* Duration Field */}
                <div className="space-y-2">
                    <Label htmlFor="duration">Durée</Label>
                    <Input
                        id="duration"
                        name="duration"
                        type="text"
                        placeholder="Ex: 1 heure, 24 heures, 30 jours"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.duration && (
                        <p className="text-red-500 text-sm">{errors.duration[0]}</p>
                    )}
                </div>

                {/* Price and Currency Inline Layout */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Prix</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            step="any"
                            placeholder="Ex: 100"
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

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Création en cours...' : 'Créer le profil'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default Create