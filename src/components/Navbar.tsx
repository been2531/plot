import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import LoginModal from '@/features/auth/components/LoginModal'

export default function Navbar() {
  const { user, signOutUser } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOutUser()
    navigate('/')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between
        px-5 py-3 bg-plot-black/90 backdrop-blur-md border-b border-white/8">

        {/* 로고 */}
        <Link to="/" className="text-lg font-semibold text-plot-white tracking-widest">
          PLOT
        </Link>

        {/* 우측: 탐색 + 인증 */}
        <nav className="flex items-center gap-4">
          <Link
            to="/explore"
            className="text-sm text-white/50 hover:text-plot-white transition-colors"
          >
            탐색
          </Link>

          {user ? (
            /* 로그인 상태 */
            <div className="flex items-center gap-3">
              <Link to={`/profile/${user.uid}`}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? '프로필'}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-plot-clay flex items-center justify-center text-xs text-white font-medium">
                    {user.displayName?.[0] ?? 'U'}
                  </div>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            /* 비로그인 상태 */
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-sm px-4 py-1.5 rounded-full border border-white/20
                text-plot-white hover:bg-white/10 transition-colors"
            >
              로그인
            </button>
          )}
        </nav>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}
