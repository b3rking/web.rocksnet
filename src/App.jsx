import { RouterProvider } from "react-router"
import router from "./router/web"
import { TooltipProvider } from "#components/ui/tooltip"
import { Toaster } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { checkAuth } from "./features/auth/authSlice"

const App = () => {
    const dispatch = useDispatch()
    const { isLoading } = useSelector(state => state.auth)

    useEffect(() => {
        dispatch(checkAuth())
    }, [dispatch])

    // Only render router after auth check is complete
    if (isLoading) {
        return null
    }

    return (
        <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
        </TooltipProvider>
    )
}

export default App