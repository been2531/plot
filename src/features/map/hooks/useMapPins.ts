import { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Pin } from '@/shared/types'

interface Bounds {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

interface UseMapPinsResult {
  pins: Pin[]
  loading: boolean
  error: string | null
  /** 뷰포트 바운드가 변경될 때 호출 */
  updateBounds: (bounds: Bounds) => void
}

function docToPin(data: Record<string, unknown>, id: string): Pin {
  return {
    id,
    name: (data.name as string) ?? '',
    address: (data.address as string) ?? '',
    lat: (data.lat as number) ?? 0,
    lng: (data.lng as number) ?? 0,
    imageUrl: data.imageUrl as string | undefined,
    isSponsor: (data.isSponsor as boolean) ?? false,
    sponsorLinkUrl: data.sponsorLinkUrl as string | undefined,
    affiliateUrl: data.affiliateUrl as string | undefined,
    comments: [],
  }
}

/**
 * 지도 뷰포트 바운드(sw/ne 좌표) 안에 있는 핀을 Firestore에서 조회.
 * Firestore는 2D 지리 범위 쿼리를 직접 지원하지 않으므로
 * lat 범위 쿼리 후 클라이언트에서 lng를 필터링하는 방식 사용.
 * (GeoHash 기반 geofirestore 도입 전 단계)
 */
export function useMapPins(): UseMapPinsResult {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const boundsRef = useRef<Bounds | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPins = useCallback(async (bounds: Bounds) => {
    setLoading(true)
    setError(null)
    try {
      const q = query(
        collection(db, 'pins'),
        where('lat', '>=', bounds.swLat),
        where('lat', '<=', bounds.neLat),
      )
      const snap = await getDocs(q)
      const result = snap.docs
        .filter((doc) => {
          const lng = doc.data().lng as number
          return lng >= bounds.swLng && lng <= bounds.neLng
        })
        .map((doc) => docToPin(doc.data() as Record<string, unknown>, doc.id))
      setPins(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '핀을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 뷰포트가 자주 바뀌므로 300ms 디바운스 적용
  const updateBounds = useCallback((bounds: Bounds) => {
    boundsRef.current = bounds
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetchPins(bounds)
    }, 300)
  }, [fetchPins])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { pins, loading, error, updateBounds }
}
