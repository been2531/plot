// ─── 핵심 도메인 타입 정의 ───────────────────────────────────────────────────
// 이 파일이 서비스 전체의 데이터 계약. Firestore 컬렉션 구조와 1:1 대응.

/** 지도 위의 단일 장소 핀 */
export interface Pin {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  imageUrl?: string
  /** 스폰서 핀 여부 — 광고 필드, 유저 생성 핀과 분리 */
  isSponsor: boolean
  sponsorLinkUrl?: string
  /** 어필리에이트 예약 링크 (아고다, 클룩 등) */
  affiliateUrl?: string
  comments: PinComment[]
}

/** 핀 하단의 스레드형 짧은 댓글 */
export interface PinComment {
  id: string
  authorId: string
  authorName: string
  text: string
  createdAt: Date
}

/** 여러 핀을 이은 하나의 동선 스토리 */
export interface Plot {
  id: string
  title: string
  description?: string
  authorId: string
  authorName: string
  pins: Pin[]
  /** 핀 연결 순서 (순서 변경 시 pinIds만 업데이트) */
  pinIds: string[]
  tags: string[]
  coverImageUrl?: string
  /** 크리에이터 외부 후원 링크 (토스, 포스타입 등) — 플랫폼 정산 없음 */
  creatorSupportUrl?: string
  isPublic: boolean
  scrapCount: number
  createdAt: Date
  updatedAt: Date
}

/** 유저 프로필 */
export interface UserProfile {
  uid: string
  displayName: string
  photoUrl?: string
  bio?: string
  followersCount: number
  followingCount: number
  plotCount: number
  createdAt: Date
}
