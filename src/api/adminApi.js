/**
 * 관리자 API 레이어
 *
 * venueApi.js 와 동일하게 상대경로(/api/*) 사용 → CloudFront 가 백엔드(EC2)로 프록시.
 * 절대경로(http://EC2:8081)로 박으면 HTTPS 페이지에서 Mixed Content 차단됨.
 *
 * 명세서 기준 (2026-05-31 확인). 백엔드 필드명이 바뀌면 이 파일만 수정.
 */

const BASE_URL = ''

// ── 공통 fetch 래퍼 ─────────────────────────────────────────────
async function request(path, { method = 'GET', body } = {}) {
  const opts = { method, headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  const res = await fetch(`${BASE_URL}${path}`, opts)
  if (!res.ok) {
    let msg = `${res.status}`
    try {
      const err = await res.json()
      msg = err.message || err.error || msg
    } catch { /* 본문 없음 */ }
    throw new Error(msg)
  }

  // 204 No Content
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// 쿼리스트링 빌더 (null/undefined/'' 자동 제외)
function qs(params = {}) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') sp.append(k, v)
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/* ── 대시보드 ────────────────────────────────────────────────────
 * GET /api/admin/dashboard
 * 응답: { placeCount, reportCount, pendingReportCount, reviewCount,
 *         recentPlaces: [{ id, name, team, status, createdAt }] }
 */
export function fetchDashboard() {
  return request('/api/admin/dashboard')
}

/* ── 제보 관리 ───────────────────────────────────────────────────
 * GET /api/admin/reports?status=&keyword=
 * 응답: [{ id, placeName, address, teamId, team, content,
 *          referenceLink, createdAt, status, rejectReason }]
 */
export function fetchReports({ status, keyword } = {}) {
  return request(`/api/admin/reports${qs({ status, keyword })}`)
}

/* POST /api/admin/reports/{reportId}/approve
 * body: { name, address, latitude, longitude, teamId, team }
 */
export function approveReport(reportId, payload) {
  return request(`/api/admin/reports/${reportId}/approve`, {
    method: 'POST',
    body: payload,
  })
}

/* POST /api/admin/reports/{reportId}/reject
 * body: { reason }
 */
export function rejectReport(reportId, reason) {
  return request(`/api/admin/reports/${reportId}/reject`, {
    method: 'POST',
    body: { reason },
  })
}

/* ── 검수 후보 (크롤링) ──────────────────────────────────────────
 * GET /api/admin/crawl-candidates?status=&source=&keyword=
 * 응답: [{ id, source, sourceId, keyword, name, address, roadAddress,
 *          phone, mapLink, categoryName, categoryGroupCode, latitude,
 *          longitude, distanceMeters, collectedAt, status, duplicateReason }]
 */
export function fetchCandidates({ status, source, keyword } = {}) {
  return request(`/api/admin/crawl-candidates${qs({ status, source, keyword })}`)
}

/* POST /api/admin/crawl-candidates  (수동 등록)
 * body: { name, address, roadAddress, phone, categoryName, latitude, longitude, mapLink }
 */
export function registerCandidate(payload) {
  return request('/api/admin/crawl-candidates', {
    method: 'POST',
    body: payload,
  })
}

/* POST /api/admin/crawl-candidates/{candidateId}/approve
 * body: { name, address, latitude, longitude, teamId, team, note, tags[] }
 */
export function approveCandidate(candidateId, payload) {
  return request(`/api/admin/crawl-candidates/${candidateId}/approve`, {
    method: 'POST',
    body: payload,
  })
}

/* POST /api/admin/crawl-candidates/{candidateId}/reject
 * body: { reason }
 */
export function rejectCandidate(candidateId, reason) {
  return request(`/api/admin/crawl-candidates/${candidateId}/reject`, {
    method: 'POST',
    body: { reason },
  })
}

/* ── 카카오 장소 검색 / 수집 ─────────────────────────────────────
 * GET /api/admin/kakao/places?query=&categoryGroupCode=&longitude=
 *      &latitude=&radius=&rect=&page=&size=&sort=
 * 응답: [{ source, sourceId, keyword, name, address, roadAddress, phone,
 *          mapLink, categoryName, categoryGroupCode, latitude, longitude,
 *          distanceMeters, status }]
 */
export function searchKakaoPlaces(params = {}) {
  return request(`/api/admin/kakao/places${qs(params)}`)
}

/* POST /api/admin/kakao/places/collect
 * body: { query, categoryGroupCode, longitude, latitude, radius, rect, page, size, sort }
 * → 검수 후보로 저장 (id, collectedAt, status, duplicateReason 포함)
 */
export function collectKakaoPlaces(payload) {
  return request('/api/admin/kakao/places/collect', {
    method: 'POST',
    body: payload,
  })
}

/* ── 장소 관리 ───────────────────────────────────────────────────
 * GET /api/admin/places?status=&teamId=&keyword=&district=
 * 응답: [{ id, name, team, teamId, address, status, createdAt, updatedAt }]
 */
export function fetchAdminPlaces({ status, teamId, keyword, district } = {}) {
  return request(`/api/admin/places${qs({ status, teamId, keyword, district })}`)
}

/* POST /api/places
 * body: { kakaoPlaceId, name, address, latitude, longitude, teamId, team,
 *         category, categoryName, categoryGroupCode, phone, instagramUrl,
 *         naverMapUrl, photos[], note, tags[], status }
 * → 201 place
 */
export function createPlace(payload) {
  return request('/api/places', { method: 'POST', body: payload })
}

/* PATCH /api/places/{placeId}
 * body: { name, address, latitude, longitude, teamId, team, category,
 *         phone, instagramUrl, naverMapUrl, photos[], note, tags[], status }
 */
export function updatePlace(placeId, payload) {
  return request(`/api/places/${placeId}`, { method: 'PATCH', body: payload })
}

/* DELETE /api/places/{placeId} → 204 */
export function deletePlace(placeId) {
  return request(`/api/places/${placeId}`, { method: 'DELETE' })
}

/* ── 구단 목록 (teamId 매핑 소스) ────────────────────────────────
 * GET /api/place-filters → { teams: [{ teamId, team }], districts, categories, tags }
 * teamId 는 하드코딩하지 않고 백엔드 필터에서 가져온다.
 */
export async function fetchTeams() {
  const data = await request('/api/place-filters')
  return Array.isArray(data?.teams) ? data.teams : []
}
