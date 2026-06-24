import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleGoogleLogin() {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      onClose()
    } catch {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="로그인"
    >
      {/* 모달 카드 */}
      <div className="relative w-full max-w-sm mx-4 bg-[#161616] border border-white/10 rounded-2xl p-8 shadow-2xl">

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors text-xl leading-none"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-plot-white tracking-widest mb-2">
            PLOT
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            장소와 동선으로 만드는<br />나만의 공간 이야기
          </p>
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4
            bg-plot-white text-plot-black rounded-xl font-medium text-sm
            hover:bg-plot-mist transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Google 로고 SVG */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? '로그인 중…' : 'Google로 계속하기'}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        )}

        {/* 약관 안내 */}
        <p className="mt-6 text-center text-xs text-white/25 leading-relaxed">
          계속하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}
