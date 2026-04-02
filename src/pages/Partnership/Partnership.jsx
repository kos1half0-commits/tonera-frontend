import { useState, useEffect } from 'react'
import api from '../../api/index'
import './Partnership.css'

const STEPS = [
  { n: 1, icon: '📢', title: 'Опубликуйте пост',    desc: 'Скопируйте пример поста и опубликуйте его в своём канале с логотипом' },
  { n: 2, icon: '🤖', title: 'Добавьте бота',        desc: 'Добавьте @{bot} в канал как администратора с правом публикации постов' },
  { n: 3, icon: '📋', title: 'Подайте заявку',       desc: 'Укажите ссылку на канал и ссылку на пост с рекламой' },
  { n: 4, icon: '✅', title: 'Ожидайте одобрения',   desc: 'Мы проверим канал и одобрим заявку в течение 24 часов' },
  { n: 5, icon: '🎯', title: 'Получайте трафик',     desc: 'Ваш канал появится в заданиях — тысячи пользователей будут подписываться' },
]

export default function Partnership({ onBack }) {
  const [info, setInfo]               = useState(null)
  const [step, setStep]               = useState(0) // 0=info, 1=form
  const [channelUrl, setChannelUrl]   = useState('')
  const [postUrl, setPostUrl]         = useState('')
  const [checking, setChecking]       = useState(false)
  const [postChecked, setPostChecked] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [copied, setCopied]           = useState(false)
  const [toast, setToast]             = useState('')
  const [toastErr, setToastErr]       = useState(false)

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
      if (r.data.ok) { setPostChecked(true); showToast('✅ Пост проверен!') }
      else showToast(r.data.error || 'Пост не прошёл проверку', true)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setChecking(false)
  }

  const apply = async () => {
    if (!channelUrl.trim()) { showToast('Введите ссылку на канал', true); return }
    if (!postChecked) { showToast('Сначала проверьте пост', true); return }
    setLoading(true)
    try {
      await api.post('/api/partnership/apply', { channel_url: channelUrl, post_url: postUrl })
      showToast('✅ Заявка отправлена!')
      const r = await api.get('/api/partnership/my')
      setInfo(r.data)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setLoading(false)
  }

  const botUsername = info?.bot_username || 'tonera_bot'
  const minSubs     = info?.min_subs || 1000
  const refPercent  = info?.ref_percent || 30
  const refLink     = info?.ref_code
    ? `t.me/${botUsername}?start=${info.ref_code}`
    : `t.me/${botUsername}`
  const p = info?.partnership
  const postText = `🚀 Зарабатывай TON каждый день!\n\n💎 TonEra — платформа для заработка TON:\n📈 Стейкинг — 1% в день\n🎰 Игры — крути и выигрывай\n✅ Задания — выполняй и получай TON\n\n👇 Заходи прямо сейчас:\n${refLink}`

  return (
    <div className="partner-wrap">
      {toast && <div className={`partner-toast ${toastErr?'err':''}`}>{toast}</div>}

      <div className="partner-header">
        <button className="partner-back" onClick={onBack}>← НАЗАД</button>
        <div className="partner-title">🤝 ПАРТНЁРСТВО</div>
      </div>

      {/* СТАТУС ЗАЯВКИ */}
      {p?.status === 'approved' && (
        <div className="p-status approved">
          <div className="ps-icon">🌟</div>
          <div className="ps-title">ВЫ ПАРТНЁР TONERA</div>
          <div className="ps-desc">Ваш канал добавлен в задания — пользователи подписываются на ваш канал и вы получаете бесплатный трафик</div>
          <div className="ps-channel">{p.channel_url}</div>
          <div className="ps-bonus">Ваш реф. процент: <b>{refPercent}%</b></div>
        </div>
      )}

      {p?.status === 'pending' && (
        <div className="p-status pending">
          <div className="ps-icon">⏳</div>
          <div className="ps-title">ЗАЯВКА НА РАССМОТРЕНИИ</div>
          <div className="ps-desc">Мы проверяем вашу заявку. Обычно это занимает до 24 часов. После одобрения ваш канал появится в заданиях TonEra.</div>
          <div className="ps-channel">{p.channel_url}</div>
        </div>
      )}

      {p?.status === 'rejected' && (
        <div className="p-status rejected">
          <div className="ps-icon">❌</div>
          <div className="ps-title">ЗАЯВКА ОТКЛОНЕНА</div>
          <div className="ps-desc">Убедитесь что пост содержит ссылку на бота и канал публичный, затем подайте заявку снова</div>
          <button className="ps-retry-btn" onClick={() => setStep(1)}>ПОДАТЬ ЗАНОВО</button>
        </div>
      )}

      {!p && step === 0 && (
        <>
          {/* ПРЕИМУЩЕСТВА */}
          <div className="p-benefits">
            <div className="pb-title">ЧТО ВЫ ПОЛУЧИТЕ</div>
            <div className="pb-item">
              <div className="pb-icon">🎯</div>
              <div>
                <div className="pb-item-title">Бесплатный трафик</div>
                <div className="pb-item-desc">Ваш канал появится в заданиях TonEra — тысячи активных пользователей будут подписываться</div>
              </div>
            </div>
            <div className="pb-item">
              <div className="pb-icon">💰</div>
              <div>
                <div className="pb-item-title">Повышенный реф. %</div>
                <div className="pb-item-desc">Получайте <b>{refPercent}%</b> с депозитов рефералов вместо стандартного процента</div>
              </div>
            </div>
            <div className="pb-item">
              <div className="pb-icon">📣</div>
              <div>
                <div className="pb-item-title">Публикация постов</div>
                <div className="pb-item-desc">Мы сможем публиковать посты в вашем канале через нашего бота по взаимной договорённости</div>
              </div>
            </div>
          </div>

          {/* КАК ЭТО РАБОТАЕТ */}
          <div className="p-how">
            <div className="ph-title">КАК ЭТО РАБОТАЕТ</div>
            {STEPS.map(s => (
              <div key={s.n} className="ph-step">
                <div className="ph-num">{s.n}</div>
                <div className="ph-icon">{s.icon}</div>
                <div className="ph-content">
                  <div className="ph-step-title">{s.title}</div>
                  <div className="ph-step-desc">{s.desc.replace('{bot}', botUsername)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ТРЕБОВАНИЯ */}
          <div className="p-req">
            <div className="pr-title">ТРЕБОВАНИЯ</div>
            <div className="pr-row"><span className="pr-check">✅</span><span>Минимум <b>{minSubs.toLocaleString()}</b> подписчиков в канале</span></div>
            <div className="pr-row"><span className="pr-check">✅</span><span>Публичный Telegram канал</span></div>
            <div className="pr-row"><span className="pr-check">✅</span><span>Опубликован пост с рекламой TonEra</span></div>
            <div className="pr-row"><span className="pr-check">✅</span><span>Бот <b>@{botUsername}</b> добавлен как администратор</span></div>
          </div>

          <button className="p-start-btn" onClick={() => setStep(1)}>
            🤝 СТАТЬ ПАРТНЁРОМ
          </button>
        </>
      )}

      {!p && step === 1 && (
        <>
          {/* ШАГ 1 — ПРИМЕР ПОСТА */}
          <div className="p-section">
            <div className="p-section-num">ШАГ 1</div>
            <div className="p-section-title">📢 Опубликуйте рекламный пост</div>
            <div className="p-section-desc">Скопируйте текст ниже, прикрепите логотип и опубликуйте в своём канале</div>
            <img src="/logo.png" className="pe-logo" alt="TonEra" />
            <div className="pe-text">{postText}</div>
            <div className="pe-btn-row">
              <button className="pe-download-btn" onClick={() => {
                const tg = window.Telegram?.WebApp
                if (tg) tg.openLink(window.location.origin + '/logo.png')
                else window.open('/logo.png', '_blank')
              }}>⬇️ ЛОГОТИП</button>
              <button className="pe-copy-btn" onClick={() => {
                navigator.clipboard.writeText(postText).then(() => {
                  setCopied(true); setTimeout(() => setCopied(false), 3000)
                })
              }}>{copied ? '✅ СКОПИРОВАНО' : '📋 СКОПИРОВАТЬ'}</button>
            </div>
          </div>

          {/* ШАГ 2 — ДОБАВИТЬ БОТА */}
          <div className="p-section">
            <div className="p-section-num">ШАГ 2</div>
            <div className="p-section-title">🤖 Добавьте бота в канал</div>
            <div className="p-section-desc">Добавьте <b>@{botUsername}</b> как администратора канала с правом публикации постов</div>
            <div className="p-tip">💡 Это нужно чтобы мы могли публиковать посты в вашем канале и проверять подписчиков</div>
          </div>

          {/* ШАГ 3 — ФОРМА ЗАЯВКИ */}
          <div className="p-section">
            <div className="p-section-num">ШАГ 3</div>
            <div className="p-section-title">📋 Подайте заявку</div>
            <div className="p-section-desc">Укажите ссылки на канал и опубликованный пост</div>

            <div className="pf-label">ССЫЛКА НА КАНАЛ</div>
            <input className="pf-input" placeholder="https://t.me/yourchannel"
              value={channelUrl} onChange={e => setChannelUrl(e.target.value)} />

            <div className="pf-label" style={{marginTop:12}}>ССЫЛКА НА ПОСТ С РЕКЛАМОЙ</div>
            <div className="pf-hint">Формат: https://t.me/yourchannel/123</div>
            <div className="pf-post-row">
              <input className="pf-input" placeholder="https://t.me/yourchannel/123"
                value={postUrl} onChange={e => { setPostUrl(e.target.value); setPostChecked(false) }} />
              <button className={`pf-check-btn ${postChecked?'checked':''}`} onClick={checkPost} disabled={checking}>
                {checking ? '...' : postChecked ? '✓' : 'ПРОВЕРИТЬ'}
              </button>
            </div>
            {postChecked && <div className="pf-verified">✅ Пост содержит ссылку на бота</div>}

            <button className="pf-submit-btn" onClick={apply} disabled={loading || !postChecked}>
              {loading ? 'ОТПРАВКА...' : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
            </button>

            <button className="p-back-link" onClick={() => setStep(0)}>← Назад</button>
          </div>
        </>
      )}
    </div>
  )
}
