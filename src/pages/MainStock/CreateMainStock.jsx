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

const CreateMainStock = ({ onStockAssigned }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [profils, setProfils] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        profil_id: '',
        quantity: ''
    })

    const fetchProfils = async () => {
        try {
            const profilsRes = await api.get('/profils')
            const profilsData = Array.isArray(profilsRes.data) 
                ? profilsRes.data 
                : profilsRes.data.profils || profilsRes.data.data || []
            setProfils(profilsData)
        } catch (err) {
            console.error('Error fetching profils for main stock:', err)
            setProfils([])
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchProfils()
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
            const response = await api.post('/main-stocks', {
                profil_id: formData.profil_id,
                quantity: Number(formData.quantity)
            })

            setFormData({
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
                setErrors({ general: "Une erreur est survenue lors de la création du stock principal" })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            trigger={<Button>Ajouter au stock principal</Button>}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
        >
            <DialogHeader>
                <DialogTitle>Ajouter au stock principal</DialogTitle>
                <DialogDescription>
                    Ajoutez ou incrémentez la quantité d'un profil technique dans le stock principal.
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {errors.general}
                    </div>
                )}

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

                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        placeholder="Ex: 100"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    {errors.quantity && (
                        <p className="text-red-500 text-sm">{errors.quantity[0]}</p>
                    )}
                </div>

                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Enregistrement...' : 'Valider'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default CreateMainStock