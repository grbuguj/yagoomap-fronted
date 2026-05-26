import styles from './AreaFilter.module.css'

function AreaFilter({ areas, selected, onSelect }) {
  return (
    <div className={styles.scroll}>
      {areas.map(area => (
        <button
          key={area}
          className={`${styles.chip} ${selected === area ? styles.active : ''}`}
          onClick={() => onSelect(area)}
        >
          {area}
        </button>
      ))}
    </div>
  )
}

export default AreaFilter
