import { useState, useMemo, useCallback } from 'react'
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
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [policyType,    setPolicyType]    = useState(null) // 'privacy' | 'terms' | null

  // 전체 or 준비된 팀 선택 시 true
  const isAvailable = selectedTeam === '전체' || AVAILABLE_TEAMS.includes(selectedTeam)

  const handleTeamChange = useCallback((team) => {
    setSelectedTeam(team)
    setSelectedVenue(null)
    setKeyword('')
  }, [])

  const handleVenueSelect = useCallback((venue) => {
    setSelectedVenue(venue)
    setSidebarOpen(true)   // 마커 클릭 시 사이드바 자동 오픈
  }, [])

  const handleVenueClose = useCallback(() => {
    setSelectedVenue(null)
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
    return list
  }, [selectedTeam, isAvailable, keyword])

  return (
    <div className="app">
      <Header onReport={() => setShowReport(true)} />

      <div className={`content${sidebarOpen ? '' : ' content--closed'}`}>
        {/* ── 사이드바 래퍼 ── */}
        <div className={`sidebarWrap${sidebarOpen ? '' : ' sidebarWrap--closed'}`}>
          <aside className="sidebar">
            <div className="sidebarTop">
              <SearchBar
                value={keyword}
                onChange={setKeyword}
                disabled={!isAvailable}
              />
              <TeamFilter selected={selectedTeam} onSelect={handleTeamChange} />
            </div>

            <div className="sidebarBody">
              {!isAvailable ? (
                <div className="comingSoon">
                  <span>⚾</span>
                  <p>{selectedTeam}</p>
                  <small>준비 중이에요!</small>
                  <small>곧 오픈할게요 🙏</small>
                </div>
              ) : selectedVenue ? (
                <VenueDetail venue={selectedVenue} onClose={handleVenueClose} />
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
          <button className="reSearchBtn">↺ 이 지역 재검색</button>

          <KakaoMap
            venues={filteredVenues}
            selectedTeam={selectedTeam}
            selectedVenue={selectedVenue}
            onVenueClick={handleVenueSelect}
          />

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
