# PLOT 개발 가이드라인

## 프로젝트 개요
장소와 동선을 매개로 한 프리미엄 공간 큐레이션 SNS.  
유저의 모든 기능(글 작성, 동선 생성, 스크랩, 탐색)은 **평생 100% 무료·무제한**이 핵심 원칙.

## 빌드 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 로컬 미리보기
```

## 기술 스택
- **Frontend**: React 18 + TypeScript + Vite 5
- **스타일**: Tailwind CSS v3 (PostCSS)
- **라우팅**: React Router v6
- **DB/Auth**: Firebase Firestore + Firebase Auth (Spark 무료 플랜)
- **스토리지**: Cloudflare R2 (이미지, 무료 10GB)
- **지도**: Kakao Map Web API (기본 무료 쿼터)
- **배포**: Cloudflare Pages

## 코드 스타일 규칙 (엄격 준수)

### 1. 정적 타이핑
- `any` 타입 사용 금지. 불확실한 타입은 `unknown` 후 narrowing.
- Props 인터페이스는 파일 상단에 명시적으로 선언.
- API 응답 타입은 `src/shared/types/` 에 모두 정의.

### 2. 컴포넌트 분리 원칙
- 단일 책임: 컴포넌트 하나는 하나의 UI 역할만.
- 150줄 초과 시 분리를 검토.
- 공통 UI(`Button`, `Modal` 등) → `src/components/`
- 도메인 UI(지도 핀, 피드 카드 등) → `src/features/<domain>/components/`

### 3. 커스텀 훅 패턴
- 비즈니스 로직·사이드이펙트는 컴포넌트 밖으로 분리 → `use*` 훅.
- 전역 공통 훅 → `src/hooks/`
- 특정 도메인 훅 → `src/features/<domain>/hooks/`

### 4. 외부 서비스 격리
- Firebase, R2, Map API 직접 호출은 `src/services/` 모듈에서만.
- 컴포넌트에서 `firebase.firestore()` 직접 호출 금지.

### 5. 환경변수
- API 키, 시크릿은 반드시 `.env.local`에. 코드에 하드코딩 절대 금지.
- 노출 가능한 키(`VITE_` prefix)와 서버 전용 키를 혼동하지 않기.
- `.env.example`을 항상 최신 상태로 유지.

### 6. 상업화 필드 격리
- 스폰서 핀, 어필리에이트 링크, 외부 송금 링크 관련 코드는  
  `src/features/map/` 또는 별도 `src/features/monetization/` 내에서만 관리.
- 유저 무료 기능 코드와 광고/수익 코드를 같은 컴포넌트에 혼재 금지.

## 폴더 구조

```
src/
├── assets/                   # 정적 이미지, 아이콘, 폰트
├── components/               # 공통 프리미엄 UI (Button, Modal, Drawer, Badge)
├── features/
│   ├── auth/                 # 로그인/회원가입, 프로필 관리
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services.ts       # Firebase Auth 래퍼
│   ├── feed/                 # 핀터레스트형 매거진 피드, 스크랩 카드
│   │   ├── components/
│   │   └── hooks/
│   └── map/                  # 지도 렌더링, 커스텀 핀, 동선 라인
│       ├── components/       # MapContainer, Pin, RouteLayer 등
│       │   └── MapContainer.tsx   # ← 지도 SDK 로딩 진입점
│       └── hooks/
├── hooks/                    # 전역 공통 훅 (useDebounce, useMediaQuery 등)
├── services/                 # Firebase, R2, Kakao Map API 모듈
│   ├── firebase.ts
│   ├── r2.ts
│   └── mapApi.ts
├── shared/
│   ├── types/                # 전역 타입 정의 (Plot, Pin, User 등)
│   ├── constants/            # 앱 전역 상수
│   └── utils/                # 순수 유틸 함수
├── App.tsx
└── main.tsx
```
