"use client"

import { DataTable } from "#components/ui/DataTable"
import api from "#lib/axios"
import { useEffect, useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { useApp } from "#hooks/useApp"
import { useAuth } from "#hooks/useAuth"

const Page = () => {
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Setting page layout title
    useApp('Historique')
    const user = useAuth()
    
    const getHistoryData = async () => {
        try {
            const res = await api.get('/stock/history')
            const resolvedData = Array.isArray(res.data) ? res.data : res.data.history || res.data.data || []
            setHistory(resolvedData)
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.error('Error fetching stock history:', err)
        }
    }

    useEffect(() => {
        getHistoryData()
    }, [])

    const columns = useMemo(() => [
        {
            id: "agent",
            header: "Agent / Utilisateur",
            cell: ({ row }) => {
                const agentObj = row.original.agent
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                            {agentObj?.name || "Inconnu"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {agentObj?.email || "-"}
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
            id: "action",
            accessorKey: "action",
            header: "Opération",
            cell: ({ getValue }) => {
                const action = (getValue() || "").toLowerCase()
                const isReduction = action === 'reduction' || action === 'sale' || action === 'vente'
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        isReduction 
                            ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200/20" 
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/20"
                    }`}>
                        {isReduction ? "Vente" : "Attribution"}
                    </span>
                )
            }
        },
        {
            id: "quantity",
            accessorKey: "quantity",
            header: "Quantité",
            cell: ({ row, getValue }) => {
                const qty = getValue()
                const action = (row.original.action || "").toLowerCase()
                const isReduction = action === 'reduction' || action === 'sale' || action === 'vente'

                return (
                    <span className={`font-bold transition-colors ${
                        isReduction 
                            ? "text-red-600 dark:text-red-400" 
                            : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                        {isReduction ? "-" : "+"}{qty} {qty > 1 ? "tickets" : "ticket"}
                    </span>
                )
            }
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Date de l'opération",
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
    ], [user])

    return (
        <div className="text-foreground bg-background transition-colors duration-200">
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2 className="text-xl tracking-tight text-stone-900 dark:text-stone-50">
                    Historique des mouvements du stock
                </h2>
                <div className="flex flex-row" />
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground/70 animate-pulse py-4">
                    Chargement de l'historique en cours...
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <DataTable columns={columns} data={history} />
                </div>
            )}
        </div>
    )
}

export default Page