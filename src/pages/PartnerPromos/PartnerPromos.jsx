import { useState, useEffect } from 'react'
import api from '../../api/index'
import './PartnerPromos.css'

export default function PartnerPromos({ onBack, onActivate }) {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(null)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)

  const showToast = (msg, err = false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  useEffect(() => {
    api.get('/api/promo/partner-list').then(r => {
      setPromos(r.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activate = async (code) => {
    setActivating(code)
    try {
      const r = await api.post('/api/promo/activate', { code })
      showToast(`\u2705 +${parseFloat(r.data.amount).toFixed(5)} TON`)
      // Mark as used
      setPromos(prev => prev.map(p => p.code === code ? { ...p, used: true, uses: p.uses + 1, remaining: p.remaining - 1 } : p))
      if (onActivate) onActivate(parseFloat(r.data.amount))
    } catch (e) {
      showToast(e?.response?.data?.error || '\u041e\u0448\u0438\u0431\u043a\u0430', true)
    }
    setActivating(null)
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    showToast(`\uD83D\uDCCB ${code} \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d`)
  }

  const extractChannelName = (url) => {
    if (!url) return ''
    const m = url.match(/t\.me\/([^/?]+)/)
    return m ? '@' + m[1] : url
  }

  return (
    <div className="pp-wrap">
      {toast && <div className={`pp-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="pp-header">
        <button className="pp-back" onClick={onBack}>{'\u2190 \u041d\u0410\u0417\u0410\u0414'}</button>
        <div className="pp-title">{'\uD83C\uDF81 \u041f\u0420\u041e\u041c\u041e\u041a\u041e\u0414\u042b \u041f\u0410\u0420\u0422\u041d\u0401\u0420\u041e\u0412'}</div>
      </div>

      <div className="pp-subtitle">
        {'\u041f\u043e\u0434\u043f\u0438\u0448\u0438\u0442\u0435\u0441\u044c \u043d\u0430 \u043a\u0430\u043d\u0430\u043b \u0438 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u0443\u0439\u0442\u0435 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u0434\u043b\u044f \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u044f \u0431\u043e\u043d\u0443\u0441\u0430 TON'}
      </div>

      {loading && (
        <div className="pp-loading">{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}</div>
      )}

      {!loading && promos.length === 0 && (
        <div className="pp-empty">
          <div className="pp-empty-icon">{'\uD83D\uDCED'}</div>
          <div className="pp-empty-text">{'\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u043e\u0432'}</div>
          <div className="pp-empty-sub">{'\u0417\u0430\u0433\u043b\u044f\u043d\u0438\u0442\u0435 \u043f\u043e\u0437\u0436\u0435 \u2014 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u044b \u043f\u0443\u0431\u043b\u0438\u043a\u0443\u044e\u0442 \u043d\u043e\u0432\u044b\u0435 \u043a\u043e\u0434\u044b'}</div>
        </div>
      )}

      <div className="pp-list">
        {promos.map((p, i) => (
          <div key={i} className={`pp-card ${p.used ? 'used' : ''}`}>
            {/* Channel info */}
            <div className="pp-channel">
              <div className="pp-channel-avatar">{'\uD83D\uDCE2'}</div>
              <div className="pp-channel-info">
                <div className="pp-channel-name">{extractChannelName(p.channel_url)}</div>
                <div className="pp-channel-by">{p.username ? '@' + p.username : p.first_name}</div>
              </div>
              <a href={p.channel_url} target="_blank" rel="noopener noreferrer" className="pp-channel-link">
                {'\u041f\u043e\u0434\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f'}
              </a>
            </div>

            {/* Promo code */}
            <div className="pp-code-row">
              <div className="pp-code-box" onClick={() => copyCode(p.code)}>
                <span className="pp-code-text">{p.code}</span>
                <span className="pp-code-copy">{'\uD83D\uDCCB'}</span>
              </div>
              <div className="pp-reward">
                <span className="pp-reward-val">+{parseFloat(p.amount).toFixed(4)}</span>
                <span className="pp-reward-cur">TON</span>
              </div>
            </div>

            {/* Stats */}
            <div className="pp-stats">
              <div className="pp-stat">
                <span className="pp-stat-icon">{'\uD83D\uDC65'}</span>
                <span>{p.remaining}/{p.max_uses}</span>
              </div>
              {p.expires_at && (
                <div className="pp-stat">
                  <span className="pp-stat-icon">{'\u23F0'}</span>
                  <span>{new Date(p.expires_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
                </div>
              )}
              {p.remaining <= 5 && p.remaining > 0 && (
                <div className="pp-stat hot">{'\uD83D\uDD25 \u041c\u0430\u043b\u043e \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c!'}</div>
              )}
            </div>

            {/* Action */}
            {p.used ? (
              <div className="pp-used-badge">{'\u2705 \u0410\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d'}</div>
            ) : (
              <button
                className="pp-activate-btn"
                disabled={activating === p.code}
                onClick={() => activate(p.code)}
              >
                {activating === p.code ? '\u23F3...' : '\uD83C\uDF81 \u0410\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
