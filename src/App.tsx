import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import HomePage from '@/pages/HomePage'
import ExplorePage from '@/pages/ExplorePage'
import ProfilePage from '@/pages/ProfilePage'
import PlotDetailPage from '@/pages/PlotDetailPage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile/:uid" element={<ProfilePage />} />
        <Route path="/plot/:id" element={<PlotDetailPage />} />
      </Routes>
    </>
  )
}
