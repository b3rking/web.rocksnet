import { Error, AppLayout, Dashboard } from "@/pages";
import { Login } from "@/pages/Auth/Login";
import { createBrowserRouter, Navigate } from "react-router";
import { useSelector } from "react-redux";

// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
    const { is_auth, isLoading } = useSelector(state => state.auth);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return is_auth ? children : <Navigate to="/login" replace />;
};

// Login Route - redirects to home if already authenticated
const LoginRoute = () => {
    const { is_auth, isLoading } = useSelector(state => state.auth);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return is_auth ? <Navigate to="/" replace /> : <Login />;
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        errorElement: <Error />,
        children: [
            {
                index: true,
                element: <Dashboard />
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