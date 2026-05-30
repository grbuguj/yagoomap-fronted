/**
 * API 추상화 레이어
 *
 * 환경변수 VITE_API_BASE_URL 이 설정된 경우 → 실제 백엔드 API 호출
 * 설정 안 된 경우(로컬 개발, 백엔드 미실행) → mock 데이터 fallback
 *
 * 백엔드 필드명이 프론트와 다를 경우 → mapPlace() 함수만 수정
 */

import { VENUES }       from '../data/venues'
import { MOCK_REVIEWS } from '../data/reviews'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

// ── 개발 환경 판단 ──────────────────────────────────────────────
// VITE_API_BASE_URL 환경변수가 없으면 mock 사용 (로컬에서 백엔드 없이 개발 시)
// 로컬에서 실제 백엔드 연동하려면 .env.local 에 VITE_API_BASE_URL=http://localhost:8081 추가
const USE_MOCK = !import.meta.env.VITE_API_BASE_URL && import.meta.env.DEV

// ── 백엔드 응답 → 프론트 Venue 형식 변환 ────────────────────────
// GET /api/places 응답 기준 (2026-05-30 확인된 필드명)
function mapPlace(p) {
  return {
    id:             p.id,
    name:           p.name,
    team:           p.team,                         // "LG 트윈스" 풀네임
    address:        p.roadAddress ?? p.address,     // 도로명주소 우선
    lat:            p.latitude,                     // ← 백엔드 필드명
    lng:            p.longitude,                    // ← 백엔드 필드명
    phone:          p.phone        ?? null,
    rating:         p.rating       ?? 0,
    reviewCount:    p.reviewCount  ?? 0,
    category:       p.category     ?? null,
    tags:           Array.isArray(p.tags) ? p.tags : [],
    note:           p.note         ?? null,
    kakaoPlaceUrl:  p.kakaoPlaceUrl ?? null,        // 카카오맵 직접 링크
    district:       p.district     ?? null,         // 지역구 (향후 지역 필터용)
  }
}

// ── mock 리뷰 캐시 (실제 API 붙으면 미사용) ─────────────────────
let _reviewCache = [...MOCK_REVIEWS]
let _nextReviewId = _reviewCache.length + 1

/* ── 가게 전체 목록 ─────────────────────────────────────────────
 * 백엔드: GET /api/places
 * 응답: Place[] (전체, 페이지네이션 없음)
 * 필터링은 클라이언트에서 수행
 */
export async function fetchVenues() {
  if (USE_MOCK) {
    return [...VENUES]
  }

  const res = await fetch(`${BASE_URL}/api/places`)
  if (!res.ok) throw new Error(`가게 목록 조회 실패: ${res.status}`)

  const data = await res.json()
  // 배열 직접 응답 또는 { data: [...] } / { content: [...] } wrapping 모두 대응
  const list = Array.isArray(data) ? data : (data.data ?? data.content ?? [])
  return list.map(mapPlace)
}

/* ── 리뷰 조회 ──────────────────────────────────────────────────
 * 백엔드: GET /api/places/{venueId}/reviews
 */
export async function fetchReviews(venueId) {
  if (USE_MOCK) {
    return _reviewCache
      .filter(r => r.venueId === venueId)
      .sort((a, b) => b.id - a.id)
  }

  const res = await fetch(`${BASE_URL}/api/places/${venueId}/reviews`)
  if (!res.ok) throw new Error(`리뷰 조회 실패: ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? data.content ?? [])
}

/* ── 리뷰 등록 ──────────────────────────────────────────────────
 * 백엔드: POST /api/places/{venueId}/reviews
 * Body: { rating: number, content: string }
 */
export async function submitReview({ venueId, rating, content }) {
  if (USE_MOCK) {
    const today = new Date()
    const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`
    const newReview = { id: _nextReviewId++, venueId, rating, content, createdAt: dateStr }
    _reviewCache = [newReview, ..._reviewCache]
    return newReview
  }

  const res = await fetch(`${BASE_URL}/api/places/${venueId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, content }),
  })
  if (!res.ok) throw new Error(`리뷰 등록 실패: ${res.status}`)
  return res.json()
}

/* ── 제보 ────────────────────────────────────────────────────────
 * 백엔드: POST /api/reports
 */
export async function submitReport(data) {
  if (USE_MOCK) {
    console.log('[Mock] Report submitted:', data)
    return { success: true }
  }

  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`제보 실패: ${res.status}`)
  return res.json()
}
