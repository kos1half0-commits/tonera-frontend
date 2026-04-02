import { useState, useEffect } from 'react'
import { getReferrals } from '../../api/index'
import api from '../../api/index'
import './Referrals.css'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'tonera_bot'

export default function Referrals({ user }) {
  const [refs, setRefs] = useState([])
  const [regBonus, setRegBonus] = useState(0.001)
  const [fromTasks, setFromTasks] = useState(0)
  const [fromDeposits, setFromDeposits] = useState(0)
  const [earned, setEarned] = useState(0)
  const [copied, setCopied] = useState(false)

  const refLink = user?.ref_code
    ? `https://t.me/${BOT_USERNAME}?start=${user.ref_code}`
    : `https://t.me/${BOT_USERNAME}`

  useEffect(() => {
    import('../../api/index').then(m => m.default.get('/api/settings/ref_register_bonus').then(r => setRegBonus(parseFloat(r.data?.value || 0.001))).catch(()=>{}))
    getReferrals().then(r => {
      const data = r.data
      if (Array.isArray(data)) { setRefs(data) }
      else {
        setRefs(data?.referrals || [])
        if (data?.earned !== undefined) setEarned(parseFloat(data.earned) || 0)
        if (data?.from_tasks !== undefined) setFromTasks(parseFloat(data.from_tasks) || 0)
        if (data?.from_deposits !== undefined) setFromDeposits(parseFloat(data.from_deposits) || 0)
      }
    }).catch(() => {})

    // Получаем заработок только от рефералов
    api.get('/api/referrals').then(r => {
      if (r.data?.earned !== undefined) setEarned(parseFloat(r.data.earned) || 0)
    }).catch(() => {})
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const tg = window.Telegram?.WebApp
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=Заходи в TonEra — зарабатывай TON!`)
  }

  return (
    <div className="refs-wrap">
      <div className="refs-title">Рефералы</div>

      <div className="refs-stats">
        <div className="ref-stat"><div className="rsv">{refs.length}</div><div className="rsl">Приглашено</div></div>
        <div className="ref-stat"><div className="rsv">{earned.toFixed(4)}</div><div className="rsl">TON заработано</div></div>
        <div className="ref-stat"><div className="rsv">{fromTasks.toFixed(4)}</div><div className="rsl">С заданий</div></div>
        <div className="ref-stat"><div className="rsv">{fromDeposits.toFixed(4)}</div><div className="rsl">С депозитов</div></div>
      </div>

      <div className="invite-card">
        <div className="inv-label">РЕФЕРАЛЬНАЯ ССЫЛКА</div>
        <div className="inv-link">{refLink}</div>
        <div className="inv-btns">
          <button className="btn-p" onClick={handleShare}>⬆ ПОДЕЛИТЬСЯ</button>
          <button className="btn-copy" onClick={handleCopy}>{copied ? '✓' : 'КОПИРОВАТЬ'}</button>
        </div>
      </div>

      <div className="hiw-card">
        <div className="hiw-title">КАК ЭТО РАБОТАЕТ</div>
        {['Поделись реферальной ссылкой','Друг регистрируется в TonEra','Ты получаешь бонус мгновенно'].map((s,i) => (
          <div className="hiw-step" key={i}>
            <div className="hiw-num">{i+1}</div>
            <div className="hiw-txt">{s}</div>
          </div>
        ))}
      </div>

      {refs.length > 0 && (
        <div className="refs-list">
          <div className="refs-list-title">ПРИГЛАШЁННЫЕ</div>
          {refs.map((r, i) => (
            <div className="ref-item" key={i}>
              <div className="ref-avatar">{(r.username || r.first_name || '?')[0].toUpperCase()}</div>
              <div className="ref-info">
                <div className="ref-name">{r.username || r.first_name || 'Пользователь'}</div>
                <div className="ref-date">{new Date(r.created_at).toLocaleDateString('ru')}</div>
              </div>
              <div className="ref-bonus">+{parseFloat(r.earned || regBonus).toFixed(4)} TON</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
