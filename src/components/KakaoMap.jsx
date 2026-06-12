import { useEffect, useRef } from 'react'
import { TEAM_CONFIG, MIXED_COLOR } from '../data/teams'
import { INCHEON_STATIONS } from '../data/incheonStations'
import { INCHEON_PARKING } from '../data/incheonParking'
import styles from './KakaoMap.module.css'

// 레이블에 표시할 가게 이름 (너무 길면 자름)
function labelText(name) {
  return name.length > 9 ? name.slice(0, 8) + '…' : name
}

function createMarkerContent(venue) {
  const cfg       = TEAM_CONFIG[venue.team]
  const teamClass = cfg?.markerClass || ''
  const short     = cfg?.shortName || '⚾'   // 혼합 응원 → ⚾ 중립 마커
  const color     = cfg?.color || MIXED_COLOR

  const div = document.createElement('div')
  div.className = `ymap-marker ${teamClass}`.trim()
  div.dataset.id = String(venue.id)
  // 핀/활성 레이블 색상을 전 구단에 동적 주입
  div.style.setProperty('--team-color', color)
  div.innerHTML = `
    <div class="ymap-pin">
      <span class="ymap-pin-text">${short}</span>
    </div>
    <div class="ymap-label">${labelText(venue.name)}</div>
  `
  return div
}

function KakaoMap({ venues, selectedTeam, selectedVenue, onVenueClick, userLocation, onBoundsChange, sidebarOpen, showIncheonLayer }) {
  const mapRef              = useRef(null)
  const mapInstance         = useRef(null)
  const overlaysRef         = useRef([])  // [{ overlay, content, venueId }]
  const incheonOverlaysRef  = useRef([])  // 인천 공공데이터 레이어 (역/주차장)
  const myLocOverlay        = useRef(null)
  const onBoundsChangeCb    = useRef(onBoundsChange)

  // 콜백 ref 최신 상태 유지 (클로저 stale 방지)
  useEffect(() => { onBoundsChangeCb.current = onBoundsChange }, [onBoundsChange])

  /* ── 지도 초기화 (1회) ───────────────────────────────────── */
  useEffect(() => {
    const center = selectedTeam === 'KIA 타이거즈'
      ? new window.kakao.maps.LatLng(35.1683, 126.8890)
      : selectedTeam === '롯데 자이언츠'
        ? new window.kakao.maps.LatLng(35.1940, 129.0614)
        : new window.kakao.maps.LatLng(37.5665, 126.9780)

    const map = new window.kakao.maps.Map(mapRef.current, { center, level: 9 })
    mapInstance.current = map

    // 드래그/줌 후 bounds를 App으로 전달 → 재검색 버튼 표시
    const emitBounds = () => {
      if (!onBoundsChangeCb.current) return
      const b  = map.getBounds()
      const sw = b.getSouthWest()
      const ne = b.getNorthEast()
      onBoundsChangeCb.current({
        swLat: sw.getLat(), swLng: sw.getLng(),
        neLat: ne.getLat(), neLng: ne.getLng(),
      })
    }
    window.kakao.maps.event.addListener(map, 'dragend',      emitBounds)
    window.kakao.maps.event.addListener(map, 'zoom_changed', emitBounds)
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

  /* ── 인천 공공데이터 레이어 (도시철도역 + 공영주차장) ───── */
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // 기존 레이어 제거
    incheonOverlaysRef.current.forEach(o => o.setMap(null))
    incheonOverlaysRef.current = []
    if (!showIncheonLayer) return

    const make = (lat, lng, cls, emoji, title) => {
      const el = document.createElement('div')
      el.className = `ymap-incheon ${cls}`
      el.title = title
      el.textContent = emoji
      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(lat, lng),
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 2,
      })
      incheonOverlaysRef.current.push(overlay)
    }

    INCHEON_STATIONS.forEach(s =>
      make(s.lat, s.lng, 'ymap-incheon--station', '🚉', `${s.name}역 (${s.line})`))
    // 주차장 1,004개 전부 그리면 무거움 → 50면 이상(307개)만 마커 표시.
    // (매장 상세 "가는 길"의 최근접 계산은 전체 1,004개 기준 — 여긴 지도 표시용 필터)
    INCHEON_PARKING.filter(p => (p.capacity ?? 0) >= 50).forEach(p =>
      make(p.lat, p.lng, 'ymap-incheon--parking', '🅿️', `${p.name}${p.capacity ? ` · ${p.capacity}면` : ''}${p.fee ? ` · ${p.fee}` : ''}`))

    // 레이어 켤 때 인천 중심으로 이동
    map.panTo(new window.kakao.maps.LatLng(37.4566, 126.7026))
    if (map.getLevel() > 7) map.setLevel(7)
  }, [showIncheonLayer])

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


  /* ── 사이드바 크기 변경 시 지도 리레이아웃 ──────────────── */
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    // 트랜지션(0.3s) 완료 후 relayout
    const timer = setTimeout(() => map.relayout(), 320)
    return () => clearTimeout(timer)
  }, [sidebarOpen])

  /* ── 현재 위치 파란 점 + 지도 이동 ──────────────────────── */
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !userLocation) return

    // 기존 내 위치 오버레이 제거
    if (myLocOverlay.current) {
      myLocOverlay.current.setMap(null)
      myLocOverlay.current = null
    }

    const dot = document.createElement('div')
    dot.className = 'ymap-my-location'
    dot.innerHTML = '<div class="ymap-my-location-dot"></div>'

    myLocOverlay.current = new window.kakao.maps.CustomOverlay({
      map,
      position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      content: dot,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 5,
    })

    map.panTo(new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng))
    map.setLevel(4)
  }, [userLocation])

  return (
    <div className={styles.container}>
      <div ref={mapRef} className={styles.map} />
    </div>
  )
}

export default KakaoMap
