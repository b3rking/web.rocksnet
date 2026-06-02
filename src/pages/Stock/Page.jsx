"use client"

import { DataTable } from "#components/ui/DataTable"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import CreateStock from "./CreateStock"
import { useAuth } from "#hooks/useAuth"
import SaleStock from "./SaleStock"

const Page = () => {
    const [stocks, setStocks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Setting page layout title
    useApp('Stock')
    const user = useAuth()
    
    const getStockData = async () => {
        try {
            const res = await api.get('/stock')
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

    const columns = useMemo(() => [
        {
            id: "agent",
            header: "Agent / Utilisateur",
            cell: ({ row }) => {
                const userObj = row.original.user
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                            {userObj?.name || "Inconnu"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {userObj?.email || "-"}
                        </span>
                    </div>
                )
            }
        },
        {
            id: "profil_name",
            header: "Profil Technique",
            cell: ({ row }) => {
                return (
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                        {row.original.profil?.name || "-"}
                    </span>
                )
            }
        },
        {
            id: "profil_duration",
            header: "Durée du Profil",
            cell: ({ row }) => {
                return (
                    <span className="text-stone-700 dark:text-stone-300">
                        {row.original.profil?.duration || "-"}
                    </span>
                )
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
                    <span className="whitespace-nowrap font-semibold text-stone-900 dark:text-stone-100">
                        {Number(amount).toLocaleString('fr-FR')}{" "}
                        {currencyStr && (
                            <span className="text-muted-foreground text-xs ml-0.5 font-normal">{currencyStr}</span>
                        )}
                    </span>
                )
            }
        },
        {
            id: "quantity",
            accessorKey: "quantity",
            header: "Quantité en Stock",
            cell: ({ getValue }) => {
                const qty = getValue()
                return (
                    <span className={`font-bold transition-colors ${
                        qty <= 5 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                        {qty} {qty > 1 ? "tickets" : "ticket"}
                    </span>
                )
            }
        },
        {
            id: "updated_at",
            accessorKey: "updated_at",
            header: "Dernière Mise à jour",
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
                const canSell = user?.role_id > 1

                if (!canSell) {
                    return <span className="text-xs text-muted-foreground/40">—</span>
                }

                return (
                    <div className="flex gap-2">
                        <SaleStock 
                            profil={rowData} 
                            onSaleRecorded={getStockData} 
                        />
                    </div>
                )
            },
        },
    ], [user])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Gestion du stock des agents
                </h2>
                <div className="flex flex-row">
                    {user?.role_id < 2 && <CreateStock onStockAssigned={getStockData} />}
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground/70 animate-pulse py-4">
                    Chargement du stock en cours...
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable columns={columns} data={stocks} />
                </div>
            )}
        </div>
    )
}

export default Page