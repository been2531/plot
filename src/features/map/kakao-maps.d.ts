// Kakao Map Web SDK 전역 타입 선언 — 모든 map 컴포넌트에서 공유
// 실제 SDK를 window에 붙이므로 declare global 사용

export interface KakaoLatLng {
  getLat: () => number
  getLng: () => number
}

export interface KakaoBounds {
  getSouthWest: () => KakaoLatLng
  getNorthEast: () => KakaoLatLng
}

export interface KakaoMapInstance {
  setCenter: (latlng: KakaoLatLng) => void
  getLevel: () => number
  getBounds: () => KakaoBounds
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMapInstance | null) => void
}

export interface KakaoMouseEvent {
  latLng: KakaoLatLng
}

export interface KakaoPolyline {
  setMap: (map: KakaoMapInstance | null) => void
}

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void
        event: {
          addListener: (target: unknown, type: string, handler: (e: KakaoMouseEvent) => void) => void
          removeListener: (target: unknown, type: string, handler: (e: KakaoMouseEvent) => void) => void
        }
        Map: new (container: HTMLElement, options: {
          center: KakaoLatLng
          level: number
        }) => KakaoMapInstance
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        CustomOverlay: new (options: {
          position: KakaoLatLng
          content: HTMLElement
          yAnchor?: number
          zIndex?: number
        }) => KakaoCustomOverlay
        Polyline: new (options: {
          path: KakaoLatLng[]
          strokeWeight?: number
          strokeColor?: string
          strokeOpacity?: number
          strokeStyle?: 'solid' | 'shortdash' | 'dash' | 'dot' | 'longdash' | 'dashdot' | 'longdashdot'
        }) => KakaoPolyline
      }
    }
  }
}
