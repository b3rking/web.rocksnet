import { Login } from "@/pages/Auth/Login";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const LoginRoute = () => {
    const { is_auth } = useSelector(state => state.auth);

    return is_auth ? <Navigate to="/" replace /> : <Login />;
};

export default LoginRoute