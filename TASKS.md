# PLOT — 자율 개발 태스크 목록

클라우드 에이전트가 이 파일을 읽고, 미완료 태스크를 하나씩 구현한 뒤 `[x]`로 표시하고 커밋합니다.
새로운 태스크를 발굴하면 **Backlog** 섹션에 추가합니다.

---

## 규칙
- 에이전트는 한 번 실행 시 **태스크 1~2개**만 처리합니다 (품질 우선).
- 완료 처리: `[ ]` → `[x]`, 커밋 메시지에 태스크 번호 포함.
- 새 태스크 발굴 시 Backlog에 추가 후 우선순위 재정렬.
- 타입 에러·빌드 에러가 생기면 즉시 수정 후 커밋.

---

## In Progress
_현재 작업 중인 항목 (에이전트가 시작 시 여기로 이동)_

---

## Todo

### 기반 인프라

### 피드 기능

### 지도 기능
- [ ] T09: `src/features/map/components/MapPin.tsx` — 커스텀 핀 마커 컴포넌트 (일반 핀 / 스폰서 핀 구분)
- [ ] T10: `src/features/map/components/RouteLayer.tsx` — 핀 간 연결선(동선) 렌더링
- [ ] T11: `src/features/map/hooks/useMapPins.ts` — 지도 뷰포트 내 핀 데이터 Firestore 쿼리 훅
- [ ] T12: 플롯 생성 흐름 — 지도에서 장소 클릭 → 핀 추가 → 순서 정렬 → 저장

### 소셜 기능
- [ ] T13: `src/features/feed/components/PinCommentThread.tsx` — 핀 하단 스레드형 댓글 UI
- [ ] T14: 팔로우/팔로워 기능 — Firestore `users/{uid}/following` 컬렉션 구조 및 훅
- [ ] T15: 프로필 페이지 — 유저 플롯 목록, 팔로워 수, 스크랩 보드

### 상업화 필드
- [ ] T16: 크리에이터 후원 링크 필드 — 플롯 생성/편집 시 외부 링크(토스/포스타입) 입력 필드
- [ ] T17: 스폰서 핀 UI — 지도 핀에 스폰서 배지 표시 및 외부 링크 아웃 처리
- [ ] T18: 어필리에이트 링크 — 핀 상세에서 외부 예약 플랫폼 링크 연동 UI

---

## Backlog
_에이전트가 새 작업을 발굴하면 여기에 추가_

- 다크모드 / 라이트모드 토글
- 장소 검색 자동완성 (Kakao 로컬 API)
- 플롯 공유 링크 생성 (og:image 포함)
- Cloudflare R2 이미지 업로드 서비스 모듈
- PWA 설정 (manifest, service worker)

---

## Done
- [x] T00: Vite+React+TypeScript+Tailwind 스캐폴딩, SplitLayout, MapContainer 뼈대, CLAUDE.md, .env.example
- [x] T01: `src/services/firebase.ts` — Firebase 앱 초기화 및 Firestore/Auth 인스턴스 export
- [x] T02: `src/features/auth/hooks/useAuth.ts` — Firebase Auth 상태 구독 훅 (onAuthStateChanged)
- [x] T03: `src/features/auth/components/LoginModal.tsx` — Google OAuth 로그인 모달 UI
- [x] T04: React Router 설정 — `/`, `/explore`, `/profile/:uid`, `/plot/:id` 라우트 구조, Navbar 구현
- [x] T05: `src/features/feed/components/PlotCard.tsx` — 핀터레스트형 플롯 카드 (커버 이미지, 제목, 작성자, 스크랩 수)
- [x] T06: `src/features/feed/components/FeedGrid.tsx` — CSS Masonry 그리드 피드 레이아웃
- [x] T07: `src/features/feed/hooks/useFeed.ts` — Firestore `plots` 컬렉션 페이지네이션 훅
- [x] T08: 스크랩 기능 — 플롯 카드의 [북마크] 버튼 → Firestore `users/{uid}/scraps` 저장
