import { useState, useRef, useEffect } from 'react'
import { TEAMS } from '../data/teams'
import styles from './TeamFilterDropdown.module.css'

/**
 * 구단 필터 드롭다운 (검색바 옆).
 * activeFilter: 'ALL' | 'FAV' | <teamKey>
 * - 가게가 1곳 이상인 구단만 노출
 * - 항목 앞에 팀 컬러 도트 표시
 * - "혼합 응원"은 별도 필터 없이 기본(전체)에 포함 (= 무표시 기본값)
 */
function TeamFilterDropdown({
  activeFilter,
  onChange,
  teamCounts = {},
  favoritesCount = 0,
  totalCount = 0,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // 바깥 클릭 / ESC 로 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 가게가 있는 구단만
  const teams = TEAMS.filter(t => (teamCounts[t.key] || 0) > 0)
  const activeTeam = TEAMS.find(t => t.key === activeFilter)

  // 트리거(현재 선택) 표시
  const trigger =
    activeFilter === 'FAV' ? { emoji: '⭐', dot: null, label: '찜' }
    : activeTeam           ? { emoji: null, dot: activeTeam.color, label: activeTeam.shortName }
    :                        { emoji: null, dot: null, label: '전체' }

  const pick = (key) => { onChange(key); setOpen(false) }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="구단 필터"
        onClick={() => setOpen(o => !o)}
      >
        {trigger.emoji && <span className={styles.triggerEmoji}>{trigger.emoji}</span>}
        {trigger.dot && <span className={styles.dot} style={{ background: trigger.dot }} />}
        <span className={styles.triggerLabel}>{trigger.label}</span>
        <svg
          className={`${styles.chevron}${open ? ' ' + styles.chevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel} role="listbox">
          <button
            type="button" role="option" aria-selected={activeFilter === 'ALL'}
            className={`${styles.option}${activeFilter === 'ALL' ? ' ' + styles.optionActive : ''}`}
            onClick={() => pick('ALL')}
          >
            <span className={styles.optIcon} />
            <span className={styles.optLabel}>전체</span>
            <span className={styles.optCount}>{totalCount}</span>
          </button>

          <button
            type="button" role="option" aria-selected={activeFilter === 'FAV'}
            className={`${styles.option}${activeFilter === 'FAV' ? ' ' + styles.optionActive : ''}`}
            onClick={() => pick('FAV')}
          >
            <span className={styles.optIcon}>⭐</span>
            <span className={styles.optLabel}>찜</span>
            <span className={styles.optCount}>{favoritesCount}</span>
          </button>

          {teams.length > 0 && <div className={styles.divider} />}

          {teams.map(t => (
            <button
              key={t.key} type="button" role="option" aria-selected={activeFilter === t.key}
              className={`${styles.option}${activeFilter === t.key ? ' ' + styles.optionActive : ''}`}
              onClick={() => pick(t.key)}
            >
              <span className={styles.optIcon}>
                <span className={styles.dot} style={{ background: t.color }} />
              </span>
              <span className={styles.optLabel}>{t.shortName}</span>
              <span className={styles.optCount}>{teamCounts[t.key] || 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamFilterDropdown
