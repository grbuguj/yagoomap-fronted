// 공공데이터포털 CSV → src/data/*.js 변환 스크립트 (로컬 1회 실행)
// 사용법:
//   node scripts/convertCsv.mjs 역사정보.csv            → incheonStations.json
//   node scripts/convertCsv.mjs 전국주차장.csv --parking → incheonParking.json (인천만 필터)
// ⚠️ 컬럼명은 실제 CSV 헤더를 열어 확인 후 아래 매핑을 수정하세요.
// EUC-KR CSV라면 먼저: iconv -f euc-kr -t utf-8 원본.csv > utf8.csv
import fs from 'fs'

const [file, mode] = process.argv.slice(2)
if (!file) { console.error('usage: node scripts/convertCsv.mjs <csv> [--parking]'); process.exit(1) }

const text = fs.readFileSync(file, 'utf-8')
const [header, ...rows] = text.split(/\r?\n/).filter(Boolean)
const cols = header.split(',')
console.log('헤더:', cols.map((c, i) => `${i}:${c}`).join(' | '))

const idx = name => cols.findIndex(c => c.includes(name))

let out
if (mode === '--parking') {
  const [iName, iLat, iLng, iFee, iCap, iAddr] =
    ['주차장명', '위도', '경도', '요금정보', '주차구획수', '소재지도로명주소'].map(idx)
  out = rows
    .map(r => r.split(','))
    .filter(c => (c[iAddr] ?? '').startsWith('인천'))
    .map(c => ({ name: c[iName], lat: +c[iLat], lng: +c[iLng], fee: c[iFee], capacity: +c[iCap] || null }))
    .filter(p => p.lat && p.lng)
} else {
  const [iName, iLine, iLat, iLng] = ['역사명', '노선명', '역위도', '역경도'].map(idx)
  out = rows
    .map(r => r.split(','))
    .map(c => ({ name: c[iName], line: c[iLine], lat: +c[iLat], lng: +c[iLng], transfer: null }))
    .filter(s => s.lat && s.lng)
}

const dest = mode === '--parking' ? 'incheonParking.json' : 'incheonStations.json'
fs.writeFileSync(dest, JSON.stringify(out, null, 1))
console.log(`${dest} 생성 완료 — ${out.length}건. src/data/*.js의 배열을 이 내용으로 교체하세요.`)
