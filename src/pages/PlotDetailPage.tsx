import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, getDocs, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useFollow } from '@/features/auth/hooks/useFollow'
import { useScrap } from '@/features/feed/hooks/useScrap'
import PinCommentThread from '@/features/feed/components/PinCommentThread'
import { updatePlot, deletePlot } from '@/services/plotService'
import type { Plot, Pin } from '@/shared/types'
import type { UpdatePlotInput } from '@/services/plotService'

async function fetchPlot(id: string): Promise<Plot | null> {
  const [snap, pinsSnap] = await Promise.all([
    getDoc(doc(db, 'plots', id)),
    getDocs(collection(db, 'plots', id, 'pins')),
  ])
  if (!snap.exists()) return null
  const d = snap.data()
  const pinIds: string[] = d.pinIds ?? []

  const pinsMap = new Map<string, Pin>()
  pinsSnap.docs.forEach((pinDoc) => {
    const p = pinDoc.data()
    pinsMap.set(pinDoc.id, {
      id: pinDoc.id,
      name: p.name ?? '',
      address: p.address ?? '',
      lat: p.lat ?? 0,
      lng: p.lng ?? 0,
      imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
      isSponsor: p.isSponsor ?? false,
      sponsorLinkUrl: typeof p.sponsorLinkUrl === 'string' ? p.sponsorLinkUrl : undefined,
      affiliateUrl: typeof p.affiliateUrl === 'string' ? p.affiliateUrl : undefined,
      comments: [],
    })
  })

  const pins = pinIds.map((pid) => pinsMap.get(pid)).filter((p): p is Pin => p !== undefined)

  return {
    id: snap.id,
    title: d.title ?? '',
    description: d.description,
    authorId: d.authorId ?? '',
    authorName: d.authorName ?? '',
    pins,
    pinIds,
    tags: d.tags ?? [],
    coverImageUrl: d.coverImageUrl,
    creatorSupportUrl: d.creatorSupportUrl,
    isPublic: d.isPublic ?? true,
    scrapCount: d.scrapCount ?? 0,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(),
  }
}

function FollowButton({ uid, targetUid }: { uid: string | null; targetUid: string }) {
  const { isFollowing, loading, toggle } = useFollow(uid, targetUid)
  if (!uid || uid === targetUid) return null
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-4 py-1.5 rounded-full border transition-colors
        ${isFollowing
          ? 'border-white/20 text-white/50 hover:border-red-400/40 hover:text-red-400/70'
          : 'border-plot-clay text-plot-clay hover:bg-plot-clay hover:text-white'
        } disabled:opacity-40`}
    >
      {isFollowing ? '팔로잉' : '팔로우'}
    </button>
  )
}

function PinCard({ pin, plotId, uid, displayName }: {
  pin: Pin
  plotId: string
  uid: string | null
  displayName: string | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden">
      {pin.imageUrl && (
        <img src={pin.imageUrl} alt={pin.name} className="w-full h-36 object-cover" />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white/90">{pin.name}</h3>
            {pin.address && (
              <p className="text-xs text-white/35 mt-0.5">{pin.address}</p>
            )}
          </div>
          {pin.isSponsor && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/70
              bg-amber-400/10 px-1.5 py-0.5 rounded">AD</span>
          )}
        </div>

        {(pin.affiliateUrl ?? pin.sponsorLinkUrl) && (
          <a
            href={pin.affiliateUrl ?? pin.sponsorLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-plot-clay hover:underline"
          >
            예약 / 더 보기 →
          </a>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] text-white/35 hover:text-white/60 transition-colors"
        >
          {open ? '댓글 닫기' : '댓글 보기'}
        </button>

        {open && (
          <PinCommentThread
            plotId={plotId}
            pinId={pin.id}
            uid={uid}
            displayName={displayName}
          />
        )}
      </div>
    </div>
  )
}

function EditPlotModal({ plot, onClose, onSave }: {
  plot: Plot
  onClose: () => void
  onSave: (data: UpdatePlotInput) => void
}) {
  const [title, setTitle] = useState(plot.title)
  const [description, setDescription] = useState(plot.description ?? '')
  const [tags, setTags] = useState(plot.tags.join(', '))
  const [isPublic, setIsPublic] = useState(plot.isPublic)
  const [creatorSupportUrl, setCreatorSupportUrl] = useState(plot.creatorSupportUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setSaving(true)
    setError(null)
    try {
      const data: UpdatePlotInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublic,
        creatorSupportUrl: creatorSupportUrl.trim() || undefined,
      }
      await updatePlot(plot.id, data)
      onSave(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-plot-clay/60 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/80">플롯 수정</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-white/45 mb-1.5 block">제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              maxLength={60} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-white/45 mb-1.5 block">설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} maxLength={300} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="text-xs text-white/45 mb-1.5 block">태그 (쉼표 구분)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="성수, 카페, 주말" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-white/45 mb-1.5 block">
              후원 링크 <span className="text-white/20">(토스, 포스타입 등)</span>
            </label>
            <input value={creatorSupportUrl} onChange={(e) => setCreatorSupportUrl(e.target.value)}
              placeholder="https://toss.me/…" className={inputCls} />
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-white/45">공개 플롯</span>
            <button type="button" onClick={() => setIsPublic((v) => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-plot-clay' : 'bg-white/15'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>

          {error && <p className="text-xs text-red-400/80">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs text-white/40 hover:text-white/60 border border-white/10 transition-colors">
              취소
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl bg-plot-clay text-white text-xs font-semibold
                hover:bg-plot-clay/80 disabled:opacity-50 transition-colors">
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PlotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plot, setPlot] = useState<Plot | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const { isScrapped, scrapCount, toggle: toggleScrap } = useScrap(
    id ?? '',
    user?.uid ?? null,
    plot?.scrapCount ?? 0,
  )

  useEffect(() => {
    if (!id) return
    fetchPlot(id)
      .then((p) => { if (p) setPlot(p); else setNotFound(true) })
      .catch(() => setNotFound(true))
  }, [id])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // clipboard API 미지원 브라우저 fallback
    })
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await deletePlot(id)
      navigate('/', { replace: true })
    } catch {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  function handleSaveEdit(data: UpdatePlotInput) {
    setPlot((prev) => prev ? {
      ...prev,
      title: data.title ?? prev.title,
      description: data.description,
      tags: data.tags ?? prev.tags,
      isPublic: data.isPublic ?? prev.isPublic,
      creatorSupportUrl: data.creatorSupportUrl,
    } : prev)
    setEditOpen(false)
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-plot-black flex flex-col items-center justify-center gap-3">
        <p className="text-white/40 text-sm">플롯을 찾을 수 없습니다.</p>
        <Link to="/" className="text-xs text-plot-clay hover:underline">홈으로</Link>
      </div>
    )
  }

  if (!plot) {
    return (
      <div className="min-h-screen bg-plot-black flex items-center justify-center">
        <span className="text-white/30 text-sm animate-pulse">불러오는 중…</span>
      </div>
    )
  }

  const isAuthor = user?.uid === plot.authorId

  return (
    <div className="min-h-screen bg-plot-black pt-14">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* 커버 */}
        {plot.coverImageUrl && (
          <img
            src={plot.coverImageUrl}
            alt={plot.title}
            className="w-full rounded-2xl object-cover max-h-64"
          />
        )}

        {/* 헤더 */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {plot.tags.map((tag) => (
              <span key={tag} className="text-[10px] text-plot-sage/70 bg-plot-sage/10 rounded-full px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-xl font-bold text-white/90 leading-snug">{plot.title}</h1>
          {plot.description && (
            <p className="text-sm text-white/50 leading-relaxed">{plot.description}</p>
          )}

          {/* 작성자 + 팔로우 */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <Link
                to={`/profile/${plot.authorId}`}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {plot.authorName}
              </Link>
              <FollowButton uid={user?.uid ?? null} targetUid={plot.authorId} />
            </div>

            {/* 액션 버튼 묶음 */}
            <div className="flex items-center gap-3">
              {/* 공유 */}
              <button
                onClick={handleShare}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {copied ? '복사됨 ✓' : '공유'}
              </button>

              {/* 스크랩 */}
              <button
                onClick={toggleScrap}
                className={`flex items-center gap-1.5 text-xs transition-colors
                  ${isScrapped ? 'text-plot-clay' : 'text-white/40 hover:text-white/70'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isScrapped ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {scrapCount}
              </button>
            </div>
          </div>

          {/* 작성자 전용: 수정/삭제 */}
          {isAuthor && (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setEditOpen(true)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs text-red-400/50 hover:text-red-400/80 transition-colors"
              >
                삭제
              </button>
            </div>
          )}

          {/* 크리에이터 후원 링크 */}
          {plot.creatorSupportUrl && (
            <a
              href={plot.creatorSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/40 border border-white/10
                rounded-full px-3 py-1 hover:border-white/25 hover:text-white/60 transition-colors"
            >
              ☕ 크리에이터 후원하기
            </a>
          )}
        </div>

        {/* 핀 목록 */}
        {plot.pins.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-medium text-white/35 uppercase tracking-widest">동선</h2>
            {plot.pins.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                plotId={plot.id}
                uid={user?.uid ?? null}
                displayName={user?.displayName ?? null}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/25 text-center py-8">등록된 핀이 없습니다.</p>
        )}
      </div>

      {/* 플롯 수정 모달 */}
      {editOpen && (
        <EditPlotModal
          plot={plot}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <p className="text-sm text-white/80">플롯을 삭제하면 복구할 수 없습니다.</p>
            <p className="text-xs text-white/40">핀과 댓글도 함께 삭제됩니다.</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-xs text-white/40 border border-white/10 hover:text-white/60 transition-colors disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-red-500/80 text-white text-xs font-semibold
                  hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
