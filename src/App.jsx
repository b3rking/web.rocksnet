import { RouterProvider } from "react-router"
import router from "./router/web"
import { TooltipProvider } from "#components/ui/tooltip"
import { useDispatch } from "react-redux"
import { useEffect } from "react"
import { checkAuth } from "./features/auth/authSlice"

const App = () => {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(checkAuth())
    }, [dispatch])

    return (
        <TooltipProvider>
            <RouterProvider router={router} />
        </TooltipProvider>
    )
}

export default App