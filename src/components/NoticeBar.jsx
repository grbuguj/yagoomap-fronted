import { useState, useEffect } from 'react'
import styles from './NoticeBar.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * LED 전광판 스타일 공지 배너.
 * - 활성 공지가 있을 때만 렌더링하며 --notice-h CSS 변수를 조정해 사이드바 레이아웃에 반영한다.
 * - 텍스트를 2번 반복해 translateX(-50%) 로 끊김 없이 루프한다.
 */
export default function NoticeBar() {
  const [notice, setNotice] = useState(null)

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
    </div>
  )
}
