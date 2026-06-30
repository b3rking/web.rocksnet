import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 60 * 1000,
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    withCredentials: false,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('rocksnet_access_token')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

export default api