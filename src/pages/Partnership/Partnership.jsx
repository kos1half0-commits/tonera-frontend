import { useState, useEffect } from 'react'
import api from '../../api/index'
import './Partnership.css'

export default function Partnership({ onBack }) {
  const [info, setInfo] = useState(null)
  const [channelUrl, setChannelUrl] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [checking, setChecking] = useState(false)
  const [postChecked, setPostChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)

  useEffect(() => {
    api.get('/api/partnership/my').then(r => setInfo(r.data)).catch(() => {})
  }, [])

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  const checkPost = async () => {
    if (!postUrl.trim()) { showToast('Введите ссылку на пост', true); return }
    setChecking(true)
    try {
      const r = await api.post('/api/partnership/check', { post_url: postUrl })
      if (r.data.ok) {
        setPostChecked(true)
        showToast('✅ Пост проверен — ссылка на бота найдена!')
      } else {
        showToast(r.data.error || 'Пост не прошёл проверку', true)
      }
    } catch (e) {
      showToast(e?.response?.data?.error || 'Ошибка проверки', true)
    }
    setChecking(false)
  }

  const apply = async () => {
    if (!channelUrl.trim()) { showToast('Введите ссылку на канал', true); return }
    if (!postChecked) { showToast('Сначала проверьте пост', true); return }
    setLoading(true)
    try {
      await api.post('/api/partnership/apply', { channel_url: channelUrl, post_url: postUrl })
      showToast('✅ Заявка отправлена! Ожидайте одобрения.')
      const r = await api.get('/api/partnership/my')
      setInfo(r.data)
    } catch (e) {
      showToast(e?.response?.data?.error || 'Ошибка', true)
    }
    setLoading(false)
  }

  const botUsername = info?.bot_username || 'tonera_bot'
  const refPercent = info?.ref_percent || 30
  const p = info?.partnership

  return (
    <div className="partner-wrap">
      {toast && <div className={`partner-toast ${toastErr?'err':''}`}>{toast}</div>}

      <div className="partner-header">
        <button className="partner-back" onClick={onBack}>← НАЗАД</button>
        <div className="partner-title">🤝 ПАРТНЁРСТВО</div>
      </div>

      {p?.status === 'approved' ? (
        <div className="partner-approved">
          <div className="pa-icon">🌟</div>
          <div className="pa-title">ВЫ ПАРТНЁР TONERA</div>
          <div className="pa-desc">Ваш канал добавлен в задания — пользователи подписываются и вы получаете трафик</div>
          <div className="pa-channel">{p.channel_url}</div>
        </div>
      ) : p?.status === 'pending' ? (
        <div className="partner-pending">
          <div className="pp-icon">⏳</div>
          <div className="pp-title">ЗАЯВКА НА РАССМОТРЕНИИ</div>
          <div className="pp-desc">Мы проверяем вашу заявку. Обычно это занимает до 24 часов.</div>
          <div className="pp-channel">{p.channel_url}</div>
        </div>
      ) : p?.status === 'rejected' ? (
        <div className="partner-rejected">
          <div>❌ Заявка отклонена</div>
          <div className="pp-desc">Убедитесь что пост содержит ссылку на бота и подайте заявку снова</div>
        </div>
      ) : (
        <>
          <div className="partner-info-block">
            <div className="pib-title">🤝 СТАТЬ ПАРТНЁРОМ</div>
            <div className="pib-desc">Опубликуйте рекламный пост о TonEra в своём канале и получите бесплатный трафик — ваш канал будет добавлен в задания приложения.</div>
            <div className="pib-conditions">
              <div className="pib-cond">
                <span className="pib-check">✅</span>
                <span>Опубликуйте пост с упоминанием бота <b>@{botUsername}</b></span>
              </div>
              <div className="pib-cond">
                <span className="pib-check">📢</span>
                <span>Ваш канал появится в заданиях — пользователи будут подписываться</span>
              </div>
              <div className="pib-cond">
                <span className="pib-star">⭐</span>
                <span>Бонус: повышенный реф. процент <b>{refPercent}%</b></span>
              </div>
            </div>
          </div>

          <div className="partner-form">
            <div className="pf-label">ССЫЛКА НА КАНАЛ</div>
            <input className="pf-input" placeholder="https://t.me/yourchannel"
              value={channelUrl} onChange={e => setChannelUrl(e.target.value)} />

            <div className="pf-label" style={{marginTop:12}}>ССЫЛКА НА ПОСТ С РЕКЛАМОЙ</div>
            <div className="pf-hint">Пост должен содержать: t.me/{botUsername}</div>
            <div className="pf-post-row">
              <input className="pf-input" placeholder="https://t.me/yourchannel/123"
                value={postUrl} onChange={e => { setPostUrl(e.target.value); setPostChecked(false) }} />
              <button className={`pf-check-btn ${postChecked?'checked':''}`} onClick={checkPost} disabled={checking}>
                {checking ? '...' : postChecked ? '✓' : 'ПРОВЕРИТЬ'}
              </button>
            </div>
            {postChecked && <div className="pf-verified">✅ Пост проверен</div>}

            <button className="pf-submit-btn" onClick={apply} disabled={loading || !postChecked}>
              {loading ? 'ОТПРАВКА...' : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
