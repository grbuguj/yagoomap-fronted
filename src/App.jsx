import { useState, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import AreaFilter from './components/AreaFilter'
import KakaoMap from './components/KakaoMap'
import VenueCard from './components/VenueCard'
import BottomNav from './components/BottomNav'
import './App.css'

function App() {
  const [selectedArea, setSelectedArea] = useState('전체')
  const [selectedVenue, setSelectedVenue] = useState(null)

  const handleSelectVenue = useCallback((venue) => {
    setSelectedVenue(venue)
  }, [])

  const handleCloseVenue = useCallback(() => {
    setSelectedVenue(null)
  }, [])

  return (
    <div className="app">
      <Header />
      <SearchBar />
      <AreaFilter selectedArea={selectedArea} onSelectArea={setSelectedArea} />

      <div className="mapArea">
        <button className="reSearchBtn">↺ 이 지역 재검색</button>
        <KakaoMap
          selectedArea={selectedArea}
          onSelectVenue={handleSelectVenue}
        />
        {selectedVenue && (
          <VenueCard venue={selectedVenue} onClose={handleCloseVenue} />
        )}
      </div>

      <BottomNav active="map" />
    </div>
  )
}

export default App
