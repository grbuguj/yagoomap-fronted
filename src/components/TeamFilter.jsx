import { useState, useRef, useEffect } from 'react'
import { TEAMS, AVAILABLE_TEAMS } from '../data/teams'
import styles from './TeamFilter.module.css'

function TeamFilter({ selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const currentTeam = TEAMS.find(t => t.key === selected)
  const label = selected === '전체' ? '전체 구단' : (currentTeam?.key ?? '구단 선택')
  const dotColor = currentTeam?.color ?? null

  const handleSelect = (key) => {
    onSelect(key)
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {/* 트리거 버튼 */}
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.triggerLeft}>
          {dotColor && (
            <span className={styles.dot} style={{ background: dotColor }} />
          )}
          <span className={styles.triggerLabel}>{label}</span>
        </span>
        <span className={styles.arrow}>{open ? '▲' : '▼'}</span>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className={styles.dropdown}>
          {/* 전체 */}
          <button
            className={`${styles.option} ${selected === '전체' ? styles.optionActive : ''}`}
            onClick={() => handleSelect('전체')}
          >
            <span className={styles.optionDot} style={{ background: '#1a1a1a' }} />
            <span className={styles.optionName}>전체 구단</span>
          </button>

          <div className={styles.divider} />

          {/* 10개 팀 */}
          {TEAMS.map(team => {
            const isActive    = selected === team.key
            const isAvailable = AVAILABLE_TEAMS.includes(team.key)
            return (
              <button
                key={team.key}
                className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                onClick={() => handleSelect(team.key)}
              >
                <span className={styles.optionDot} style={{ background: team.color }} />
                <span className={styles.optionName}>{team.key}</span>
                {!isAvailable && (
                  <span className={styles.soon}>준비중</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TeamFilter
