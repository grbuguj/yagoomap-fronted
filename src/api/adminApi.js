/**
 * 관리자 API 레이어
 *
 * venueApi.js 와 동일한 BASE_URL 전략 사용.
 *   운영: VITE_API_BASE_URL = https://api.야구맵.kr (백엔드 HTTPS + CORS)
 *   로컬: env 미설정 → '' → vite 프록시(/api → localhost:8081)
 *
 * 명세서 기준 (2026-05-31 확인). 백엔드 필드명이 바뀌면 이 파일만 수정.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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

/* ── 리뷰 관리 ───────────────────────────────────────────────────
 * GET /api/places/{placeId}/reviews
 * 응답: [{ id, placeId, content, rating, createdAt, active }]
 * (사용자용 조회 API와 동일 엔드포인트를 관리자 화면에서 재사용)
 */
export function fetchPlaceReviews(placeId) {
  return request(`/api/places/${placeId}/reviews`)
}

/* DELETE /api/places/{placeId}/reviews/{reviewId} → 200/204
 * 부적절한 리뷰 삭제. 삭제 후 해당 가게 평균 평점·리뷰 수 갱신됨.
 */
export function deleteReview(placeId, reviewId) {
  return request(`/api/places/${placeId}/reviews/${reviewId}`, { method: 'DELETE' })
}

/* ── 구단 목록 (teamId 매핑 소스) ────────────────────────────────
 * GET /api/place-filters
 * ⚠️ 명세는 teams:[{teamId,team}] 였으나 실제 응답은 teams:["LG 트윈스"] (문자열 배열).
 *    백엔드가 객체 형태로 주면 그대로 사용하고, 문자열이면 아래 매핑으로 teamId 보강.
 *    (라이브 데이터 확인: LG=1, 한화=2, 롯데=3)
 */
const KBO_TEAM_IDS = {
  'LG 트윈스': 1,
  '한화 이글스': 2,
  '롯데 자이언츠': 3,
  // 그 외 구단 ID는 백엔드 확인 필요. place-filters가 {teamId,team} 객체를 주면 자동 대체됨.
}

export async function fetchTeams() {
  const data = await request('/api/place-filters')
  const raw = Array.isArray(data?.teams) ? data.teams : []
  return raw.map(t =>
    typeof t === 'string'
      ? { team: t, teamId: KBO_TEAM_IDS[t] ?? null }
      : { team: t.team, teamId: t.teamId }
  )
}

/* ── 운영 통계 (사용자 행동 이벤트 집계) ─────────────────────────
 * GET /api/admin/stats?days=  (기본 7일, 1~90)
 * 응답: AdminStats {
 *   generatedAt, rangeDays, totalEvents, eventsToday, eventsInRange,
 *   dauToday, activeSessionsInRange, kakaoClicks, naverClicks,
 *   reportSubmits, reviewWrites,
 *   byType:      [{ type, count }],
 *   topVenues:   [{ placeId, name, count }],
 *   topKeywords: [{ keyword, count }],
 *   referrers:   [{ referrer, count }],
 *   dailyTrend:  [{ date, count }]
 * }
 */
export function fetchStats(days = 7) {
  return request(`/api/admin/stats${qs({ days })}`)
}

/* ── 서버 상태 / 빌드 정보 (Spring Boot Actuator) ────────────────
 * /actuator 는 /api 하위가 아니므로 로컬에선 vite proxy(/actuator)로 전달된다.
 * 대시보드가 깨지지 않도록 실패해도 throw 하지 않고 null/추정값을 반환.
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/actuator/health`)
    const data = await res.json().catch(() => null)
    return data ?? { status: res.ok ? 'UP' : 'DOWN' }
  } catch {
    return null // 네트워크 실패 → 상태 알 수 없음
  }
}

export async function fetchInfo() {
  try {
    const res = await fetch(`${BASE_URL}/actuator/info`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/* ── 공지사항 ─────────────────────────────────────────────────
 * GET  /api/notice          → { content, active }   (공개)
 * PUT  /api/admin/notice    → { content, active }   (관리자)
 */
export function fetchNotice() {
  return request('/api/notice')
}

export function updateNotice({ content, active }) {
  return request('/api/admin/notice', { method: 'PUT', body: { content, active } })
}
