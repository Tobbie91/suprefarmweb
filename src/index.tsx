import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

import { SupabaseSessionProvider } from './context/SupabaseSessionProvider'
import { AuthProvider } from './context/AuthContext'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <SupabaseSessionProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SupabaseSessionProvider>
  </React.StrictMode>
)

reportWebVitals()


