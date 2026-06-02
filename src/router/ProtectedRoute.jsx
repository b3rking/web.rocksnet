import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import { ROLE_PERMISSIONS, ROLE_DEFAULT_REDIRECT } from "#lib/roleConstants";

// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
    const { is_auth, user } = useSelector(state => state.auth);
    const location = useLocation();

    // Redirect to login if not authenticated
    if (!is_auth) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user is trying to access dashboard but shouldn't (Super Agent, Agent)
    const roleId = user?.role_id;
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    const isAccessingDashboard = location.pathname === '/';

    if (isAccessingDashboard && !permissions.includes('dashboard')) {
        // Redirect to role-specific default page
        const defaultPath = ROLE_DEFAULT_REDIRECT[roleId] || '/clients';
        return <Navigate to={defaultPath} replace />;
    }

    return children;
};

export default ProtectedRoute