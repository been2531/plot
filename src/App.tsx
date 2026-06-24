import SplitLayout from '@/components/SplitLayout'
import MapContainer from '@/features/map/components/MapContainer'

// 임시 피드 패널 — features/feed 구현 후 교체 예정
function FeedPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-plot-white tracking-tight">PLOT</h1>
      <p className="text-white/40 text-sm">피드 준비 중…</p>
      {/* 카드 스켈레톤 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <SplitLayout
      feedPanel={<FeedPlaceholder />}
      mapPanel={<MapContainer />}
    />
  )
}
