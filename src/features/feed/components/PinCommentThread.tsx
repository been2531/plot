import { useState, useRef, useEffect } from 'react'
import { usePinComments } from '@/features/feed/hooks/usePinComments'
import type { PinComment } from '@/shared/types'

interface PinCommentThreadProps {
  plotId: string
  pinId: string
  uid: string | null
  displayName: string | null
}

function formatTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function CommentItem({ comment }: { comment: PinComment }) {
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] text-white/50">{comment.authorName[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium text-white/70">{comment.authorName}</span>
          <span className="text-[10px] text-white/25">{formatTime(comment.createdAt)}</span>
        </div>
        <p className="text-xs text-white/55 mt-0.5 break-words">{comment.text}</p>
      </div>
    </div>
  )
}

export default function PinCommentThread({ plotId, pinId, uid, displayName }: PinCommentThreadProps) {
  const { comments, loading, posting, postComment } = usePinComments(plotId, pinId, uid, displayName)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // 새 댓글 추가 시 하단으로 스크롤
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [comments.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || posting) return
    await postComment(text)
    setText('')
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 댓글 목록 */}
      <div
        ref={listRef}
        className="max-h-40 overflow-y-auto space-y-2.5 pr-1
          scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {loading ? (
          <p className="text-[10px] text-white/25 text-center py-2">불러오는 중…</p>
        ) : comments.length === 0 ? (
          <p className="text-[10px] text-white/25 text-center py-2">첫 댓글을 남겨보세요.</p>
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>

      {/* 입력창 */}
      {uid ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1 border-t border-white/6">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글 달기…"
            maxLength={200}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25
              focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || posting}
            className="text-[11px] font-semibold text-plot-clay disabled:text-white/20 transition-colors shrink-0"
          >
            {posting ? '…' : '게시'}
          </button>
        </form>
      ) : (
        <p className="text-[10px] text-white/25 text-center pt-1 border-t border-white/6">
          로그인하면 댓글을 달 수 있어요.
        </p>
      )}
    </div>
  )
}
