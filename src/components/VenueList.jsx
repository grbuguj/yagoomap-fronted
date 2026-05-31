import { useState, useEffect } from 'react'
import { TEAM_CONFIG, isMixedTeam } from '../data/teams'
import styles from './VenueList.module.css'

// venueApi.js 와 동일한 BASE_URL 전략 (운영: api 도메인, 로컬: vite 프록시)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// 앱 수명 동안 유지되는 썸네일 캐시
const thumbCache = new Map()

// 네이버 API 동시 요청 제한 큐 (max 3 concurrent)
const imgQueue = {
  running: 0,
  max: 3,
  pending: [],
  async add(fn) {
    if (this.running < this.max) {
      this.running++
      try { return await fn() } finally { this.running--; this._next() }
    }
    return new Promise((res, rej) => this.pending.push({ fn, res, rej }))
  },
  _next() {
    if (this.pending.length && this.running < this.max) {
      const { fn, res, rej } = this.pending.shift()
      this.running++
      fn().then(res, rej).finally(() => { this.running--; this._next() })
    }
  },
}

function VenueThumb({ name, teamColor }) {
  const [url, setUrl] = useState(() => thumbCache.get(name) ?? null)

  useEffect(() => {
    if (thumbCache.has(name)) {
      setUrl(thumbCache.get(name))
      return
    }
    let cancelled = false
    imgQueue.add(() => {
      // 백엔드 이미지 검색이 느리거나 504면 빠르게 포기하고 placeholder로 (큐 점유 방지)
      const ctrl  = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 6000)
      return fetch(`${API_BASE}/api/images?query=${encodeURIComponent(name)}`, { signal: ctrl.signal })
        .then(r => r.ok ? r.json() : [])
        .then(items => {
          const imgUrl = items[0]?.thumbnail ?? null
          thumbCache.set(name, imgUrl)
          if (!cancelled) setUrl(imgUrl)
        })
        .catch(() => { thumbCache.set(name, null) })
        .finally(() => clearTimeout(timer))
    })
    return () => { cancelled = true }
  }, [name])

  if (url) {
    return <img src={url} alt={name} className={styles.thumb} />
  }
  return (
    <div className={styles.thumbPlaceholder} style={{ background: teamColor + '18' }}>
      <span style={{ color: teamColor }}>🍺</span>
    </div>
  )
}

function Stars({ rating }) {
  // 리뷰 없는(평점 0) 가게는 "신규" 칩으로 — 0.0이 저평가처럼 보이는 것 방지
  if (!rating || rating <= 0) {
    return <span className={styles.newTag}>신규</span>
  }
  return (
    <span className={styles.stars}>
      ★ <span>{rating.toFixed(1)}</span>
    </span>
  )
}

function VenueList({ venues, selectedTeams = [], onSelect, onOpenSelector }) {
  // 단일 팀 선택 시 그 팀 컬러, 아니면 기본
  const singleTeam = selectedTeams.length === 1 ? TEAM_CONFIG[selectedTeams[0]] : null
  const teamColor  = singleTeam?.color || 'var(--clr-primary)'

  const headerLabel = selectedTeams.length === 0
    ? '전체 구단'
    : selectedTeams.length === 1
      ? selectedTeams[0]
      : `${selectedTeams.length}개 구단`

  if (venues.length === 0) {
    return (
      <>
        <div className={styles.listHeader}>
          <button className={styles.backBtn} onClick={onOpenSelector}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {headerLabel}
          </button>
          <span className={styles.headerCount}>0곳</span>
        </div>
        <div className={styles.empty}>
          <span>⚾</span>
          <p>검색 결과가 없어요</p>
          <small>다른 검색어나 필터를 시도해보세요</small>
        </div>
      </>
    )
  }

  return (
    <ul className={styles.list}>
      <li className={styles.listHeader}>
        <button className={styles.backBtn} onClick={onOpenSelector}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {headerLabel}
        </button>
        <span className={styles.headerCount}>{venues.length}곳</span>
      </li>

      {venues.map(venue => {
        const vTeamColor = TEAM_CONFIG[venue.team]?.color || teamColor
        const mixed      = isMixedTeam(venue.team)
        return (
        <li key={venue.id} className={styles.item} onClick={() => onSelect(venue)}>
          <div className={styles.itemLeft}>
            <VenueThumb name={venue.name} teamColor={vTeamColor} />
          </div>
          <div className={styles.itemBody}>
            <div className={styles.nameRow}>
              <span className={styles.nameWrap}>
                <span className={styles.name}>{venue.name}</span>
                {mixed && <span className={styles.mixedTag}>🍻 혼합</span>}
              </span>
              <Stars rating={venue.rating} />
            </div>
            <p className={styles.address}>{venue.address}</p>
          </div>
          <span className={styles.arrow}>›</span>
        </li>
        )
      })}
    </ul>
  )
}

export default VenueList
