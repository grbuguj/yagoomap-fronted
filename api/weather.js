// 기상청 단기예보 프록시 (Vercel serverless)
// 호출: /api/weather?nx=55&ny=124
// 출처: 공공데이터포털 「기상청_단기예보 ((구)_동네예보) 조회서비스」
// 환경변수: KMA_API_KEY (없으면 INCHEON_BUS_API_KEY 재사용 — data.go.kr 계정 공통키)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { nx, ny } = req.query
  if (!nx || !ny) return res.status(400).json({ error: 'nx, ny required' })

  const key = process.env.KMA_API_KEY || process.env.INCHEON_BUS_API_KEY
  if (!key) return res.status(500).json({ error: 'API key not configured' })

  // 발표시각: 02,05,08,11,14,17,20,23시 (+10분 후 제공) — KST 기준 최신 발표분 선택
  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  let y = kst.getUTCFullYear(), mo = kst.getUTCMonth(), d = kst.getUTCDate()
  const hour = kst.getUTCHours(), min = kst.getUTCMinutes()
  const slots = [2, 5, 8, 11, 14, 17, 20, 23]
  let base = [...slots].reverse().find(h => hour > h || (hour === h && min >= 15))
  if (base === undefined) { // 0시~2시14분 → 전날 23시 발표분
    base = 23
    const prev = new Date(Date.UTC(y, mo, d) - 24 * 3600 * 1000)
    y = prev.getUTCFullYear(); mo = prev.getUTCMonth(); d = prev.getUTCDate()
  }
  const pad = n => String(n).padStart(2, '0')
  const baseDate = `${y}${pad(mo + 1)}${pad(d)}`
  const baseTime = `${pad(base)}00`

  const url =
    'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst' +
    `?serviceKey=${key}&dataType=JSON&numOfRows=400&pageNo=1` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`

  try {
    const r = await fetch(url)
    const text = await r.text()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=1800') // 발표주기 3시간 — 30분 캐시
    return res.status(200).send(text)
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed', detail: String(e) })
  }
}
