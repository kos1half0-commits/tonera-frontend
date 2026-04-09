import { useState, useEffect } from 'react'
import api from '../../api/index'
import AdBanner from '../../components/AdBanner'
import './PartnerPromos.css'

export default function PartnerPromos({ onBack }) {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)

  const showToast = (msg, err = false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  useEffect(() => {
    api.get('/api/promo/partner-list').then(r => {
      setChannels(r.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const extractChannelName = (url) => {
    if (!url) return ''
    const m = url.match(/t\.me\/([^/?]+)/)
    return m ? '@' + m[1] : url
  }

  const openChannel = (url) => {
    if (url) window.open(url, '_blank')
  }

  return (
    <div className="pp-wrap fade-up">
      {toast && <div className={`pp-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      {/* Header with back */}
      <div className="pp-header">
        <button className="pp-back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="pp-title-wrap">
          <div className="pp-title">{'\uD83C\uDF81 \u041f\u0420\u041e\u041c\u041e\u041a\u041e\u0414\u042b \u041f\u0410\u0420\u0422\u041d\u0401\u0420\u041e\u0412'}</div>
          <div className="pp-subtitle-sm">{'\u041f\u043e\u0434\u043f\u0438\u0448\u0438\u0442\u0435\u0441\u044c \u0438 \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0431\u043e\u043d\u0443\u0441 TON'}</div>
        </div>
      </div>

      {/* Hero info card */}
      <div className="pp-hero">
        <div className="pp-hero-glow"/>
        <div className="pp-hero-content">
          <div className="pp-hero-icon">{'\uD83D\uDCA1'}</div>
          <div className="pp-hero-text">{'\u041a\u0430\u043a \u044d\u0442\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442?'}</div>
        </div>
        <div className="pp-steps">
          <div className="pp-step">
            <div className="pp-step-num">1</div>
            <div className="pp-step-label">{'\u041f\u043e\u0434\u043f\u0438\u0448\u0438\u0442\u0435\u0441\u044c\n\u043d\u0430 \u043a\u0430\u043d\u0430\u043b'}</div>
          </div>
          <div className="pp-step-dot"/>
          <div className="pp-step-dot"/>
          <div className="pp-step-dot"/>
          <div className="pp-step">
            <div className="pp-step-num">2</div>
            <div className="pp-step-label">{'\u041d\u0430\u0439\u0434\u0438\u0442\u0435 \u043a\u043e\u0434\n\u0432 \u043f\u043e\u0441\u0442\u0430\u0445'}</div>
          </div>
          <div className="pp-step-dot"/>
          <div className="pp-step-dot"/>
          <div className="pp-step-dot"/>
          <div className="pp-step">
            <div className="pp-step-num">3</div>
            <div className="pp-step-label">{'\u0412\u0432\u0435\u0434\u0438\u0442\u0435\n\u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439'}</div>
          </div>
        </div>
      </div>

      <AdBanner page="promos" />

      {/* Count badge */}
      {!loading && channels.length > 0 && (
        <div className="pp-count">
          <span className="pp-count-num">{channels.length}</span>
          <span>{channels.length === 1 ? '\u043a\u0430\u043d\u0430\u043b' : '\u043a\u0430\u043d\u0430\u043b\u043e\u0432'} {'\u0441 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u043c\u0438 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u0430\u043c\u0438'}</span>
        </div>
      )}

      {loading && (
        <div className="pp-loading">
          <div className="pp-loading-spinner"/>
          <div>{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}</div>
        </div>
      )}

      {!loading && channels.length === 0 && (
        <div className="pp-empty">
          <div className="pp-empty-icon">{'\uD83D\uDCED'}</div>
          <div className="pp-empty-text">{'\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043f\u0440\u043e\u043c\u043e-\u043a\u0430\u043d\u0430\u043b\u043e\u0432'}</div>
          <div className="pp-empty-sub">{'\u0417\u0430\u0433\u043b\u044f\u043d\u0438\u0442\u0435 \u043f\u043e\u0437\u0436\u0435 \u2014 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u044b \u0440\u0435\u0433\u0443\u043b\u044f\u0440\u043d\u043e \u043f\u0443\u0431\u043b\u0438\u043a\u0443\u044e\u0442 \u043d\u043e\u0432\u044b\u0435 \u043a\u043e\u0434\u044b'}</div>
        </div>
      )}

      {/* Channel list */}
      <div className="pp-list">
        {channels.map((ch, i) => (
          <div key={i} className="pp-card" style={{'--delay': `${i * 0.05}s`}}>
            <div className="pp-card-glow"/>
            <div className="pp-channel-row">
              <div className="pp-avatar">
                <span>{'\uD83D\uDCE2'}</span>
              </div>
              <div className="pp-channel-info">
                <div className="pp-channel-name">{extractChannelName(ch.channel_url)}</div>
                {(ch.username || ch.first_name) && (
                  <div className="pp-channel-by">{'\u043f\u0430\u0440\u0442\u043d\u0451\u0440: '}{ch.username ? '@' + ch.username : ch.first_name}</div>
                )}
              </div>
              <div className="pp-reward-pill">
                <div className="pp-reward-val">+{parseFloat(ch.reward).toFixed(5)}</div>
                <div className="pp-reward-cur">TON</div>
              </div>
            </div>

            <div className="pp-card-meta">
              <span className="pp-meta-hint">{'\uD83D\uDD0D \u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u0432 \u043f\u043e\u0441\u0442\u0430\u0445 \u043a\u0430\u043d\u0430\u043b\u0430'}</span>
              {ch.expires_at && (
                <span className="pp-meta-expire">{'\u23F0 \u0434\u043e '}{new Date(ch.expires_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
              )}
            </div>

            <button className="pp-open-btn" onClick={() => openChannel(ch.channel_url)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{'\u041f\u0415\u0420\u0415\u0419\u0422\u0418 \u041d\u0410 \u041a\u0410\u041d\u0410\u041b'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
