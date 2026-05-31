import { TEAMS, MIXED_TEAM, MIXED_EMOJI } from '../data/teams'
import styles from './TeamSelector.module.css'

const TEAM_EMOJI = {
  'LG 트윈스':    '⚡',
  'KIA 타이거즈':  '🐯',
  '롯데 자이언츠': '🏟️',
  '삼성 라이온즈': '🦁',
  '두산 베어스':   '🐻',
  'KT 위즈':      '🧙',
  'SSG 랜더스':   '🚀',
  'NC 다이노스':   '🦖',
  '한화 이글스':   '🦅',
  '키움 히어로즈': '🦸',
}

function TeamSelector({ onConfirm, counts = {}, availableTeams = [], mixedCount = 0 }) {
  const mixedAvailable = mixedCount > 0

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>⚾ 구단 선택</p>

      {/* 혼합 응원 — 모든 경기 중계 가게 (상단 풀폭 배너) */}
      <button
        className={`${styles.banner} ${mixedAvailable ? styles.bannerOn : styles.bannerSoon}`}
        onClick={() => mixedAvailable && onConfirm(MIXED_TEAM)}
        disabled={!mixedAvailable}
      >
        <span className={styles.bannerEmoji}>{MIXED_EMOJI}</span>
        <span className={styles.bannerText}>
          <span className={styles.bannerName}>혼합 응원</span>
          <span className={styles.bannerSub}>모든 구단 경기 중계</span>
        </span>
        <span className={styles.bannerRight}>
          {mixedAvailable
            ? <><span className={styles.bannerCount}>{mixedCount}곳</span><span className={styles.bannerGo}>보기 ›</span></>
            : <span className={styles.bannerCount}>준비중</span>}
        </span>
      </button>

      {/* 구단 카드 — 탭하면 바로 그 구단 목록 */}
      <div className={styles.grid}>
        {TEAMS.map(team => {
          const available = availableTeams.includes(team.key)
          const count     = counts[team.key] || 0

          return (
            <button
              key={team.key}
              className={`${styles.card} ${available ? styles.cardAvailable : styles.cardSoon}`}
              onClick={() => available && onConfirm(team.key)}
              disabled={!available}
            >
              <span className={styles.emoji}>{TEAM_EMOJI[team.key]}</span>
              <span className={styles.cardText}>
                <span className={styles.teamName}>{team.key}</span>
                <span className={styles.count}>
                  {available ? `${count}곳 등록` : '준비중'}
                </span>
              </span>
              {available && <span className={styles.cardArrow}>›</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TeamSelector
