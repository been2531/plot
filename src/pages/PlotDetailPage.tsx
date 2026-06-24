import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, getDocs, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useFollow } from '@/features/auth/hooks/useFollow'
import { useScrap } from '@/features/feed/hooks/useScrap'
import PinCommentThread from '@/features/feed/components/PinCommentThread'
import type { Plot, Pin } from '@/shared/types'

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

  // pinIds 순서대로 핀 정렬
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
          {open ? '댓글 닫기' : `댓글 보기`}
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

export default function PlotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [plot, setPlot] = useState<Plot | null>(null)
  const [notFound, setNotFound] = useState(false)

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

          {/* 작성자 + 팔로우 + 스크랩 */}
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
    </div>
  )
}
