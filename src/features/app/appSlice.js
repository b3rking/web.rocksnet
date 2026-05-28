import {createSlice } from '@reduxjs/toolkit'

const initialState = {
    activeMenu: "Gestion d'utilisateurs"
}

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setActiveMenu: (state, action) => {
            state.activeMenu = action.payload
        }
    }
})

export const { setActiveMenu } = appSlice.actions