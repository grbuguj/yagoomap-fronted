import { useEffect, useRef } from 'react'
import { TEAM_CONFIG } from '../data/teams'
import styles from './KakaoMap.module.css'

const TEAM_MARKER_CLASS = {
  'LG 트윈스':    'ymap-marker--lg',
  'KIA 타이거즈': 'ymap-marker--kia',
  '롯데 자이언츠': 'ymap-marker--lotte',
}

const TEAM_SHORT = {
  'LG 트윈스':    'LG',
  'KIA 타이거즈': 'K',
  '롯데 자이언츠': 'L',
}

// 레이블에 표시할 가게 이름 (너무 길면 자름)
function labelText(name) {
  return name.length > 9 ? name.slice(0, 8) + '…' : name
}

function createMarkerContent(venue) {
  const teamClass = TEAM_MARKER_CLASS[venue.team] || ''
  const short     = TEAM_SHORT[venue.team] || '⚾'

  const div = document.createElement('div')
  div.className = `ymap-marker ${teamClass}`.trim()
  div.dataset.id = String(venue.id)
  div.innerHTML = `
    <div class="ymap-pin">
      <span class="ymap-pin-text">${short}</span>
    </div>
    <div class="ymap-label">${labelText(venue.name)}</div>
  `
  return div
}

function KakaoMap({ venues, selectedTeam, selectedVenue, onVenueClick }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  // [{ overlay, content, venueId }]
  const overlaysRef = useRef([])

  /* ── 지도 초기화 (1회) ───────────────────────────────────── */
  useEffect(() => {
    const center = selectedTeam === 'KIA 타이거즈'
      ? new window.kakao.maps.LatLng(35.1683, 126.8890)
      : selectedTeam === '롯데 자이언츠'
        ? new window.kakao.maps.LatLng(35.1940, 129.0614)
        : new window.kakao.maps.LatLng(37.5665, 126.9780)

    mapInstance.current = new window.kakao.maps.Map(mapRef.current, {
      center,
      level: 8,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 마커 전체 재생성 (venues 목록 변경 시만) ────────────── */
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // 기존 마커 제거
    overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null))
    overlaysRef.current = []

    venues.forEach(venue => {
      const content = createMarkerContent(venue)
      content.addEventListener('click', () => onVenueClick(venue))

      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(venue.lat, venue.lng),
        content,
        yAnchor: 1.4,
        zIndex: 1,
      })

      overlaysRef.current.push({ overlay, content, venueId: venue.id })
    })
  }, [venues, onVenueClick])

  /* ── active 상태만 클래스 교체 (DOM 직접 수정) ──────────── */
  useEffect(() => {
    overlaysRef.current.forEach(({ overlay, content, venueId }) => {
      const isActive = selectedVenue?.id === venueId
      // active 클래스 토글
      if (isActive) {
        content.classList.add('ymap-marker--active')
        overlay.setZIndex(10)
      } else {
        content.classList.remove('ymap-marker--active')
        overlay.setZIndex(1)
      }
    })
  }, [selectedVenue])

  /* ── 선택된 venue 위치로 지도 이동 ──────────────────────── */
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !selectedVenue) return
    map.panTo(new window.kakao.maps.LatLng(selectedVenue.lat, selectedVenue.lng))
  }, [selectedVenue])

  /* ── 팀 변경 시 지도 중심 이동 ──────────────────────────── */
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    const cfg = Object.values(TEAM_CONFIG).find(t => t.key === selectedTeam)
    if (cfg) {
      map.panTo(new window.kakao.maps.LatLng(cfg.stadium.lat, cfg.stadium.lng))
      map.setLevel(9)
    }
  }, [selectedTeam])

  return (
    <div className={styles.container}>
      <div ref={mapRef} className={styles.map} />
    </div>
  )
}

export default KakaoMap
