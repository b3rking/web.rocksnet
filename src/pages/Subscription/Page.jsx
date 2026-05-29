"use client"

import { DataTable } from "#components/ui/DataTable"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import { useAuth } from "#hooks/useAuth"
import Create from "./Create"
import Edit from "./Edit" // Imported to handle update triggers
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
            getSubscriptionData() // Refresh list dynamically on success
        } catch (err) {
            console.error('Error deleting subscription:', err)
            alert('Une erreur est survenue lors de la suppression.')
        }
    }

    useEffect(() => {
        getSubscriptionData()
    }, [])

    // useMemo prevents component identity recreation on parent form typing actions
    const columns = useMemo(() => [
        {
            id: "bandwidth",
            accessorKey: "bandwidth",
            header: "Bande passante / Profil",
            cell: ({ getValue }) => {
                return <span className="font-medium text-stone-900">{getValue() || "-"}</span>
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
                    <span className="whitespace-nowrap font-medium">
                        {Number(amount).toLocaleString('fr-FR')}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5">{currencyStr}</span>
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
                return format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const rowData = row.original

                // Restrict modification actions to authorized roles (e.g., admin)
                if (user?.role_id >= 2) {
                    return <span className="text-xs text-muted-foreground/50">—</span>
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
    ], [user]) // Re-run calculations ONLY if the authenticated identity context shifts

    return (
        <div>
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2>Gestion des Forfaits d'Abonnement</h2>
                <div className="flex flex-row">
                    {/* Access protection check matching system rule levels */}
                    {user?.role_id < 2 && <Create onSubscriptionCreated={getSubscriptionData} />}
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">
                    Chargement des abonnements en cours...
                </div>
            ) : (
                <DataTable columns={columns} data={subscriptions} />
            )}
        </div>
    )
}

export default Page