import { useParams } from 'react-router-dom'

// 플롯 상세 페이지 — T12 구현 후 채울 예정
export default function PlotDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-plot-black flex items-center justify-center">
      <p className="text-white/40 text-sm">플롯 상세 준비 중… (id: {id})</p>
    </div>
  )
}
