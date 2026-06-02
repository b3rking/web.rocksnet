"use client"

import { useEffect, useState } from "react"
import { useApp } from "#hooks/useApp"
import api from "#lib/axios"

// Components & UI Elements
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#components/ui/card"
import { Button } from "#components/ui/button"

// Icons
import { 
    IconUsers, 
    IconTicket, 
    IconReceipt2, 
    IconCreditCard, 
    IconTrendingUp,
    IconArrowUpRight,
    IconCoins,
    IconPlus
} from "@tabler/icons-react"

// Charts (Using your native recharts dep)
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts"

const Dashboard = () => {
    useApp('Tableau de bord')

    const [stats, setStats] = useState({
        totalClients: 0,
        activeSubscriptions: 0,
        availableStock: 0,
        recentRevenueCDF: 0,
        recentPayments: [],
        chartData: []
    })
    const [isLoading, setIsLoading] = useState(true)

    // Parallel processing across explicit backend points
    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true)
            const [clientsRes, paymentsRes, stockRes, subsRes] = await Promise.all([
                api.get('/clients').catch(() => ({ data: [] })),
                api.get('/payments').catch(() => ({ data: [] })),
                api.get('/stock').catch(() => ({ data: { total: 0 } })),
                api.get('/subscriptions').catch(() => ({ data: [] }))
            ])

            // Safely resolve nested Eloquent layouts or resource wrappers
            const clientCount = clientsRes.data?.data?.length || clientsRes.data?.length || 0
            const rawPayments = paymentsRes.data?.data || paymentsRes.data || []
            const activeSubs = subsRes.data?.data?.length || subsRes.data?.length || 0
            
            // Format data variables for graphs
            const mockChartData = [
                { name: "Jan", sales: 4000, revenue: 2400 },
                { name: "Fév", sales: 3000, revenue: 1398 },
                { name: "Mar", sales: 2000, revenue: 9800 },
                { name: "Avr", sales: 2780, revenue: 3908 },
                { name: "Mai", sales: 1890, revenue: 4800 },
                { name: "Juin", sales: 2390, revenue: 3800 },
            ]

            setStats({
                totalClients: clientCount,
                activeSubscriptions: activeSubs,
                availableStock: stockRes.data?.total || 0,
                recentRevenueCDF: rawPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                recentPayments: rawPayments.slice(0, 5),
                chartData: mockChartData
            })
        } catch (error) {
            console.error("Dashboard calculation error:", error)
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
                    <Button size="sm" className="h-9 gap-1">
                        <IconPlus className="h-4 w-4" /> Attribution Ticket
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 gap-1">
                        <IconReceipt2 className="h-4 w-4" /> Nouvelle Vente
                    </Button>
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
                        <p className="text-xs text-muted-foreground mt-1">Enregistrés sur la plateforme</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                        <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <IconCreditCard className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            {isLoading ? "..." : stats.activeSubscriptions}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Flux récurrents valides</p>
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
                            {isLoading ? "..." : `${stats.recentRevenueCDF.toLocaleString('fr-FR')} FC`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cumulé sur la période courante</p>
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
                        <p className="text-xs text-muted-foreground mt-1">Tickets disponibles pour attribution</p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Analytics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Visual Area Graphs */}
                <Card className="lg:col-span-4 border border-border bg-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">Analyse de Performance</CardTitle>
                                <CardDescription>Suivi combiné des encaissements abonnements et tickets</CardDescription>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                <IconTrendingUp className="h-4 w-4" /> +12.4%
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 sm:p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
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
                                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenus" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Real-time Transaction Ledger Snapshot */}
                <Card className="lg:col-span-3 border border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Flux Comptables Récents</CardTitle>
                        <CardDescription>Les 5 dernières transactions financières enregistrées</CardDescription>
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
                                                {payment.description || `Paiement #${payment.id.substring(0,8)}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {payment.payment_method?.toLowerCase()} — {payment.payment_type}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold whitespace-nowrap">
                                                {Number(payment.amount).toLocaleString('fr-FR')} {payment.currency?.symbol || "FC"}
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