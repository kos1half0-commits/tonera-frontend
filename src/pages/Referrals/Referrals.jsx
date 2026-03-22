import { useState, useEffect } from 'react'
import { getReferrals } from '../../api/index'
import './Referrals.css'

export default function Referrals({ user }) {
  const [refs, setRefs] = useState([])
  const [copied, setCopied] = useState(false)

  const refLink = user?.ref_code ? `https://t.me/ToneraBot?start=${user.ref_code}` : 'https://t.me/ToneraBot?start=demo'

  useEffect(() => {
    getReferrals().then(r => setRefs(r.data)).catch(() => {})
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
        <div className="ref-stat"><div className="rsv">{(refs.length * 0.5).toFixed(1)}</div><div className="rsl">TON заработано</div></div>
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
        {['Поделись реферальной ссылкой','Друг регистрируется в TonEra','Ты получаешь 0.5 TON мгновенно'].map((s,i) => (
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
              <div className="ref-info"><div className="ref-name">{r.username || r.first_name || 'Пользователь'}</div><div className="ref-date">{new Date(r.created_at).toLocaleDateString('ru')}</div></div>
              <div className="ref-bonus">+0.5 TON</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
