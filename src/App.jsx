import { RouterProvider } from "react-router"
import router from "./router/router"
import { TooltipProvider } from "#components/ui/tooltip"

const App = () => {
    return (
        <TooltipProvider>
            <RouterProvider router={router}/>
        </TooltipProvider>
    )
}

export default App