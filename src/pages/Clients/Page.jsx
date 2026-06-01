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
    const [clients, setClients] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Set page layout title
    useApp('Clients')
    const user = useAuth()
    const userRole = user?.role?.name // Extracting string role to match Laravel logic

    const getClientData = async () => {
        try {
            const res = await api.get('/clients')
            const resolvedData = res.data.data || res.data.clients || res.data || []
            setClients(resolvedData)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching clients:', err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer ce profil client ?')) return

        try {
            await api.delete(`/clients/${id}`)
            getClientData() // Refresh listing dynamically on execution success
        } catch (err) {
            console.error('Error deleting client:', err)
            alert('Une erreur est survenue lors de la suppression.')
        }
    }

    useEffect(() => {
        getClientData()
    }, [])

    // Prevent component recreation across global re-renders
    const columns = useMemo(() => [
        {
            id: "name",
            accessorKey: "name",
            header: "Nom Complet",
            cell: ({ getValue }) => (
                <span className="font-semibold text-stone-900">{getValue() || "-"}</span>
            )
        },
        {
            id: "phone",
            accessorKey: "phone",
            header: "Téléphone",
            cell: ({ getValue }) => <span className="text-sm text-stone-700">{getValue() || "-"}</span>
        },
        {
            id: "email",
            accessorKey: "email",
            header: "Email",
            cell: ({ getValue }) => <span className="text-sm text-stone-700">{getValue() || "-"}</span>
        },
        {
            id: "adress",
            accessorKey: "adress",
            header: "Adresse",
            cell: ({ getValue }) => <span className="text-sm text-stone-600 line-clamp-1">{getValue() || "-"}</span>
        },
        {
            id: "subscription",
            header: "Forfait Souscrit",
            cell: ({ row }) => {
                const subscription = row.original.subscription
                if (!subscription) return <span className="text-muted-foreground text-xs">Aucun forfait</span>

                const price = subscription.price
                const currency = subscription.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-stone-800">
                            {subscription.bandwidth || "Vitesse inconnue"}
                        </span>
                        {price !== undefined && price !== null && (
                            <span className="text-xs text-muted-foreground">
                                {Number(price).toLocaleString('fr-FR')} {currencyStr}
                            </span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "etat",
            accessorKey: "etat",
            header: "État",
            cell: ({ getValue }) => {
                const status = getValue()
                if (!status) return "-"

                return (
                    <span className="capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                        {status.toLowerCase()}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date d'Inscription",
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-"
                return format(parseISO(rawDate), "dd/MM/yyyy", { locale: fr })
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
                                client={rowData}
                                onClientUpdated={getClientData}
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
                <h2>Gestion des Profils Clients</h2>
                <div className="flex flex-row">
                    {/* Explicitly authorized roles can register new clients */}
                    {/* {['admin', 'super agent'].includes(userRole) && ( */}
                        <Create onClientCreated={getClientData} />
                    {/* )} */}
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">
                    Chargement de la liste des clients en cours...
                </div>
            ) : (
                <DataTable columns={columns} data={clients} />
            )}
        </div>
    )
}

export default Page