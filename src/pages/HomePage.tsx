import SplitLayout from '@/components/SplitLayout'
import MapContainer from '@/features/map/components/MapContainer'

// 피드 그리드 구현(T06) 전까지 사용하는 스켈레톤 플레이스홀더
function FeedPlaceholder() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-white/40 text-sm">피드 준비 중…</p>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <SplitLayout
      feedPanel={<FeedPlaceholder />}
      mapPanel={<MapContainer />}
    />
  )
}
