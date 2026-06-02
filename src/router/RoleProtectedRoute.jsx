import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import { ROLE_PERMISSIONS, ROLE_DEFAULT_REDIRECT } from "#lib/roleConstants";

/**
 * Route component that checks role-based access to a specific page
 * @param {ReactNode} children - The page component to render
 * @param {string} pageKey - The permission key for this page (e.g., 'users', 'stocks', 'dashboard')
 */
const RoleProtectedRoute = ({ children, pageKey = 'dashboard' }) => {
    const { user } = useSelector(state => state.auth);
    const roleId = user?.role_id;

    // Get user permissions
    const permissions = ROLE_PERMISSIONS[roleId] || [];

    // If user doesn't have permission for this page, redirect to default
    if (!permissions.includes(pageKey)) {
        const defaultPath = ROLE_DEFAULT_REDIRECT[roleId] || '/clients';
        return <Navigate to={defaultPath} replace />;
    }

    return children;
};

export default RoleProtectedRoute;
