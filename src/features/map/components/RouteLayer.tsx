import { useEffect, useRef } from 'react'
import type { Pin } from '@/shared/types'
import type { KakaoMapInstance, KakaoPolyline } from '@/features/map/kakao-maps'

interface RouteLayerProps {
  /** 순서대로 연결할 핀 목록 */
  pins: Pin[]
  map: KakaoMapInstance
  /** 선 색상 (hex 또는 CSS 색상) */
  color?: string
  /** 선 굵기 (px) */
  weight?: number
  /** 불투명도 0–1 */
  opacity?: number
  /** 점선 여부 */
  dashed?: boolean
}

/**
 * 순서대로 핀들을 잇는 동선 폴리라인을 Kakao Map 위에 그린다.
 * pins 배열이 바뀌면 기존 라인을 제거하고 새로 그린다.
 */
export default function RouteLayer({
  pins,
  map,
  color = '#C17B5C',
  weight = 3,
  opacity = 0.75,
  dashed = false,
}: RouteLayerProps) {
  const polylineRef = useRef<KakaoPolyline | null>(null)

  useEffect(() => {
    if (!window.kakao?.maps || pins.length < 2) {
      polylineRef.current?.setMap(null)
      polylineRef.current = null
      return
    }

    const { maps } = window.kakao

    const path = pins.map((p) => new maps.LatLng(p.lat, p.lng))

    const polyline = new maps.Polyline({
      path,
      strokeWeight: weight,
      strokeColor: color,
      strokeOpacity: opacity,
      strokeStyle: dashed ? 'dash' : 'solid',
    })

    polyline.setMap(map)

    polylineRef.current?.setMap(null)
    polylineRef.current = polyline

    return () => {
      polyline.setMap(null)
    }
  }, [pins, map, color, weight, opacity, dashed])

  return null
}
