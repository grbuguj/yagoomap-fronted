import { TEAM_CONFIG } from '../data/teams'
import ReviewSection from './ReviewSection'
import styles from './VenueDetail.module.css'


function Stars({ rating }) {
  return (
    <span className={styles.stars}>
      {'★'.repeat(Math.floor(rating))}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

function VenueDetail({ venue, onClose }) {
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
          <span className={styles.reviewCount}>리뷰 {venue.reviewCount}개</span>
        </div>

        {/* 안내 문구 */}
        <p className={styles.notice}>
          📞 정확한 중계 여부는 가게에 전화로 확인하세요
        </p>

        {/* 지도 연결 버튼 */}
        <div className={styles.btnRow}>
          <button className={styles.mapBtn} onClick={handleKakaoMap}>
            카카오맵 길찾기
          </button>
          <button className={`${styles.mapBtn} ${styles.mapBtnSecondary}`} onClick={handleNaverMap}>
            네이버 지도
          </button>
        </div>
      </div>

      {/* 리뷰 섹션 */}
      <ReviewSection venueId={venue.id} />
    </div>
  )
}

export default VenueDetail
