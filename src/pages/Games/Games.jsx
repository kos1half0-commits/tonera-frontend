import './Games.css'

const GAMES = [
  { id: 'spin',    icon: '🎡', title: 'КОЛЕСО ФОРТУНЫ', desc: 'Крути колесо и выигрывай TON' },
  { id: 'trading', icon: '📈', title: 'ТРЕЙДИНГ',       desc: 'Угадай движение цены TON' },
]

export default function Games({ onGame, tradingStatus = '1' }) {
  return (
    <div className="games-wrap">
      <div className="games-title">🎮 ИГРЫ</div>
      <div className="games-grid">
        {GAMES.map(g => {
          // Трейдинг со статусом 0 — скрываем полностью
          if (g.id === 'trading' && tradingStatus === '0') return null

          // Трейдинг со статусом 2 — показываем с плашкой тех обслуживания
          const isMaint = g.id === 'trading' && tradingStatus === '2'

          return (
            <div key={g.id} className={`game-card ${isMaint ? 'maint' : ''}`}
              onClick={() => !isMaint && onGame(g.id)}>
              <div className="gc-icon">{isMaint ? '🔧' : g.icon}</div>
              <div className="gc-title">{g.title}</div>
              <div className="gc-desc">{isMaint ? 'Технические работы' : g.desc}</div>
              {isMaint && <div className="gc-maint-badge">ТЕХ. РАБОТЫ</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
