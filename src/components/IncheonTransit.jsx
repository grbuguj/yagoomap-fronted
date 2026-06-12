// 인천 매장 전용 "가는 길 + AI 직관 도우미" 섹션 — 인천시 공공데이터 연계
// · 최寄 도시철도역 + 도보시간 (인천교통공사_도시철도역사정보)
// · 최寄 공영주차장 (전국주차장정보표준데이터, 인천 필터)
// · 실시간 버스 도착 (인천광역시_도착정보 조회 — 정류소 데이터 채워지면 자동 활성화)
// · AI 직관 도우미: 경기일정 × 날씨(기상청) × 교통 × 주차 종합 추천 (utils/aiCoach)
import { useState, useEffect, useMemo } from 'react'
import { INCHEON_STATIONS } from '../data/incheonStations'
import { INCHEON_PARKING } from '../data/incheonParking'
import { nearest, walkMin } from '../utils/geo'
import { buildCoachTips } from '../utils/aiCoach'
import { fetchBusArrival, fetchEveningWeather } from '../api/incheonApi'
import styles from './IncheonTransit.module.css'

const isIncheon = v => (v?.address ?? '').includes('인천')

export default function IncheonTransit({ venue, game }) {
  const active = !!venue && isIncheon(venue) && !!venue.lat && !!venue.lng
  const [weather, setWeather] = useState(null)
  const [arrivals, setArrivals] = useState([])

  const station = useMemo(
    () => (active ? nearest(venue.lat, venue.lng, INCHEON_STATIONS)[0] : null),
    [active, venue?.lat, venue?.lng])
  const parking = useMemo(
    () => (active ? nearest(venue.lat, venue.lng, INCHEON_PARKING)[0] : null),
    [active, venue?.lat, venue?.lng])
  // 정류소 7,085개는 무거워서 lazy-load (인천 매장 열 때만 별도 청크로 로드)
  const [busStop, setBusStop] = useState(null)
  useEffect(() => {
    if (!active) { setBusStop(null); return }
    let on = true
    import('../data/incheonBusStops').then(({ INCHEON_BUS_STOPS }) => {
      if (!on || INCHEON_BUS_STOPS.length === 0) return
      const [s] = nearest(venue.lat, venue.lng, INCHEON_BUS_STOPS)
      setBusStop(s && s.dist <= 500 ? s : null) // 500m 이내 정류소만
    }).catch(() => {})
    return () => { on = false }
  }, [active, venue?.lat, venue?.lng])

  // 날씨 (기상청 단기예보 — 프록시 미배포 시 조용히 생략)
  useEffect(() => {
    if (!active) return
    let on = true
    fetchEveningWeather(venue.lat, venue.lng)
      .then(w => { if (on) setWeather(w) })
      .catch(() => {})
    return () => { on = false }
  }, [active, venue?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 실시간 버스 도착 (정류소 데이터 + 프록시 준비 시 자동 활성화)
  useEffect(() => {
    if (!busStop) { setArrivals([]); return }
    let on = true
    fetchBusArrival(busStop.id)
      .then(list => { if (on) setArrivals(list) })
      .catch(() => {})
    return () => { on = false }
  }, [busStop?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null

  const tips = buildCoachTips({ venue, game, station, parking, weather })

  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <span className={styles.title}>🚇 가는 길</span>
        <span className={styles.source}>인천시 공공데이터</span>
      </div>

      {station && (
        <div className={styles.row}>
          <span className={styles.rowIcon}>🚉</span>
          <div className={styles.rowBody}>
            <div className={styles.rowMain}>
              <b className={styles.rowName}>{station.name}역</b>
              <span className={styles.rowMeta}>도보 {walkMin(station.dist)}분 · {station.dist.toLocaleString()}m</span>
            </div>
            <div className={styles.rowSub}>
              {station.line}{station.transfer ? ` · ${station.transfer} 환승` : ''}
            </div>
          </div>
        </div>
      )}

      {parking && parking.dist <= 1200 && (
        <div className={styles.row}>
          <span className={styles.rowIcon}>🅿️</span>
          <div className={styles.rowBody}>
            <div className={styles.rowMain}>
              <b className={styles.rowName}>{parking.name}</b>
              <span className={styles.rowMeta}>{parking.dist.toLocaleString()}m</span>
            </div>
            <div className={styles.rowSub}>
              {[parking.fee, parking.capacity ? `${parking.capacity.toLocaleString()}면` : null]
                .filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {busStop && arrivals.length > 0 && (
        <div className={styles.row}>
          <span className={styles.rowIcon}>🚌</span>
          <div className={styles.rowBody}>
            <div className={styles.rowMain}>
              <b className={styles.rowName}>{busStop.name}</b>
              <span className={styles.live}>● 실시간</span>
              <span className={styles.rowMeta}>{busStop.dist}m</span>
            </div>
            <div className={styles.pills}>
              {arrivals.map((b, i) => (
                <span key={i} className={`${styles.pill} ${b.minutes <= 3 ? styles.pillSoon : ''}`}>
                  <b>{b.route ? `${b.route}번` : '버스'}</b>
                  <span className={styles.pillTime}>{b.minutes <= 1 ? '곧 도착' : `${b.minutes}분`}</span>
                  {b.stopsAway != null && b.stopsAway > 0 && (
                    <span className={styles.pillStops}>{b.stopsAway}정거장</span>
                  )}
                </span>
              ))}
            </div>
          </div>
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
