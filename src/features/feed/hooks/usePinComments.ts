import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { PinComment } from '@/shared/types'

function docToComment(doc: { id: string; data: () => Record<string, unknown> }): PinComment {
  const d = doc.data()
  return {
    id: doc.id,
    authorId: (d.authorId as string) ?? '',
    authorName: (d.authorName as string) ?? '익명',
    text: (d.text as string) ?? '',
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
  }
}

interface UsePinCommentsResult {
  comments: PinComment[]
  loading: boolean
  posting: boolean
  postError: string | null
  postComment: (text: string) => Promise<void>
}

export function usePinComments(
  plotId: string,
  pinId: string,
  uid: string | null,
  displayName: string | null,
): UsePinCommentsResult {
  const [comments, setComments] = useState<PinComment[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  useEffect(() => {
    if (!plotId || !pinId) return
    const q = query(
      collection(db, 'plots', plotId, 'pins', pinId, 'comments'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(docToComment))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [plotId, pinId])

  async function postComment(text: string) {
    if (!uid || !text.trim()) return
    setPosting(true)
    setPostError(null)
    try {
      await addDoc(collection(db, 'plots', plotId, 'pins', pinId, 'comments'), {
        authorId: uid,
        authorName: displayName ?? '익명',
        text: text.trim(),
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setPostError(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.')
    } finally {
      setPosting(false)
    }
  }

  return { comments, loading, posting, postError, postComment }
}
