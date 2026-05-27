// Mock data — replace with API calls via src/api/venueApi.js

export const VENUES = [
  // ── LG 트윈스 (서울) ──────────────────────────────────────────
  { id: 1,  name: "투홀릭치킨 서초점",    address: "서울 서초구 양재동 328-12",            lat: 37.4685, lng: 127.0410, rating: 4.5, reviewCount: 72,  nearStation: "양재시민의숲역 350m",       area: "역삼역",     team: "LG 트윈스", phone: "02-3478-1234" },
  { id: 2,  name: "야구보러가자",          address: "서울 중랑구 면목동 601-19",            lat: 37.5816, lng: 127.0877, rating: 4.8, reviewCount: 89,  nearStation: "건대입구역 600m",           area: "건대입구역",  team: "LG 트윈스", phone: "02-2291-5678" },
  { id: 3,  name: "트윈스포차",            address: "서울 강북구 번동 468-2",               lat: 37.6406, lng: 127.0298, rating: 4.7, reviewCount: 64,  nearStation: "수유역 400m",               area: "기타",       team: "LG 트윈스", phone: "02-4912-3344" },
  { id: 4,  name: "강남 두꺼비 1981",      address: "서울 서초구 서초동 1302-50",           lat: 37.5034, lng: 127.0226, rating: 4.6, reviewCount: 112, nearStation: "신논현역 250m",             area: "역삼역",     team: "LG 트윈스", phone: "02-558-1981"  },
  { id: 5,  name: "죽여주는김치찜 하남점", address: "경기도 하남시 망월동 1100",            lat: 37.5637, lng: 127.1918, rating: 4.9, reviewCount: 145, nearStation: "미사역 도보 5분",           area: "기타",       team: "LG 트윈스", phone: "031-8899-4567" },
  { id: 6,  name: "호멜포차",              address: "서울 동작구 노량진동 16-1",            lat: 37.5143, lng: 126.9393, rating: 4.5, reviewCount: 55,  nearStation: "노량진역 350m",             area: "기타",       team: "LG 트윈스", phone: "02-813-7812"  },
  { id: 7,  name: "슐미랭삼 선릉점",       address: "서울 강남구 삼성동 140-19",            lat: 37.5066, lng: 127.0497, rating: 4.9, reviewCount: 203, nearStation: "선릉역 300m",               area: "역삼역",     team: "LG 트윈스", phone: "02-5566-7788" },
  { id: 8,  name: "더블플레이치킨 홍대점", address: "서울 마포구 동교동 200-24",            lat: 37.5582, lng: 126.9229, rating: 4.5, reviewCount: 77,  nearStation: "홍대입구역 350m",           area: "홍대입구역",  team: "LG 트윈스", phone: "02-3313-4455" },
  { id: 9,  name: "맛도리네포장마차",       address: "서울 송파구 삼전동 166-5",             lat: 37.5003, lng: 127.0947, rating: 4.5, reviewCount: 61,  nearStation: "삼전역 400m",               area: "잠실역",     team: "LG 트윈스", phone: "02-412-9900"  },
  { id: 10, name: "당인리극장",             address: "서울 마포구 서교동 394-20",            lat: 37.5492, lng: 126.9154, rating: 4.7, reviewCount: 156, nearStation: "합정역 150m",               area: "홍대입구역",  team: "LG 트윈스", phone: "02-3344-5566" },
  { id: 11, name: "레코드피자 을지로점",    address: "서울 중구 을지로3가 342-2",            lat: 37.5660, lng: 126.9905, rating: 4.7, reviewCount: 132, nearStation: "을지로3가역 200m",          area: "기타",       team: "LG 트윈스", phone: "02-2211-3344" },
  { id: 12, name: "치어하우스",             address: "서울 마포구 상수동 145-2",             lat: 37.5484, lng: 126.9224, rating: 4.8, reviewCount: 94,  nearStation: "상수역 200m",               area: "홍대입구역",  team: "LG 트윈스", phone: "02-3355-6677" },
  { id: 13, name: "밤새맥주 일산본점",      address: "경기도 고양시 일산동구 장항동 761",   lat: 37.6620, lng: 126.7673, rating: 4.6, reviewCount: 93,  nearStation: "라페스타 내",               area: "기타",       team: "LG 트윈스", phone: "031-9988-7766" },
  { id: 14, name: "드래프트128",            address: "서울 영등포구 여의도동 20",            lat: 37.5278, lng: 126.9292, rating: 4.8, reviewCount: 221, nearStation: "여의도역 도보 2분",          area: "기타",       team: "LG 트윈스", phone: "02-784-1280"  },
  { id: 15, name: "망원동나경이네",          address: "서울 마포구 망원동 418-37",            lat: 37.5553, lng: 126.9005, rating: 4.6, reviewCount: 48,  nearStation: "망원역 200m",               area: "홍대입구역",  team: "LG 트윈스", phone: "02-333-9911"  },
  { id: 16, name: "카페&펍 연무장 던던",    address: "서울 중구 을지로6가 21-31",            lat: 37.5657, lng: 127.0069, rating: 4.6, reviewCount: 88,  nearStation: "동대문역사문화공원역 200m",  area: "건대입구역",  team: "LG 트윈스", phone: "02-2266-3388" },
  { id: 17, name: "주한상",                 address: "서울 동대문구 장안동 376-4",           lat: 37.5663, lng: 127.0672, rating: 4.4, reviewCount: 42,  nearStation: "장한평역 350m",             area: "건대입구역",  team: "LG 트윈스", phone: "02-2249-1234" },
  { id: 18, name: "고레와참치",             address: "서울 은평구 응암동 126-20",            lat: 37.5948, lng: 126.9156, rating: 4.4, reviewCount: 38,  nearStation: "응암역 200m",               area: "기타",       team: "LG 트윈스", phone: "02-389-2121"  },
  { id: 19, name: "금성슈퍼 광화문본점",    address: "서울 종로구 신문로1가 7-5",            lat: 37.5706, lng: 126.9760, rating: 4.6, reviewCount: 178, nearStation: "광화문역 400m",             area: "기타",       team: "LG 트윈스", phone: "02-723-4890"  },
  { id: 20, name: "잠실 고박사",            address: "서울 송파구 잠실동 195-12",            lat: 37.5102, lng: 127.0796, rating: 4.9, reviewCount: 187, nearStation: "잠실새내역 150m",           area: "잠실역",     team: "LG 트윈스", phone: "02-421-5678"  },
  { id: 21, name: "엘지포차",               address: "서울 종로구 종로6가 239-41",           lat: 37.5720, lng: 127.0061, rating: 4.7, reviewCount: 103, nearStation: "동묘앞역 250m",             area: "기타",       team: "LG 트윈스", phone: "02-2289-0011" },
  { id: 22, name: "트윈스삼겹살",           address: "서울 중랑구 면목동 104-15",            lat: 37.5886, lng: 127.0911, rating: 4.5, reviewCount: 67,  nearStation: "면목역 300m",               area: "건대입구역",  team: "LG 트윈스", phone: "02-491-8745"  },
  { id: 23, name: "취바",                   address: "서울 도봉구 창동 805",                 lat: 37.6543, lng: 127.0464, rating: 4.5, reviewCount: 51,  nearStation: "창동역 500m",               area: "기타",       team: "LG 트윈스", phone: "02-3456-7890" },
  { id: 24, name: "9회말집",                address: "서울 서대문구 연희동 131-5",           lat: 37.5720, lng: 126.9290, rating: 4.6, reviewCount: 59,  nearStation: "홍대입구역 500m",           area: "홍대입구역",  team: "LG 트윈스", phone: "02-3322-4455" },
  { id: 25, name: "승리의한잔",             address: "서울 송파구 잠실동 40-1",              lat: 37.5127, lng: 127.0820, rating: 4.6, reviewCount: 84,  nearStation: "잠실새내역 400m",           area: "잠실역",     team: "LG 트윈스", phone: "02-423-6677"  },

  // ── KIA 타이거즈 (광주) ──────────────────────────────────────
  { id: 26, name: "챔피언스포차",           address: "광주 북구 임동 챔피언스필드 앞",         lat: 35.1678, lng: 126.8882, rating: 4.7, reviewCount: 88,  nearStation: "챔피언스필드 도보 2분",      area: "챔피언스필드", team: "KIA 타이거즈", phone: "062-521-3344" },
  { id: 27, name: "타이거스탠",             address: "광주 북구 동문대로 챔피언스필드 맞은편", lat: 35.1692, lng: 126.8897, rating: 4.8, reviewCount: 102, nearStation: "챔피언스필드 도보 5분",      area: "챔피언스필드", team: "KIA 타이거즈", phone: "062-514-8800" },
  { id: 28, name: "광주야구포차",           address: "광주 북구 유동 88-3",                    lat: 35.1648, lng: 126.8865, rating: 4.5, reviewCount: 63,  nearStation: "챔피언스필드 350m",         area: "챔피언스필드", team: "KIA 타이거즈", phone: "062-528-1122" },
  { id: 29, name: "무등야구바",             address: "광주 서구 상무중앙로 상무지구",           lat: 35.1538, lng: 126.8512, rating: 4.6, reviewCount: 77,  nearStation: "상무역 200m",               area: "상무역",      team: "KIA 타이거즈", phone: "062-375-9988" },
  { id: 30, name: "KIA응원주점",            address: "광주 동구 금남로 광주역 인근",            lat: 35.1598, lng: 126.9042, rating: 4.4, reviewCount: 45,  nearStation: "광주역 400m",               area: "광주역",      team: "KIA 타이거즈", phone: "062-233-7700" },

  // ── 롯데 자이언츠 (부산) ──────────────────────────────────────
  { id: 31, name: "사직포차",               address: "부산 동래구 사직동 사직구장 앞",          lat: 35.1938, lng: 129.0608, rating: 4.8, reviewCount: 95,  nearStation: "사직역 도보 3분",           area: "사직",        team: "롯데 자이언츠", phone: "051-558-9900" },
  { id: 32, name: "자이언츠 팬바",          address: "부산 동래구 사직동 산1-1 근처",           lat: 35.1948, lng: 129.0622, rating: 4.7, reviewCount: 83,  nearStation: "사직역 도보 5분",           area: "사직",        team: "롯데 자이언츠", phone: "051-552-4477" },
  { id: 33, name: "부산야구포차",           address: "부산 부산진구 부전동 서면로터리 근처",    lat: 35.1569, lng: 129.0596, rating: 4.5, reviewCount: 71,  nearStation: "서면역 300m",               area: "서면",        team: "롯데 자이언츠", phone: "051-806-3355" },
  { id: 34, name: "롯데응원주점",           address: "부산 동구 초량동 부산역 근처",            lat: 35.1148, lng: 129.0405, rating: 4.3, reviewCount: 52,  nearStation: "부산역 400m",               area: "부산역",      team: "롯데 자이언츠", phone: "051-441-2288" },
  { id: 35, name: "갈매기치킨 서면점",      address: "부산 부산진구 전포동 서면 중심가",        lat: 35.1583, lng: 129.0615, rating: 4.6, reviewCount: 68,  nearStation: "서면역 200m",               area: "서면",        team: "롯데 자이언츠", phone: "051-818-6699" },
]

// 팀별 지역 목록 (area filter용)
export const AREAS_BY_TEAM = {
  'LG 트윈스':    ['전체', '역삼역', '홍대입구역', '잠실역', '건대입구역'],
  'KIA 타이거즈': ['전체', '챔피언스필드', '상무역', '광주역'],
  '롯데 자이언츠': ['전체', '사직', '서면', '부산역'],
}
