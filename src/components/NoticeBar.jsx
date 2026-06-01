import { useState, useEffect } from 'react'
import styles from './NoticeBar.module.css'
import { getSessionId } from '../api/events'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const PING_INTERVAL = 25_000 // 25초마다 heartbeat (백엔드 윈도우 75초)

/**
 * LED 전광판 스타일 공지 배너.
 * - 활성 공지가 있을 때만 렌더링하며 --notice-h CSS 변수를 조정해 사이드바 레이아웃에 반영한다.
 * - 텍스트를 2번 반복해 translateX(-50%) 로 끊김 없이 루프한다.
 * - 우측에 실시간 접속자 수를 표시한다 (presence heartbeat + 폴링).
 */
export default function NoticeBar() {
  const [notice, setNotice] = useState(null)
  const [liveCount, setLiveCount] = useState(null)

  useEffect(() => {
    fetch(`${BASE_URL}/api/notice`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => setNotice(data))
      .catch(() => setNotice({ content: null, active: false }))
  }, [])

  const visible = notice?.active && notice?.content?.trim()

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

  if (!visible) return null

  const text = notice.content.trim()
  // 스크롤 속도 상수: 글자 수에 비례 (최소 12s)
  const duration = `${Math.max(12, text.length * 0.28)}s`

  return (
    <div className={styles.bar} aria-live="off" aria-label="공지사항">
      {/* 좌측 고정 라벨 */}
      <div className={styles.label}>
        <span className={styles.labelIcon}>📢</span>
        <span className={styles.labelText}>NOTICE</span>
      </div>

      {/* 스크롤 뷰포트 */}
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{ '--dur': duration }}
        >
          {/* 끊김 없는 루프를 위해 동일 텍스트 2회 */}
          <span className={styles.text}>
            {text}&nbsp;&nbsp;&nbsp;⚾&nbsp;&nbsp;&nbsp;
          </span>
          <span className={styles.text} aria-hidden="true">
            {text}&nbsp;&nbsp;&nbsp;⚾&nbsp;&nbsp;&nbsp;
          </span>
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
