import { Error, AppLayout, Dashboard, User, Profil, Stock, History, Subscription, Client, Payment } from "@/pages";
import { createBrowserRouter } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import LoginRoute from "./LoginRoute";


const router = createBrowserRouter([
    {
        path: '/',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        errorElement: <Error />,
        children: [
            {
                index: true,
                element: <RoleProtectedRoute pageKey="dashboard"><Dashboard /></RoleProtectedRoute>
            },
            {
                path: '/users',
                element: <RoleProtectedRoute pageKey="users"><User /></RoleProtectedRoute>,
                errorElement: <Error />
            },
            {
                path: '/profils',
                element: <RoleProtectedRoute pageKey="profils"><Profil /></RoleProtectedRoute>,
                errorElement: <Error />
            },
            {
                path: '/stocks',
                element: <RoleProtectedRoute pageKey="stocks"><Stock /></RoleProtectedRoute>,
                errorElement: <Error />
            },
            {
                path: '/history',
                element: <RoleProtectedRoute pageKey="history"><History /></RoleProtectedRoute>,
                errorElement: <Error />
            },
            {
                path: '/subscriptions',
                element: <RoleProtectedRoute pageKey="subscriptions"><Subscription /></RoleProtectedRoute>,
                errorElement: <Error />
            },
            {
                path: '/clients',
                element: <RoleProtectedRoute pageKey="clients"><Client /></RoleProtectedRoute>,
                errorElement: <Error />
            },
            {
                path: '/payments',
                element: <RoleProtectedRoute pageKey="payments"><Payment /></RoleProtectedRoute>,
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