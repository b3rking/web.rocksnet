import { Error, AppLayout, Dashboard, User } from "@/pages";
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