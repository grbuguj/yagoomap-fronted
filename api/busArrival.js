// 인천광역시 버스도착정보 프록시 (Vercel serverless — api/images.js와 동일 패턴)
// 호출: /api/busArrival?bstopId=정류소ID
// 출처: 공공데이터포털 「인천광역시_버스도착정보 조회」 (제공기관: 인천광역시)
// 환경변수 INCHEON_BUS_API_KEY 를 Vercel 프로젝트 env에 등록해야 동작.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { bstopId } = req.query
  if (!bstopId) return res.status(400).json({ error: 'bstopId required' })

  const key = process.env.INCHEON_BUS_API_KEY
  if (!key) return res.status(500).json({ error: 'INCHEON_BUS_API_KEY not configured' })

  const url =
    'https://apis.data.go.kr/6280000/busArrivalService/getAllRouteBusArrivalList' +
    `?serviceKey=${key}&bstopId=${encodeURIComponent(bstopId)}&numOfRows=5&pageNo=1`

  try {
    const r = await fetch(url)
    const text = await r.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=30') // 도착정보 갱신주기 고려 30초 캐시
    return res.status(200).send(text)
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed', detail: String(e) })
  }
}
