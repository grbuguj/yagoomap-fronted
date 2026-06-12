// 인천 도시철도 역사 좌표 데이터
// 출처: 공공데이터포털 「인천교통공사_도시철도역사정보」 (data.go.kr/data/15083751/fileData.do)
// ⚠️ 아래는 데모용 시드(주요 역 발췌) — 공식 CSV 전체본으로 교체 필수.
//    교체 방법: CSV 다운로드 후 `node scripts/convertCsv.mjs 역사정보.csv` 실행 결과로 덮어쓰기.
export const INCHEON_STATIONS = [
  // ── 인천 1호선 ──
  { name: '계양',          line: '인천 1호선', lat: 37.5713, lng: 126.7360, transfer: '공항철도' },
  { name: '부평구청',      line: '인천 1호선', lat: 37.5079, lng: 126.7218, transfer: '7호선' },
  { name: '부평',          line: '인천 1호선', lat: 37.4894, lng: 126.7245, transfer: '경인선(1호선)' },
  { name: '부평삼거리',    line: '인천 1호선', lat: 37.4775, lng: 126.7138, transfer: null },
  { name: '간석오거리',    line: '인천 1호선', lat: 37.4647, lng: 126.7070, transfer: null },
  { name: '인천시청',      line: '인천 1호선', lat: 37.4566, lng: 126.7026, transfer: '인천 2호선' },
  { name: '예술회관',      line: '인천 1호선', lat: 37.4470, lng: 126.7016, transfer: null },
  { name: '인천터미널',    line: '인천 1호선', lat: 37.4423, lng: 126.6998, transfer: null },
  { name: '문학경기장',    line: '인천 1호선', lat: 37.4372, lng: 126.6909, transfer: null },
  { name: '선학',          line: '인천 1호선', lat: 37.4290, lng: 126.6929, transfer: null },
  { name: '원인재',        line: '인천 1호선', lat: 37.4173, lng: 126.6985, transfer: '수인분당선' },
  { name: '동막',          line: '인천 1호선', lat: 37.4063, lng: 126.6750, transfer: null },
  { name: '캠퍼스타운',    line: '인천 1호선', lat: 37.3897, lng: 126.6500, transfer: null },
  { name: '테크노파크',    line: '인천 1호선', lat: 37.3826, lng: 126.6566, transfer: null },
  { name: '송도달빛축제공원', line: '인천 1호선', lat: 37.3733, lng: 126.6630, transfer: null },
  // ── 인천 2호선 ──
  { name: '검단오류',      line: '인천 2호선', lat: 37.5947, lng: 126.6230, transfer: null },
  { name: '검암',          line: '인천 2호선', lat: 37.5685, lng: 126.6736, transfer: '공항철도' },
  { name: '석남',          line: '인천 2호선', lat: 37.5092, lng: 126.6519, transfer: '7호선' },
  { name: '주안',          line: '인천 2호선', lat: 37.4646, lng: 126.6803, transfer: '경인선(1호선)' },
  { name: '석바위시장',    line: '인천 2호선', lat: 37.4602, lng: 126.6890, transfer: null },
]
