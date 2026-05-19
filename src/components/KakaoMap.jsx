import { useEffect, useRef, useCallback } from 'react'
import { VENUES } from '../data/venues'
import styles from './KakaoMap.module.css'

function KakaoMap({ selectedArea, onSelectVenue }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlaysRef = useRef([])

  useEffect(() => {
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 8,
    })
    mapInstanceRef.current = map
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    const filtered = selectedArea === '전체'
      ? VENUES
      : VENUES.filter((v) => v.area === selectedArea)

    filtered.forEach((venue) => {
      const content = document.createElement('div')
      content.className = 'yamap-marker'
      content.innerHTML = `
        <div class="yamap-pin">⚾</div>
        <div class="yamap-label">${venue.name}</div>
      `
      content.addEventListener('click', () => onSelectVenue(venue))

      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(venue.lat, venue.lng),
        content,
        yAnchor: 1.3,
      })

      overlaysRef.current.push(overlay)
    })

    if (filtered.length > 0 && selectedArea !== '전체') {
      map.setCenter(new window.kakao.maps.LatLng(filtered[0].lat, filtered[0].lng))
      map.setLevel(6)
    } else {
      map.setCenter(new window.kakao.maps.LatLng(37.5665, 126.9780))
      map.setLevel(8)
    }
  }, [selectedArea, onSelectVenue])

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.map} />
    </div>
  )
}

export default KakaoMap
