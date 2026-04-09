import { useState, useEffect } from 'react'
import api from '../../api/index'
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
    <div className="pp-wrap">
      {toast && <div className={`pp-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="pp-header">
        <button className="pp-back" onClick={onBack}>{'\u2190 \u041d\u0410\u0417\u0410\u0414'}</button>
        <div className="pp-title">{'\uD83C\uDF81 \u041f\u0420\u041e\u041c\u041e\u041a\u041e\u0414\u042b \u041f\u0410\u0420\u0422\u041d\u0401\u0420\u041e\u0412'}</div>
      </div>

      {/* Info block */}
      <div className="pp-info-card">
        <div className="pp-info-icon">{'\uD83D\uDCA1'}</div>
        <div className="pp-info-text">
          {'\u041f\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u043d\u0430 \u043a\u0430\u043d\u0430\u043b \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0430, \u043d\u0430\u0439\u0434\u0438\u0442\u0435 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u0432 \u043f\u043e\u0441\u0442\u0430\u0445 \u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u0435\u0433\u043e \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435. \u0414\u043b\u044f \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u0438 \u043d\u0443\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u043f\u043e\u0434\u043f\u0438\u0441\u0430\u043d\u043d\u044b\u043c \u043d\u0430 \u043a\u0430\u043d\u0430\u043b!'}
        </div>
      </div>

      {/* Steps */}
      <div className="pp-steps">
        <div className="pp-step">
          <div className="pp-step-num">1</div>
          <div className="pp-step-text">{'\u041f\u043e\u0434\u043f\u0438\u0448\u0438\u0442\u0435\u0441\u044c \u043d\u0430 \u043a\u0430\u043d\u0430\u043b'}</div>
        </div>
        <div className="pp-step-arrow">{'\u2192'}</div>
        <div className="pp-step">
          <div className="pp-step-num">2</div>
          <div className="pp-step-text">{'\u041d\u0430\u0439\u0434\u0438\u0442\u0435 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434'}</div>
        </div>
        <div className="pp-step-arrow">{'\u2192'}</div>
        <div className="pp-step">
          <div className="pp-step-num">3</div>
          <div className="pp-step-text">{'\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430 \u0433\u043b\u0430\u0432\u043d\u043e\u0439'}</div>
        </div>
      </div>

      {loading && (
        <div className="pp-loading">{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}</div>
      )}

      {!loading && channels.length === 0 && (
        <div className="pp-empty">
          <div className="pp-empty-icon">{'\uD83D\uDCED'}</div>
          <div className="pp-empty-text">{'\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043f\u0440\u043e\u043c\u043e-\u043a\u0430\u043d\u0430\u043b\u043e\u0432'}</div>
          <div className="pp-empty-sub">{'\u0417\u0430\u0433\u043b\u044f\u043d\u0438\u0442\u0435 \u043f\u043e\u0437\u0436\u0435 \u2014 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u044b \u043f\u0443\u0431\u043b\u0438\u043a\u0443\u044e\u0442 \u043d\u043e\u0432\u044b\u0435 \u043a\u043e\u0434\u044b'}</div>
        </div>
      )}

      <div className="pp-list">
        {channels.map((ch, i) => (
          <div key={i} className="pp-card" onClick={() => openChannel(ch.channel_url)}>
            <div className="pp-channel">
              <div className="pp-channel-avatar">{'\uD83D\uDCE2'}</div>
              <div className="pp-channel-info">
                <div className="pp-channel-name">{extractChannelName(ch.channel_url)}</div>
                {(ch.username || ch.first_name) && (
                  <div className="pp-channel-by">{'\u043f\u0430\u0440\u0442\u043d\u0451\u0440: '}{ch.username ? '@' + ch.username : ch.first_name}</div>
                )}
              </div>
              <div className="pp-reward-badge">
                <span className="pp-reward-val">+{parseFloat(ch.reward).toFixed(4)}</span>
                <span className="pp-reward-cur">TON</span>
              </div>
            </div>

            <div className="pp-card-footer">
              <div className="pp-card-hint">{'\uD83D\uDD0D \u041d\u0430\u0439\u0434\u0438\u0442\u0435 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u0432 \u043f\u043e\u0441\u0442\u0430\u0445 \u043a\u0430\u043d\u0430\u043b\u0430'}</div>
              {ch.expires_at && (
                <div className="pp-card-expire">
                  {'\u23F0 \u0434\u043e '}{new Date(ch.expires_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>

            <div className="pp-open-btn">
              {'\uD83D\uDCE2 \u041f\u0415\u0420\u0415\u0419\u0422\u0418 \u041d\u0410 \u041a\u0410\u041d\u0410\u041b'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
