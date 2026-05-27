import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ReviewDetailPage from './pages/ReviewDetailPage'
import ReviewPage from './pages/ReviewPage'
import UploadPage from './pages/UploadPage'

function Protected({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/upload" element={<Protected><UploadPage /></Protected>} />
        <Route path="/review" element={<Protected><ReviewPage /></Protected>} />
        <Route path="/review/:id" element={<Protected><ReviewDetailPage /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
