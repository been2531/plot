import PlotCard from '@/features/feed/components/PlotCard'
import type { Plot } from '@/shared/types'

interface FeedGridProps {
  plots: Plot[]
  isLoading?: boolean
  /** 스크랩된 플롯 ID 집합 — PlotCard에 전달 */
  scrappedIds?: Set<string>
  onScrap?: (plotId: string) => void
}

export default function FeedGrid({ plots, isLoading = false, scrappedIds, onScrap }: FeedGridProps) {
  if (isLoading) {
    return <FeedSkeleton />
  }

  if (plots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <span className="text-4xl mb-4 text-white/20">✦</span>
        <p className="text-white/40 text-sm">아직 플롯이 없습니다.</p>
        <p className="text-white/25 text-xs mt-1">첫 번째 동선을 만들어보세요.</p>
      </div>
    )
  }

  return (
    /*
     * CSS columns Masonry 레이아웃.
     * grid 방식은 행 높이를 미리 알아야 하므로 동적 이미지에 부적합.
     * columns + break-inside-avoid 조합이 가장 넓은 브라우저 지원을 제공.
     */
    <div className="columns-2 gap-2 p-3 [&>*]:mb-2 [&>*]:break-inside-avoid">
      {plots.map((plot) => (
        <PlotCard
          key={plot.id}
          plot={plot}
          isScrapped={scrappedIds?.has(plot.id)}
          onScrap={onScrap}
        />
      ))}
    </div>
  )
}

/** 초기 로딩 시 표시되는 스켈레톤 UI */
function FeedSkeleton() {
  // 높이를 번갈아 배치해 Masonry 느낌 유지
  const heights = ['h-48', 'h-64', 'h-40', 'h-56', 'h-44', 'h-60']

  return (
    <div className="columns-2 gap-2 p-3 [&>*]:mb-2 [&>*]:break-inside-avoid">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-full ${h} rounded-2xl bg-white/5 animate-pulse`}
        />
      ))}
    </div>
  )
}
