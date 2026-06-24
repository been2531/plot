import { useEffect, useRef, useState } from 'react'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_LEVEL } from '@/shared/constants'

// Kakao Map SDK가 window에 붙이는 전역 객체 타입 선언
// 실제 SDK 로드 전까지는 undefined이므로 optional로 처리
declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap
        LatLng: new (lat: number, lng: number) => unknown
      }
    }
  }
}

interface KakaoMapOptions {
  center: unknown
  level: number
}

// SDK가 노출하는 Map 인스턴스 타입 (필요한 메서드만 최소 선언)
interface KakaoMap {
  setCenter: (latlng: unknown) => void
  getLevel: () => number
}

interface MapContainerProps {
  /** 지도 중심 좌표 — 미입력 시 서울 시청 기본값 */
  center?: { lat: number; lng: number }
  /** Kakao Map 줌 레벨 (1~14) */
  zoomLevel?: number
  className?: string
}

/**
 * Kakao Map Web SDK를 비동기로 로드하고 지도를 렌더링하는 컴포넌트.
 *
 * SDK 스크립트는 최초 마운트 시 1회만 주입 (이미 로드된 경우 건너뜀).
 * autoload=false 파라미터로 SDK를 받고, kakao.maps.load() 콜백에서
 * 지도를 초기화해야 "SDK 준비 전 Map 생성" 에러를 방지할 수 있음.
 */
export default function MapContainer({
  center = DEFAULT_MAP_CENTER,
  zoomLevel = DEFAULT_MAP_LEVEL,
  className = '',
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<KakaoMap | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY

    // 환경변수 미설정 시 개발 경고
    if (!apiKey) {
      console.warn('[MapContainer] VITE_KAKAO_MAP_KEY가 설정되지 않았습니다. .env.local을 확인하세요.')
      setLoadState('error')
      return
    }

    // 이미 SDK가 로드된 경우 (컴포넌트 재마운트 시) 스크립트 재주입 방지
    if (window.kakao?.maps) {
      initMap()
      return
    }

    setLoadState('loading')

    const script = document.createElement('script')
    // autoload=false: SDK 파싱 완료 후 kakao.maps.load() 수동 호출 필요
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`
    script.async = true

    script.onload = () => initMap()
    script.onerror = () => {
      console.error('[MapContainer] Kakao Map SDK 로드 실패')
      setLoadState('error')
    }

    document.head.appendChild(script)
  // center/zoomLevel 변경은 initMap 내부에서 별도 처리 — SDK 재로드 불필요
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** SDK 로드 완료 후 지도 인스턴스 초기화 */
  function initMap() {
    window.kakao!.maps.load(() => {
      if (!containerRef.current) return

      const { maps } = window.kakao!
      const latlng = new maps.LatLng(center.lat, center.lng)
      mapInstanceRef.current = new maps.Map(containerRef.current, {
        center: latlng,
        level: zoomLevel,
      })

      setLoadState('ready')
    })
  }

  // center prop 변경 시 지도 중심 이동 (SDK 재로드 없이)
  useEffect(() => {
    if (loadState !== 'ready' || !mapInstanceRef.current) return
    const latlng = new window.kakao!.maps.LatLng(center.lat, center.lng)
    mapInstanceRef.current.setCenter(latlng)
  }, [center, loadState])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Kakao Map SDK가 이 div를 canvas로 채움 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {loadState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-plot-black/70">
          <span className="text-plot-white text-sm animate-pulse">지도 로딩 중…</span>
        </div>
      )}

      {/* 에러 오버레이 */}
      {loadState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-plot-black">
          <p className="text-white/50 text-sm text-center px-4">
            지도를 불러올 수 없습니다.<br />
            API 키를 확인해주세요.
          </p>
        </div>
      )}
    </div>
  )
}
