import { useCallback, useEffect, useRef, useState } from 'react'
import SplitLayout from '@/components/SplitLayout'
import MapContainer from '@/features/map/components/MapContainer'
import MapPin from '@/features/map/components/MapPin'
import FeedGrid from '@/features/feed/components/FeedGrid'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { useMapPins } from '@/features/map/hooks/useMapPins'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { KakaoMapInstance } from '@/features/map/kakao-maps'

function FeedPanel() {
  const { user } = useAuth()
  const { plots, loading, loadingMore, hasMore, error, loadMore } = useFeed()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-16 pb-3 border-b border-white/8">
        <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
          최신 플롯
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {error && (
          <p className="text-center text-xs text-red-400/70 py-4">{error}</p>
        )}
        <FeedGrid plots={plots} isLoading={loading} uid={user?.uid ?? null} />
        {!loading && hasMore && (
          <div ref={sentinelRef} className="h-8" />
        )}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <span className="text-white/30 text-xs animate-pulse">불러오는 중…</span>
          </div>
        )}
        {!loading && !hasMore && plots.length > 0 && (
          <p className="text-center text-xs text-white/20 py-6">모든 플롯을 확인했어요.</p>
        )}
      </div>
    </div>
  )
}

function MapPanel() {
  const [mapInstance, setMapInstance] = useState<KakaoMapInstance | null>(null)
  const { pins, updateBounds } = useMapPins()

  const handleMapReady = useCallback((map: KakaoMapInstance) => {
    setMapInstance(map)

    const syncBounds = () => {
      const b = map.getBounds()
      const sw = b.getSouthWest()
      const ne = b.getNorthEast()
      updateBounds({
        swLat: sw.getLat(), swLng: sw.getLng(),
        neLat: ne.getLat(), neLng: ne.getLng(),
      })
    }

    // bounds_changed 이벤트는 mouseEvent 인자 없이 호출되므로 타입 캐스팅
    window.kakao!.maps.event.addListener(map, 'bounds_changed', syncBounds as unknown as Parameters<NonNullable<typeof window.kakao>['maps']['event']['addListener']>[2])
    syncBounds()
  }, [updateBounds])

  return (
    <div className="relative w-full h-full">
      <MapContainer onMapReady={handleMapReady} />
      {mapInstance && pins.map((pin) => (
        <MapPin key={pin.id} pin={pin} map={mapInstance} />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <SplitLayout
      feedPanel={<FeedPanel />}
      mapPanel={<MapPanel />}
    />
  )
}
