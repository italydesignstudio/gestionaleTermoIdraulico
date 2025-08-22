import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

// Debug: Log environment on startup
console.log('🚀 Frontend started');
console.log('🔧 Environment:', import.meta.env.MODE);
console.log('🌐 API URL:', import.meta.env.VITE_API_BASE_URL || 'NOT SET');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
