/**
 * KBO 경기 일정 API. 백엔드(GET /api/games)에서 네이버 동기화 데이터를 받는다.
 * 실패 시 빈 배열 — 경기 정보는 부가 기능이라 앱 동작을 막지 않는다.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function getJsonArray(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return []
    const data = await r.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function fetchTodayGames() {
  return getJsonArray(`${BASE_URL}/api/games/today`)
}

export function fetchGamesByDate(date) {
  return getJsonArray(`${BASE_URL}/api/games?date=${encodeURIComponent(date)}`)
}
