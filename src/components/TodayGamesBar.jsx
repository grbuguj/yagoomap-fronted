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
function colorOf(teamKey) {
  return TEAM_CONFIG[teamKey]?.color || '#444'
}

function GameChip({ game }) {
  const live     = game.status === 'LIVE'
  const finished = game.status === 'FINISHED'
  const canceled = game.status === 'CANCELED'
  const hasScore = (finished || live) && game.homeScore != null && game.awayScore != null

  let center
  if (canceled) {
    center = <span className={styles.canceled}>취소</span>
  } else if (hasScore) {
    center = <span className={styles.score}>{game.awayScore}<span className={styles.colon}>:</span>{game.homeScore}</span>
  } else {
    center = <span className={styles.time}>{timeText(game.startTime)}</span>
  }

  const metaRight = live
    ? (game.statusInfo || '경기중')
    : finished
      ? '종료'
      : (game.stadium || '')

  return (
    <div
      className={`${styles.chip} ${canceled ? styles.chipCanceled : ''}`}
      title={`${game.awayTeam} vs ${game.homeTeam}${game.stadium ? ` @${game.stadium}` : ''}`}
    >
      <span className={styles.teams}>
        <span className={styles.team} style={{ color: colorOf(game.awayTeam) }}>{shortOf(game.awayTeam)}</span>
        {center}
        <span className={styles.team} style={{ color: colorOf(game.homeTeam) }}>{shortOf(game.homeTeam)}</span>
      </span>
      <span className={styles.meta}>
        {live && <span className={styles.liveDot} />}
        {metaRight}
      </span>
    </div>
  )
}

/** 오늘의 KBO 경기 가로 스크롤 스트립. 경기 없으면 렌더 안 함. */
function TodayGamesBar({ games = [] }) {
  if (!games.length) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.headIcon}>⚾</span>
        <span className={styles.headText}>오늘의 경기</span>
      </div>
      <div className={styles.scroller}>
        {games.map(g => (
          <GameChip key={g.gameId} game={g} />
        ))}
      </div>
    </div>
  )
}

export default TodayGamesBar
