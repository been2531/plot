import { useEffect, useRef } from 'react'
import SplitLayout from '@/components/SplitLayout'
import MapContainer from '@/features/map/components/MapContainer'
import FeedGrid from '@/features/feed/components/FeedGrid'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { useAuth } from '@/features/auth/hooks/useAuth'

function FeedPanel() {
  const { user } = useAuth()
  const { plots, loading, loadingMore, hasMore, error, loadMore } = useFeed()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // 스크롤 끝에 닿으면 자동으로 다음 페이지 로드
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-16 pb-3 border-b border-white/8">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
          최신 플롯
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {error && (
          <p className="text-center text-xs text-red-400/70 py-4">{error}</p>
        )}
        <FeedGrid plots={plots} isLoading={loading} uid={user?.uid ?? null} />
        {/* 무한 스크롤 감지 센티넬 */}
        {!loading && hasMore && (
          <div ref={sentinelRef} className="h-8" />
        )}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <span className="text-white/30 text-xs animate-pulse">불러오는 중…</span>
          </div>
        )}
        {!loading && !hasMore && plots.length > 0 && (
          <p className="text-center text-xs text-white/20 py-6">모든 플롯을 확인했어요.</p>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <SplitLayout
      feedPanel={<FeedPanel />}
      mapPanel={<MapContainer />}
    />
  )
}
