import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.css'
import ThemeProvider from './ThemeProvider'

console.log('Mounting React app...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Root element not found')
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Failed to mount React app:', error)
}
