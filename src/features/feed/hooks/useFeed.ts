// Firestore `plots` 컬렉션에서 공개 플롯을 최신순으로 페이지네이션 조회하는 훅
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
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Plot } from '@/shared/types'

const PAGE_SIZE = 12

interface FeedState {
  plots: Plot[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
}

interface UseFeedReturn extends FeedState {
  loadMore: () => Promise<void>
  refresh: () => void
}

/** Firestore DocumentData → Plot 변환 (타입 안전 narrowing) */
function toPlot(doc: QueryDocumentSnapshot<DocumentData>): Plot {
  const d = doc.data()
  return {
    id: doc.id,
    title: typeof d['title'] === 'string' ? d['title'] : '',
    description: typeof d['description'] === 'string' ? d['description'] : undefined,
    authorId: typeof d['authorId'] === 'string' ? d['authorId'] : '',
    authorName: typeof d['authorName'] === 'string' ? d['authorName'] : '',
    pins: Array.isArray(d['pins']) ? d['pins'] : [],
    pinIds: Array.isArray(d['pinIds']) ? d['pinIds'] : [],
    tags: Array.isArray(d['tags']) ? d['tags'] : [],
    coverImageUrl: typeof d['coverImageUrl'] === 'string' ? d['coverImageUrl'] : undefined,
    creatorSupportUrl:
      typeof d['creatorSupportUrl'] === 'string' ? d['creatorSupportUrl'] : undefined,
    isPublic: typeof d['isPublic'] === 'boolean' ? d['isPublic'] : true,
    scrapCount: typeof d['scrapCount'] === 'number' ? d['scrapCount'] : 0,
    createdAt: d['createdAt']?.toDate?.() ?? new Date(0),
    updatedAt: d['updatedAt']?.toDate?.() ?? new Date(0),
  }
}

export function useFeed(): UseFeedReturn {
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // 마지막으로 조회된 문서 커서 — loadMore에서 startAfter로 사용
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  // 초기화 트리거 (refresh 호출 시 카운터 증가)
  const [refreshKey, setRefreshKey] = useState(0)

  // 첫 페이지 로드 (refreshKey가 바뀔 때마다 재실행)
  useEffect(() => {
    let cancelled = false

    async function fetchFirst() {
      setLoading(true)
      setError(null)
      lastDocRef.current = null

      try {
        const q = query(
          collection(db, 'plots'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE),
        )
        const snapshot = await getDocs(q)
        if (cancelled) return

        const fetched = snapshot.docs.map(toPlot)
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null
        setPlots(fetched)
        setHasMore(snapshot.docs.length === PAGE_SIZE)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '피드를 불러오는 데 실패했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchFirst()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  // 다음 페이지 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return

    setLoadingMore(true)
    setError(null)

    try {
      const q = query(
        collection(db, 'plots'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE),
      )
      const snapshot = await getDocs(q)

      const fetched = snapshot.docs.map(toPlot)
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? lastDocRef.current
      setPlots((prev) => [...prev, ...fetched])
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가 피드를 불러오는 데 실패했습니다.')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return { plots, loading, loadingMore, error, hasMore, loadMore, refresh }
}
