"use client"

import { useState, useEffect } from "react"
import { Modal } from "#components/ui/Modal"
import { Button } from "#components/ui/button"
import { Input } from "#components/ui/input"
import { Label } from "#components/ui/label"
import { Textarea } from "#components/ui/textarea"
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
import { useAuth } from "#hooks/useAuth"

const Create = ({ onPaymentCreated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currencies, setCurrencies] = useState([])
    const [agents, setAgents] = useState([])
    const [clients, setClients] = useState([])
    const [stockMovements, setStockMovements] = useState([])
    
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    
    const user = useAuth()
    const activeUser = user?.user || user; // Normalizes auth structure if nested
    const isAdminUser = activeUser?.role_id === 1; // Matches your exact admin role ID

    const [formData, setFormData] = useState({
        amount: '',
        currency_id: '',
        agent_id: '',
        payment_type: '',
        payment_method: '',
        description: '',
        client_id: '',
        period: '', 
        stock_history_id: ''
    })

    // Baseline configuration loading
    const fetchBaseRelations = async () => {
        try {
            const currencyRes = await api.get('/currencies')
            const currencyData = currencyRes.data.currencies || currencyRes.data || []
            setCurrencies(currencyData)

            if (currencyData.length > 0 && !formData.currency_id) {
                setFormData(prev => ({ ...prev, currency_id: String(currencyData[0].id) }))
            }
        } catch (err) {
            console.error('Error fetching baseline configurations:', err)
        }
    }

    // Dynamic stock history loader matching filters
    const fetchStockMovements = async (agentId = '') => {
        try {
            let url = '/stock/history?action=Reduction'
            if (agentId) {
                url += `&agent_id=${agentId}`
            }

            const res = await api.get(url)
            setStockMovements(res.data.history || res.data || [])
        } catch (err) {
            console.error('Error fetching stock movements:', err)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchBaseRelations()
        }
    }, [isOpen])

    // Handle structural type shifts
    useEffect(() => {
        if (formData.payment_type === 'Subscription') {
            api.get('/clients')
                .then(res => setClients(res.data.clients || res.data || []))
                .catch(err => console.error(err))
        } 
        
        if (formData.payment_type === 'Ticket') {
            if (isAdminUser) {
                api.get('/list/agents')
                    .then(res => setAgents(res.data.data || res.data || []))
                    .catch(err => console.error(err))
            }
            fetchStockMovements(formData.agent_id)
        }

        // Clean up structural states when changing contexts
        setFormData(prev => ({
            ...prev,
            client_id: prev.payment_type === 'Subscription' ? prev.client_id : '',
            period: prev.payment_type === 'Subscription' ? prev.period : '',
            stock_history_id: prev.payment_type === 'Ticket' ? prev.stock_history_id : '',
            agent_id: prev.payment_type === 'Ticket' ? prev.agent_id : ''
        }))
    }, [formData.payment_type])

    // Re-fetch movements when Admin updates agent targeting context
    useEffect(() => {
        if (formData.payment_type === 'Ticket') {
            fetchStockMovements(formData.agent_id)
            setFormData(prev => ({ ...prev, stock_history_id: '' }))
        }
    }, [formData.agent_id])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSelectChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        const activeUserId = activeUser?.id

        const payload = {
            amount: Number(formData.amount).toFixed(2),
            currency_id: Number(formData.currency_id),
            saved_by: activeUserId, 
            payment_type: formData.payment_type,
            payment_method: formData.payment_method,
            description: formData.description,
            ...(formData.payment_type === 'Subscription' && formData.client_id && { client_id: Number(formData.client_id) }),
            ...(formData.payment_type === 'Subscription' && formData.period && { period: formData.period }),
            ...(formData.payment_type === 'Ticket' && formData.stock_history_id && { stock_history_id: formData.stock_history_id }),
            ...(formData.payment_type === 'Ticket' && formData.agent_id && { agent_id: Number(formData.agent_id) })
        }

        try {
            const response = await api.post('/payments', payload)
            setFormData({
                amount: '', currency_id: formData.currency_id, agent_id: '',
                payment_type: '', payment_method: '', description: '',
                client_id: '', period: '', stock_history_id: ''
            })
            setIsOpen(false)
            if (onPaymentCreated) onPaymentCreated(response.data)
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else {
                setErrors({ general: err.response?.data?.message || "Une erreur est survenue." })
            }
        } finally {
            // Correct implementation to unlock the form UI state
            setIsLoading(false)
        }
    }

    return (
        <Modal trigger={<Button>Enregistrer un paiement</Button>} isOpen={isOpen} onOpenChange={setIsOpen}>
            <DialogHeader>
                <DialogTitle>Enregistrer un nouveau paiement</DialogTitle>
                <DialogDescription>Saisissez les informations financières courantes.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{errors.general}</div>}

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Montant</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required disabled={isLoading} />
                        {errors.amount && <p className="text-red-500 text-sm">{errors.amount[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency_id">Devise</Label>
                        <Select value={formData.currency_id} onValueChange={(val) => handleSelectChange('currency_id', val)}>
                            <SelectTrigger id="currency_id" disabled={isLoading}><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                            <SelectContent>
                                {currencies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.symbol || c.code})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Payment Type & Method */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="payment_type">Type de Paiement</Label>
                        <Select value={formData.payment_type} onValueChange={(val) => handleSelectChange('payment_type', val)}>
                            <SelectTrigger id="payment_type" disabled={isLoading}><SelectValue placeholder="Choisir" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Subscription">Subscription</SelectItem>
                                <SelectItem value="Ticket">Ticket</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.payment_type && <p className="text-red-500 text-sm">{errors.payment_type[0]}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Méthode</Label>
                        <Select value={formData.payment_method} onValueChange={(val) => handleSelectChange('payment_method', val)}>
                            <SelectTrigger id="payment_method" disabled={isLoading}><SelectValue placeholder="Choisir" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Espèces (Cash)</SelectItem>
                                <SelectItem value="Transfert">Virement Bancaire</SelectItem>
                                <SelectItem value="Cheque">Chèque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* CONDITIONAL SUB-FORMS */}
                {formData.payment_type === 'Subscription' && (
                    <div className="space-y-4 border-l-2 border-blue-500 pl-3 bg-slate-50/50 p-3 rounded">
                        <div className="space-y-2">
                            <Label htmlFor="client_id">Sélectionner le Client</Label>
                            <Select value={formData.client_id} onValueChange={(val) => handleSelectChange('client_id', val)}>
                                <SelectTrigger id="client_id" disabled={isLoading}><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                                <SelectContent>
                                    {clients.map(cl => <SelectItem key={cl.id} value={String(cl.id)}>{cl.name} ({cl.email || 'Pas de mail'})</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.client_id && <p className="text-red-500 text-sm">{errors.client_id[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="period">Période d'Abonnement payé</Label>
                            <Select value={formData.period} onValueChange={(val) => handleSelectChange('period', val)}>
                                <SelectTrigger id="period" disabled={isLoading}><SelectValue placeholder="Définir la durée payée" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15 days">15 jours</SelectItem>
                                    <SelectItem value="1 month">1 mois</SelectItem>
                                    <SelectItem value="3 months">3 mois</SelectItem>
                                    <SelectItem value="6 months">6 mois</SelectItem>
                                    <SelectItem value="1 year">1 an</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.period && <p className="text-red-500 text-sm">{errors.period[0]}</p>}
                        </div>
                    </div>
                )}

                {formData.payment_type === 'Ticket' && (
                    <>
                        {isAdminUser && (
                            <div className="space-y-2 border-l-2 border-emerald-500 pl-3 bg-slate-50/50 p-2 rounded">
                                <Label htmlFor="agent_id">Filtrer par Agent</Label>
                                <Select value={formData.agent_id} onValueChange={(val) => handleSelectChange('agent_id', val)}>
                                    <SelectTrigger id="agent_id" disabled={isLoading}><SelectValue placeholder="Sélectionner l'agent ciblé" /></SelectTrigger>
                                    <SelectContent>
                                        {agents.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2 border-l-2 border-amber-500 pl-3 bg-slate-50/50 p-2 rounded">
                            <Label htmlFor="stock_history_id">Mouvement de Vente Associé (Réductions)</Label>
                            <Select 
                                value={formData.stock_history_id} 
                                onValueChange={(val) => handleSelectChange('stock_history_id', val)}
                                disabled={isLoading || (isAdminUser && !formData.agent_id)}
                            >
                                <SelectTrigger id="stock_history_id">
                                    <SelectValue placeholder={isAdminUser && !formData.agent_id ? "Veuillez d'abord choisir un agent" : "Sélectionner le mouvement de stock"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockMovements.length === 0 ? (
                                        <div className="p-2 text-xs text-muted-foreground text-center">Aucun mouvement trouvé.</div>
                                    ) : (
                                        stockMovements.map(sm => (
                                            <SelectItem key={sm.id} value={String(sm.id)}>
                                                {sm.profil?.name || 'Forfait'} | {sm.description || `Mouvement du ${new Date(sm.created_at).toLocaleDateString()}`} [-{sm.quantity || 0}]
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.stock_history_id && <p className="text-red-500 text-sm">{errors.stock_history_id[0]}</p>}
                        </div>
                    </>
                )}

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description[0]}</p>}
                </div>

                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Annuler</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Traitement...' : 'Confirmer'}</Button>
                </div>
            </form>
        </Modal>
    )
}

export default Create