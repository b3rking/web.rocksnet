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

    const [formData, setFormData] = useState({
        amount: '',
        currency_id: '',
        agent_id: '',
        payment_type: '',
        payment_method: '',
        description: '',
        client_id: '',
        stock_history_id: ''
    })

    // General relationship hydrator
    const fetchBaseRelations = async () => {
        try {
            const [currencyRes, usersRes] = await Promise.all([
                api.get('/currencies'),
                api.get('/users') 
            ])
            const currencyData = currencyRes.data.data || currencyRes.data || []
            const usersData = usersRes.data.data || usersRes.data || []

            setCurrencies(currencyData)
            setAgents(usersData)

            if (currencyData.length > 0 && !formData.currency_id) {
                setFormData(prev => ({ ...prev, currency_id: String(currencyData[0].id) }))
            }
        } catch (err) {
            console.error('Error fetching baseline configurations:', err)
        }
    }

    // Dynamic conditional relationship hydrator
    const fetchConditionalRelations = async (type) => {
        try {
            if (type === 'Subscription') { // Case matching your JSON payload value exactly
                const res = await api.get('/clients')
                setClients(res.data.data || res.data || [])
            } else if (type === 'Ticket') {
                // Fetch movements filtered to stock reductions (sales)
                const res = await api.get('/stock-histories?type=reduction')
                setStockMovements(res.data.data || res.data || [])
            }
        } catch (err) {
            console.error(`Error hydrating conditionally for ${type}:`, err)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchBaseRelations()
        }
    }, [isOpen])

    useEffect(() => {
        if (formData.payment_type) {
            fetchConditionalRelations(formData.payment_type)
        }
    }, [formData.payment_type])

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

        // Trace user payload structure to catch alternative ID paths inside your hook context object
        const activeUserId = user?.id || user?.user?.id

        const payload = {
            amount: Number(formData.amount).toFixed(2),
            currency_id: Number(formData.currency_id),
            saved_by: activeUserId, 
            payment_type: formData.payment_type,
            payment_method: formData.payment_method,
            description: formData.description,
            ...(formData.agent_id && { agent_id: Number(formData.agent_id) }),
            ...(formData.payment_type === 'Subscription' && formData.client_id && { client_id: Number(formData.client_id) }),
            ...(formData.payment_type === 'Ticket' && formData.stock_history_id && { stock_history_id: formData.stock_history_id })
        }

        try {
            const response = await api.post('/payments', payload)
            setFormData({
                amount: '', currency_id: formData.currency_id, agent_id: '',
                payment_type: '', payment_method: '', description: '',
                client_id: '', stock_history_id: ''
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
                                <SelectItem value="Transfert">Transfert</SelectItem>
                                <SelectItem value="Espèces">Espèces</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* CONDITIONAL SUB-FORMS */}
                {formData.payment_type === 'Subscription' && (
                    <div className="space-y-2 border-l-2 border-blue-500 pl-3 bg-slate-50/50 p-2 rounded">
                        <Label htmlFor="client_id">Sélectionner le Client</Label>
                        <Select value={formData.client_id} onValueChange={(val) => handleSelectChange('client_id', val)}>
                            <SelectTrigger id="client_id" disabled={isLoading}><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                            <SelectContent>
                                {clients.map(cl => <SelectItem key={cl.id} value={String(cl.id)}>{cl.name} ({cl.email || 'Pas de mail'})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {errors.client_id && <p className="text-red-500 text-sm">{errors.client_id[0]}</p>}
                    </div>
                )}

                {formData.payment_type === 'Ticket' && (
                    <div className="space-y-2 border-l-2 border-amber-500 pl-3 bg-slate-50/50 p-2 rounded">
                        <Label htmlFor="stock_history_id">Mouvement de Vente Associé (Réductions)</Label>
                        <Select value={formData.stock_history_id} onValueChange={(val) => handleSelectChange('stock_history_id', val)}>
                            <SelectTrigger id="stock_history_id" disabled={isLoading}><SelectValue placeholder="Sélectionner le mouvement de stock" /></SelectTrigger>
                            <SelectContent>
                                {stockMovements.map(sm => (
                                    <SelectItem key={sm.id} value={String(sm.id)}>
                                        {sm.description || `Mouvement du ${new Date(sm.created_at).toLocaleDateString()}`} [-{sm.quantity || 0}]
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.stock_history_id && <p className="text-red-500 text-sm">{errors.stock_history_id[0]}</p>}
                    </div>
                )}

                {/* Optional Agent Assignment */}
                <div className="space-y-2">
                    <Label htmlFor="agent_id">Agent Assigné (Optionnel)</Label>
                    <Select value={formData.agent_id} onValueChange={(val) => handleSelectChange('agent_id', val)}>
                        <SelectTrigger id="agent_id" disabled={isLoading}><SelectValue placeholder="Aucun" /></SelectTrigger>
                        <SelectContent>
                            {agents.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
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






















































// "use client"

// import { useState, useEffect } from "react"
// import { Modal } from "#components/ui/Modal"
// import { Button } from "#components/ui/button"
// import { Input } from "#components/ui/input"
// import { Label } from "#components/ui/label"
// import { Textarea } from "#components/ui/textarea"
// import {
//     DialogHeader,
//     DialogTitle,
//     DialogDescription
// } from "#components/ui/dialog"
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "#components/ui/select"
// import api from "#lib/axios"
// import { useAuth } from "#hooks/useAuth"

// const Create = ({ onPaymentCreated }) => {
//     const [isOpen, setIsOpen] = useState(false)
//     const [currencies, setCurrencies] = useState([])
//     const [agents, setAgents] = useState([])
//     const [errors, setErrors] = useState({})
//     const [isLoading, setIsLoading] = useState(false)
    
//     const user = useAuth()

//     const [formData, setFormData] = useState({
//         amount: '',
//         currency_id: '',
//         agent_id: '',
//         payment_type: '',
//         payment_method: '',
//         description: '',
//         invoice_id: '',
//         stock_history_id: ''
//     })

//     // Fetch dynamic supporting dropdown relationships
//     const fetchRelations = async () => {
//         try {
//             const [currencyRes, usersRes] = await Promise.all([
//                 api.get('/currencies'),
//                 api.get('list/agents') // Assumed endpoint for populating assignable agents
//             ])

//             const currencyData = Array.isArray(currencyRes.data) ? currencyRes.data : currencyRes.data.currencies || currencyRes.data.data || []
//             const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || usersRes.data.data || []

//             setCurrencies(currencyData)
//             // Filter users on client side if necessary, or assign full listing
//             setAgents(usersData)

//             // Auto-select fallback currency if none has been locked down yet
//             if (currencyData.length > 0 && !formData.currency_id) {
//                 setFormData(prev => ({
//                     ...prev,
//                     currency_id: String(currencyData[0].id)
//                 }))
//             }
//         } catch (err) {
//             console.error('Error hydrating payment relations:', err)
//         }
//     }

//     useEffect(() => {
//         if (isOpen) {
//             fetchRelations()
//         }
//     }, [isOpen])

//     const handleChange = (e) => {
//         const { name, value } = e.target
//         setFormData(prev => ({ ...prev, [name]: value }))
//         if (errors[name]) {
//             setErrors(prev => ({ ...prev, [name]: '' }))
//         }
//     }

//     const handleSelectChange = (field, value) => {
//         setFormData(prev => ({ ...prev, [field]: value }))
//         if (errors[field]) {
//             setErrors(prev => ({ ...prev, [field]: '' }))
//         }
//     }

//     const handleSubmit = async (e) => {
//         e.preventDefault()
//         setIsLoading(true)
//         setErrors({})

//         // Construct standard payload matching PaymentController validation demands
//         const payload = {
//             amount: Number(formData.amount).toFixed(2),
//             currency_id: Number(formData.currency_id),
//             saved_by: user?.id, // Injected securely via authentication context rules
//             payment_type: formData.payment_type,
//             payment_method: formData.payment_method,
//             ...(formData.agent_id && { agent_id: Number(formData.agent_id) }),
//             ...(formData.description && { description: formData.description }),
//             ...(formData.invoice_id && { invoice_id: formData.invoice_id }),
//             ...(formData.stock_history_id && { stock_history_id: formData.stock_history_id }),
//         }

//         try {
//             const response = await api.post('/payments', payload)

//             // Reset inputs gracefully while preserving active layout structural constants
//             setFormData({
//                 amount: '',
//                 currency_id: formData.currency_id,
//                 agent_id: '',
//                 payment_type: '',
//                 payment_method: '',
//                 description: '',
//                 invoice_id: '',
//                 stock_history_id: ''
//             })

//             setIsOpen(false)
//             if (onPaymentCreated) {
//                 onPaymentCreated(response.data)
//             }
//         } catch (err) {
//             if (err.response?.data?.errors) {
//                 setErrors(err.response.data.errors)
//             } else if (err.response?.data?.message) {
//                 setErrors({ general: err.response.data.message })
//             } else {
//                 setErrors({ general: "Une erreur est survenue lors de l'enregistrement du paiement" })
//             }
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     return (
//         <Modal
//             trigger={<Button>Enregistrer un paiement</Button>}
//             isOpen={isOpen}
//             onOpenChange={setIsOpen}
//         >
//             <DialogHeader>
//                 <DialogTitle>Enregistrer un nouveau paiement</DialogTitle>
//                 <DialogDescription>
//                     Remplissez les détails financiers pour générer une transaction dans le grand livre comptable.
//                 </DialogDescription>
//             </DialogHeader>

//             <form onSubmit={handleSubmit} className="space-y-4 mt-4">
//                 {errors.general && (
//                     <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
//                         {errors.general}
//                     </div>
//                 )}

//                 {/* Amount and Currency */}
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                         <Label htmlFor="amount">Montant</Label>
//                         <Input
//                             id="amount"
//                             name="amount"
//                             type="number"
//                             step="0.01"
//                             placeholder="0.00"
//                             value={formData.amount}
//                             onChange={handleChange}
//                             required
//                             disabled={isLoading}
//                         />
//                         {errors.amount && (
//                             <p className="text-red-500 text-sm">{errors.amount[0]}</p>
//                         )}
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="currency_id">Devise</Label>
//                         <Select 
//                             value={formData.currency_id} 
//                             onValueChange={(val) => handleSelectChange('currency_id', val)}
//                             modal={true}
//                         >
//                             <SelectTrigger id="currency_id" disabled={isLoading}>
//                                 <SelectValue placeholder="Sélectionnez" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {currencies.map(currency => (
//                                     <SelectItem key={currency.id} value={String(currency.id)}>
//                                         {currency.name} ({currency.symbol || currency.code})
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         {errors.currency_id && (
//                             <p className="text-red-500 text-sm">{errors.currency_id[0]}</p>
//                         )}
//                     </div>
//                 </div>

//                 {/* Payment Type and Method */}
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                         <Label htmlFor="payment_type">Type de Flux</Label>
//                         <Select 
//                             value={formData.payment_type} 
//                             onValueChange={(val) => handleSelectChange('payment_type', val)}
//                             modal={true}
//                         >
//                             <SelectTrigger id="payment_type" disabled={isLoading}>
//                                 <SelectValue placeholder="Choisir le type" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {/* Maps explicitly to your backend PaymentTypeEnum values */}
//                                 <SelectItem value="Subscription">Abonnements</SelectItem>
//                                 <SelectItem value="Ticket">Vente des Tickets</SelectItem>
//                             </SelectContent>
//                         </Select>
//                         {errors.payment_type && (
//                             <p className="text-red-500 text-sm">{errors.payment_type[0]}</p>
//                         )}
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="payment_method">Méthode de Paiement</Label>
//                         <Select 
//                             value={formData.payment_method} 
//                             onValueChange={(val) => handleSelectChange('payment_method', val)}
//                             modal={true}
//                         >
//                             <SelectTrigger id="payment_method" disabled={isLoading}>
//                                 <SelectValue placeholder="Choisir la méthode" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="Cash">Espèces (Cash)</SelectItem>
//                                 <SelectItem value="Transfert">Virement Bancaire</SelectItem>
//                                 <SelectItem value="Cheque">Chèque</SelectItem>
//                             </SelectContent>
//                         </Select>
//                         {errors.payment_method && (
//                             <p className="text-red-500 text-sm">{errors.payment_method[0]}</p>
//                         )}
//                     </div>
//                 </div>

//                 {/* Optional Agent Assignment */}
//                 <div className="space-y-2">
//                     <Label htmlFor="agent_id">Agent Responsable (Optionnel)</Label>
//                     <Select 
//                         value={formData.agent_id} 
//                         onValueChange={(val) => handleSelectChange('agent_id', val)}
//                         modal={true}
//                     >
//                         <SelectTrigger id="agent_id" disabled={isLoading}>
//                             <SelectValue placeholder="Sélectionner un agent assigné" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {agents.map(agent => (
//                                 <SelectItem key={agent.id} value={String(agent.id)}>
//                                     {agent.name} ({agent.email})
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                     {errors.agent_id && (
//                         <p className="text-red-500 text-sm">{errors.agent_id[0]}</p>
//                     )}
//                 </div>

//                 {/* Optional Narrative Description */}
//                 <div className="space-y-2">
//                     <Label htmlFor="description">Description (Min. 10 caractères)</Label>
//                     <Textarea
//                         id="description"
//                         name="description"
//                         placeholder="Fournissez des détails clairs sur le contexte de cette transaction financière..."
//                         value={formData.description}
//                         onChange={handleChange}
//                         disabled={isLoading}
//                         className="min-h-[80px]"
//                     />
//                     {errors.description && (
//                         <p className="text-red-500 text-sm">{errors.description[0]}</p>
//                     )}
//                 </div>

//                 {/* Footer Action Elements */}
//                 <div className="flex gap-4 justify-end mt-6">
//                     <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
//                         Annuler
//                     </Button>
//                     <Button type="submit" disabled={isLoading}>
//                         {isLoading ? 'Enregistrement...' : "Confirmer le paiement"}
//                     </Button>
//                 </div>
//             </form>
//         </Modal>
//     )
// }

// export default Create