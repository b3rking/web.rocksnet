import { Error, AppLayout, Dashboard } from "@/pages";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        errorElement: <Error />,
        children: [
            {
                index: true,
                element: <Dashboard />
            }
        ]
    }
])

export default router