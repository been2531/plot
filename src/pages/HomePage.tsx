import SplitLayout from '@/components/SplitLayout'
import MapContainer from '@/features/map/components/MapContainer'
import FeedGrid from '@/features/feed/components/FeedGrid'
import type { Plot } from '@/shared/types'

// T07(useFeed 훅) 구현 전까지 사용하는 더미 데이터
const DUMMY_PLOTS: Plot[] = [
  {
    id: '1',
    title: '성수동 감성 카페 투어',
    authorId: 'u1',
    authorName: '지은',
    pins: [],
    pinIds: [],
    tags: ['성수', '카페', '주말'],
    coverImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
    isPublic: true,
    scrapCount: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: '익선동 골목 산책 — 오래된 것들의 아름다움',
    authorId: 'u2',
    authorName: '민준',
    pins: [],
    pinIds: [],
    tags: ['익선동', '한옥'],
    coverImageUrl: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=400&q=80',
    isPublic: true,
    scrapCount: 87,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: '한강 노을 동선',
    authorId: 'u3',
    authorName: '서연',
    pins: [],
    pinIds: [],
    tags: ['한강', '노을', '피크닉'],
    isPublic: true,
    scrapCount: 23,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: '북촌 한옥마을 골목 지도',
    authorId: 'u4',
    authorName: '도윤',
    pins: [],
    pinIds: [],
    tags: ['북촌', '한옥', '서울'],
    coverImageUrl: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=400&q=80',
    isPublic: true,
    scrapCount: 134,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    title: '망원시장 주변 맛집 루트',
    authorId: 'u5',
    authorName: '하은',
    pins: [],
    pinIds: [],
    tags: ['망원', '맛집'],
    isPublic: true,
    scrapCount: 61,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    title: '연남동 저녁 산책 코스',
    authorId: 'u6',
    authorName: '준서',
    pins: [],
    pinIds: [],
    tags: ['연남동', '저녁', '산책'],
    coverImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
    isPublic: true,
    scrapCount: 19,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

function FeedPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* 피드 헤더 */}
      <div className="px-4 pt-16 pb-3 border-b border-white/8">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
          최신 플롯
        </h2>
      </div>
      {/* 피드 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        <FeedGrid plots={DUMMY_PLOTS} />
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
