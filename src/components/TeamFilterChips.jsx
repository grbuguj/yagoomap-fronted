import { TEAMS, MIXED_EMOJI } from '../data/teams'
import styles from './TeamFilterChips.module.css'

function Chip({ label, count, active, accent, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`${styles.chip}${active ? ' ' + styles.chipActive : ''}`}
      style={active ? { background: accent, borderColor: accent } : undefined}
      onClick={onClick}
    >
      {label}
      {count > 0 && <span className={styles.count}>{count}</span>}
    </button>
  )
}

/**
 * 구단/모드 필터 칩 한 줄 (가로 스크롤).
 * activeFilter: 'ALL' | 'FAV' | 'MIXED' | <teamKey>
 * 가게가 1곳 이상인 구단만 칩으로 노출한다.
 */
function TeamFilterChips({
  activeFilter,
  onChange,
  teamCounts = {},
  mixedCount = 0,
  favoritesCount = 0,
  totalCount = 0,
}) {
  return (
    <div className={styles.bar} role="tablist" aria-label="구단 필터">
      <Chip
        label="전체" count={totalCount} accent="#2b2b2b"
        active={activeFilter === 'ALL'} onClick={() => onChange('ALL')}
      />
      <Chip
        label="⭐ 찜" count={favoritesCount} accent="#f5a623"
        active={activeFilter === 'FAV'} onClick={() => onChange('FAV')}
      />
      {mixedCount > 0 && (
        <Chip
          label={`${MIXED_EMOJI} 혼합`} count={mixedCount} accent="#6b7280"
          active={activeFilter === 'MIXED'} onClick={() => onChange('MIXED')}
        />
      )}
      {TEAMS.filter(t => (teamCounts[t.key] || 0) > 0).map(t => (
        <Chip
          key={t.key} label={t.shortName} count={teamCounts[t.key] || 0} accent={t.color}
          active={activeFilter === t.key} onClick={() => onChange(t.key)}
        />
      ))}
    </div>
  )
}

export default TeamFilterChips
