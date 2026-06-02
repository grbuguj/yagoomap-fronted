import { TEAMS, TEAM_CONFIG, MIXED_TEAM, MIXED_COLOR, MIXED_EMOJI } from '../data/teams'
import styles from './TeamSelector.module.css'

// "2026-06-02T18:30:00" → "18:30"
function gameTime(iso) {
  if (!iso) return ''
  const m = iso.match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

// 팀 카드용 오늘 경기 뱃지 (코너 핀)
function GamePill({ game, teamKey }) {
  const oppKey   = game.homeTeam === teamKey ? game.awayTeam : game.homeTeam
  const oppShort = TEAM_CONFIG[oppKey]?.shortName || oppKey
  const live     = game.status === 'LIVE'
  const finished = game.status === 'FINISHED'
  const canceled = game.status === 'CANCELED'

  let text
  if (canceled)      text = '취소'
  else if (live)     text = 'LIVE'
  else if (finished) text = '종료'
  else               text = gameTime(game.startTime)

  return (
    <span
      className={`${styles.gamePill} ${live ? styles.gamePillLive : ''} ${canceled ? styles.gamePillCanceled : ''}`}
      title={`오늘 vs ${oppShort}`}
    >
      {live && <span className={styles.gamePillDot} />}
      {text}
    </span>
  )
}

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

function TeamSelector({ selectedTeams, onToggle, onConfirm, counts = {}, availableTeams = [], mixedCount = 0, favoritesCount = 0, onShowFavorites, gamesByTeam = {} }) {
  const mixedAvailable = mixedCount > 0
  const mixedSelected  = selectedTeams.includes(MIXED_TEAM)

  return (
    <div className={styles.wrap}>
      {/* 즐겨찾기 바로가기 */}
      <button
        type="button"
        className={styles.favBanner}
        onClick={onShowFavorites}
        disabled={favoritesCount === 0}
      >
        <span className={styles.favBannerIcon}>⭐</span>
        <span className={styles.favBannerBody}>
          <span className={styles.favBannerName}>즐겨찾기</span>
          <span className={styles.favBannerSub}>
            {favoritesCount > 0 ? `${favoritesCount}곳 저장됨` : '하트를 눌러 가게를 저장해보세요'}
          </span>
        </span>
        {favoritesCount > 0 && <span className={styles.favBannerArrow}>›</span>}
      </button>

      <p className={styles.heading}>⚾ 구단 선택</p>

      {/* 혼합 응원 — 상단 풀폭 배너 (모든 경기 중계 가게) */}
      <button
        className={`${styles.banner} ${mixedAvailable ? styles.cardAvailable : styles.cardSoon} ${mixedSelected ? styles.cardSelected : ''}`}
        onClick={() => mixedAvailable && onToggle(MIXED_TEAM)}
        disabled={!mixedAvailable}
        style={mixedSelected ? { borderColor: MIXED_COLOR, background: MIXED_COLOR + '0d' } : {}}
      >
        <span className={styles.bannerEmoji}>{MIXED_EMOJI}</span>
        <span className={styles.bannerBody}>
          <span className={styles.bannerName}>혼합 응원</span>
          <span className={styles.bannerSub}>
            {mixedAvailable ? `${mixedCount}곳 · 모든 구단 경기 중계` : '준비중'}
          </span>
        </span>
        {mixedAvailable && (
          <span
            className={styles.bannerListBtn}
            onClick={e => { e.stopPropagation(); onConfirm(MIXED_TEAM) }}
          >
            목록 보기 ›
          </span>
        )}
      </button>

      <div className={styles.grid}>
        {TEAMS.map(team => {
          const available = availableTeams.includes(team.key)
          const count     = counts[team.key] || 0
          const selected  = selectedTeams.includes(team.key)
          const game      = gamesByTeam[team.key]

          return (
            <button
              key={team.key}
              className={`${styles.card} ${available ? styles.cardAvailable : styles.cardSoon} ${selected ? styles.cardSelected : ''}`}
              onClick={() => available && onToggle(team.key)}
              disabled={!available}
              style={selected ? { borderColor: team.color, background: team.color + '0d' } : {}}
            >
              {game && <GamePill game={game} teamKey={team.key} />}
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
      </div>
    </div>
  )
}

export default TeamSelector
