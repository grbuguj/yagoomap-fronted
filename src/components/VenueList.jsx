import { TEAM_CONFIG } from '../data/teams'
import styles from './VenueList.module.css'

function Stars({ rating }) {
  return (
    <span className={styles.stars}>
      ★ <span>{rating.toFixed(1)}</span>
    </span>
  )
}

function VenueList({ venues, selectedTeam, onSelect }) {
  const teamColor = TEAM_CONFIG[selectedTeam]?.color || 'var(--clr-primary)'

  if (venues.length === 0) {
    return (
      <div className={styles.empty}>
        <span>⚾</span>
        <p>검색 결과가 없어요</p>
        <small>다른 검색어나 필터를 시도해보세요</small>
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      <li className={styles.count}>{venues.length}곳</li>
      {venues.map(venue => (
        <li key={venue.id} className={styles.item} onClick={() => onSelect(venue)}>
          <div className={styles.itemLeft}>
            <div className={styles.imgPlaceholder} style={{ background: teamColor + '18' }}>
              <span style={{ color: teamColor }}>🍺</span>
            </div>
          </div>
          <div className={styles.itemBody}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{venue.name}</span>
              <Stars rating={venue.rating} />
            </div>
            <p className={styles.station}>{venue.nearStation}</p>
            <p className={styles.address}>{venue.address}</p>
          </div>
          <span className={styles.arrow}>›</span>
        </li>
      ))}
    </ul>
  )
}

export default VenueList
