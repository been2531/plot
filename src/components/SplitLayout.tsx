import { useState } from 'react'

interface SplitLayoutProps {
  /** 좌측 피드 패널 (FeedList 등) */
  feedPanel: React.ReactNode
  /** 우측 또는 전체 지도 패널 (MapContainer 등) */
  mapPanel: React.ReactNode
}

/**
 * 데스크톱: 좌측 피드(360px 고정) + 우측 전체 지도
 * 모바일:   하단 탭(피드 ↔ 지도) 전환 + 지도 위에 Bottom Sheet
 *
 * CSS Grid로 구성하여 피드 너비 조절이 용이하도록 설계.
 */
export default function SplitLayout({ feedPanel, mapPanel }: SplitLayoutProps) {
  // 모바일에서 현재 활성 탭
  const [mobileTab, setMobileTab] = useState<'feed' | 'map'>('map')

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-plot-black">

      {/* ── 데스크톱 레이아웃 (md 이상) ── */}
      <div className="hidden md:grid md:grid-cols-[360px_1fr] h-full">

        {/* 좌측: 피드 패널 */}
        <aside className="flex flex-col h-full overflow-y-auto border-r border-white/10 bg-plot-black">
          {feedPanel}
        </aside>

        {/* 우측: 지도 패널 (전체 높이 차지) */}
        <main className="relative h-full">
          {mapPanel}
        </main>
      </div>

      {/* ── 모바일 레이아웃 (md 미만) ── */}
      <div className="flex md:hidden flex-col h-full">

        {/* 컨텐츠 영역: 탭에 따라 표시 전환 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 지도는 항상 렌더링하되, 피드 탭에선 숨김 — 지도 SDK 재마운트 방지 */}
          <div className={`absolute inset-0 ${mobileTab === 'map' ? 'z-10' : 'z-0'}`}>
            {mapPanel}
          </div>
          <div className={`absolute inset-0 overflow-y-auto bg-plot-black ${mobileTab === 'feed' ? 'z-10' : 'z-0 pointer-events-none'}`}>
            {feedPanel}
          </div>
        </div>

        {/* 하단 탭 네비게이션 */}
        <nav className="flex border-t border-white/10 bg-plot-black shrink-0">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${mobileTab === 'map'
                ? 'text-plot-white border-t-2 border-plot-clay'
                : 'text-white/40'}`}
          >
            지도
          </button>
          <button
            onClick={() => setMobileTab('feed')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${mobileTab === 'feed'
                ? 'text-plot-white border-t-2 border-plot-clay'
                : 'text-white/40'}`}
          >
            피드
          </button>
        </nav>
      </div>

    </div>
  )
}
