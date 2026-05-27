import { useSelector } from "react-redux";
import { Navigate } from "react-router";

// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
    const { is_auth } = useSelector(state => state.auth);

    return is_auth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute