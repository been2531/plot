import { useState, useEffect, useCallback } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

interface UseFollowResult {
  isFollowing: boolean
  loading: boolean
  toggle: () => Promise<void>
}

/**
 * uid → targetUid 팔로우 상태를 관리.
 * Firestore 구조:
 *   users/{uid}/following/{targetUid}   — 내가 팔로우하는 목록
 *   users/{targetUid}/followers/{uid}   — 나를 팔로우하는 목록
 *   users/{uid}.followingCount / users/{targetUid}.followersCount — 카운터
 */
export function useFollow(uid: string | null, targetUid: string): UseFollowResult {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uid || uid === targetUid) return
    const ref = doc(db, 'users', uid, 'following', targetUid)
    getDoc(ref).then((snap) => setIsFollowing(snap.exists())).catch(() => {})
  }, [uid, targetUid])

  const toggle = useCallback(async () => {
    if (!uid || uid === targetUid || loading) return
    setLoading(true)

    const followingRef = doc(db, 'users', uid, 'following', targetUid)
    const followerRef = doc(db, 'users', targetUid, 'followers', uid)
    const myRef = doc(db, 'users', uid)
    const targetRef = doc(db, 'users', targetUid)

    try {
      if (isFollowing) {
        await Promise.all([
          deleteDoc(followingRef),
          deleteDoc(followerRef),
          updateDoc(myRef, { followingCount: increment(-1) }),
          updateDoc(targetRef, { followersCount: increment(-1) }),
        ])
        setIsFollowing(false)
      } else {
        await Promise.all([
          setDoc(followingRef, { followedAt: serverTimestamp() }),
          setDoc(followerRef, { followedAt: serverTimestamp() }),
          updateDoc(myRef, { followingCount: increment(1) }),
          updateDoc(targetRef, { followersCount: increment(1) }),
        ])
        setIsFollowing(true)
      }
    } catch {
      // 실패 시 상태 유지 (낙관적 업데이트 미적용 — 카운터와 불일치 방지)
    } finally {
      setLoading(false)
    }
  }, [uid, targetUid, isFollowing, loading])

  return { isFollowing, loading, toggle }
}
