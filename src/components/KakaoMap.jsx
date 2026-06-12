import { useEffect, useRef, useState } from 'react'
import { TEAM_CONFIG, MIXED_COLOR } from '../data/teams'
import { INCHEON_PARKING } from '../data/incheonParking'
import { STADIUMS } from '../data/stadiums'
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
  const incheonOverlaysRef  = useRef([])  // 인천 공공데이터 레이어 (주차장)
  const incheonPopupRef     = useRef(null) // 주차장 정보 팝업
  const myLocOverlay        = useRef(null)
  const onBoundsChangeCb    = useRef(onBoundsChange)
  const [zoomLevel, setZoomLevel] = useState(9) // 축소 레벨별 마커/클러스터 전환용

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

    // 줌 레벨 추적 (레벨별 마커/클러스터 전환)
    setZoomLevel(map.getLevel())
    window.kakao.maps.event.addListener(map, 'zoom_changed', () => setZoomLevel(map.getLevel()))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── KBO 구장 마커 (상시 표시 랜드마크) ─────────────────── */
  // 축소 뷰(클러스터 모드)에선 ⚾ 컴팩트 배지로 줄여 버블과의 겹침 최소화
  const stadiumCompact = zoomLevel >= 7
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    const overlays = STADIUMS.map(s => {
      const el = document.createElement('div')
      el.className = `ymap-stadium${stadiumCompact ? ' ymap-stadium--compact' : ''}`
      el.style.setProperty('--stadium-color', s.color)
      el.title = `${s.name} — ${s.teams}`
      el.innerHTML = `<span class="ymap-stadium-ball">⚾</span><span class="ymap-stadium-name">${s.name}</span><i class="ymap-stadium-tail"></i>`
      return new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(s.lat, s.lng),
        content: el,
        yAnchor: 1.25, // 꼬리가 구장 좌표를 가리키도록
        xAnchor: 0.5,
        zIndex: 0,
      })
    })
    return () => overlays.forEach(o => o.setMap(null))
  }, [stadiumCompact])

  /* ── 마커 재생성 (venues 변경 또는 줌 레벨 전환 시) ──────── */
  // 레벨 7 미만(확대): 개별 마커 / 레벨 7 이상(축소): 그리드 클러스터 버블
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // 기존 마커 제거
    overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null))
    overlaysRef.current = []

    const addVenueMarker = venue => {
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
    }

    const CLUSTER_LEVEL = 7
    if (zoomLevel < CLUSTER_LEVEL) {
      venues.forEach(addVenueMarker)
      return
    }

    // ── 그리드 클러스터링 (줌 레벨에 비례해 셀 크기 확대) ──
    const cell = 0.06 * Math.pow(2, zoomLevel - CLUSTER_LEVEL)
    const buckets = new Map()
    venues.forEach(v => {
      const key = `${Math.round(v.lat / cell)}:${Math.round(v.lng / cell)}`
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(v)
    })

    // 축소 뷰에선 낱개 매장도 버블로 통일 (개별 핀이 튀지 않도록)
    buckets.forEach(group => {
      const lat = group.reduce((s, v) => s + v.lat, 0) / group.length
      const lng = group.reduce((s, v) => s + v.lng, 0) / group.length
      const el = document.createElement('div')
      const size = group.length >= 20 ? 'lg' : 'sm'
      el.className = `ymap-cluster ymap-cluster--${size}`
      el.textContent = group.length.toLocaleString()
      el.title = `이 지역 매장 ${group.length}곳 — 클릭하면 확대`
      el.addEventListener('click', () => {
        map.setLevel(Math.max(1, map.getLevel() - 2), {
          anchor: new window.kakao.maps.LatLng(lat, lng),
        })
      })
      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(lat, lng),
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 2,
      })
      overlaysRef.current.push({ overlay, content: el, venueId: null })
    })
  }, [venues, onVenueClick, zoomLevel])

  /* ── 인천 공공데이터 레이어 (공영주차장) ────────────────── */
  // 역 마커는 카카오 기본지도에 이미 표시되므로 별도로 그리지 않음.
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // 기존 레이어 + 팝업 제거
    incheonOverlaysRef.current.forEach(o => o.setMap(null))
    incheonOverlaysRef.current = []
    if (incheonPopupRef.current) {
      incheonPopupRef.current.setMap(null)
      incheonPopupRef.current = null
    }
    if (!showIncheonLayer) return

    const closePopup = () => {
      if (incheonPopupRef.current) {
        incheonPopupRef.current.setMap(null)
        incheonPopupRef.current = null
      }
    }

    const openPopup = (p) => {
      closePopup()
      const el = document.createElement('div')
      el.className = 'ymap-incheon-popup'
      const feeLine = [
        p.fee,
        p.baseFee != null && p.baseMin != null ? `기본 ${p.baseMin}분 ${p.baseFee.toLocaleString()}원` : null,
      ].filter(Boolean).join(' · ')
      el.innerHTML = `
        <div class="ymap-incheon-popup-title">🅿️ ${p.name}</div>
        ${p.capacity ? `<div>주차면 ${p.capacity.toLocaleString()}면</div>` : ''}
        ${feeLine ? `<div>${feeLine}</div>` : ''}
        ${p.hours ? `<div>평일 ${p.hours}</div>` : ''}
        <div class="ymap-incheon-popup-src">인천시 공공데이터</div>
      `
      el.addEventListener('click', closePopup)
      incheonPopupRef.current = new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(p.lat, p.lng),
        content: el,
        yAnchor: 1.25,
        zIndex: 20,
      })
    }

    // 주차장 1,004개 전부 그리면 무거움 → 50면 이상(약 300개)만 마커 표시.
    // (매장 상세 "가는 길"의 최근접 계산은 전체 1,004개 기준 — 여긴 지도 표시용 필터)
    INCHEON_PARKING.filter(p => (p.capacity ?? 0) >= 50).forEach(p => {
      const el = document.createElement('div')
      el.className = 'ymap-incheon ymap-incheon--parking'
      el.textContent = '🅿️'
      el.addEventListener('click', () => openPopup(p))
      const overlay = new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(p.lat, p.lng),
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 2,
      })
      incheonOverlaysRef.current.push(overlay)
    })

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
