import { useEffect } from 'react'
import { TEAM_CONFIG } from '../data/teams'
import styles from './TodayGamesBar.module.css'

// "2026-06-02T18:30:00" → "18:30"
function timeText(iso) {
  if (!iso) return ''
  const m = iso.match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

function shortOf(teamKey) {
  return TEAM_CONFIG[teamKey]?.shortName || teamKey
}

// LED 스코어보드 한 칸 (원정 — 점수/vs — 홈 — 상태)
function GameCell({ game }) {
  const live     = game.status === 'LIVE'
  const finished = game.status === 'FINISHED'
  const canceled = game.status === 'CANCELED'
  const hasScore = (finished || live) && game.homeScore != null && game.awayScore != null

  let mid
  if (canceled) {
    mid = <span className={styles.vs}>취소</span>
  } else if (hasScore) {
    mid = (
      <span className={styles.score}>
        {game.awayScore}<span className={styles.colon}>:</span>{game.homeScore}
      </span>
    )
  } else {
    mid = <span className={styles.vs}>vs</span>
  }

  let status = null
  if (live)          status = <span className={styles.live}><span className={styles.liveDot} />LIVE</span>
  else if (finished) status = <span className={styles.fin}>종료</span>
  else if (!canceled) status = <span className={styles.time}>{timeText(game.startTime)}</span>

  return (
    <span
      className={`${styles.cell} ${canceled ? styles.cellOff : ''}`}
      title={`${game.awayTeam} vs ${game.homeTeam}${game.stadium ? ` @${game.stadium}` : ''}`}
    >
      <span className={styles.team}>{shortOf(game.awayTeam)}</span>
      {mid}
      <span className={styles.team}>{shortOf(game.homeTeam)}</span>
      {status}
    </span>
  )
}

/**
 * 오늘의 KBO 경기 — NOTICE 전광판 바로 아래에 스택되는 풀폭 LED 스코어보드 한 줄.
 * - 경기가 있을 때만 렌더링하며 --games-h CSS 변수로 사이드바 위치를 보정한다 (NOTICE 와 동일 패턴).
 * - NOTICE 가 없으면 --notice-h=0 이라 헤더 바로 아래로 자연스럽게 올라온다.
 */
function TodayGamesBar({ games = [] }) {
  const visible = games.length > 0

  useEffect(() => {
    document.documentElement.style.setProperty('--games-h', visible ? '36px' : '0px')
    return () => document.documentElement.style.setProperty('--games-h', '0px')
  }, [visible])

  if (!visible) return null

  return (
    <div className={styles.board} aria-label="오늘의 경기">
      {/* 좌측 고정 라벨 */}
      <div className={styles.label}>
        <span className={styles.labelIcon}>⚾</span>
        <span className={styles.labelText}>TODAY</span>
      </div>

      {/* 경기 칸 (가로 스크롤) */}
      <div className={styles.cells}>
        {games.map(g => (
          <GameCell key={g.gameId} game={g} />
        ))}
      </div>
    </div>
  )
}

export default TodayGamesBar
