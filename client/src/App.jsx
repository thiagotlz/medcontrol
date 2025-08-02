import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LayoutPadrao from './components/LayoutPadrao'
import { FlashMessageProvider } from './contexts/FlashMessageContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Medications from './pages/Medications'
import Settings from './pages/Settings'

// CSS
import './styles/FlashMessage.css'

function App() {
  return (
    <FlashMessageProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <LayoutPadrao />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="medications" element={<Medications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </FlashMessageProvider>
  )
}

export default App