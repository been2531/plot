/** 지도 기본 중심 좌표 — 서울 시청 */
export const DEFAULT_MAP_CENTER = { lat: 37.5665, lng: 126.9780 } as const

/** 지도 기본 줌 레벨 (Kakao Map 기준: 1=최대 확대, 14=전국) */
export const DEFAULT_MAP_LEVEL = 5

/** Cloudflare R2 퍼블릭 도메인 — .env에서 오버라이드 가능 */
export const R2_BASE_URL = import.meta.env.VITE_R2_BASE_URL ?? ''

/** 피드 페이지당 로드할 플롯 수 */
export const FEED_PAGE_SIZE = 12
