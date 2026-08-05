# Guitar Practice Tracker (Vite + React)

기타 연습 종합 웹앱. 스케일/포지션, 백킹(코드진행 커스텀 에디터·코드별 지판),
솔로, 코드, 리듬, 플레이어(구간반복) 제공. 모듈화된 소스 구조.

## 개발
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 정적 빌드
```

## 배포 (Vercel)
`vercel.json`이 Vite 빌드(`npm run build` → `dist/`)를 지정합니다.
GitHub 푸시 시 Vercel이 자동 빌드/배포합니다.

## 구조
`src/lib` 공유코어 · `src/hooks` · `src/data` · `src/features/{scales,backing,solo,chords,rhythm,player}` · `src/ui`
