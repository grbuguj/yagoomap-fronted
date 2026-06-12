// AI 직관 도우미 — 경기일정 + 인천 교통·주차 공공데이터를 종합해 관람 코스 추천 코멘트 생성
// (규칙 기반 추천 엔진. 추후 LLM 프록시 연동 시 buildCoachTips 출력을 프롬프트 컨텍스트로 사용)
import { walkMin } from './geo'
import { TEAM_CONFIG } from '../data/teams'

const timeOf = iso => {
  const m = (iso ?? '').match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

/**
 * @returns {string[]} 추천 코멘트 목록 (0~3개)
 */
export function buildCoachTips({ venue, game, station, parking }) {
  const tips = []
  const walk = station ? walkMin(station.dist) : null

  // ① 경기 상황 × 교통 코스 추천
  if (game) {
    const teamKey  = venue.team
    const oppKey   = game.homeTeam === teamKey ? game.awayTeam : game.homeTeam
    const oppShort = TEAM_CONFIG[oppKey]?.shortName || oppKey
    const isHome   = game.homeTeam === teamKey

    if (game.status === 'LIVE') {
      tips.push(
        station
          ? `지금 ${oppShort}전 경기 중! ${station.name}역에서 도보 ${walk}분 — 바로 합류해서 응원할 수 있어요.`
          : `지금 ${oppShort}전 경기 중! 바로 합류해서 응원할 수 있어요.`
      )
    } else if (game.status !== 'FINISHED' && game.status !== 'CANCELED') {
      const t = timeOf(game.startTime)
      tips.push(
        station
          ? `오늘 ${t} ${oppShort}전(${isHome ? '홈' : '원정'}) — 경기 시작 30분 전 ${station.name}역(${station.line}) 도착 → 도보 ${walk}분이면 첫 회부터 함께할 수 있어요.`
          : `오늘 ${t} ${oppShort}전(${isHome ? '홈' : '원정'}) — 경기 전 미리 자리 잡는 걸 추천해요.`
      )
    }
  } else {
    tips.push('오늘은 경기가 없는 날 — 한적하게 다녀가기 좋은 타이밍이에요.')
  }

  // ② 문학경기장(SSG 랜더스필드) 인접 시나리오
  if (station?.name === '문학경기장' && station.dist <= 1500) {
    tips.push('SSG 랜더스필드 바로 옆 — 직관 전 모임이나 경기 후 뒤풀이 장소로 최적이에요.')
  }

  // ③ 주차 전략
  if (parking && parking.dist <= 1200) {
    tips.push(
      parking.capacity >= 500
        ? `차로 온다면 ${parking.name}(${parking.capacity.toLocaleString()}면) 추천 — ${parking.dist.toLocaleString()}m 거리예요.`
        : `${parking.name}(${parking.capacity ? `${parking.capacity}면` : '소형'})은 경기일 만차 가능성이 있어요 — 대중교통이 더 편할 수 있어요.`
    )
  }

  return tips.slice(0, 3)
}
