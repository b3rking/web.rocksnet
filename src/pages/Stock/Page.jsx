"use client"

import { DataTable } from "#components/ui/DataTable"
import { Button } from "#components/ui/button"
import api from "#lib/axios"
import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
// Assuming your creation/attribution component handles the POST /api/stock/attribute modal
// import Create from "./Create" 

const Page = () => {
    const [stocks, setStocks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Setting page layout title
    useApp('Stock')

    const columns = [
        {
            id: "agent",
            header: "Agent / Utilisateur",
            cell: ({ row }) => {
                const user = row.original.user
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{user?.name || "Inconnu"}</span>
                        <span className="text-xs text-muted-foreground">{user?.email || "-"}</span>
                    </div>
                )
            }
        },
        {
            id: "profil_name",
            header: "Profil Technique",
            cell: ({ row }) => {
                return <span className="font-medium">{row.original.profil?.name || "-"}</span>
            }
        },
        {
            id: "profil_duration",
            header: "Durée du Profil",
            cell: ({ row }) => {
                return <span>{row.original.profil?.duration || "-"}</span>
            }
        },
        {
            id: "profil_price",
            header: "Prix unitaire",
            cell: ({ row }) => {
                const amount = row.original.profil?.price
                const currency = row.original.profil?.currency
                const currencyStr = currency ? (currency.symbol || currency.code || currency.name) : ""

                if (amount === undefined || amount === null) return "-"

                return (
                    <span className="whitespace-nowrap">
                        {Number(amount).toLocaleString('fr-FR')}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5">{currencyStr}</span>
                        )}
                    </span>
                )
            }
        },
        {
            accessorKey: "quantity",
            header: "Quantité en Stock",
            cell: ({ getValue }) => {
                const qty = getValue()
                return (
                    <span className={`font-bold ${qty <= 5 ? "text-red-600" : "text-emerald-600"}`}>
                        {qty} {qty > 1 ? "tickets" : "ticket"}
                    </span>
                )
            }
        },
        {
            accessorKey: "updated_at",
            header: "Dernière Mise à jour",
            cell: ({ getValue }) => {
                const rawDate = getValue()
                if (!rawDate) return "-"
                return format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    {/* Placeholder action matching your endpoint route for selling or registering a sale */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            // Logic or state trigger to open your POST /api/stock/sale modal
                            console.log("Enregistrer une vente pour:", row.original)
                        }}
                    >
                        Vendre
                    </Button>
                </div>
            ),
        },
    ]

    const getStockData = async () => {
        try {
            // GET http://localhost:8000/api/stock
            const res = await api.get('/stock')
            // Adapts logic seamlessly if backend encapsulates array inside wrapper objects
            const resolvedData = Array.isArray(res.data) ? res.data : res.data.stock || res.data.data || []
            setStocks(resolvedData)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching stock:', err)
        }
    }

    useEffect(() => {
        getStockData()
    }, [])

    const handleStockUpdated = () => {
        getStockData()
    }

    return (
        <div>
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2>Gestion du stock des agents</h2>
                {/* CreateStock element to target the POST /api/stock/attribute endpoint */}
                {/* <CreateStock onStockAssigned={handleStockUpdated} /> */}
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">
                    Chargement du stock en cours...
                </div>
            ) : (
                <DataTable columns={columns} data={stocks} />
            )}
        </div>
    )
}

export default Page