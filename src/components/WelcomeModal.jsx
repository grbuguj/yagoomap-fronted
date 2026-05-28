import { useState } from 'react'
import styles from './WelcomeModal.module.css'

const STORAGE_KEY = 'yagoomap_welcome_hidden_date'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10) // "2026-05-28"
}

export function shouldShowWelcome() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== getTodayStr()
  } catch {
    return true
  }
}

const FEATURES = [
  { icon: '🗺️', title: '야구 중계 술집 지도', desc: '전국 야구 보는 가게를 지도에서 한눈에 찾아보세요.' },
  { icon: '⚾', title: '팀별 필터링',          desc: '응원하는 팀의 가게만 골라볼 수 있어요.' },
  { icon: '📍', title: '내 위치 기반 검색',    desc: '현재 위치 근처의 가게를 바로 찾아드려요.' },
  { icon: '⭐', title: '리뷰 남기기',           desc: '다녀온 가게 후기를 익명으로 공유해요.' },
  { icon: '📢', title: '가게 제보',             desc: '새로운 가게를 알고 있다면 제보해주세요!' },
]

function WelcomeModal({ onClose }) {
  const handleDontShowToday = () => {
    try {
      localStorage.setItem(STORAGE_KEY, getTodayStr())
    } catch {}
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className={styles.header}>
          <span className={styles.headerBall}>⚾</span>
          <div>
            <p className={styles.headerSub}>야구맵에 오신 걸 환영합니다!</p>
            <h2 className={styles.headerTitle}>야구 보는 술집,<br />지도에서 찾아보세요</h2>
          </div>
        </div>

        {/* 기능 목록 */}
        <ul className={styles.featureList}>
          {FEATURES.map(f => (
            <li key={f.title} className={styles.featureItem}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <div>
                <span className={styles.featureTitle}>{f.title}</span>
                <span className={styles.featureDesc}>{f.desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* 버튼 */}
        <div className={styles.btnRow}>
          <button className={styles.btnSkip} onClick={handleDontShowToday}>
            오늘 다시 보지 않기
          </button>
          <button className={styles.btnClose} onClick={onClose}>
            시작하기
          </button>
        </div>

      </div>
    </div>
  )
}

export default WelcomeModal
