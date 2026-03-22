import { useState, useEffect, useRef } from 'react'
import { getUserStakes, createStake, unstake } from '../../api/index'
import { useUserStore } from '../../store/userStore'
import './Staking.css'

const RATE_MS = 0.01 / (24 * 60 * 60 * 1000)

export default function Staking({ user }) {
  const { updateBalance } = useUserStore()
  const [dep, setDep] = useState(0)
  const [wal, setWal] = useState(parseFloat(user?.balance_ton ?? 0))
  const [acc, setAcc] = useState(0)
  const [t0, setT0] = useState(Date.now())
  const [income, setIncome] = useState(0)
  const [modal, setModal] = useState(null) // 'plus' | 'minus'
  const [amount, setAmount] = useState('')
  const [stakeId, setStakeId] = useState(null)
  const [toast, setToast] = useState('')
  const timerRef = useRef(null)

  const getIncome = (a, t) => a + dep * RATE_MS * (Date.now() - t)

  // Load active stake on mount
  useEffect(() => {
    getUserStakes().then(r => {
      if (r.data?.length > 0) {
        const s = r.data[0]
        setDep(parseFloat(s.amount))
        setStakeId(s.id)
        setAcc(parseFloat(s.earned) || 0)
        setT0(new Date(s.started_at).getTime())
      }
    }).catch(() => {})
  }, [])

  // Live ticker
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIncome(getIncome(acc, t0))
    }, 100)
    return () => clearInterval(timerRef.current)
  }, [dep, acc, t0])

  const snap = () => {
    const cur = getIncome(acc, t0)
    setAcc(cur)
    setT0(Date.now())
    return cur
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleCollect = () => {
    if (income < 1e-9) return
    const v = snap()
    setAcc(0)
    setT0(Date.now())
    setWal(w => w + v)
    updateBalance(v)
    showToast(`СОБРАНО +${v.toFixed(6)} TON`)
  }

  const handleReinvest = () => {
    if (income < 1e-9) return
    const v = snap()
    setAcc(0)
    setT0(Date.now())
    setDep(d => d + v)
    showToast(`РЕИНВЕСТ +${v.toFixed(6)} TON`)
  }

  const handleConfirm = async () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) { showToast('ВВЕДИ СУММУ'); return }
    if (modal === 'plus') {
      if (val > wal) { showToast('НЕДОСТАТОЧНО СРЕДСТВ'); return }
      snap()
      setAcc(0); setT0(Date.now())
      setWal(w => w - val)
      setDep(d => d + val)
      updateBalance(-val)
      try { await createStake({ amount: val }) } catch {}
      showToast(`ДЕПОЗИТ +${val.toFixed(4)} TON`)
    } else {
      if (val > dep) { showToast('БОЛЬШЕ ДЕПОЗИТА'); return }
      snap()
      setAcc(0); setT0(Date.now())
      setDep(d => d - val)
      setWal(w => w + val)
      updateBalance(val)
      if (stakeId) { try { await unstake(stakeId) } catch {} }
      showToast(`ВЫВЕДЕНО ${val.toFixed(4)} TON`)
    }
    setModal(null)
    setAmount('')
  }

  return (
    <div className="staking-wrap">
      {toast && <div className="stake-toast">{toast}</div>}

      <div className="stake-topbar">
        <div className="swpill">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 13a1 1 0 100 2 1 1 0 000-2z" fill="currentColor"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/></svg>
          <span className="swp-b">{wal.toFixed(4)}</span>
          <span className="swp-c">TON</span>
        </div>
        <div className="dep-badge">РАБОЧИЙ ДЕПОЗИТ</div>
      </div>

      <div className="stake-row">
        <div>
          <div className="sr-label">ДЕПОЗИТ</div>
          <div className="sr-val">
            <span className="sr-num">{dep.toFixed(4)}</span>
            <span className="sr-cur">TON</span>
          </div>
        </div>
        <div className="sbg">
          <button className="sbsq sbsq-m" onClick={() => { setModal('minus'); setAmount('') }}>−</button>
          <button className="sbsq sbsq-p" onClick={() => { setModal('plus'); setAmount('') }}>+</button>
        </div>
      </div>

      <div className="stake-row">
        <div>
          <div className="sr-label">ДОХОД В ДЕНЬ</div>
          <div className="sr-val">
            <span className="sr-num" style={{fontSize:22}}>1%</span>
            <span className="sr-sub">~{(dep * 0.01).toFixed(4)} TON</span>
          </div>
        </div>
        <button className="sbsq-po" onClick={() => { setModal('plus'); setAmount('') }}>+</button>
      </div>

      <div className="income-card">
        <div className="inc-lbl">ДОХОД</div>
        <div className="inc-row">
          <span className={`inc-num ${income > 0 ? 'g' : ''}`}>{income.toFixed(8)}</span>
          <span className="inc-ton">TON</span>
        </div>
        <div className="inc-btns">
          <button className="ibtn ibtn-c" onClick={handleCollect}>Собрать</button>
          <button className="ibtn ibtn-r" onClick={handleReinvest}>Реинвест</button>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-inner">
            <div className="modal-title">{modal === 'plus' ? 'ДОБАВИТЬ ДЕПОЗИТ' : 'ВЫВЕСТИ ДЕПОЗИТ'}</div>
            <div className="mi-wrap">
              <input className="mi" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus/>
              <span className="mi-cur">TON</span>
            </div>
            <div className="mhint">
              {modal === 'plus' ? 'Доступно в кошельке: ' : 'Депозит: '}
              <span>{(modal === 'plus' ? wal : dep).toFixed(4)}</span> TON
            </div>
            <div className="mbtns">
              <button className="mbtn mb-c" onClick={() => setModal(null)}>Отмена</button>
              <button className="mbtn mb-ok" onClick={handleConfirm}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
