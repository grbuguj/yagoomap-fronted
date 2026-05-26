import { useState, useMemo, useCallback, useRef } from 'react'
import Header        from './components/Header'
import SearchBar     from './components/SearchBar'
import TeamFilter    from './components/TeamFilter'
import VenueList     from './components/VenueList'
import VenueDetail   from './components/VenueDetail'
import KakaoMap      from './components/KakaoMap'
import ReportModal   from './components/ReportModal'
import SidebarFooter from './components/SidebarFooter'
import PolicyModal   from './components/PolicyModal'
import { VENUES } from './data/venues'
import { AVAILABLE_TEAMS } from './data/teams'
import './App.css'

function App() {
  const [selectedTeam,  setSelectedTeam]  = useState('LG 트윈스')
  const [keyword,       setKeyword]       = useState('')
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [showReport,    setShowReport]    = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(() => window.innerWidth > 480)
  const [policyType,    setPolicyType]    = useState(null) // 'privacy' | 'terms' | null
  const [userLocation,  setUserLocation]  = useState(null)
  const [locating,      setLocating]      = useState(false)
  const [mapMoved,      setMapMoved]      = useState(false)
  const liveBoundsRef  = useRef(null)   // 최신 지도 bounds (plain object)
  const [boundsFilter, setBoundsFilter]  = useState(null)  // 재검색 시 스냅샷

  // 바텀시트 스와이프 제스처
  const swipeTouchY    = useRef(0)      // 터치 시작 Y
  const swipeScrollTop = useRef(0)      // 터치 시작 시점의 sidebarBody 스크롤 위치
  const sidebarBodyRef = useRef(null)   // sidebarBody DOM 참조

  // 전체 or 준비된 팀 선택 시 true
  const isAvailable = selectedTeam === '전체' || AVAILABLE_TEAMS.includes(selectedTeam)

  const handleTeamChange = useCallback((team) => {
    setSelectedTeam(team)
    setSelectedVenue(null)
    setKeyword('')
    setBoundsFilter(null)   // 팀 바꾸면 bounds 필터 초기화
    setMapMoved(false)
  }, [])

  const handleVenueSelect = useCallback((venue) => {
    setSelectedVenue(venue)
    setSidebarOpen(true)   // 마커 클릭 시 사이드바 자동 오픈
  }, [])

  const handleVenueClose = useCallback(() => {
    setSelectedVenue(null)
  }, [])

  const handleBoundsChange = useCallback((bounds) => {
    liveBoundsRef.current = bounds
    setMapMoved(true)
  }, [])

  const handleReSearch = useCallback(() => {
    setBoundsFilter(liveBoundsRef.current)
    setMapMoved(false)
  }, [])

  // ── 바텀시트 핸들 스와이프 ──────────────────────────────
  const onHandleTouchStart = useCallback((e) => {
    swipeTouchY.current = e.touches[0].clientY
  }, [])

  const onHandleTouchEnd = useCallback((e) => {
    const dy = e.changedTouches[0].clientY - swipeTouchY.current
    if      (dy >  40) setSidebarOpen(false)  // 아래로 → 닫기
    else if (dy < -40) setSidebarOpen(true)   // 위로  → 열기
  }, [])

  // ── 컨텐츠 영역: 맨 위에서 아래로 스와이프 → 닫기 ──────
  const onBodyTouchStart = useCallback((e) => {
    swipeTouchY.current    = e.touches[0].clientY
    swipeScrollTop.current = sidebarBodyRef.current?.scrollTop ?? 0
  }, [])

  const onBodyTouchEnd = useCallback((e) => {
    const dy = e.changedTouches[0].clientY - swipeTouchY.current
    // 스크롤이 맨 위이고 아래로 60px 이상 → 닫기
    if (dy > 60 && swipeScrollTop.current === 0) {
      setSidebarOpen(false)
    }
  }, [])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않아요.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        alert('위치 정보를 가져올 수 없어요.\n위치 권한을 허용해주세요.')
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const filteredVenues = useMemo(() => {
    if (!isAvailable) return []
    // 전체: 준비된 팀 전체 / 특정 팀: 해당 팀만
    let list = selectedTeam === '전체'
      ? VENUES.filter(v => AVAILABLE_TEAMS.includes(v.team))
      : VENUES.filter(v => v.team === selectedTeam)
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(v =>
        v.name.toLowerCase().includes(kw) ||
        v.address.toLowerCase().includes(kw)
      )
    }
    // 지역 재검색 bounds 필터
    if (boundsFilter) {
      list = list.filter(v =>
        v.lat >= boundsFilter.swLat && v.lat <= boundsFilter.neLat &&
        v.lng >= boundsFilter.swLng && v.lng <= boundsFilter.neLng
      )
    }
    return list
  }, [selectedTeam, isAvailable, keyword, boundsFilter])

  return (
    <div className="app">
      <Header onReport={() => setShowReport(true)} />

      <div className={`content${sidebarOpen ? '' : ' content--closed'}`}>
        {/* ── 사이드바 래퍼 ── */}
        <div className={`sidebarWrap${sidebarOpen ? '' : ' sidebarWrap--closed'}`}>
          {/* 모바일 전용 드래그 핸들 (데스크톱에선 display:none) */}
          <button
            className="sidebarHandle"
            onClick={() => setSidebarOpen(o => !o)}
            onTouchStart={onHandleTouchStart}
            onTouchEnd={onHandleTouchEnd}
          >
            <span className="sidebarHandleBar" />
          </button>
          <aside className="sidebar">
            {/* 모바일 디테일 뷰에서는 검색/팀필터 숨김 */}
            <div className={`sidebarTop${selectedVenue ? ' sidebarTop--detailMode' : ''}`}>
              <SearchBar
                value={keyword}
                onChange={setKeyword}
                disabled={!isAvailable}
              />
              <TeamFilter selected={selectedTeam} onSelect={handleTeamChange} />
            </div>

            <div
              className="sidebarBody"
              ref={sidebarBodyRef}
              onTouchStart={onBodyTouchStart}
              onTouchEnd={onBodyTouchEnd}
            >
              {!isAvailable ? (
                <div className="comingSoon">
                  <span>⚾</span>
                  <p>{selectedTeam}</p>
                  <small>준비 중이에요!</small>
                  <small>곧 오픈할게요 🙏</small>
                </div>
              ) : selectedVenue ? (
                <VenueDetail key={selectedVenue.id} venue={selectedVenue} onClose={handleVenueClose} />
              ) : (
                <VenueList
                  venues={filteredVenues}
                  selectedTeam={selectedTeam}
                  onSelect={handleVenueSelect}
                />
              )}
            </div>

            <SidebarFooter onPolicy={setPolicyType} />
          </aside>
        </div>

        {/* ── 사이드바 토글 탭 (사이드바 바깥, 네이버맵 스타일) ── */}
        <button
          className="sidebarToggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? '닫기' : '열기'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* ── 지도 영역 ── */}
        <div className="mapArea">
          <button
            className={`reSearchBtn${mapMoved ? ' reSearchBtn--visible' : ''}`}
            onClick={handleReSearch}
          >
            ↺ 이 지역 재검색
          </button>

          <KakaoMap
            venues={filteredVenues}
            selectedTeam={selectedTeam}
            selectedVenue={selectedVenue}
            onVenueClick={handleVenueSelect}
            userLocation={userLocation}
            onBoundsChange={handleBoundsChange}
          />

          {/* 내 위치 버튼 */}
          <button
            className={`locateBtn${locating ? ' locateBtn--locating' : ''}`}
            onClick={handleLocate}
            disabled={locating}
            title="내 위치로 이동"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>

          <button className="reportBtn" onClick={() => setShowReport(true)}>
            📍 제보하기
          </button>
        </div>
      </div>

      {showReport && (
        <ReportModal
          selectedTeam={selectedTeam}
          onClose={() => setShowReport(false)}
        />
      )}

      {policyType && (
        <PolicyModal
          type={policyType}
          onClose={() => setPolicyType(null)}
        />
      )}
    </div>
  )
}

export default App
