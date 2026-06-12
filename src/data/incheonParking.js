// 인천 공영주차장 좌표 데이터
// 출처: 공공데이터포털 「전국주차장정보표준데이터」 인천 필터 (data.go.kr/data/15012896/standard.do)
// ⚠️ 아래는 데모용 시드(주요 주차장 발췌) — 공식 CSV 전체본으로 교체 필수.
//    교체 방법: CSV 다운로드 후 `node scripts/convertCsv.mjs 주차장.csv --parking` 실행 결과로 덮어쓰기.
export const INCHEON_PARKING = [
  { name: '문학경기장 주차장',        lat: 37.4351, lng: 126.6890, fee: '유료', capacity: 1500 },
  { name: '인천터미널 공영주차장',    lat: 37.4419, lng: 126.7005, fee: '유료', capacity: 800 },
  { name: '구월동 공영주차장',        lat: 37.4490, lng: 126.7080, fee: '유료', capacity: 250 },
  { name: '부평역 지하 공영주차장',   lat: 37.4890, lng: 126.7230, fee: '유료', capacity: 400 },
  { name: '부평구청 공영주차장',      lat: 37.5070, lng: 126.7210, fee: '유료', capacity: 200 },
  { name: '주안역 공영주차장',        lat: 37.4650, lng: 126.6810, fee: '유료', capacity: 300 },
  { name: '송도 센트럴파크 주차장',   lat: 37.3930, lng: 126.6360, fee: '유료', capacity: 600 },
]
