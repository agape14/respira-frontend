import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Establecer el título de la página desde la variable de entorno
document.title = import.meta.env.VITE_APP_TITLE || 'Respira - CMP';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
