import { authSlice } from '@/features/auth/authSlice'
import { appSlice } from '@/features/app/appSlice'
import { configureStore } from '@reduxjs/toolkit'


const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        app: appSlice.reducer
    },
})

export default store