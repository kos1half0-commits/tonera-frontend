import { useState, useEffect, useRef } from 'react'
import { useUserStore } from '../../store/userStore'
import api from '../../api/index'
import './Slots.css'

const SYMBOLS = [
  { icon: '🍋', name: 'лимон',   mult: 2,   weight: 30 },
  { icon: '🍒', name: 'вишня',   mult: 3,   weight: 25 },
  { icon: '🍇', name: 'виноград', mult: 4,  weight: 20 },
  { icon: '🔔', name: 'колокол', mult: 6,   weight: 12 },
  { icon: '💎', name: 'алмаз',   mult: 15,  weight: 8  },
  { icon: '⭐', name: 'звезда',  mult: 25,  weight: 4  },
  { icon: '💰', name: 'TON',     mult: 100, weight: 1  },
]

const REEL_SIZE = 30

function buildReel() {
  const reel = []
  SYMBOLS.forEach(s => {
    for (let i = 0; i < s.weight; i++) reel.push(s)
  })
  // Shuffle
  for (let i = reel.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [reel[i], reel[j]] = [reel[j], reel[i]]
  }
  return reel
}

export default function Slots({ onBack }) {
  const { updateBalance } = useUserStore()
  const user = useUserStore(s => s.user)
  const [amount, setAmount] = useState('0.1')
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState([[0,0,0],[0,0,0],[0,0,0]])
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [config, setConfig] = useState({ slots_enabled: '1', slots_min_bet: '0.01' })
  const balance = parseFloat(user?.balance_ton ?? 0)

  useEffect(() => {
    api.get('/api/slots/info').then(r => setConfig(r.data)).catch(() => {})
  }, [])

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  const spin = async () => {
    if (spinning) return
    const val = parseFloat(amount)
    if (!val || val < parseFloat(config.slots_min_bet)) {
      showToast(`МИН. СТАВКА: ${config.slots_min_bet} TON`, true); return
    }
    if (val > balance) { showToast('НЕДОСТАТОЧНО СРЕДСТВ', true); return }

    setSpinning(true)
    setResult(null)

    try {
      const r = await api.post('/api/slots/spin', { amount: val })
      const { symbols, won, payout, multiplier } = r.data

      // Анимация — крутим барабаны
      const duration = [1200, 1600, 2000]
      const reelData = [buildReel(), buildReel(), buildReel()]

      // Анимируем каждый барабан
      reelData.forEach((reel, ri) => {
        let frame = 0
        const total = Math.floor(duration[ri] / 50)
        const interval = setInterval(() => {
          frame++
          const idx = frame % reel.length
          setReels(prev => {
            const next = [...prev]
            next[ri] = [
              reel[(idx - 1 + reel.length) % reel.length],
              reel[idx],
              reel[(idx + 1) % reel.length]
            ].map(s => s.icon)
            return next
          })
          if (frame >= total) {
            clearInterval(interval)
            // Ставим финальный символ
            const finalSymbol = SYMBOLS.find(s => s.icon === symbols[ri])
            setReels(prev => {
              const next = [...prev]
              next[ri] = [
                reel[(reel.length - 1) % reel.length].icon,
                symbols[ri],
                reel[1 % reel.length].icon
              ]
              return next
            })
            if (ri === 2) {
              setTimeout(() => {
                setResult({ won, payout, multiplier, symbols })
                if (won) {
                  updateBalance(-val + payout)
                  showToast(`🎰 ВЫИГРЫШ x${multiplier}! +${(payout-val).toFixed(4)} TON`)
                } else {
                  updateBalance(-val)
                  showToast('😢 Не повезло', true)
                }
                setSpinning(false)
              }, 300)
            }
          }
        }, 50)
      })
    } catch (e) {
      showToast(e?.response?.data?.error || 'Ошибка', true)
      setSpinning(false)
    }
  }

  return (
    <div className="slots-wrap">
      {toast && <div className={`slots-toast ${toastErr?'err':''}`}>{toast}</div>}

      <div className="slots-header">
        <button className="slots-back" onClick={onBack}>← ИГРЫ</button>
        <div className="slots-title">🎰 СЛОТЫ</div>
        <div className="slots-balance">{balance.toFixed(4)} TON</div>
      </div>

      <div className="slots-machine">
        <div className="slots-reels">
          {reels.map((reel, ri) => (
            <div key={ri} className={`slots-reel ${spinning?'spinning':''}`}>
              <div className="reel-sym dim">{reel[0]}</div>
              <div className="reel-sym main">{reel[1]}</div>
              <div className="reel-sym dim">{reel[2]}</div>
            </div>
          ))}
        </div>
        <div className="slots-line"/>
      </div>

      {result && (
        <div className={`slots-result ${result.won?'win':'lose'}`}>
          {result.won
            ? `🎰 x${result.multiplier} — +${(result.payout-parseFloat(amount)).toFixed(4)} TON`
            : '😢 Не повезло — попробуй ещё!'}
        </div>
      )}

      <div className="slots-paytable">
        <div className="spt-title">ТАБЛИЦА ВЫПЛАТ</div>
        <div className="spt-grid">
          {SYMBOLS.map(s => (
            <div key={s.name} className="spt-row">
              <span>{s.icon}{s.icon}{s.icon}</span>
              <span className="spt-mult">x{s.mult}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="slots-bet-row">
        <div className="slots-bet-label">СТАВКА (TON)</div>
        <div className="slots-bet-btns">
          {['0.01','0.05','0.1','0.5','1'].map(v => (
            <button key={v} className={`slots-bet-btn ${amount===v?'on':''}`}
              onClick={() => setAmount(v)}>{v}</button>
          ))}
        </div>
      </div>

      <button className="slots-spin-btn" onClick={spin} disabled={spinning}>
        {spinning ? '🎰 КРУТИТСЯ...' : `🎰 КРУТИТЬ за ${amount} TON`}
      </button>
    </div>
  )
}
