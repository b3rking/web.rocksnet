"use client"

import {
    IconInnerShadowTop,
    IconTicket,
    IconUser
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

const data = {
    documents: [
        {
            name: "Utilisateurs",
            url: "/users",
            icon: IconUser,
        },
        {
            name: "Profiles",
            url: "/profils",
            icon: IconTicket,
        }
    ],
}

export function AppSidebar(props) {
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
                <NavLinks items={data.documents} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}
