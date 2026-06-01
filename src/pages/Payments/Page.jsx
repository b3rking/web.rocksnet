"use client"

import { DataTable } from "#components/ui/DataTable"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import { useAuth } from "#hooks/useAuth"
import { Button } from "#components/ui/button"
import Create from "./Create" 
import Edit from "./Edit" 

const Page = () => {
    const [payments, setPayments] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Set page layout title
    useApp('Paiements')
    const user = useAuth()
    const userRole = user?.role?.name // Extracting role string to match backend logic

    const getPaymentData = async () => {
        try {
            const res = await api.get('/payments')
            const resolvedData = res.data.data || res.data.payments || res.data || []
            setPayments(resolvedData)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching payments:', err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cet historique de paiement ?')) return

        try {
            await api.delete(`/payments/${id}`)
            getPaymentData() 
        } catch (err) {
            console.error('Error deleting payment:', err)
            alert('Une erreur est survenue lors de la suppression.')
        }
    }

    useEffect(() => {
        getPaymentData()
    }, [])

    const columns = useMemo(() => [
        {
            id: "amount",
            header: "Montant",
            cell: ({ row }) => {
                const amount = row.original.amount
                const currency = row.original.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                if (amount === undefined || amount === null) return "-"

                return (
                    <span className="whitespace-nowrap font-semibold text-stone-900">
                        {Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5">{currencyStr}</span>
                        )}
                    </span>
                )
            }
        },
        {
            id: "payment_method",
            accessorKey: "payment_method",
            header: "Méthode",
            cell: ({ getValue }) => (
                <span className="capitalize text-stone-700 text-sm font-medium">
                    {getValue()?.toLowerCase() || "-"}
                </span>
            )
        },
        {
            id: "payment_type",
            accessorKey: "payment_type",
            header: "Type de Flux",
            cell: ({ getValue }) => (
                <span className="capitalize text-stone-600 text-sm">
                    {getValue()?.toLowerCase() || "-"}
                </span>
            )
        },
        {
            id: "target_entity",
            header: "Payez par",
            cell: ({ row }) => {
                const type = row.original.payment_type
                const agent = row.original.agent
                const invoice = row.original.invoice
                
                if (type === 'Subscription') {
                    return (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {/* Client #{invoice?.client_id || row.original.client_id || "-"} */}
                                { invoice?.client?.name || "-"}
                            </span>
                            {invoice?.period && (
                                <span className="text-xs text-muted-foreground italic">
                                    Période: {invoice.period}
                                </span>
                            )}
                        </div>
                    )
                }

                if (type === 'Ticket') {
                    return <span className="text-sm text-stone-600">{agent?.name || "Agent non spécifié"}</span>
                }

                return <span className="text-xs text-muted-foreground">—</span>
            }
        },
        {
            id: "saved_by",
            header: "Enregistré par",
            cell: ({ row }) => {
                const operator = row.original.saved_by_user || row.original.saved_by
                return <span className="text-sm">{operator?.name || "-"}</span>
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date de Transaction",
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-"
                return format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const rowData = row.original

                const canUpdate = ['admin', 'super agent'].includes(userRole)
                const canDelete = userRole === 'admin'

                if (!canUpdate && !canDelete) {
                    return <span className="text-xs text-muted-foreground/50">—</span>
                }

                return (
                    <div className="flex gap-2">
                        {canUpdate && (
                            <Edit
                                payment={rowData}
                                onPaymentUpdated={getPaymentData}
                            />
                        )}

                        {canDelete && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(rowData.id)}
                            >
                                Supprimer
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ], [userRole]) 

    return (
        <div>
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2>Gestion des Paiements Comptables</h2>
                <div className="flex flex-row">
                    <Create onPaymentCreated={getPaymentData} />
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">
                    Chargement du registre des paiements en cours...
                </div>
            ) : (
                <DataTable columns={columns} data={payments} />
            )}
        </div>
    )
}

export default Page