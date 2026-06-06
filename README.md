<div align="center">

<img src="public/logo.png" alt="야구맵 로고" width="96" />

# 야구맵 ⚾

**전국 야구 중계 술집을 지도에서 바로 찾아보세요.**

내가 응원하는 구단의 경기를 틀어주는 가게를, 카카오맵 위에서 한눈에.

[![서비스 바로가기](https://img.shields.io/badge/LIVE-야구맵.kr-2b8a3e?style=for-the-badge)](https://야구맵.kr)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![Kakao Maps](https://img.shields.io/badge/Kakao_Maps-SDK-FFCD00?logo=kakao&logoColor=000)
![Deploy](https://img.shields.io/badge/Deploy-S3_+_CloudFront-FF9900?logo=amazonaws&logoColor=white)

</div>

---

## 📖 소개

**야구맵**은 KBO 경기를 중계하는 전국의 술집·매장을 지도에서 찾아주는 웹 서비스입니다.
"오늘 LG 경기 보면서 한잔할 곳"을 구단 필터 한 번으로 찾을 수 있고, 오늘의 경기 일정과 실시간 접속자까지 한 화면에서 확인할 수 있습니다.

이 저장소는 **프론트엔드(웹 클라이언트)** 코드입니다. 백엔드 API 서버는 👉 [`jiin-jung/yagoomap-backend`](https://github.com/jiin-jung/yagoomap-backend) 에 있습니다.

## ✨ 주요 기능

| | 기능 | 설명 |
|---|---|---|
| 🗺️ | **카카오맵 매장 지도** | 구단별 필터 · 지도 범위 재검색 · 내 위치 이동 · 매장 마커 인터랙션 |
| ⚾ | **오늘의 KBO 경기 바** | 상단 LED 스코어보드에 오늘 경기를 표시하고, 매장 카드/상세와 연동 |
| 📢 | **NOTICE 전광판** | LED 스타일 공지 배너 + heartbeat 기반 **실시간 접속자 수** |
| ⭐ | **즐겨찾기** | 관심 매장을 로컬에 저장하고 전용 필터로 모아보기 |
| 🔍 | **검색 · 구단 필터** | 매장명/주소 검색 + 10개 구단 드롭다운 필터 |
| 📝 | **리뷰 & AI 요약** | 매장별 리뷰와 요약 정보 표시 |
| 🛠️ | **관리자 대시보드** | `/admin` — 매장·공지·리뷰 관리 + 사용자 이벤트 모니터링 패널 |
| 📈 | **이벤트 분석** | 페이지 진입·검색·필터·매장 조회 등 사용자 행동 수집 |
| 🔎 | **SEO 최적화** | 메타/OG/트위터 카드 · JSON-LD 구조화 데이터 · sitemap · robots |
| 📱 | **반응형 UI** | 모바일 바텀시트 스와이프 등 모바일 우선 레이아웃 |

## 🧰 기술 스택

- **프레임워크** — React 19 + React Router 7
- **빌드 도구** — Vite 8 (`@vitejs/plugin-react`)
- **스타일** — CSS Modules (`*.module.css`)
- **지도** — Kakao Maps JavaScript SDK
- **린트** — ESLint 10 (`react-hooks`, `react-refresh`)
- **배포** — GitHub Actions → AWS S3 + CloudFront

## 🚀 시작하기

### 1. 설치

```bash
git clone https://github.com/grbuguj/yagoomap-fronted.git
cd yagoomap-fronted
npm install
```

### 2. 환경 변수 (선택)

백엔드와 실제로 연동할 때만 설정합니다. **없으면 자동으로 mock 데이터로 동작**하므로 백엔드 없이도 바로 개발할 수 있어요.

```bash
cp .env.local.example .env.local
```

| 변수 | 설명 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 API 주소 (예: 로컬 `http://localhost:8081`). 미설정 시 mock 데이터 사용 |

> 카카오맵 SDK는 `index.html`에 포함되어 있습니다. 다른 도메인에서 사용하려면 [Kakao Developers](https://developers.kakao.com)에서 발급한 JavaScript 키로 교체하고 플랫폼 도메인을 등록하세요.

### 3. 실행

```bash
npm run dev       # 개발 서버 → http://localhost:5173
npm run build     # 프로덕션 빌드 → dist/
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint 검사
```

> 로컬 개발 시 `/api`, `/actuator` 요청은 Vite 프록시를 통해 백엔드(`localhost:8081`)로 전달됩니다. (`vite.config.js`)

## 🗂️ 프로젝트 구조

```
yagoomap-fronted/
├─ public/              # 정적 자산 (favicon, og-image, sitemap, robots)
├─ api/                 # 서버리스 함수 (네이버 이미지 검색 프록시)
├─ src/
│  ├─ main.jsx          # 라우터 진입점 (/ , /admin)
│  ├─ App.jsx           # 메인 지도 화면 (검색·필터·매장·지도 통합)
│  ├─ admin/            # 관리자 대시보드 (게이트 · 페이지 · mock)
│  ├─ api/              # API 클라이언트 (venue · games · admin · events)
│  ├─ components/       # UI 컴포넌트 (KakaoMap, NoticeBar, TodayGamesBar …)
│  ├─ data/             # 정적 데이터 (teams · venues · reviews)
│  └─ hooks/            # 커스텀 훅 (useFavorites …)
├─ vite.config.js       # 빌드 · 개발 프록시 설정
└─ .github/workflows/   # 배포 파이프라인
```

라우팅은 두 갈래입니다 — `/*` 는 메인 지도 화면(`App`), `/admin/*` 은 관리자 대시보드(`AdminGate`).

## ☁️ 배포

`main` 브랜치에 push하면 **GitHub Actions**가 자동으로 배포합니다.

```
push → npm ci → npm run build (VITE_API_BASE_URL 주입)
     → AWS S3 업로드 → CloudFront 캐시 무효화
```

`index.html`은 항상 최신을 받도록 no-cache, 해시가 붙은 정적 자산(JS/CSS)은 장기 캐시로 설정됩니다. (`.github/workflows/deploy-frontend.yml`)

## 🔗 백엔드

API 서버는 별도 저장소에서 관리합니다.

| | 저장소 | 스택 |
|---|---|---|
| 백엔드 | [`jiin-jung/yagoomap-backend`](https://github.com/jiin-jung/yagoomap-backend) | Spring Boot · MySQL · Redis |

## 👥 팀 · 횃불이유괴단

| 역할 | 담당 | 저장소 |
|---|---|---|
| 프론트엔드 | [@grbuguj](https://github.com/grbuguj) | 현재 저장소 |
| 백엔드 | [@jiin-jung](https://github.com/jiin-jung) | [yagoomap-backend](https://github.com/jiin-jung/yagoomap-backend) |

---

<div align="center">
<sub>⚾ 야구 보러 가는 길, 야구맵과 함께 — <a href="https://야구맵.kr">야구맵.kr</a></sub>
</div>
