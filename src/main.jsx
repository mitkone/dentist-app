import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { DemoModeProvider } from './contexts/DemoModeContext'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#f8fafc',
          color: '#0f172a',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Грешка в приложението</h1>
          <pre style={{ fontSize: 12, color: '#b91c1c', overflow: 'auto' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <DemoModeProvider>
          <App />
        </DemoModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
