import { useSelector } from "react-redux"

export const useAuth = () => {
    return (useSelector(store => store.auth.user))
}