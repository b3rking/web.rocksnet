import { setActiveMenu } from "@/features/app/appSlice"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

export function useApp(title) {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(setActiveMenu(title))
    })

    return useSelector(store => store.app.activeMenu)
}