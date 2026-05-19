import { useState } from 'react'

const TEAMS = [
    { name: 'LG 트윈스', color: '#C30452', available: true },
    { name: 'KIA 타이거즈', color: '#EA0029', available: false },
    { name: '삼성 라이온즈', color: '#074CA1', available: false },
    { name: '두산 베어스', color: '#131230', available: false },
    { name: 'KT 위즈', color: '#000000', available: false },
    { name: 'SSG 랜더스', color: '#CE0E2D', available: false },
    { name: '롯데 자이언츠', color: '#002B72', available: false },
    { name: '한화 이글스', color: '#FF6600', available: false },
    { name: 'NC 다이노스', color: '#1D467A', available: false },
    { name: '키움 히어로즈', color: '#820024', available: false },
]

function TeamFilter() {
    const [selectedTeam, setSelectedTeam] = useState('LG 트윈스')

    return (
        <div>
            {TEAMS.map((team) => (
                <button
                    key={team.name}
                    disabled={!team.available}
                    onClick={() => setSelectedTeam(team.name)}
                    style={{
                        backgroundColor: selectedTeam === team.name ? team.color : '',
                        color: selectedTeam === team.name ? 'white' : '',
                    }}
                >
                    {team.name} {!team.available && '준비중'}
                </button>
            ))}
        </div>
    )
}

export default TeamFilter