export const TEAMS = [
  { key: 'LG 트윈스',    shortName: 'LG',  color: '#C30452', markerClass: 'ymap-marker--lg',     stadium: { lat: 37.5122, lng: 127.0717 } },
  { key: 'KIA 타이거즈',  shortName: 'KIA', color: '#EA0029', markerClass: 'ymap-marker--kia',    stadium: { lat: 35.1683, lng: 126.8890 } },
  { key: '롯데 자이언츠', shortName: '롯데', color: '#002B72', markerClass: 'ymap-marker--lotte',  stadium: { lat: 35.1940, lng: 129.0614 } },
  { key: '삼성 라이온즈', shortName: '삼성', color: '#074CA1', markerClass: 'ymap-marker--samsung', stadium: { lat: 35.8415, lng: 128.6817 } },
  { key: '두산 베어스',   shortName: '두산', color: '#131230', markerClass: 'ymap-marker--doosan', stadium: { lat: 37.5122, lng: 127.0719 } },
  { key: 'KT 위즈',      shortName: 'KT',  color: '#0B0B45', markerClass: 'ymap-marker--kt',     stadium: { lat: 37.2972, lng: 127.0099 } },
  { key: 'SSG 랜더스',   shortName: 'SSG', color: '#CE0E2D', markerClass: 'ymap-marker--ssg',    stadium: { lat: 37.4370, lng: 126.6931 } },
  { key: 'NC 다이노스',   shortName: 'NC',  color: '#071D5E', markerClass: 'ymap-marker--nc',     stadium: { lat: 35.2225, lng: 128.5816 } },
  { key: '한화 이글스',   shortName: '한화', color: '#FF6600', markerClass: 'ymap-marker--hanwha', stadium: { lat: 36.4716, lng: 127.4008 } },
  { key: '키움 히어로즈', shortName: '키움', color: '#570514', markerClass: 'ymap-marker--kiwoom', stadium: { lat: 37.4981, lng: 126.8670 } },
]

// 현재 데이터가 준비된 팀
export const AVAILABLE_TEAMS = ['LG 트윈스']

export const TEAM_CONFIG = Object.fromEntries(TEAMS.map(t => [t.key, t]))
