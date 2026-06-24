import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useFollow } from '@/features/auth/hooks/useFollow'
import { fetchScrapIds } from '@/features/feed/hooks/useScrap'
import { updateUserProfile } from '@/services/userService'
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

function EditProfileModal({ profile, onClose, onSave }: {
  profile: UserProfile
  onClose: () => void
  onSave: (displayName: string, bio: string) => void
}) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) { setError('이름을 입력해주세요.'); return }
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
      })
      onSave(displayName.trim(), bio.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-plot-clay/60 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/80">프로필 편집</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-white/45 mb-1.5 block">이름 *</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-white/45 mb-1.5 block">소개</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              rows={3} maxLength={150} placeholder="간단한 자기소개를 적어주세요."
              className={`${inputCls} resize-none`} />
          </div>
          {error && <p className="text-xs text-red-400/80">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs text-white/40 border border-white/10 hover:text-white/60 transition-colors">
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
  const [editOpen, setEditOpen] = useState(false)

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
              {isMe && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-xs text-white/35 hover:text-white/60 border border-white/10
                    hover:border-white/20 rounded-full px-3 py-0.5 transition-colors"
                >
                  편집
                </button>
              )}
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

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={(displayName, bio) => {
            setProfile((prev) => prev ? { ...prev, displayName, bio: bio || undefined } : prev)
            setEditOpen(false)
          }}
        />
      )}
    </div>
  )
}
