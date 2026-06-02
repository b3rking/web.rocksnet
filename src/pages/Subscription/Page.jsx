"use client"

import { DataTable } from "#components/ui/DataTable"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import { useAuth } from "#hooks/useAuth"
import Create from "./Create"
import Edit from "./Edit" 
import { Button } from "#components/ui/button"

const Page = () => {
    const [subscriptions, setSubscriptions] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Setting page layout title
    useApp('Abonnements')
    const user = useAuth()

    const getSubscriptionData = async () => {
        try {
            const res = await api.get('/subscriptions')
            const resolvedData = Array.isArray(res.data)
                ? res.data
                : res.data.subscriptions?.data || res.data.subscriptions || res.data.data || []

            setSubscriptions(resolvedData)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching subscriptions:', err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cet abonnement ?')) return

        try {
            await api.delete(`/subscriptions/${id}`)
            getSubscriptionData() 
        } catch (err) {
            console.error('Error deleting subscription:', err)
            alert('Une erreur est survenue lors de la suppression.')
        }
    }

    useEffect(() => {
        getSubscriptionData()
    }, [])

    const columns = useMemo(() => [
        {
            id: "bandwidth",
            accessorKey: "bandwidth",
            header: "Bande passante / Profil",
            cell: ({ getValue }) => {
                return (
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                        {getValue() || "-"}
                    </span>
                )
            }
        },
        {
            id: "price",
            header: "Tarif",
            cell: ({ row }) => {
                const amount = row.original.price
                const currency = row.original.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                if (amount === undefined || amount === null) return "-"

                return (
                    <span className="whitespace-nowrap font-semibold text-stone-900 dark:text-stone-100">
                        {Number(amount).toLocaleString('fr-FR')}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5 font-normal">
                                {currencyStr}
                            </span>
                        )}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date de création",
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-"
                return (
                    <span className="text-stone-600 dark:text-stone-400 text-sm">
                        {format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const rowData = row.original

                if (user?.role_id >= 2) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        <Edit
                            subscription={rowData}
                            onSubscriptionUpdated={getSubscriptionData}
                        />

                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(rowData.id)}
                        >
                            Supprimer
                        </Button>
                    </div>
                )
            },
        },
    ], [user]) 

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion des Forfaits d'Abonnement
                </h2>
                <div className="flex flex-row">
                    {user?.role_id < 2 && <Create onSubscriptionCreated={getSubscriptionData} />}
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground/70 animate-pulse py-4">
                    Chargement des abonnements en cours...
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable columns={columns} data={subscriptions} />
                </div>
            )}
        </div>
    )
}

export default Page