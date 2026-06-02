"use client"

import {
    IconDotsVertical,
    IconLogout,
} from "@tabler/icons-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useDispatch, useSelector } from "react-redux"
import { Navigate } from "react-router"
import { logout } from "@/features/auth/authSlice"
import { useAuth } from "#hooks/useAuth"

export function NavUser() {
    const { isMobile } = useSidebar()
    const auth = useSelector((store) => store.auth)
    const user = useAuth()
    const dispatch = useDispatch()

    if (!auth.is_auth) {
        return <Navigate to="/login" replace />
    }

    const handleLogout = (e) => {
        e.preventDefault()
        dispatch(logout())
    }

    // Extraction du nom du rôle (ajuste selon ta structure, ex: user?.role?.name)
    const userRole = user?.role?.name || user?.role || ""

    // Génération dynamique des initiales pour le Fallback de l'avatar
    const getInitials = (name) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    // Style conditionnel ou badge pour le rôle pour matcher l'esthétique premium
    const getRoleBadgeStyle = (role) => {
        const r = role?.toLowerCase()
        if (r === 'admin') return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        if (r === 'super agent') return "bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20"
        return "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg grayscale">
                                <AvatarImage src={user?.avatar} alt={user?.name} />
                                <AvatarFallback className="rounded-lg">
                                    {getInitials(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold text-stone-900 dark:text-stone-100">
                                    {user?.name}
                                </span>
                                {userRole && (
                                    <span className="truncate text-xs font-medium capitalize text-stone-500 dark:text-stone-400">
                                        {userRole.toLowerCase()}
                                    </span>
                                )}
                            </div>
                            <IconDotsVertical className="ml-auto size-4 text-stone-400" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                                <Avatar className="h-9 w-9 rounded-lg">
                                    <AvatarImage src={user?.avatar} alt={user?.name} />
                                    <AvatarFallback className="rounded-lg">
                                        {getInitials(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate font-semibold text-stone-900 dark:text-stone-50">
                                            {user?.name}
                                        </span>
                                        {userRole && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${getRoleBadgeStyle(userRole)}`}>
                                                {userRole}
                                            </span>
                                        )}
                                    </div>
                                    <span className="truncate text-xs text-stone-500 dark:text-stone-400">
                                        {user?.email}
                                    </span>
                                    <span className="truncate text-xs font-medium capitalize text-stone-500 dark:text-stone-400">
                                        {user?.role?.name || user?.role || "-"}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={auth.isLoading}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
                        >
                            <IconLogout className="size-4" />
                            {auth.isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default NavUser