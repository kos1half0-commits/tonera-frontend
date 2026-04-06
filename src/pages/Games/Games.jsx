import AdBanner from '../../components/AdBanner'
import { useState, useEffect } from 'react'
import api from '../../api/index'
import './Games.css'

const GAMES_CONFIG = [
  { id: 'spin',    icon: '🎡', title: 'КОЛЕСО ФОРТУНЫ', desc: 'Крути колесо и выигрывай TON',    settingKey: 'spin_enabled' },
  { id: 'trading', icon: '₿',  title: 'ТРЕЙДИНГ BTC',   desc: 'Угадай движение цены Bitcoin',    settingKey: 'trading_enabled' },
  { id: 'slots',   icon: '🎰', title: 'СЛОТЫ',          desc: 'Три барабана — крути и выигрывай', settingKey: 'slots_enabled' },
]

export default function Games({ onGame, isAdmin = false }) {
  const [statuses, setStatuses] = useState({})

  useEffect(() => {
    // Загружаем статусы всех игр
    Promise.all([
      api.get('/api/spin/info'),
      api.get('/api/trading/info'),
      api.get('/api/slots/info'),
    ]).then(([spin, trading, slots]) => {
      setStatuses({
        spin_enabled:    String(spin.data?.spin_enabled    ?? '1'),
        trading_enabled: String(trading.data?.trading_enabled ?? '1'),
        slots_enabled:   String(slots.data?.slots_enabled  ?? '1'),
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="games-wrap">
      <AdBanner page="games" />
      <div className="games-title">🎮 ИГРЫ</div>
      <div className="games-grid">
        {GAMES_CONFIG.map(g => {
          const status = statuses[g.settingKey] || '1'
          // 0 — скрыто от всех
          if (status === '0') return null
          // 3 — только админ
          if (status === '3' && !isAdmin) return null
          // 2 — тех обслуживание (видно но нельзя открыть)
          const isMaint = status === '2'
          const isAdminOnly = status === '3' && isAdmin

          return (
            <div key={g.id} className={`game-card ${isMaint ? 'maint' : ''} ${isAdminOnly ? 'admin-only' : ''}`}
              onClick={() => !isMaint && onGame(g.id)}>
              <div className="gc-icon">{isMaint ? '🔧' : g.icon}</div>
              <div className="gc-title">{g.title}</div>
              <div className="gc-desc">{isMaint ? 'Технические работы' : g.desc}</div>
              {isMaint && <div className="gc-badge maint-badge">ТЕХ. РАБОТЫ</div>}
              {isAdminOnly && <div className="gc-badge admin-badge">ТОЛЬКО АДМИН</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
