"use client"

import {
    IconArrowsTransferUpDown,
    IconBuildingWarehouse,
    IconCalendarTime,
    IconInnerShadowTop,
    IconMoneybagHeart,
    IconTicket,
    IconUser,
    IconUsersGroup
} from "@tabler/icons-react"

import { NavLinks } from "#components/ui/NavLinks"
import { NavUser } from "@/components/ui/NavUser"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router"
import { useAuth } from "#hooks/useAuth"
import { ROLE_PERMISSIONS } from "#lib/roleConstants"

const allMenuItems = [
    {
        name: "Utilisateurs",
        url: "/users",
        icon: IconUser,
        key: "users",
    },
    {
        name: "Profiles",
        url: "/profils",
        icon: IconTicket,
        key: "profils",
    },
    {
        name: "Stock",
        url: "/stocks",
        icon: IconBuildingWarehouse,
        key: "stocks",
    },
    {
        name: "Historique",
        url: "/history",
        icon: IconCalendarTime,
        key: "history",
    },
    {
        name: "Abonnements",
        url: "/subscriptions",
        icon: IconArrowsTransferUpDown,
        key: "subscriptions",
    },
    {
        name: "Clients",
        url: "/clients",
        icon: IconUsersGroup,
        key: "clients",
    },
    {
        name: "Paiements",
        url: "/payments",
        icon: IconMoneybagHeart,
        key: "payments",
    }
]

export function AppSidebar(props) {
    const user = useAuth()
    const roleId = user?.role_id || 3 // Default to Agent if no role

    // Filter menu items based on user role
    const filteredMenuItems = allMenuItems.filter(item => {
        const permissions = ROLE_PERMISSIONS[roleId] || []
        return permissions.includes(item.key)
    })

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                        >
                            <Link to="/">
                                <IconInnerShadowTop className="size-5!" />
                                <span className="text-base font-semibold">Rocksnet</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavLinks items={filteredMenuItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
