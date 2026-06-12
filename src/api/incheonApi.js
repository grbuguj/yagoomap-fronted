// 인천 공공데이터 실시간 API 클라이언트 (버스도착 + 기상청 날씨)
// 프록시 경유: 기본은 백엔드(BASE_URL)/api/* — images.js와 동일 경로 규칙.
// Vercel 함수로 쓰려면 VITE_PROXY_BASE_URL=https://yagoomap-fronted.vercel.app 설정.
import { latLngToGrid } from '../utils/kmaGrid'
import { ROUTE_NO } from '../data/incheonBusRoutes'

const PROXY =
  import.meta.env.VITE_PROXY_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  ''

/** 정류소 실시간 버스 도착정보 → [{ route, minutes, stopsAway }] (도착 임박순) */
export async function fetchBusArrival(bstopId) {
  const res = await fetch(`${PROXY}/api/busArrival?bstopId=${encodeURIComponent(bstopId)}`)
  if (!res.ok) throw new Error(`busArrival ${res.status}`)
  const xml = new DOMParser().parseFromString(await res.text(), 'application/xml')
  const pick = (el, ...tags) => {
    for (const t of tags) {
      const v = el.getElementsByTagName(t)[0]?.textContent?.trim()
      if (v) return v
    }
    return null
  }
  // 응답 필드 (실응답 검증됨): ARRIVALESTIMATETIME(초), ROUTEID, REST_STOP_COUNT 등.
  // 노선번호(ROUTENO)는 미제공 → ROUTE_NO 매핑(인천광역시_버스노선 현황)으로 변환.
  const items = [...xml.getElementsByTagName('itemList'), ...xml.getElementsByTagName('item')]
  return items
    .map(el => {
      const sec = Number(pick(el, 'ARRIVALESTIMATETIME', 'arrivalEstimateTime'))
      const routeId = pick(el, 'ROUTEID', 'routeId')
      const stops = Number(pick(el, 'REST_STOP_COUNT', 'restStopCount'))
      return {
        route: ROUTE_NO[routeId] ?? null, // 매핑 없으면 번호 없이 표시
        minutes: Number.isFinite(sec) ? Math.max(1, Math.round(sec / 60)) : null,
        stopsAway: Number.isFinite(stops) ? stops : null,
      }
    })
    .filter(b => b.minutes != null)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 3)
}

/** 오늘 저녁(17~21시) 예보 요약 → { pop, pty, tmp } (강수확률%, 강수형태코드, 기온℃) */
export async function fetchEveningWeather(lat, lng) {
  const { nx, ny } = latLngToGrid(lat, lng)
  const res = await fetch(`${PROXY}/api/weather?nx=${nx}&ny=${ny}`)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const json = await res.json()
  const items = json?.response?.body?.items?.item ?? []

  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  const today = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`
  const evening = ['1700', '1800', '1900', '2000', '2100']
  const grab = cat => items
    .filter(i => i.category === cat && i.fcstDate === today && evening.includes(i.fcstTime))
    .map(i => Number(i.fcstValue))
    .filter(Number.isFinite)

  const pops = grab('POP'), ptys = grab('PTY'), tmps = grab('TMP')
  if (!pops.length && !ptys.length) return null
  return {
    pop: pops.length ? Math.max(...pops) : null,           // 저녁 최대 강수확률
    pty: ptys.length ? Math.max(...ptys) : 0,               // 0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기
    tmp: tmps.length ? Math.round(tmps.reduce((a, b) => a + b) / tmps.length) : null,
  }
}
