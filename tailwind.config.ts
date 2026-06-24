import type { Config } from 'tailwindcss'

const config: Config = {
  // Tailwind가 스캔할 파일 범위 — 이 범위 밖의 클래스는 프로덕션 번들에서 제거됨
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // PLOT 브랜드 컬러 팔레트
      colors: {
        'plot-black':  '#0D0D0D',
        'plot-white':  '#F7F5F2',
        'plot-sage':   '#8B9E7B',
        'plot-clay':   '#C4846A',
        'plot-mist':   '#D6DDE8',
      },
      fontFamily: {
        // 추후 한국어 프리미엄 폰트로 교체 예정 (Noto Serif KR 등)
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
