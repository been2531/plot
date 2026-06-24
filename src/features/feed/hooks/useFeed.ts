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
import type { Plot } from '@/shared/types'

const PAGE_SIZE = 12

function docToPlot(doc: QueryDocumentSnapshot<DocumentData>): Plot {
  const d = doc.data()
  return {
    id: doc.id,
    title: d.title ?? '',
    description: d.description,
    authorId: d.authorId ?? '',
    authorName: d.authorName ?? '',
    pins: d.pins ?? [],
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

interface UseFeedResult {
  plots: Plot[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
}

export function useFeed(): UseFeedResult {
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)

  const fetchPage = useCallback(async (after: QueryDocumentSnapshot<DocumentData> | null) => {
    const baseQuery = query(
      collection(db, 'plots'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    )
    const q = after ? query(baseQuery, startAfter(after)) : baseQuery
    const snap = await getDocs(q)
    return snap
  }, [])

  // 초기 로드
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPage(null)
      .then((snap) => {
        if (cancelled) return
        const docs = snap.docs
        lastDocRef.current = docs[docs.length - 1] ?? null
        setPlots(docs.map(docToPlot))
        setHasMore(docs.length === PAGE_SIZE)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '피드를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !lastDocRef.current) return
    setLoadingMore(true)
    setError(null)

    fetchPage(lastDocRef.current)
      .then((snap) => {
        const docs = snap.docs
        lastDocRef.current = docs[docs.length - 1] ?? lastDocRef.current
        setPlots((prev) => [...prev, ...docs.map(docToPlot)])
        setHasMore(docs.length === PAGE_SIZE)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '추가 피드를 불러오지 못했습니다.')
      })
      .finally(() => setLoadingMore(false))
  }, [loadingMore, hasMore, fetchPage])

  return { plots, loading, loadingMore, hasMore, error, loadMore }
}
