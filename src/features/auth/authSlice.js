import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "#lib/axios";

const initialState = {
    is_auth: false,
    user: {},
    isLoading: true,
};

export const authenticate = createAsyncThunk(
    "auth/authenticate",
    async ({ email, password }, thunkAPI) => {
        try {
            const res = await api.post("/login", {
                email,
                password,
            });
            console.log("Login response:", res.data);
            localStorage.setItem(
                "rocksnet_access_token",
                res.data.access_token,
            );
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    },
);

export const checkAuth = createAsyncThunk(
    "auth/checkAuth",
    async (_, thunkAPI) => {
        try {
            const token = localStorage.getItem("rocksnet_access_token");
            if (!token) {
                return thunkAPI.rejectWithValue("No token found");
            }

            const res = await api.get("/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("CheckAuth response:", res.data);
            return res.data;
        } catch (error) {
            localStorage.removeItem("rocksnet_access_token");

            return thunkAPI.rejectWithValue(
                error.response?.data || error.message,
            );
        }
    },
);

export const logout = createAsyncThunk('auth/logut', async (_, thunkAPI) => {
    try {
        const res = await api.post('/logout')
        return res.data
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message)
    }
})

export const authSlice = createSlice({
    name: "login",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(authenticate.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(authenticate.fulfilled, (state, action) => {
                state.is_auth = true;
                state.isLoading = false;
                // Handle both { user: {...} } and direct user object
                state.user = action.payload.user || action.payload;
            })
            .addCase(authenticate.rejected, (state, action) => {
                state.is_auth = false;
                state.isLoading = false;
                state.user = {};
                console.log("Auth failed:", action.payload);
            })
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.is_auth = true;
                // Handle both { user: {...} } and direct user object
                state.user = action.payload.user || action.payload;
                state.isLoading = false;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.is_auth = false;
                state.user = {};
                state.isLoading = false;
            })
            .addCase(logout.pending, (state) => {
                state.isLoading = true
            })
            .addCase(logout.fulfilled, (state) => {
                state.is_auth = false
                state.user = {}
                state.isLoading = false
            })
            .addCase(logout.rejected, (state) => {
                state.isLoading = false
            });
    },
});

// export const { authenticate } = authSlice.actions

export default authSlice.reducer;
