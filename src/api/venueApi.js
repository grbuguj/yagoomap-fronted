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
// BASE_URL이 로컬호스트이고 DEV 모드면 mock 사용
const USE_MOCK = BASE_URL.includes('localhost') && import.meta.env.DEV

// ── 백엔드 응답 → 프론트 Venue 형식 변환 ────────────────────────
// 백엔드 필드명 확정 후 여기만 수정하면 됨
function mapPlace(p) {
  return {
    id:          p.id,
    name:        p.name,
    team:        p.team,                        // "LG 트윈스" 풀네임 기대
    address:     p.address,
    lat:         p.lat          ?? p.latitude,  // lat 또는 latitude
    lng:         p.lng          ?? p.longitude, // lng 또는 longitude
    phone:       p.phone        ?? null,
    rating:      p.rating       ?? 0,
    reviewCount: p.reviewCount  ?? p.review_count ?? 0,
    category:    p.category     ?? null,
    tags:        Array.isArray(p.tags) ? p.tags : [],
    note:        p.note         ?? null,
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
