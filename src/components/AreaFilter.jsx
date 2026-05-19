import { AREAS } from '../data/venues'
import styles from './AreaFilter.module.css'

function AreaFilter({ selectedArea, onSelectArea }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.scroll}>
        {AREAS.map((area) => (
          <button
            key={area}
            className={`${styles.chip} ${selectedArea === area ? styles.active : ''}`}
            onClick={() => onSelectArea(area)}
          >
            {area}
          </button>
        ))}
        <button className={styles.moreBtn}>
          더보기 ∨
        </button>
      </div>
    </div>
  )
}

export default AreaFilter
