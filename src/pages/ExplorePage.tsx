import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryDocumentSnapshot,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import FeedGrid from '@/features/feed/components/FeedGrid'
import type { Plot } from '@/shared/types'

const PAGE_SIZE = 12

const PRESET_TAGS = ['카페', '맛집', '성수', '홍대', '이태원', '한남', '연남', '북촌', '을지로', '주말']

function docToPlot(doc: QueryDocumentSnapshot<DocumentData>): Plot {
  const d = doc.data()
  return {
    id: doc.id,
    title: d.title ?? '',
    description: d.description,
    authorId: d.authorId ?? '',
    authorName: d.authorName ?? '',
    pins: [],
    pinIds: d.pinIds ?? [],
    tags: d.tags ?? [],
    coverImageUrl: d.coverImageUrl,
    creatorSupportUrl: d.creatorSupportUrl,
    isPublic: d.isPublic ?? true,
    scrapCount: d.scrapCount ?? 0,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt),
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(d.updatedAt),
  }
}

export default function ExplorePage() {
  const { user } = useAuth()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchTag, setSearchTag] = useState<string | null>(null)

  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const selectedTag = searchTag ?? activeTag

  const buildQuery = useCallback(
    (after: QueryDocumentSnapshot<DocumentData> | null) => {
      const base = selectedTag
        ? query(
            collection(db, 'plots'),
            where('isPublic', '==', true),
            where('tags', 'array-contains', selectedTag),
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE),
          )
        : query(
            collection(db, 'plots'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE),
          )
      return after ? query(base, startAfter(after)) : base
    },
    [selectedTag],
  )

  // 첫 페이지 로드 (태그 변경 시 리셋)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    lastDocRef.current = null
    setPlots([])
    setHasMore(true)

    getDocs(buildQuery(null))
      .then((snap) => {
        if (cancelled) return
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null
        setPlots(snap.docs.map(docToPlot))
        setHasMore(snap.docs.length === PAGE_SIZE)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '피드를 불러오지 못했습니다.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [buildQuery])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !lastDocRef.current) return
    setLoadingMore(true)

    getDocs(buildQuery(lastDocRef.current))
      .then((snap) => {
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? lastDocRef.current
        setPlots((prev) => [...prev, ...snap.docs.map(docToPlot)])
        setHasMore(snap.docs.length === PAGE_SIZE)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '추가 피드를 불러오지 못했습니다.')
      })
      .finally(() => setLoadingMore(false))
  }, [buildQuery, loadingMore, hasMore])

  // 무한 스크롤
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

  function handleTagClick(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag))
    setSearchTag(null)
    setSearchInput('')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchInput.trim()
    setSearchTag(trimmed || null)
    setActiveTag(null)
  }

  return (
    <div className="min-h-screen bg-plot-black pt-14">
      {/* 검색 + 태그 필터 헤더 */}
      <div className="sticky top-14 z-30 bg-plot-black/95 backdrop-blur-md border-b border-white/8">
        {/* 검색창 */}
        <form onSubmit={handleSearch} className="px-4 pt-4 pb-3">
          <div className="relative">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="태그로 탐색 (예: 카페, 성수)"
              className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 pr-20
                text-sm text-white placeholder:text-white/25
                focus:outline-none focus:border-plot-clay/40 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 rounded-full
                text-xs font-medium text-white/60 hover:text-white transition-colors"
            >
              탐색
            </button>
          </div>
        </form>

        {/* 태그 칩 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTag(null); setSearchTag(null); setSearchInput('') }}
            className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors
              ${selectedTag === null
                ? 'bg-plot-clay border-plot-clay text-white'
                : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white/70'
              }`}
          >
            전체
          </button>
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors
                ${selectedTag === tag
                  ? 'bg-plot-clay border-plot-clay text-white'
                  : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white/70'
                }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 피드 */}
      <div>
        {error && (
          <p className="text-center text-xs text-red-400/70 py-4">{error}</p>
        )}
        {selectedTag && !loading && (
          <p className="text-xs text-white/35 px-4 py-3">
            <span className="text-plot-clay">#{selectedTag}</span> 검색 결과 {plots.length}개
          </p>
        )}
        <FeedGrid plots={plots} isLoading={loading} uid={user?.uid ?? null} />
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
        {!loading && plots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <span className="text-4xl text-white/15">✦</span>
            <p className="text-sm text-white/35">
              {selectedTag ? `#${selectedTag} 플롯이 아직 없습니다.` : '아직 플롯이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
