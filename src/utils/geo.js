// 좌표 간 거리 계산 유틸 (인천 공공데이터 연계용)

/** 두 좌표 사이 거리(m) — haversine */
export function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371e3
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** items 중 (lat,lng)에서 가까운 순 n개 — dist(m) 필드 추가해 반환 */
export const nearest = (lat, lng, items, n = 1) =>
  [...items]
    .map(i => ({ ...i, dist: distanceM(lat, lng, i.lat, i.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)

/** 도보 소요시간(분) — 평균 보행속도 4km/h(약 67m/분) */
export const walkMin = dist => Math.max(1, Math.round(dist / 67))
