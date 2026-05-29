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

    // useMemo prevents component identity recreation on parent form typing actions
    const columns = useMemo(() => [
        {
            id: "agent",
            header: "Agent / Utilisateur",
            cell: ({ row }) => {
                const agentObj = row.original.agent
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{agentObj?.name || "Inconnu"}</span>
                        <span className="text-xs text-muted-foreground">{agentObj?.email || "-"}</span>
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
            id: "action",
            accessorKey: "action",
            header: "Opération",
            cell: ({ getValue }) => {
                const action = (getValue() || "").toLowerCase()
                
                // Maps directly to your backend ActionEnum values
                const isReduction = action === 'reduction' || action === 'sale' || action === 'vente'
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isReduction 
                            ? "bg-red-100 text-red-800"          // Red badge for sales/reductions
                            : "bg-emerald-100 text-emerald-800"  // Green badge for attributions/recharges
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
                const isReduction = action === 'reduction'

                return (
                    <span className={`font-bold ${isReduction ? "text-red-600" : "text-emerald-600"}`}>
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
                return format(parseISO(rawDate), "dd/MM/yyyy HH:mm", { locale: fr })
            },
        },
    ], [user]) // Re-run calculations ONLY if the authenticated identity context shifts

    return (
        <div>
            <div className="flex flex-row items-center justify-between font-bold mb-6">
                <h2>Historique des mouvements du stock</h2>
                <div className="flex flex-row">
                    {/* Keeps alignment balanced with your stock dashboard layout */}
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">
                    Chargement de l'historique en cours...
                </div>
            ) : (
                <DataTable columns={columns} data={history} />
            )}
        </div>
    )
}

export default Page