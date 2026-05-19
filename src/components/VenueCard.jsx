import styles from './VenueCard.module.css'

const TAG_EMOJIS = {
  'LG중계': '📺',
  '단체석': '👥',
  '대형스크린': '🖥️',
  '포차': '🏮',
  '맥주': '🍺',
  '치킨': '🍗',
  '삼겹살': '🥩',
  '고기': '🥩',
  '응원석': '📣',
  '분위기': '✨',
  '가성비': '💰',
  '루프탑': '🌃',
  '복고감성': '📻',
  '한식': '🍚',
  '피자': '🍕',
  '참치': '🐟',
  '쭈꾸미': '🐙',
  '힙한분위기': '🎵',
  '손주영': '⭐',
}

function Stars({ rating }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <span className={styles.stars}>
      {'★'.repeat(full)}{half ? '½' : ''}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

function VenueCard({ venue, onClose }) {
  if (!venue) return null

  const handleNavigation = () => {
    const url = `https://map.kakao.com/link/search/${encodeURIComponent(venue.name)}`
    window.open(url, '_blank')
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.imageArea}>
          <div className={styles.imagePlaceholder}>
            <span>🍻</span>
          </div>
          <span className={styles.badge}>추천</span>
        </div>

        <div className={styles.info}>
          <div className={styles.topRow}>
            <div>
              <h2 className={styles.name}>{venue.name}</h2>
              <p className={styles.station}>{venue.nearStation}</p>
              <p className={styles.address}>{venue.address}</p>
            </div>
          </div>

          <div className={styles.tags}>
            {venue.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {TAG_EMOJIS[tag] || ''} {tag}
              </span>
            ))}
          </div>

          <div className={styles.bottomRow}>
            <div className={styles.ratingArea}>
              <Stars rating={venue.rating} />
              <span className={styles.reviewCount}>({venue.reviewCount})</span>
              <button className={styles.reviewBtn}>리뷰 보기 &gt;</button>
            </div>
            <button className={styles.navBtn} onClick={handleNavigation}>
              ✈ 길찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VenueCard
