import { useParams } from 'react-router-dom'

// 프로필 페이지 — T15 구현 후 채울 예정
export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>()

  return (
    <div className="min-h-screen bg-plot-black flex items-center justify-center">
      <p className="text-white/40 text-sm">프로필 준비 중… (uid: {uid})</p>
    </div>
  )
}
