"use client"

import { useState } from "react"
import { Modal } from "#components/ui/Modal"
import { Button } from "#components/ui/button"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import {
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "#components/ui/dialog"
import api from "#lib/axios"

const SaleStock = ({ profil, onSaleRecorded }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        tickets_sold: ''
    })

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        // Safely extract the technical profile's primary ID from the row data
        const targetProfilId = profil.profil_id
        
        const payload = {
            tickets_sold: Number(formData.tickets_sold), 
            profil_id: targetProfilId
        }

        try {
            // Payload explicitly matches your Laravel validation constraints
            const response = await api.post('/stock/sale', payload)

            setFormData({ tickets_sold: '' })
            setIsOpen(false)

            if (onSaleRecorded) {
                onSaleRecorded(response.data)
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else if (err.response?.data?.message) {
                setErrors({ general: err.response.data.message })
            } else {
                setErrors({ general: "Une erreur est survenue lors de l'enregistrement de la vente" })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={
                <Button size="sm" variant="outline">
                    Vendre
                </Button>
            }
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Enregistrer une vente</DialogTitle>
                <DialogDescription>
                    Déduisez des tickets de votre stock pour le profil : <strong>{profil.name || profil.profil?.name}</strong>
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {errors.general}
                    </div>
                )}

                {/* Tickets Sold Field */}
                <div className="space-y-2">
                    <Label htmlFor="tickets_sold">Quantité à vendre</Label>
                    <Input
                        id="tickets_sold"
                        name="tickets_sold"
                        type="number"
                        min="1"
                        placeholder="Ex: 5"
                        value={formData.tickets_sold}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.tickets_sold && (
                        <p className="text-red-500 text-sm">{errors.tickets_sold[0]}</p>
                    )}
                    {profil.quantity !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Stock disponible : {profil.quantity} ticket(s)
                        </p>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                        {isLoading ? 'Enregistrement...' : 'Confirmer la vente'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default SaleStock