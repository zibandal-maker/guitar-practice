import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 정적 배포(현재 index.html 대체 대상)와 동일하게 루트 상대 경로 사용.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      // 사운드폰트 등 대용량 애셋은 §1-1 단계에서 precache 목록에 추가.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        maximumFileSizeToCacheInBytes: 60 * 1024 * 1024,
      },
      manifest: {
        name: 'Guitar Practice Tracker',
        short_name: 'GuitarTracker',
        description: '기타 연습용 스케일·코드·리듬·백킹·솔로·플레이어',
        start_url: '.',
        display: 'standalone',
        background_color: '#0f1424',
        theme_color: '#5b6ef5',
        orientation: 'portrait-primary',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  server: { port: 5173 },
})
