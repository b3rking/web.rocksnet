import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store/store'
import { ThemeProvider } from '#components/ThemeProvider'

createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <StrictMode>
            <ThemeProvider defaultTheme="dark" storageKey="app-theme">
            <App />
            </ThemeProvider>
        </StrictMode>,
    </Provider>
)
