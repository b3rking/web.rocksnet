"use client"

import { useEffect, useState } from "react"
import { useApp } from "#hooks/useApp"
import api from "#lib/axios"
import { Link } from 'react-router'

// Components & UI Elements
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#components/ui/card"
import { Button } from "#components/ui/button"

// Icons
import { 
    IconUsers, 
    IconTicket, 
    IconReceipt2, 
    IconArrowUpRight,
    IconCoins,
    IconPlus
} from "@tabler/icons-react"

// Charts
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"

const Dashboard = () => {
    useApp('Tableau de bord')

    const [stats, setStats] = useState({
        totalClients: 0,
        activeClients: 0,
        totalSales: 0,
        availableStock: 0,
        chartData: [],
        recentPayments: []
    })
    const [isLoading, setIsLoading] = useState(true)

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true)
            const res = await api.get('/dashboard')
            
            // Extraction sécurisée des données de l'API
            const payload = res.data?.data || res.data || {}

            setStats({
                totalClients: payload.total_client || 0,
                activeClients: payload.total_client_actif || 0,
                totalSales: payload.total_sales || 0,
                availableStock: payload.stock || 0,
                chartData: payload.performance || [],
                recentPayments: payload.recent_payment || []
            })
        } catch (error) {
            console.error("Dashboard data fetching error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    return (
        <div className="space-y-6 p-1">
            {/* Top Operational Quick Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm text-muted-foreground">Bienvenue dans votre espace de gestion comptable et logistique.</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link to='/stocks'>
                    <Button size="sm" className="h-9 gap-1">
                        <IconPlus className="h-4 w-4" /> Attribution Ticket
                    </Button>
                    </Link>
                    <Link to='/payments'>
                    <Button size="sm" variant="outline" className="h-9 gap-1">
                        <IconReceipt2 className="h-4 w-4" /> Nouvelle Vente
                    </Button>
                    </Link>
                </div>
            </div>

            {/* Core KPI Blocks */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Totaux</CardTitle>
                        <div className="rounded-md bg-primary/10 p-2 text-primary">
                            <IconUsers className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            {isLoading ? "..." : stats.totalClients}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.activeClients} actifs actuellement
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Volume des Ventes</CardTitle>
                        <div className="rounded-md bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <IconCoins className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            {isLoading ? "..." : stats.totalSales}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Transactions validées</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stock Central</CardTitle>
                        <div className="rounded-md bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                            <IconTicket className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            {isLoading ? "..." : stats.availableStock}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tickets disponibles au total</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card opacity-50 cursor-not-allowed">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flux d'Activité</CardTitle>
                        <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <IconArrowUpRight className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">100%</div>
                        <p className="text-xs text-muted-foreground mt-1">Système opérationnel</p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Analytics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Visual Area Graphs */}
                <Card className="lg:col-span-4 border border-border bg-card">
                    <CardHeader>
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Analyse de Performance</CardTitle>
                            <CardDescription>Suivi combiné des encaissements abonnements et tickets</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 sm:p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            background: "var(--card)", 
                                            borderColor: "var(--border)",
                                            color: "var(--foreground)",
                                            borderRadius: "var(--radius-md)"
                                        }} 
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Ventes (Sales)" />
                                    <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenus (Revenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Real-time Transaction Ledger Snapshot */}
                <Card className="lg:col-span-3 border border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Flux Comptables Récents</CardTitle>
                        <CardDescription>Les dernières transactions financières enregistrées</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-2 animate-pulse">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-12 bg-muted/50 rounded-md" />
                                    ))}
                                </div>
                            ) : stats.recentPayments.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">Aucune transaction récente trouvée.</p>
                            ) : (
                                stats.recentPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none max-w-[180px] truncate">
                                                {payment.description || `Paiement #${payment.id.substring(0, 8)}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {payment.payment_method?.toLowerCase()} — {payment.payment_type}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                                {Number(payment.amount).toLocaleString('fr-FR')}
                                                <span className="text-xs text-muted-foreground font-normal ml-0.5">
                                                    &nbsp;{payment.currency_id === 2 ? "$" : "FC"}
                                                </span>
                                            </span>
                                            <IconArrowUpRight className="h-4 w-4 text-muted-foreground/60" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard