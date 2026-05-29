import { Error, AppLayout, Dashboard, User, Profil, Stock, History } from "@/pages";
import { createBrowserRouter } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import LoginRoute from "./LoginRoute";


const router = createBrowserRouter([
    {
        path: '/',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        errorElement: <Error />,
        children: [
            {
                index: true,
                element: <Dashboard />
            },
            {
                path: '/users',
                element: <User />,
                errorElement: <Error />
            },
            {
                path: '/profils',
                element: <Profil />,
                errorElement: <Error />
            },
            {
                path: '/stocks',
                element: <Stock />,
                errorElement: <Error />
            },
            {
                path: '/history',
                element: <History />,
                errorElement: <Error />
            }
        ]
    },
    {
        path: '/login',
        element: <LoginRoute />,
        errorElement: <Error />
    }
])

export default router