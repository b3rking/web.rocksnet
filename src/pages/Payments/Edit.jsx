"use client"

import { useState, useEffect, useRef } from "react"
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
import { toast } from "sonner"

const PERIOD_MULTIPLIERS = {
    '15 days': 0.5,
    '1 month': 1,
    '3 months': 3,
    '6 months': 6,
    '1 year': 12
}

const Edit = ({ payment, onPaymentUpdated }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currencies, setCurrencies] = useState([])
    const [agents, setAgents] = useState([])
    const [clients, setClients] = useState([])
    const [stockMovements, setStockMovements] = useState([])
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const user = useAuth()
    const activeUser = user?.user || user
    const isAdminUser = activeUser?.role_id === 1

    const initialClientId = useRef('')
    const initialPeriod = useRef('')

    const [formData, setFormData] = useState({
        amount: '',
        currency_id: '',
        agent_id: '',
        payment_method: '',
        description: '',
        client_id: '',
        period: '',
        stock_history_id: ''
    })

    useEffect(() => {
        if (isOpen && payment) {
            setFormData({
                amount: payment.amount || '',
                currency_id: payment.currency_id ? String(payment.currency_id) : '',
                agent_id: payment.agent_id ? String(payment.agent_id) : '',
                payment_method: payment.payment_method || '',
                description: payment.description || '',
                client_id: payment.client_id ? String(payment.client_id) : (payment.invoice?.client_id ? String(payment.invoice.client_id) : ''),
                period: payment.period || (payment.invoice?.period || ''),
                stock_history_id: payment.stock_history_id ? String(payment.stock_history_id) : ''
            })

            initialClientId.current = payment.client_id ? String(payment.client_id) : ''
            initialPeriod.current = payment.period || ''

            fetchBaseRelations()

            if (payment.payment_type === 'Subscription') {
                api.get('/clients')
                    .then(res => setClients(res.data?.clients?.data ?? res.data?.clients ?? res.data ?? []))
                    .catch(err => console.error(err))
            } else if (payment.payment_type === 'Ticket') {
                if (isAdminUser) {
                    api.get('/list/agents')
                        .then(res => setAgents(res.data?.data ?? res.data ?? []))
                        .catch(err => console.error(err))
                }
                fetchStockMovements(payment.agent_id || '')
            }
        }
    }, [isOpen, payment])

    useEffect(() => {
        if (isOpen && payment?.payment_type === 'Ticket') {
            fetchStockMovements(formData.agent_id)
            if (formData.agent_id !== String(payment.agent_id || '')) {
                setFormData(prev => ({ ...prev, stock_history_id: '' }))
            }
        }
    }, [formData.agent_id])

    // --- AUTO-FILL CURRENCY & AMOUNT FOR SUBSCRIPTIONS (skip on initial load) ---
    useEffect(() => {
        if (!isOpen || payment?.payment_type !== 'Subscription' || !formData.client_id) return

        const isInitial = formData.client_id === initialClientId.current &&
                          formData.period === initialPeriod.current
        if (isInitial) return

        const client = clients.find(c => String(c.id) === String(formData.client_id))
        if (!client?.subscription) return

        if (client.subscription.currency_id) {
            setFormData(prev => ({ ...prev, currency_id: String(client.subscription.currency_id) }))
        }
    }, [formData.client_id, formData.period, isOpen, payment?.payment_type, clients])

    useEffect(() => {
        if (!isOpen || payment?.payment_type !== 'Subscription' || !formData.client_id || !formData.period) return

        const isInitial = formData.client_id === initialClientId.current &&
                          formData.period === initialPeriod.current
        if (isInitial) return

        const client = clients.find(c => String(c.id) === String(formData.client_id))
        if (!client?.subscription?.price) return

        const basePrice = parseFloat(client.subscription.price)
        const multiplier = PERIOD_MULTIPLIERS[formData.period] || 1
        const calculatedAmount = (basePrice * multiplier).toFixed(2)

        setFormData(prev => ({ ...prev, amount: calculatedAmount }))
    }, [formData.client_id, formData.period, isOpen, payment?.payment_type, clients])

    const fetchBaseRelations = async () => {
        try {
            const currencyRes = await api.get('/currencies')
            const currencyData = currencyRes.data?.currencies ?? currencyRes.data ?? []
            setCurrencies(currencyData)
        } catch (err) {
            console.error('Error fetching baseline configurations:', err)
        }
    }

    const fetchStockMovements = async (agentId = '') => {
        try {
            let url = '/stock/history?action=Reduction'
            if (agentId) url += `&agent_id=${agentId}`
            const res = await api.get(url)
            setStockMovements(res.data?.history ?? res.data?.data ?? res.data ?? [])
        } catch (err) {
            console.error('Error fetching stock movements:', err)
        }
    }

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

        const payload = {
            amount: formData.amount ? Number(formData.amount).toFixed(2) : undefined,
            currency_id: formData.currency_id ? Number(formData.currency_id) : undefined,
            saved_by: activeUser?.id,
            description: formData.description,
            payment_method: formData.payment_method,
            ...(payment.payment_type === 'Subscription' && {
                client_id: formData.client_id ? Number(formData.client_id) : null,
                period: formData.period || null
            }),
            ...(payment.payment_type === 'Ticket' && {
                stock_history_id: formData.stock_history_id ? Number(formData.stock_history_id) : null,
                agent_id: formData.agent_id ? Number(formData.agent_id) : null
            })
        }

        try {
            const response = await api.put(`/payments/${payment.id}`, payload)
            toast.success('Paiement mis à jour avec succès')
            setIsOpen(false)
            if (onPaymentUpdated) {
                onPaymentUpdated(response.data.data || response.data)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Une erreur est survenue lors de la mise à jour."
            toast.error(errorMessage)
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors)
            } else {
                setErrors({ general: errorMessage })
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
                <DialogTitle>Modifier le paiement</DialogTitle>
                <DialogDescription>
                    Ajustez les détails financiers du paiement de type <span className="font-semibold text-stone-900 dark:text-stone-100">{payment?.payment_type}</span>.
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {errors.general && (
                    <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                        {errors.general}
                    </div>
                )}

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-amount">Montant</Label>
                        <Input
                            id="edit-amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        {errors.amount && (
                            <p className="text-red-500 text-sm">{errors.amount[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-currency_id">Devise</Label>
                        <Select
                            value={formData.currency_id}
                            onValueChange={(val) => handleSelectChange('currency_id', val)}
                        >
                            <SelectTrigger id="edit-currency_id" disabled={isLoading}>
                                <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name} ({c.symbol || c.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.currency_id && (
                            <p className="text-red-500 text-sm">{errors.currency_id[0]}</p>
                        )}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label htmlFor="edit-payment_method">Méthode de paiement</Label>
                    <Select value={formData.payment_method} onValueChange={(val) => handleSelectChange('payment_method', val)}>
                        <SelectTrigger id="edit-payment_method" disabled={isLoading}>
                            <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cash">Espèces (Cash)</SelectItem>
                            <SelectItem value="Transfert">Virement Bancaire</SelectItem>
                            <SelectItem value="Cheque">Chèque</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.payment_method && (
                        <p className="text-red-500 text-sm">{errors.payment_method[0]}</p>
                    )}
                </div>

                {/* CONDITIONAL SUB-FORMS */}
                {payment?.payment_type === 'Subscription' && (
                    <div className="space-y-4 border-l-2 border-blue-500 pl-3 bg-slate-50/50 p-3 rounded">
                        <div className="space-y-2">
                            <Label htmlFor="edit-client_id">Sélectionner le Client</Label>
                            <Select value={formData.client_id} onValueChange={(val) => handleSelectChange('client_id', val)}>
                                <SelectTrigger id="edit-client_id" disabled={isLoading}>
                                    <SelectValue placeholder="Sélectionner un client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(cl => (
                                        <SelectItem key={cl.id} value={String(cl.id)}>
                                            {cl.name} ({cl.email || 'Pas de mail'}) — {cl.subscription?.bandwidth || ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.client_id && <p className="text-red-500 text-sm">{errors.client_id[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-period">Période d'Abonnement payé</Label>
                            <Select value={formData.period} onValueChange={(val) => handleSelectChange('period', val)}>
                                <SelectTrigger id="edit-period" disabled={isLoading}>
                                    <SelectValue placeholder="Définir la durée payée" />
                                </SelectTrigger>
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

                {payment?.payment_type === 'Ticket' && (
                    <>
                        {isAdminUser && (
                            <div className="space-y-2 border-l-2 border-emerald-500 pl-3 bg-slate-50/50 p-2 rounded">
                                <Label htmlFor="edit-agent_id">Filtrer par Agent</Label>
                                <Select value={formData.agent_id} onValueChange={(val) => handleSelectChange('agent_id', val)}>
                                    <SelectTrigger id="edit-agent_id" disabled={isLoading}>
                                        <SelectValue placeholder="Sélectionner l'agent ciblé" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agents.map(a => (
                                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2 border-l-2 border-amber-500 pl-3 bg-slate-50/50 p-2 rounded">
                            <Label htmlFor="edit-stock_history_id">Mouvement de Vente Associé (Réductions)</Label>
                            <Select
                                value={formData.stock_history_id}
                                onValueChange={(val) => handleSelectChange('stock_history_id', val)}
                                disabled={isLoading || (isAdminUser && !formData.agent_id)}
                            >
                                <SelectTrigger id="edit-stock_history_id">
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

                <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                        id="edit-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                    {errors.description && (
                        <p className="text-red-500 text-sm">{errors.description[0]}</p>
                    )}
                </div>

                <div className="flex gap-4 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Traitement...' : 'Sauvegarder'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default Edit