import { TEAMS, MIXED_TEAM, MIXED_COLOR, MIXED_EMOJI } from '../data/teams'
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

function TeamSelector({ selectedTeams, onToggle, onConfirm, counts = {}, availableTeams = [], mixedCount = 0 }) {
  const mixedAvailable = mixedCount > 0
  const mixedSelected  = selectedTeams.includes(MIXED_TEAM)

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>⚾ 구단 선택</p>
      <div className={styles.grid}>
        {TEAMS.map(team => {
          const available = availableTeams.includes(team.key)
          const count     = counts[team.key] || 0
          const selected  = selectedTeams.includes(team.key)

          return (
            <button
              key={team.key}
              className={`${styles.card} ${available ? styles.cardAvailable : styles.cardSoon} ${selected ? styles.cardSelected : ''}`}
              onClick={() => available && onToggle(team.key)}
              disabled={!available}
              style={selected ? { borderColor: team.color, background: team.color + '0d' } : {}}
            >
              {selected && (
                <span className={styles.check} style={{ background: team.color }}>✓</span>
              )}
              <span className={styles.emoji}>{TEAM_EMOJI[team.key]}</span>
              <span
                className={styles.badge}
                style={{ background: available ? team.color : '#ccc' }}
              >
                {team.shortName}
              </span>
              <span className={styles.teamName}>{team.key}</span>
              <span className={styles.count}>
                {available ? `${count}곳 등록` : '준비중'}
              </span>

              {/* 목록 보기 버튼 (가용 팀만) */}
              {available && (
                <span
                  className={styles.listBtn}
                  onClick={e => { e.stopPropagation(); onConfirm(team.key) }}
                >
                  목록 보기 ›
                </span>
              )}
            </button>
          )
        })}

        {/* 혼합 응원 — 특정 구단 전용이 아닌, 모든 경기 중계 가게 */}
        <button
          className={`${styles.card} ${mixedAvailable ? styles.cardAvailable : styles.cardSoon} ${mixedSelected ? styles.cardSelected : ''}`}
          onClick={() => mixedAvailable && onToggle(MIXED_TEAM)}
          disabled={!mixedAvailable}
          style={mixedSelected ? { borderColor: MIXED_COLOR, background: MIXED_COLOR + '0d' } : {}}
        >
          {mixedSelected && (
            <span className={styles.check} style={{ background: MIXED_COLOR }}>✓</span>
          )}
          <span className={styles.emoji}>{MIXED_EMOJI}</span>
          <span
            className={styles.badge}
            style={{ background: mixedAvailable ? MIXED_COLOR : '#ccc' }}
          >
            혼합
          </span>
          <span className={styles.teamName}>혼합 응원</span>
          <span className={styles.count}>
            {mixedAvailable ? `${mixedCount}곳 등록` : '준비중'}
          </span>

          {mixedAvailable && (
            <span
              className={styles.listBtn}
              onClick={e => { e.stopPropagation(); onConfirm(MIXED_TEAM) }}
            >
              목록 보기 ›
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

export default TeamSelector
