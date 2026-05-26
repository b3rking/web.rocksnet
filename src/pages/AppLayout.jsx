import { AppSidebar } from "@/components/ui/AppSidebar"
// import { ChartAreaInteractive } from "@/components/ui/ChartAreaInteractive"
// import { DataTable } from "@/components/ui/DataTable"
// import { SectionCards } from "@/components/ui/SectionCards"
import { SiteHeader } from "@/components/ui/SiteHeader"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

// import data from "./data.json"
import { Outlet, useRouteError } from "react-router"

export default function AppLayout() {
    const error = useRouteError()
    console.log(error);
    
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                }
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            {/* <SectionCards />
                            <div className="px-4 lg:px-6">
                                <ChartAreaInteractive />
                            </div>
                            <DataTable data={data} /> */}
                            <Outlet />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
