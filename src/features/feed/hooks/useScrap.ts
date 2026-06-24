// 유저의 스크랩 목록을 Firestore에서 구독하고 토글 기능을 제공하는 훅
import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

interface UseScrapReturn {
  /** 현재 로그인 유저가 스크랩한 플롯 ID 집합 */
  scrappedIds: Set<string>
  /** 스크랩 상태를 토글하고 scrapCount를 원자적으로 갱신 */
  toggleScrap: (plotId: string) => Promise<void>
  loading: boolean
}

export function useScrap(uid: string | null): UseScrapReturn {
  const [scrappedIds, setScrappedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // 유저 스크랩 목록 실시간 구독
  useEffect(() => {
    if (!uid) {
      setScrappedIds(new Set())
      return
    }

    setLoading(true)
    const scrapsRef = collection(db, 'users', uid, 'scraps')
    const unsubscribe = onSnapshot(
      scrapsRef,
      (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setScrappedIds(ids)
        setLoading(false)
      },
      () => {
        // 권한 오류 등은 조용히 처리 — 빈 집합 유지
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  const toggleScrap = useCallback(
    async (plotId: string) => {
      if (!uid) return

      const scrapDocRef = doc(db, 'users', uid, 'scraps', plotId)
      const plotDocRef = doc(db, 'plots', plotId)
      const isScrapped = scrappedIds.has(plotId)

      // Firestore 트랜잭션으로 스크랩 문서와 플롯 카운트를 원자적으로 갱신
      await runTransaction(db, async (tx) => {
        const plotSnap = await tx.get(plotDocRef)
        const currentCount =
          typeof plotSnap.data()?.['scrapCount'] === 'number'
            ? (plotSnap.data()?.['scrapCount'] as number)
            : 0

        if (isScrapped) {
          tx.delete(scrapDocRef)
          if (plotSnap.exists()) {
            tx.update(plotDocRef, { scrapCount: Math.max(0, currentCount - 1) })
          }
        } else {
          tx.set(scrapDocRef, { scrappedAt: serverTimestamp() })
          if (plotSnap.exists()) {
            tx.update(plotDocRef, { scrapCount: currentCount + 1 })
          }
        }
      })
    },
    [uid, scrappedIds],
  )

  return { scrappedIds, toggleScrap, loading }
}
