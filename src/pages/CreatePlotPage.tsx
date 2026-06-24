import { useState, useCallback, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import MapContainer from '@/features/map/components/MapContainer'
import MapPin from '@/features/map/components/MapPin'
import RouteLayer from '@/features/map/components/RouteLayer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createPlot } from '@/services/plotService'
import { uploadImage, validateImageFile, isR2Configured } from '@/services/r2'
import type { Pin } from '@/shared/types'
import type { KakaoMapInstance } from '@/features/map/kakao-maps'

let pinIdCounter = 0
function genPinId() {
  return `local-${++pinIdCounter}-${Date.now()}`
}

interface PinListItemProps {
  pin: Pin
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

function PinListItem({ pin, index, total, onMoveUp, onMoveDown, onRemove }: PinListItemProps) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/8">
      <span className="w-5 h-5 rounded-full bg-plot-clay/80 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">{pin.name}</p>
        {pin.affiliateUrl && (
          <p className="text-[10px] text-plot-clay/60 truncate">예약링크 있음</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onMoveUp} disabled={index === 0}
          className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          aria-label="위로">↑</button>
        <button onClick={onMoveDown} disabled={index === total - 1}
          className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          aria-label="아래로">↓</button>
        <button onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-red-400 transition-colors"
          aria-label="제거">✕</button>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-plot-clay/60 transition-colors'

export default function CreatePlotPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [mapInstance, setMapInstance] = useState<KakaoMapInstance | null>(null)
  const [pins, setPins] = useState<Pin[]>([])

  // 플롯 메타
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [creatorSupportUrl, setCreatorSupportUrl] = useState('')

  // 커버 이미지
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 지도 클릭 → 핀 추가 팝업 상태
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [pendingName, setPendingName] = useState('')
  const [pendingAffiliateUrl, setPendingAffiliateUrl] = useState('')
  const pendingInputRef = useRef<HTMLInputElement>(null)

  // 훅을 모두 호출한 뒤 조건부 렌더링
  if (!authLoading && user === null) return <Navigate to="/" replace />

  const handleMapReady = useCallback((map: KakaoMapInstance) => {
    setMapInstance(map)
    window.kakao!.maps.event.addListener(map, 'click', (mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
      setPendingLatLng({ lat: mouseEvent.latLng.getLat(), lng: mouseEvent.latLng.getLng() })
      setPendingName('')
      setPendingAffiliateUrl('')
      setTimeout(() => pendingInputRef.current?.focus(), 50)
    })
  }, [])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setError(err); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setError(null)
  }

  function clearCoverImage() {
    setCoverFile(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function confirmPin() {
    if (!pendingLatLng || !pendingName.trim()) return
    const newPin: Pin = {
      id: genPinId(),
      name: pendingName.trim(),
      address: '',
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      isSponsor: false,
      affiliateUrl: pendingAffiliateUrl.trim() || undefined,
      comments: [],
    }
    setPins((prev) => [...prev, newPin])
    setPendingLatLng(null)
    setPendingName('')
    setPendingAffiliateUrl('')
  }

  function movePin(index: number, direction: -1 | 1) {
    const next = [...pins]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setPins(next)
  }

  function removePin(index: number) {
    setPins((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!title.trim()) { setError('플롯 제목을 입력해주세요.'); return }
    if (pins.length < 2) { setError('핀을 2개 이상 추가해주세요.'); return }

    setSaving(true)
    setError(null)
    try {
      let coverImageUrl: string | undefined
      if (coverFile) {
        coverImageUrl = await uploadImage(coverFile)
      }

      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const id = await createPlot({
        title: title.trim(),
        description: description.trim() || undefined,
        authorId: user!.uid,
        authorName: user!.displayName ?? '익명',
        pins,
        tags: tagList,
        isPublic,
        coverImageUrl,
        creatorSupportUrl: creatorSupportUrl.trim() || undefined,
      })
      navigate(`/plot/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen pt-14">
      {/* 왼쪽: 입력 패널 */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-white/8 bg-plot-black overflow-y-auto">
        <div className="px-5 py-5 border-b border-white/8">
          <h1 className="text-sm font-semibold text-white/80">새 플롯 만들기</h1>
          <p className="text-xs text-white/40 mt-1">지도를 클릭해 핀을 추가하세요.</p>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4">
          {/* 커버 이미지 */}
          {isR2Configured() && (
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">커버 이미지</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={coverPreview} alt="커버 미리보기" className="w-full h-32 object-cover" />
                  <button
                    onClick={clearCoverImage}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60
                      flex items-center justify-center text-white/70 hover:text-white text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-20 border border-dashed border-white/15 rounded-xl
                    flex items-center justify-center text-xs text-white/30
                    hover:border-white/30 hover:text-white/50 transition-colors"
                >
                  + 이미지 선택
                </button>
              )}
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="플롯 제목" maxLength={60} className={inputCls} />
          </div>

          {/* 설명 */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="동선에 대한 소개를 적어주세요." rows={3} maxLength={300}
              className={`${inputCls} resize-none`} />
          </div>

          {/* 태그 */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">태그 (쉼표 구분)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="성수, 카페, 주말" className={inputCls} />
          </div>

          {/* 크리에이터 후원 링크 */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              후원 링크 <span className="text-white/25">(토스, 포스타입 등)</span>
            </label>
            <input value={creatorSupportUrl} onChange={(e) => setCreatorSupportUrl(e.target.value)}
              placeholder="https://toss.me/…" className={inputCls} />
          </div>

          {/* 공개 여부 */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-white/50">공개 플롯</span>
            <button
              onClick={() => setIsPublic((v) => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-plot-clay' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>

          {/* 핀 목록 */}
          <div>
            <p className="text-xs text-white/50 mb-2">핀 순서 ({pins.length}개)</p>
            {pins.length === 0 ? (
              <p className="text-xs text-white/25 text-center py-4">지도를 클릭해 핀을 추가하세요.</p>
            ) : (
              <div className="space-y-1.5">
                {pins.map((pin, i) => (
                  <PinListItem key={pin.id} pin={pin} index={i} total={pins.length}
                    onMoveUp={() => movePin(i, -1)}
                    onMoveDown={() => movePin(i, 1)}
                    onRemove={() => removePin(i)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="px-5 py-4 border-t border-white/8 space-y-2">
          {error && <p className="text-xs text-red-400/80 text-center">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-plot-clay text-white text-sm font-semibold
              hover:bg-plot-clay/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? '저장 중…' : '플롯 저장'}
          </button>
          <button onClick={() => navigate(-1)}
            className="w-full py-2 rounded-xl text-white/40 text-xs hover:text-white/60 transition-colors">
            취소
          </button>
        </div>
      </aside>

      {/* 오른쪽: 지도 */}
      <div className="flex-1 relative">
        <MapContainer onMapReady={handleMapReady} />

        {mapInstance && pins.map((pin, i) => (
          <MapPin key={pin.id} pin={pin} map={mapInstance} order={i + 1} />
        ))}

        {mapInstance && pins.length >= 2 && (
          <RouteLayer pins={pins} map={mapInstance} />
        )}

        {/* 핀 추가 팝업 */}
        {pendingLatLng && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-80
            bg-plot-black/95 border border-white/15 rounded-2xl px-4 py-4
            shadow-2xl backdrop-blur-md space-y-2.5">
            <p className="text-[10px] text-white/35 font-medium uppercase tracking-wider">장소 추가</p>

            <input ref={pendingInputRef} value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmPin() }}
              placeholder="장소 이름 *"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2
                text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-plot-clay/40 transition-colors" />

            <input value={pendingAffiliateUrl}
              onChange={(e) => setPendingAffiliateUrl(e.target.value)}
              placeholder="예약 링크 (아고다, 클룩 등) — 선택"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2
                text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-plot-clay/40 transition-colors" />

            <div className="flex justify-end gap-2 pt-0.5">
              <button onClick={() => setPendingLatLng(null)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors px-2">
                취소
              </button>
              <button onClick={confirmPin} disabled={!pendingName.trim()}
                className="text-xs text-white font-semibold bg-plot-clay/80 hover:bg-plot-clay
                  disabled:opacity-30 rounded-lg px-4 py-1.5 transition-colors">
                추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
