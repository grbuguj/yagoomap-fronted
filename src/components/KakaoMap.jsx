import { useEffect, useRef } from 'react'

function KakaoMap() {
    const mapRef = useRef(null)

    useEffect(() => {
        const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
            level: 8,
        })
    }, [])

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '600px' }}
        />
    )
}

export default KakaoMap