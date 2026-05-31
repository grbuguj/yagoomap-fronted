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
const USE_MOCK = false

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
    naverMapUrl:    p.naverMapUrl   ?? null,        // 네이버맵 직접 링크
    instagramUrl:   p.instagramUrl  ?? null,        // 인스타그램 링크
    representativeImageUrl: p.representativeImageUrl ?? null, // 대표 이미지 URL
    photos:         Array.isArray(p.photos) ? p.photos : [], // 추가 사진 목록
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

  try {
    const res = await fetch(`${BASE_URL}/api/places`)
    if (!res.ok) throw new Error(`${res.status}`)

    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.data ?? data.content ?? [])

    // 백엔드 데이터가 아직 없으면 mock fallback
    if (list.length === 0) {
      console.warn('[야구맵] 백엔드 데이터 없음 → mock 데이터 사용')
      return [...VENUES]
    }

    return list.map(mapPlace)
  } catch (err) {
    console.warn('[야구맵] API 실패 → mock 데이터 사용:', err.message)
    return [...VENUES]
  }
}

/* ── 리뷰 조회 ──────────────────────────────────────────────────
 * 백엔드: GET /api/places/{venueId}/reviews
 * NOTE: API 미확정 → 실패 시 mock fallback
 */
export async function fetchReviews(venueId) {
  if (USE_MOCK) {
    return _reviewCache
      .filter(r => r.venueId === venueId)
      .sort((a, b) => b.id - a.id)
  }

  try {
    const res = await fetch(`${BASE_URL}/api/places/${venueId}/reviews`)
    if (!res.ok) throw new Error(`리뷰 조회 실패: ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : (data.data ?? data.content ?? [])
  } catch (err) {
    console.warn('[야구맵] 리뷰 API 실패 → mock 사용:', err.message)
    return _reviewCache
      .filter(r => r.venueId === venueId)
      .sort((a, b) => b.id - a.id)
  }
}

/* ── 리뷰 등록 ──────────────────────────────────────────────────
 * 백엔드: POST /api/places/{venueId}/reviews
 * Body: { rating: number, content: string }
 * NOTE: API 미확정 → 실패 시 mock fallback
 */
export async function submitReview({ venueId, rating, content }) {
  if (USE_MOCK) {
    const today = new Date()
    const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`
    const newReview = { id: _nextReviewId++, venueId, rating, content, createdAt: dateStr }
    _reviewCache = [newReview, ..._reviewCache]
    return newReview
  }

  try {
    const res = await fetch(`${BASE_URL}/api/places/${venueId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, content }),
    })
    if (!res.ok) throw new Error(`리뷰 등록 실패: ${res.status}`)
    return res.json()
  } catch (err) {
    console.warn('[야구맵] 리뷰 등록 API 실패 → mock 처리:', err.message)
    const today = new Date()
    const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`
    const newReview = { id: _nextReviewId++, venueId, rating, content, createdAt: dateStr }
    _reviewCache = [newReview, ..._reviewCache]
    return newReview
  }
}

/* ── 제보 ────────────────────────────────────────────────────────
 * 백엔드: POST /api/reports
 * Body: { placeName, address, teamId, team, content, referenceLink }
 */
export async function submitReport(data) {
  if (USE_MOCK) {
    console.log('[Mock] Report submitted:', data)
    return { success: true }
  }

  // 프론트 폼 필드명 → 백엔드 필드명 변환
  const body = {
    placeName:     data.name,
    address:       data.address,
    team:          data.team          || null,
    teamId:        data.teamId        ?? null,
    content:       data.content       || null,
    referenceLink: data.referenceLink ?? null,
  }

  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`제보 실패: ${res.status}`)
  return res.json()
}

/* ── 필터 메타데이터 ──────────────────────────────────────────────
 * 백엔드: GET /api/place-filters
 * 응답: { teams: [{teamId, team}], districts, categories, tags }
 */
export async function fetchFilters() {
  const res = await fetch(`${BASE_URL}/api/place-filters`)
  if (!res.ok) throw new Error(`필터 조회 실패: ${res.status}`)
  return res.json()
}
