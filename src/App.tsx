import { Routes, Route, Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import HomePage from '@/pages/HomePage'
import ExplorePage from '@/pages/ExplorePage'
import ProfilePage from '@/pages/ProfilePage'
import PlotDetailPage from '@/pages/PlotDetailPage'
import CreatePlotPage from '@/pages/CreatePlotPage'

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-plot-black flex flex-col items-center justify-center gap-4">
      <span className="text-5xl text-white/10">✦</span>
      <p className="text-white/40 text-sm">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="text-xs text-plot-clay hover:underline">홈으로</Link>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
        <Route path="/plot/:id" element={<PlotDetailPage />} />
        <Route path="/create" element={<CreatePlotPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
