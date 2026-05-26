/**
 * API 추상화 레이어
 * Mock → 실제 API 교체 시 이 파일만 수정하면 됨
 *
 * TODO: 실제 연동 시
 *   const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
 *   fetch(`${BASE_URL}/api/...`) 로 교체
 */

import { VENUES } from '../data/venues'
import { MOCK_REVIEWS } from '../data/reviews'

// 런타임에 추가된 리뷰를 메모리에 보관 (새로고침 시 초기화)
let _reviewCache = [...MOCK_REVIEWS]
let _nextReviewId = _reviewCache.length + 1

/* ── 가게 목록 ─────────────────────────────────────────────── */
export async function fetchVenues({ team, area, keyword } = {}) {
  // TODO: replace with real API
  // const res = await fetch(`${BASE_URL}/api/venues?team=${team}&area=${area}&keyword=${keyword}`)
  // return res.json()

  let results = [...VENUES]
  if (team && team !== '전체') results = results.filter(v => v.team === team)
  if (area && area !== '전체')  results = results.filter(v => v.area === area)
  if (keyword?.trim()) {
    const kw = keyword.trim().toLowerCase()
    results = results.filter(v =>
      v.name.toLowerCase().includes(kw) ||
      v.address.toLowerCase().includes(kw)
    )
  }
  return results
}

/* ── 제보 ────────────────────────────────────────────────────── */
export async function submitReport(data) {
  // TODO: replace with real API
  // const res = await fetch(`${BASE_URL}/api/reports`, { method: 'POST', body: JSON.stringify(data) })
  // return res.json()
  console.log('[Mock] Report submitted:', data)
  return { success: true }
}

/* ── 리뷰 조회 ──────────────────────────────────────────────── */
export async function fetchReviews(venueId) {
  // TODO: replace with real API
  // const res = await fetch(`${BASE_URL}/api/venues/${venueId}/reviews`)
  // return res.json()
  return _reviewCache
    .filter(r => r.venueId === venueId)
    .sort((a, b) => b.id - a.id)   // 최신순
}

/* ── 리뷰 등록 ──────────────────────────────────────────────── */
export async function submitReview({ venueId, rating, content }) {
  // TODO: replace with real API
  // const res = await fetch(`${BASE_URL}/api/venues/${venueId}/reviews`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ rating, content }),
  // })
  // return res.json()
  const today = new Date()
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`
  const newReview = {
    id: _nextReviewId++,
    venueId,
    rating,
    content,
    createdAt: dateStr,
  }
  _reviewCache = [newReview, ..._reviewCache]
  console.log('[Mock] Review submitted:', newReview)
  return newReview
}
