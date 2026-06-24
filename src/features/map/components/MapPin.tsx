import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { Pin } from '@/shared/types'
import type { KakaoMapInstance, KakaoCustomOverlay } from '@/features/map/kakao-maps'

interface MapPinProps {
  pin: Pin
  map: KakaoMapInstance
  /** 핀 클릭 시 호출 */
  onClick?: (pin: Pin) => void
  /** 선택된(활성) 핀 여부 */
  isActive?: boolean
  /** 동선 내 순서 번호 (1-based). 없으면 표시 안 함 */
  order?: number
}

/** 일반 핀 마커 버블 */
function PinBubble({
  pin,
  isActive,
  order,
  onClick,
}: {
  pin: Pin
  isActive: boolean
  order?: number
  onClick: () => void
}) {
  if (pin.isSponsor) {
    return (
      <button
        onClick={onClick}
        className={`
          relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
          border shadow-lg transition-all duration-150 cursor-pointer select-none
          ${isActive
            ? 'bg-amber-400 border-amber-300 text-black scale-110'
            : 'bg-amber-500/90 border-amber-400/60 text-black hover:scale-105'
          }
        `}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">AD</span>
        <span className="text-xs font-semibold max-w-[80px] truncate">{pin.name}</span>
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0
          border-l-4 border-r-4 border-t-4
          border-l-transparent border-r-transparent
          border-t-amber-500/90" />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-8 h-8 rounded-full border-2 shadow-lg
        transition-all duration-150 cursor-pointer select-none
        ${isActive
          ? 'bg-plot-clay border-white scale-125 shadow-plot-clay/40'
          : 'bg-plot-black/80 border-white/40 hover:border-white hover:scale-110 backdrop-blur-sm'
        }
      `}
    >
      {order !== undefined ? (
        <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white/80'}`}>
          {order}
        </span>
      ) : (
        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-white/60'}`} />
      )}
      <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0
        border-l-[5px] border-r-[5px] border-t-[6px]
        border-l-transparent border-r-transparent
        ${isActive ? 'border-t-plot-clay' : 'border-t-white/40'}`}
      />
    </button>
  )
}

/**
 * Kakao Map CustomOverlay 위에 React 컴포넌트를 마운트하는 핀.
 * map prop이 바뀌면 오버레이를 재생성한다.
 */
export default function MapPin({ pin, map, onClick, isActive = false, order }: MapPinProps) {
  const overlayRef = useRef<KakaoCustomOverlay | null>(null)
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)

  useEffect(() => {
    if (!window.kakao?.maps) return

    const container = document.createElement('div')
    const root = createRoot(container)
    rootRef.current = root

    const position = new window.kakao.maps.LatLng(pin.lat, pin.lng)
    const overlay = new window.kakao.maps.CustomOverlay({
      position,
      content: container,
      yAnchor: 1.4,
      zIndex: isActive ? 10 : 1,
    })

    root.render(
      <PinBubble
        pin={pin}
        isActive={isActive}
        order={order}
        onClick={() => onClick?.(pin)}
      />,
    )

    overlay.setMap(map)
    overlayRef.current = overlay

    return () => {
      overlay.setMap(null)
      setTimeout(() => root.unmount(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // isActive / order 변경 시 리렌더만
  useEffect(() => {
    rootRef.current?.render(
      <PinBubble
        pin={pin}
        isActive={isActive}
        order={order}
        onClick={() => onClick?.(pin)}
      />,
    )
  }, [pin, isActive, order, onClick])

  return null
}
