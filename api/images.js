/**
 * Vercel Serverless Function — 네이버 이미지 검색 API 프록시
 * GET /api/images?query=강남역+카페
 */
export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API credentials not configured' });
  }

  try {
    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=5&filter=large`;
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id':     clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.status(200).json(data.items ?? []);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
