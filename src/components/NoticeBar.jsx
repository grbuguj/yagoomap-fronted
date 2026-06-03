import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import styles from './NoticeBar.module.css'
import { getSessionId } from '../api/events'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const PING_INTERVAL = 25_000 // 25초마다 heartbeat (백엔드 윈도우 75초)

/**
 * LED 전광판 스타일 공지 배너.
 * - 활성 공지가 있을 때만 렌더링하며 --notice-h CSS 변수를 조정해 사이드바 레이아웃에 반영한다.
 * - 뷰포트 폭에 맞춰 텍스트를 reps 개씩 두 묶음 반복하고 translateX(-50%) 로 끊김 없이 루프한다.
 * - 우측에 실시간 접속자 수를 표시한다 (presence heartbeat + 폴링).
 */
export default function NoticeBar() {
  const [notice, setNotice] = useState(null)
  const [liveCount, setLiveCount] = useState(null)
  const [reps, setReps] = useState(2)        // 메시지 반복 횟수 (뷰포트 폭에 맞춰 계산)
  const viewportRef = useRef(null)
  const unitRef = useRef(null)

  useEffect(() => {
    fetch(`${BASE_URL}/api/notice`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => setNotice(data))
      .catch(() => setNotice({ content: null, active: false }))
  }, [])

  const text = notice?.content?.trim() || ''
  const visible = !!(notice?.active && text)

  // --notice-h CSS 변수로 사이드바 위치 보정
  useEffect(() => {
    document.documentElement.style.setProperty('--notice-h', visible ? '36px' : '0px')
    return () => document.documentElement.style.setProperty('--notice-h', '0px')
  }, [visible])

  // 실시간 접속자: 배너가 보일 때만 heartbeat (공지는 전역이라 모든 접속자가 동시에 카운트됨)
  useEffect(() => {
    if (!visible) return
    let alive = true
    const ping = () => {
      fetch(`${BASE_URL}/api/active-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getSessionId() }),
        keepalive: true,
      })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (alive && d && typeof d.count === 'number') setLiveCount(d.count) })
        .catch(() => {})
    }
    ping()
    const id = setInterval(ping, PING_INTERVAL)
    return () => { alive = false; clearInterval(id) }
  }, [visible])

  // 뷰포트를 항상 채우도록 메시지 반복 횟수 계산 (한 유닛이 뷰포트보다 좁으면 여러 번 반복)
  useLayoutEffect(() => {
    if (!visible) return
    const compute = () => {
      const vw = viewportRef.current?.offsetWidth || 0
      const uw = unitRef.current?.offsetWidth || 0
      if (!vw || !uw) return
      setReps(Math.max(2, Math.min(24, Math.ceil(vw / uw) + 1)))
    }
    compute()
    // 픽셀 폰트(Galmuri11) 로드 후 글자 폭이 바뀌므로 재계산
    document.fonts?.ready.then(compute)
    const ro = new ResizeObserver(compute)
    if (viewportRef.current) ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [visible, text])

  if (!visible) return null

  // 스크롤 속도: reps 에 비례해 늘려 유닛당 속도를 일정하게 유지 (최소 12s 기준)
  const duration = `${Math.max(12, text.length * 0.28) * reps}s`

  return (
    <div className={styles.bar} aria-live="off" aria-label="공지사항">
      {/* 좌측 고정 라벨 */}
      <div className={styles.label}>
        <span className={styles.labelIcon}>📢</span>
        <span className={styles.labelText}>NOTICE</span>
      </div>

      {/* 스크롤 뷰포트 */}
      <div className={styles.viewport} ref={viewportRef}>
        {/* 폭 측정용 숨김 유닛 (반복 횟수 계산) */}
        <span
          ref={unitRef}
          className={styles.text}
          aria-hidden="true"
          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', top: 0, left: 0 }}
        >
          {text}&nbsp;&nbsp;&nbsp;⚾&nbsp;&nbsp;&nbsp;
        </span>
        <div
          className={styles.track}
          style={{ '--dur': duration }}
        >
          {/* 뷰포트를 항상 채우도록 반복 — 앞 reps 개 + 뒤 reps 개(동일)로 -50% 루프가 매끄럽다 */}
          {Array.from({ length: reps * 2 }, (_, i) => (
            <span key={i} className={styles.text} aria-hidden={i !== 0}>
              {text}&nbsp;&nbsp;&nbsp;⚾&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* 우측 실시간 접속자 수 */}
      <div className={styles.count} title="현재 접속 중인 사용자 수">
        <span className={styles.countDot} />
        <span className={styles.countLabel}>실시간</span>
        <span className={styles.countNum}>{liveCount ?? '–'}</span>
        <span className={styles.countLabel}>명</span>
      </div>
    </div>
  )
}
