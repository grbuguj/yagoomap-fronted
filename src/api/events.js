/**
 * 사용자 행동 이벤트 수집 (analytics) — fire-and-forget
 *
 * 백엔드: POST /api/events → 202 Accepted (응답 본문 없음, 비동기 적재)
 *
 * 설계 원칙
 *  - 절대 throw 하지 않는다. 수집 실패가 사용자 경험에 영향을 주면 안 된다.
 *  - 개인 식별 정보를 보내지 않는다. sessionId 는 익명 난수(브라우저 단위 묶음용).
 *  - keepalive: true 로 탭 전환/외부 링크 이동 직전에도 전송이 끊기지 않게 한다.
 *
 * BASE_URL 전략은 venueApi.js / adminApi.js 와 동일.
 *   운영: VITE_API_BASE_URL = https://api.야구맵.kr (CORS 허용됨)
 *   로컬: '' → vite 프록시(/api → localhost:8081)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// 백엔드 EventType enum 과 1:1 매칭. 오타 방지를 위해 상수로 관리.
export const EVENT = {
  PAGE_VIEW:     'PAGE_VIEW',
  SEARCH:        'SEARCH',
  VIEW_VENUE:    'VIEW_VENUE',
  FILTER_TEAM:   'FILTER_TEAM',
  CLICK_KAKAO:   'CLICK_KAKAO',
  CLICK_NAVER:   'CLICK_NAVER',
  SUBMIT_REPORT: 'SUBMIT_REPORT',
  WRITE_REVIEW:  'WRITE_REVIEW',
  SHARE:         'SHARE',
}

const SID_KEY = 'yagoomap_sid'

// 익명 세션 ID — 브라우저 localStorage 에 1회 생성해 재사용 (개인 식별 아님)
function sessionId() {
  try {
    let sid = localStorage.getItem(SID_KEY)
    if (!sid) {
      sid = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 64)
      localStorage.setItem(SID_KEY, sid)
    }
    return sid
  } catch {
    // 시크릿 모드 등 storage 차단 시 → 세션 묶음 없이 진행
    return null
  }
}

// 유입 경로: ?utm_source 우선, 없으면 외부 referrer 호스트. 내부 이동은 제외.
function detectReferrer() {
  try {
    const utm = new URLSearchParams(window.location.search).get('utm_source')
    if (utm) return utm.slice(0, 64)
    const ref = document.referrer
    if (ref) {
      const host = new URL(ref).hostname
      if (host && host !== window.location.hostname) return host.slice(0, 64)
    }
  } catch {
    /* noop */
  }
  return null
}

// 최초 진입 시 1회만 계산해 세션 동안 고정 (SPA 내부 이동으로 referrer 가 바뀌지 않게)
const REFERRER = detectReferrer()

/**
 * 이벤트 전송. 어떤 상황에서도 예외를 던지지 않는다.
 * @param {string} type   EVENT.* 중 하나
 * @param {{placeId?: number, keyword?: string, team?: string}} [payload]
 */
export function sendEvent(type, payload = {}) {
  if (!type) return
  try {
    const body = JSON.stringify({
      type,
      placeId:   payload.placeId ?? null,
      keyword:   payload.keyword ?? null,
      team:      payload.team ?? null,
      sessionId: sessionId(),
      referrer:  REFERRER,
      path:      window.location.pathname,
    })
    fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* fire-and-forget: 실패 무시 */ })
  } catch {
    /* 직렬화/네트워크 준비 단계 오류도 무시 */
  }
}
