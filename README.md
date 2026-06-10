# 🎸 Guitar Practice Tracker

기타 연습용 단일 페이지 웹앱. 스케일/포지션, 코드 다이어그램, 리듬 트레이너, 플레이어를 제공합니다.

- **외부 의존성 없음** — React가 HTML에 인라인되어 있어 네트워크 요청이 없습니다.
- **데이터는 브라우저에 저장** — IndexedDB(음악 파일)와 localStorage(설정·기록)에 저장되며 서버가 필요 없습니다.
- **순수 정적 사이트** — 빌드 단계가 없습니다.

## Vercel 배포 방법

### 방법 A — Vercel CLI (가장 빠름)

```bash
npm i -g vercel        # 최초 1회
cd vercel-deploy
vercel                 # 미리보기 배포 (프롬프트 따라가기)
vercel --prod          # 프로덕션 배포
```

### 방법 B — GitHub 연동

1. 이 폴더(`vercel-deploy`)의 내용을 GitHub 저장소에 푸시
2. [vercel.com](https://vercel.com) → **Add New → Project** → 해당 저장소 선택
3. Framework Preset: **Other** (빌드 설정 불필요)
4. **Deploy** 클릭

### 방법 C — 드래그앤드롭

[vercel.com/new](https://vercel.com/new) 에서 이 폴더를 통째로 드래그하면 즉시 배포됩니다.

## 구성 파일

| 파일 | 용도 |
|---|---|
| `index.html` | 앱 본체 (단일 파일, React 인라인) |
| `vercel.json` | 정적 배포 설정 (캐시·보안 헤더) |
| `package.json` | 프로젝트 메타데이터 |

## 로컬에서 미리보기

빌드가 없으므로 파일을 브라우저로 직접 열어도 되고, 정적 서버를 띄워도 됩니다.

```bash
npx serve vercel-deploy
# 또는
python3 -m http.server 3000 --directory vercel-deploy
```

## 참고

- 마이크/오디오 재생과 IndexedDB는 보안상 `https://` 또는 `localhost`에서 동작합니다. Vercel은 자동으로 HTTPS를 제공하므로 배포 후엔 문제 없습니다.
- 데이터는 사용자 브라우저에만 저장됩니다. 다른 기기·브라우저와 동기화되지 않습니다.
