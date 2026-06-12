// 인천 매장 전용 "가는 길 + AI 직관 도우미" 섹션 — 인천시 공공데이터 연계
// · 최寄 도시철도역 + 도보시간 (인천교통공사_도시철도역사정보)
// · 최寄 공영주차장 (전국주차장정보표준데이터, 인천 필터)
// · AI 직관 도우미: 경기일정 × 교통 × 주차 종합 추천 (utils/aiCoach)
import { INCHEON_STATIONS } from '../data/incheonStations'
import { INCHEON_PARKING } from '../data/incheonParking'
import { nearest, walkMin } from '../utils/geo'
import { buildCoachTips } from '../utils/aiCoach'
import styles from './IncheonTransit.module.css'

const isIncheon = v => (v?.address ?? '').includes('인천')

export default function IncheonTransit({ venue, game }) {
  if (!venue || !isIncheon(venue) || !venue.lat || !venue.lng) return null

  const [station] = nearest(venue.lat, venue.lng, INCHEON_STATIONS)
  const [parking] = nearest(venue.lat, venue.lng, INCHEON_PARKING)
  const tips = buildCoachTips({ venue, game, station, parking })

  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span className={styles.title}>🚇 가는 길</span>
        <span className={styles.source}>인천시 공공데이터</span>
      </div>

      {station && (
        <div className={styles.row}>
          <span className={styles.icon}>🚉</span>
          <span className={styles.text}>
            <b>{station.name}역</b> ({station.line}
            {station.transfer ? ` · ${station.transfer} 환승` : ''})
            {' '}— 도보 약 {walkMin(station.dist)}분 ({station.dist.toLocaleString()}m)
          </span>
        </div>
      )}

      {parking && parking.dist <= 1200 && (
        <div className={styles.row}>
          <span className={styles.icon}>🅿️</span>
          <span className={styles.text}>
            <b>{parking.name}</b> — {parking.dist.toLocaleString()}m
            {parking.fee ? ` · ${parking.fee}` : ''}
            {parking.capacity ? ` · ${parking.capacity.toLocaleString()}면` : ''}
          </span>
        </div>
      )}

      {tips.length > 0 && (
        <div className={styles.coach}>
          <span className={styles.coachTitle}>🤖 AI 직관 도우미</span>
          {tips.map((tip, i) => (
            <p key={i} className={styles.coachTip}>{tip}</p>
          ))}
        </div>
      )}
    </div>
  )
}
