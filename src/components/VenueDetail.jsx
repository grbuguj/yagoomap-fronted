import { useState } from 'react'
import { TEAM_CONFIG } from '../data/teams'
import ReviewSection from './ReviewSection'
import styles from './VenueDetail.module.css'


function Stars({ rating }) {
  const full  = Math.floor(rating)
  const empty = 5 - full
  return (
    <span className={styles.stars}>
      {'★'.repeat(full)}
      <span className={styles.emptyStars}>{'☆'.repeat(empty)}</span>
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

function VenueDetail({ venue, onClose }) {
  const [reviewCount, setReviewCount] = useState(venue?.reviewCount ?? 0)

  if (!venue) return null

  const teamCfg = TEAM_CONFIG[venue.team]
  const teamColor = teamCfg?.color || 'var(--clr-primary)'

  const handleKakaoMap = () => {
    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(venue.name)}`, '_blank')
  }

  const handleNaverMap = () => {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(venue.name)}`, '_blank')
  }

  return (
    <div className={styles.wrap}>
      {/* 뒤로가기 */}
      <button className={styles.back} onClick={onClose}>
        ← 목록으로
      </button>

      {/* 이미지 영역 */}
      <div className={styles.imgArea} style={{ background: teamColor + '15' }}>
        <span className={styles.imgPlaceholder} style={{ color: teamColor }}>🍻</span>
        <span className={styles.teamBadge} style={{ background: teamColor }}>
          {teamCfg?.shortName || venue.team}
        </span>
      </div>

      {/* 기본 정보 */}
      <div className={styles.body}>
        <h2 className={styles.name}>{venue.name}</h2>
        <p className={styles.station}>{venue.nearStation}</p>
        <p className={styles.address}>{venue.address}</p>

        {/* 별점 */}
        <div className={styles.ratingRow}>
          <Stars rating={venue.rating} />
          <span className={styles.reviewCount}>리뷰 {reviewCount}개</span>
        </div>

        {/* 안내 문구 */}
        <p className={styles.notice}>
          📞 정확한 중계 여부는 가게에 전화로 확인하세요
        </p>

        {/* 지도 연결 버튼 */}
        <div className={styles.btnRow}>
          <button className={`${styles.mapBtn} ${styles.mapBtnKakao}`} onClick={handleKakaoMap}>
            <span className={styles.mapIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.925 2 11.785c0 3.018 1.677 5.684 4.236 7.348l-.978 3.643a.25.25 0 0 0 .373.279L9.93 20.59A11.1 11.1 0 0 0 12 20.57c5.523 0 10-3.925 10-8.785S17.523 3 12 3"/>
              </svg>
            </span>
            카카오맵 연결
          </button>
          <button className={`${styles.mapBtn} ${styles.mapBtnNaver}`} onClick={handleNaverMap}>
            <span className={styles.mapIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
              </svg>
            </span>
            네이버맵 연결
          </button>
        </div>
      </div>

      {/* 리뷰 섹션 */}
      <ReviewSection venueId={venue.id} onCountChange={setReviewCount} />
    </div>
  )
}

export default VenueDetail
