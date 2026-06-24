import SplitLayout from '@/components/SplitLayout'
import MapContainer from '@/features/map/components/MapContainer'
import FeedGrid from '@/features/feed/components/FeedGrid'
import { useFeed } from '@/features/feed/hooks/useFeed'

function FeedPanel() {
  const { plots, loading, loadingMore, error, hasMore, loadMore } = useFeed()

  return (
    <div className="flex flex-col h-full">
      {/* 피드 헤더 */}
      <div className="px-4 pt-16 pb-3 border-b border-white/8">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
          최신 플롯
        </h2>
      </div>

      {/* 에러 배너 */}
      {error && !loading && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* 피드 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        <FeedGrid plots={plots} isLoading={loading} />

        {/* 더 불러오기 버튼 */}
        {!loading && hasMore && (
          <div className="flex justify-center pb-6 pt-2">
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="px-5 py-2 rounded-full text-xs font-medium border border-white/15
                text-white/50 hover:text-white/80 hover:border-white/30
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {loadingMore ? '불러오는 중…' : '더 보기'}
            </button>
          </div>
        )}

        {/* 더 이상 없음 */}
        {!loading && !hasMore && plots.length > 0 && (
          <p className="text-center text-xs text-white/20 pb-6 pt-2">모든 플롯을 불러왔습니다</p>
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
