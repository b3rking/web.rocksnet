import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";

// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
    const { is_auth } = useSelector(state => state.auth);
    const location = useLocation();

    // Redirect to login with the intended location if not authenticated
    return is_auth ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute