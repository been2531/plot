import { useState, useEffect, useCallback } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

interface UseScrapResult {
  isScrapped: boolean
  scrapCount: number
  toggle: () => Promise<void>
  loading: boolean
}

/**
 * 특정 플롯에 대한 스크랩 상태를 관리하는 훅.
 * uid가 없으면 비로그인 상태로 간주하여 UI만 표시(토글 불가).
 */
export function useScrap(plotId: string, uid: string | null, initialScrapCount: number): UseScrapResult {
  const [isScrapped, setIsScrapped] = useState(false)
  const [scrapCount, setScrapCount] = useState(initialScrapCount)
  const [loading, setLoading] = useState(false)

  // 로그인 상태가 되면 실제 스크랩 여부 확인
  useEffect(() => {
    if (!uid) {
      setIsScrapped(false)
      return
    }
    const scrapRef = doc(db, 'users', uid, 'scraps', plotId)
    getDoc(scrapRef).then((snap) => {
      setIsScrapped(snap.exists())
    }).catch(() => {
      // 조회 실패 시 기본값 유지
    })
  }, [uid, plotId])

  const toggle = useCallback(async () => {
    if (!uid || loading) return
    setLoading(true)

    const scrapRef = doc(db, 'users', uid, 'scraps', plotId)
    const plotRef = doc(db, 'plots', plotId)

    try {
      if (isScrapped) {
        await deleteDoc(scrapRef)
        await updateDoc(plotRef, { scrapCount: increment(-1) })
        setIsScrapped(false)
        setScrapCount((c) => Math.max(0, c - 1))
      } else {
        await setDoc(scrapRef, { plotId, scrappedAt: serverTimestamp() })
        await updateDoc(plotRef, { scrapCount: increment(1) })
        setIsScrapped(true)
        setScrapCount((c) => c + 1)
      }
    } catch {
      // 상태 변경은 await 성공 후에만 이뤄지므로 catch 시점엔 롤백 불필요
    } finally {
      setLoading(false)
    }
  }, [uid, plotId, isScrapped, loading])

  return { isScrapped, scrapCount, toggle, loading }
}

/** 유저가 스크랩한 모든 plotId 목록을 가져오는 유틸 */
export async function fetchScrapIds(uid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'scraps'))
  return snap.docs.map((d) => d.id)
}
