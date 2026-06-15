import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import Pomodoro from './pages/Pomodoro'
import Calendar from './pages/Calendar'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import FocusMode from './pages/FocusMode'
import MoodTracker from './pages/MoodTracker'
import StudyBuddy from './pages/StudyBuddy'
import BossFight from './pages/BossFight'
import XPShop from './pages/XPShop'
import ShameFeed from './pages/ShameFeed'

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl font-black">
      💀 Loading...
    </div>
  )
  if (!isSignedIn) return <Navigate to="/login" />
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="/pomodoro" element={
          <ProtectedRoute>
            <Pomodoro />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/focus" element={
          <ProtectedRoute>
            <FocusMode />
          </ProtectedRoute>
        } />
        <Route path="/mood" element={
          <ProtectedRoute>
            <MoodTracker />
          </ProtectedRoute>
        } />
        <Route path="/studybuddy" element={
          <ProtectedRoute>
            <StudyBuddy />
          </ProtectedRoute>
        } />
        <Route path="/bossfight" element={
          <ProtectedRoute>
            <BossFight />
          </ProtectedRoute>
        } />
        <Route path="/shop" element={
          <ProtectedRoute>
            <XPShop />
          </ProtectedRoute>
        } />
        <Route path="/shamefeed" element={
          <ProtectedRoute>
            <ShameFeed />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App