import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useFollow } from '@/features/auth/hooks/useFollow'
import { fetchScrapIds } from '@/features/feed/hooks/useScrap'
import FeedGrid from '@/features/feed/components/FeedGrid'
import type { UserProfile, Plot } from '@/shared/types'

async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    uid,
    displayName: d.displayName ?? '익명',
    photoUrl: d.photoUrl,
    bio: d.bio,
    followersCount: d.followersCount ?? 0,
    followingCount: d.followingCount ?? 0,
    plotCount: d.plotCount ?? 0,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
  }
}

async function fetchUserPlots(authorId: string): Promise<Plot[]> {
  const q = query(
    collection(db, 'plots'),
    where('authorId', '==', authorId),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      title: data.title ?? '',
      description: data.description,
      authorId: data.authorId ?? '',
      authorName: data.authorName ?? '',
      pins: [],
      pinIds: data.pinIds ?? [],
      tags: data.tags ?? [],
      coverImageUrl: data.coverImageUrl,
      creatorSupportUrl: data.creatorSupportUrl,
      isPublic: data.isPublic ?? true,
      scrapCount: data.scrapCount ?? 0,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    }
  })
}

async function fetchScrappedPlots(uid: string): Promise<Plot[]> {
  const ids = await fetchScrapIds(uid)
  if (ids.length === 0) return []
  const plots = await Promise.all(
    ids.map(async (plotId) => {
      const snap = await getDoc(doc(db, 'plots', plotId))
      if (!snap.exists()) return null
      const data = snap.data()
      const p: Plot = {
        id: snap.id,
        title: data.title ?? '',
        description: data.description as string | undefined,
        authorId: data.authorId ?? '',
        authorName: data.authorName ?? '',
        pins: [],
        pinIds: data.pinIds ?? [],
        tags: data.tags ?? [],
        coverImageUrl: data.coverImageUrl as string | undefined,
        creatorSupportUrl: data.creatorSupportUrl as string | undefined,
        isPublic: data.isPublic ?? true,
        scrapCount: data.scrapCount ?? 0,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      }
      return p
    }),
  )
  return plots.filter((p): p is Plot => p !== null)
}

type Tab = 'plots' | 'scraps'

function FollowButton({ uid, targetUid }: { uid: string | null; targetUid: string }) {
  const { isFollowing, loading, toggle } = useFollow(uid, targetUid)
  if (!uid || uid === targetUid) return null
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-5 py-1.5 rounded-full border transition-colors
        ${isFollowing
          ? 'border-white/20 text-white/50 hover:border-red-400/40 hover:text-red-400/70'
          : 'border-plot-clay text-plot-clay hover:bg-plot-clay hover:text-white'
        } disabled:opacity-40`}
    >
      {isFollowing ? '팔로잉' : '팔로우'}
    </button>
  )
}

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plots, setPlots] = useState<Plot[]>([])
  const [scraps, setScraps] = useState<Plot[]>([])
  const [tab, setTab] = useState<Tab>('plots')
  const [loading, setLoading] = useState(true)
  const [scrapsLoading, setScrapsLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const isMe = user?.uid === uid

  useEffect(() => {
    if (!uid) return
    setLoading(true)
    Promise.all([fetchUserProfile(uid), fetchUserPlots(uid)])
      .then(([prof, userPlots]) => {
        if (!prof) { setNotFound(true); return }
        setProfile(prof)
        setPlots(userPlots)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [uid])

  // 스크랩 탭 선택 시 지연 로드 (본인 프로필만)
  useEffect(() => {
    if (tab !== 'scraps' || !isMe || !uid) return
    setScrapsLoading(true)
    fetchScrappedPlots(uid)
      .then(setScraps)
      .finally(() => setScrapsLoading(false))
  }, [tab, isMe, uid])

  if (notFound) {
    return (
      <div className="min-h-screen bg-plot-black flex flex-col items-center justify-center gap-3">
        <p className="text-white/40 text-sm">유저를 찾을 수 없습니다.</p>
        <Link to="/" className="text-xs text-plot-clay hover:underline">홈으로</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-plot-black flex items-center justify-center">
        <span className="text-white/30 text-sm animate-pulse">불러오는 중…</span>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-plot-black pt-14">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 프로필 헤더 */}
        <div className="flex items-center gap-5 mb-8">
          {/* 아바타 */}
          <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden shrink-0">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-white/30">
                {profile.displayName[0]}
              </div>
            )}
          </div>

          {/* 이름 + 통계 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-base font-semibold text-white/90">{profile.displayName}</h1>
              <FollowButton uid={user?.uid ?? null} targetUid={profile.uid} />
            </div>
            {profile.bio && (
              <p className="text-xs text-white/45 mt-1 line-clamp-2">{profile.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-white/40">
                플롯 <strong className="text-white/70">{plots.length}</strong>
              </span>
              <span className="text-xs text-white/40">
                팔로워 <strong className="text-white/70">{profile.followersCount}</strong>
              </span>
              <span className="text-xs text-white/40">
                팔로잉 <strong className="text-white/70">{profile.followingCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-white/8 mb-5">
          <button
            onClick={() => setTab('plots')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors
              ${tab === 'plots'
                ? 'border-plot-clay text-white/80'
                : 'border-transparent text-white/35 hover:text-white/60'}`}
          >
            플롯
          </button>
          {isMe && (
            <button
              onClick={() => setTab('scraps')}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors
                ${tab === 'scraps'
                  ? 'border-plot-clay text-white/80'
                  : 'border-transparent text-white/35 hover:text-white/60'}`}
            >
              스크랩
            </button>
          )}
        </div>

        {/* 콘텐츠 */}
        {tab === 'plots' && (
          plots.length === 0 ? (
            <p className="text-center text-sm text-white/25 py-16">아직 작성한 플롯이 없습니다.</p>
          ) : (
            <FeedGrid plots={plots} uid={user?.uid ?? null} />
          )
        )}

        {tab === 'scraps' && (
          scrapsLoading ? (
            <p className="text-center text-sm text-white/30 animate-pulse py-16">불러오는 중…</p>
          ) : scraps.length === 0 ? (
            <p className="text-center text-sm text-white/25 py-16">스크랩한 플롯이 없습니다.</p>
          ) : (
            <FeedGrid plots={scraps} uid={user?.uid ?? null} />
          )
        )}
      </div>
    </div>
  )
}
