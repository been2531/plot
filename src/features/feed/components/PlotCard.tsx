import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Plot } from '@/shared/types'

interface PlotCardProps {
  plot: Plot
  /** 북마크(스크랩) 버튼 클릭 핸들러 — T08에서 Firestore 연동 예정 */
  onScrap?: (plotId: string) => void
  /** 현재 유저가 이미 스크랩한 상태인지 */
  isScrapped?: boolean
}

export default function PlotCard({ plot, onScrap, isScrapped = false }: PlotCardProps) {
  const [scrapped, setScrapped] = useState(isScrapped)
  const [scrapCount, setScrapCount] = useState(plot.scrapCount)

  function handleScrap(e: React.MouseEvent) {
    // 카드 링크 이동 막기
    e.preventDefault()
    e.stopPropagation()

    const next = !scrapped
    setScrapped(next)
    setScrapCount((c) => c + (next ? 1 : -1))
    onScrap?.(plot.id)
  }

  return (
    <Link
      to={`/plot/${plot.id}`}
      className="group block rounded-2xl overflow-hidden bg-white/5 border border-white/8
        hover:border-white/20 transition-all duration-200"
    >
      {/* 커버 이미지 영역 */}
      <div className="relative w-full bg-white/5">
        {plot.coverImageUrl ? (
          <img
            src={plot.coverImageUrl}
            alt={plot.title}
            className="w-full object-cover"
            loading="lazy"
          />
        ) : (
          /* 커버 이미지 없을 때 플레이스홀더 */
          <div className="w-full aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
            <span className="text-white/20 text-3xl">✦</span>
          </div>
        )}

        {/* 스크랩(북마크) 버튼 — 이미지 우측 하단 */}
        <button
          onClick={handleScrap}
          aria-label={scrapped ? '스크랩 취소' : '스크랩'}
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
            backdrop-blur-sm transition-all duration-150
            ${scrapped
              ? 'bg-plot-clay text-white'
              : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100'
            }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={scrapped ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* 카드 하단 정보 */}
      <div className="p-3 space-y-1.5">
        {/* 태그 목록 */}
        {plot.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plot.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-plot-sage/80 bg-plot-sage/10 rounded-full px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 제목 */}
        <h3 className="text-sm font-medium text-plot-white leading-snug line-clamp-2 group-hover:text-plot-clay transition-colors">
          {plot.title}
        </h3>

        {/* 작성자 + 스크랩 수 */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs text-white/40 truncate max-w-[70%]">
            {plot.authorName}
          </span>
          <span className="flex items-center gap-1 text-xs text-white/30 shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {scrapCount}
          </span>
        </div>
      </div>
    </Link>
  )
}
