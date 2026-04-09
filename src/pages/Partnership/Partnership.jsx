import { useState, useEffect } from 'react'
import api from '../../api/index'
import './Partnership.css'

export default function Partnership({ onBack }) {
  const [info, setInfo]               = useState(null)
  const [wizardStep, setWizardStep]   = useState(0) // 0=landing, 1=channel, 2=bot, 3=post, 4=verify
  const [channelUrl, setChannelUrl]   = useState('')
  const [channelInfo, setChannelInfo] = useState(null) // {count, title}
  const [botChecked, setBotChecked]   = useState(false)
  const [postText, setPostText]       = useState('')
  const [postUrl, setPostUrl]         = useState('')
  const [postChecked, setPostChecked] = useState(false)
  const [checking, setChecking]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [copied, setCopied]           = useState(false)
  const [toast, setToast]             = useState('')
  const [toastErr, setToastErr]       = useState(false)
  const [task, setTask]               = useState(null)
  const [editDesc, setEditDesc]       = useState(false)
  const [newDesc, setNewDesc]         = useState('')
  const [newTitle, setNewTitle]       = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling]   = useState(false)

  useEffect(() => {
    api.get('/api/partnership/my').then(r => {
      setInfo(r.data)
      if (r.data?.partnership?.task_id) {
        api.get(`/api/tasks/${r.data.partnership.task_id}`).then(t => setTask(t.data)).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 4000)
  }

  const botUsername = info?.bot_username || 'tonera_bot'
  const refLink = info?.ref_code ? `t.me/${botUsername}?start=${info.ref_code}` : `t.me/${botUsername}`
  const p = info?.partnership
  const [promoCode, setPromoCode] = useState(null) // {code, amount, max_uses, expires_at}
  const [promoLoading, setPromoLoading] = useState(false)

  const makeDefaultPost = (code) => {
    const promoLine = code ? `\n\n🎁 Промокод: ${code.code}\n💰 Награда: ${code.amount} TON (${code.max_uses} активаций)` : ''
    return `🚀 Зарабатывай TON каждый день!\n\n💎 TonEra — платформа для заработка TON:\n📈 Стейкинг — 1% в день\n🎰 Игры — крути и выигрывай\n✅ Задания — выполняй и получай TON${promoLine}\n\n👇 Заходи прямо сейчас:\n${refLink}`
  }

  // Auto-generate promo code when entering step 3
  const goToStep3 = async () => {
    setPromoLoading(true)
    try {
      const r = await api.post('/api/partnership/generate-promo', { channel_url: channelUrl })
      if (r.data.ok) {
        setPromoCode(r.data.promo)
        setPostText(makeDefaultPost(r.data.promo))
        showToast(`🎁 Промокод ${r.data.promo.code} создан!`)
      } else {
        setPostText(makeDefaultPost(null))
      }
    } catch {
      setPostText(makeDefaultPost(null))
    }
    setPromoLoading(false)
    setWizardStep(3)
  }

  // Initialize post text with default (without promo)
  useEffect(() => {
    if (refLink && !postText) setPostText(makeDefaultPost(null))
  }, [refLink])

  // ===== STEP 1: Check channel =====
  const checkChannel = async () => {
    if (!channelUrl.trim()) { showToast('Введите ссылку на канал', true); return }
    setChecking(true)
    try {
      const r = await api.post('/api/partnership/check-channel', { channel_url: channelUrl })
      if (r.data.ok) {
        setChannelInfo({ count: r.data.count, title: r.data.title })
        showToast(`✅ Канал подходит! ${r.data.count} подписчиков`)
        setWizardStep(2)
      } else {
        showToast(r.data.error || 'Канал не подходит', true)
      }
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setChecking(false)
  }

  // ===== STEP 2: Check bot admin =====
  const checkBotAdmin = async () => {
    setChecking(true)
    try {
      const r = await api.post('/api/partnership/check-bot-admin', { channel_url: channelUrl })
      if (r.data.ok) {
        setBotChecked(true)
        showToast('✅ Бот — администратор канала!')
        goToStep3()
      } else {
        showToast(r.data.error || 'Бот не найден', true)
      }
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setChecking(false)
  }

  // ===== STEP 4: Check post published =====
  const checkPostPublished = async () => {
    if (!postUrl.trim()) { showToast('Вставьте ссылку на пост', true); return }
    setChecking(true)
    try {
      const r = await api.post('/api/partnership/check', { post_url: postUrl })
      if (r.data.ok) {
        setPostChecked(true)
        showToast('✅ Пост проверен!')
      } else {
        showToast(r.data.error || 'Пост не прошёл проверку', true)
      }
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setChecking(false)
  }

  // ===== STEP 3: Publish promo post via bot =====
  const publishPromo = async () => {
    if (!postText.includes('t.me/')) { showToast('Текст должен содержать ссылку t.me/', true); return }
    setChecking(true)
    try {
      const r = await api.post('/api/partnership/publish-promo', { channel_url: channelUrl, text: postText })
      if (r.data.ok) {
        setPostUrl(r.data.post_url)
        showToast('✅ Пост опубликован в канале!')
        setWizardStep(4)
      } else {
        showToast(r.data.error || 'Не удалось опубликовать', true)
      }
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка публикации', true) }
    setChecking(false)
  }

  // ===== Submit application =====
  const submitApplication = async () => {
    setLoading(true)
    try {
      await api.post('/api/partnership/apply', { channel_url: channelUrl, post_url: postUrl })
      showToast('✅ Заявка отправлена!')
      const r = await api.get('/api/partnership/my')
      setInfo(r.data)
      setWizardStep(0)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
    setLoading(false)
  }

  const S = {
    wrap: { fontFamily: 'DM Sans, sans-serif' },
    stepNum: { display:'inline-flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:'50%',fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:900,flexShrink:0 },
    card: { background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:12,padding:14,marginBottom:12 },
    input: { width:'100%',padding:'10px 14px',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:10,color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',boxSizing:'border-box' },
    btn: (bg,color) => ({ width:'100%',padding:'12px',border:'none',borderRadius:10,fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,cursor:'pointer',background:bg,color }),
    btnSm: (bg,color) => ({ padding:'8px 16px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',background:bg,color }),
    stepLine: (active,done) => ({ height:3,flex:1,borderRadius:2,background:done?'#00e676':active?'rgba(0,230,118,0.3)':'rgba(26,95,255,0.1)',transition:'all 0.3s' }),
    label: { fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'rgba(232,242,255,0.4)',marginBottom:6,display:'block' },
  }

  return (
    <div className="partner-wrap" style={S.wrap}>
      {toast && <div className={`partner-toast ${toastErr?'err':''}`}>{toast}</div>}

      <div className="partner-header">
        <button className="partner-back" onClick={onBack}>← НАЗАД</button>
        <div className="partner-title">🤝 ПАРТНЁРСТВО</div>
      </div>

      {/* ======== APPROVED ======== */}
      {p?.status === 'approved' && (
        <div className="p-approved-wrap">
          <div className="p-status approved">
            <div className="ps-icon">{info?.level?.emoji || '🌟'}</div>
            <div className="ps-title">ВЫ ПАРТНЁР TONERA</div>
            <div className="ps-desc">Ваш канал добавлен в задания — пользователи подписываются</div>
            <div className="ps-channel">{p.channel_url}</div>
          </div>

          {info?.level && (
            <div style={{...S.card, borderColor: info.level.color + '33'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{fontSize:28}}>{info.level.emoji}</div>
                <div>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:info.level.color}}>{info.level.name.toUpperCase()}</div>
                  <div style={{fontSize:10,color:'rgba(232,242,255,0.4)'}}>👥 {info.level.subscribers?.toLocaleString() || 0} подписчиков</div>
                </div>
              </div>
              {info.level.nextLevel && (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(232,242,255,0.35)',marginBottom:4}}>
                    <span>{info.level.name}</span>
                    <span>{info.level.nextLevel.emoji} {info.level.nextLevel.name} ({info.level.nextLevel.min.toLocaleString()})</span>
                  </div>
                  <div style={{height:6,background:'rgba(26,95,255,0.1)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg, ${info.level.color}, ${info.level.nextLevel.color})`,width:`${Math.min(100, (info.level.subscribers / info.level.nextLevel.min) * 100)}%`,transition:'width 0.5s'}}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {info?.taskStats && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
              <div style={{...S.card,textAlign:'center',borderColor:'rgba(0,230,118,0.15)'}}>
                <div style={{fontFamily:'Orbitron',fontSize:16,fontWeight:900,color:'#00e676'}}>{info.taskStats.executions || 0}</div>
                <div style={{fontSize:8,color:'rgba(232,242,255,0.4)'}}>Подписок</div>
              </div>
              <div style={{...S.card,textAlign:'center',borderColor:'rgba(0,212,255,0.15)'}}>
                <div style={{fontFamily:'Orbitron',fontSize:16,fontWeight:900,color:'#00d4ff'}}>{info.taskStats.total_spent?.toFixed(4) || '0'}</div>
                <div style={{fontSize:8,color:'rgba(232,242,255,0.4)'}}>TON потрачено</div>
              </div>
              <div style={{...S.card,textAlign:'center',borderColor:'rgba(168,85,247,0.15)'}}>
                <div style={{fontFamily:'Orbitron',fontSize:16,fontWeight:900,color:info.taskStats.active?'#00e676':'#ff4d6a'}}>{info.taskStats.active?'ВКЛ':'ПАУЗА'}</div>
                <div style={{fontSize:8,color:'rgba(232,242,255,0.4)'}}>Статус</div>
              </div>
            </div>
          )}

          {p.last_checked_at && (
            <div style={{fontSize:10,color:'rgba(232,242,255,0.3)',textAlign:'center',marginBottom:10}}>
              🔍 Последняя проверка: {new Date(p.last_checked_at).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
            </div>
          )}

          {task && (
            <div className="p-task-block">
              <div className="ptb-title">📋 ВАШЕ ЗАДАНИЕ</div>
              <div className="ptb-stats">
                <div className="ptb-stat"><div className="ptb-val">{task.executions||0}</div><div className="ptb-lbl">Выполнено</div></div>
                <div className="ptb-stat"><div className="ptb-val">{task.max_executions||0}</div><div className="ptb-lbl">Максимум</div></div>
                <div className="ptb-stat"><div className="ptb-val" style={{color:task.active?'#00e676':'#ff4d6a'}}>{task.active?'АКТИВНО':'ПАУЗА'}</div><div className="ptb-lbl">Статус</div></div>
              </div>
              <div className="ptb-progress-wrap">
                <div className="ptb-progress-bar"><div className="ptb-progress-fill" style={{width:`${Math.min(100,((task.executions||0)/(task.max_executions||1))*100)}%`}}/></div>
                <div className="ptb-progress-label">{Math.round(((task.executions||0)/(task.max_executions||1))*100)}%</div>
              </div>
              {editDesc ? (
                <div className="ptb-edit">
                  <div className="ptb-edit-label">НАЗВАНИЕ</div>
                  <input className="ptb-input" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Название"/>
                  <div className="ptb-edit-label">ОПИСАНИЕ</div>
                  <textarea className="ptb-textarea" value={newDesc} onChange={e=>setNewDesc(e.target.value)} rows={3} placeholder="Описание..."/>
                  <div className="ptb-edit-btns">
                    <button className="ptb-save-btn" onClick={async()=>{ await api.put(`/api/tasks/${task.id}`,{title:newTitle,description:newDesc}); const r=await api.get(`/api/tasks/${task.id}`); setTask(r.data); setEditDesc(false); showToast('✅ Обновлено') }}>СОХРАНИТЬ</button>
                    <button className="ptb-cancel-btn" onClick={()=>setEditDesc(false)}>ОТМЕНА</button>
                  </div>
                </div>
              ) : (
                <div className="ptb-info-block">
                  <div className="ptb-name-row"><div className="ptb-name">{task.title}</div><button className="ptb-edit-btn" onClick={()=>{setEditDesc(true);setNewDesc(task.description||'');setNewTitle(task.title||'')}}>✏️</button></div>
                  <div className="ptb-desc">{task.description || 'Нет описания'}</div>
                </div>
              )}
            </div>
          )}

          {/* Cancel partnership button */}
          {!confirmCancel ? (
            <button style={{width:'100%',marginTop:16,padding:'12px',border:'1px solid rgba(255,77,106,0.2)',borderRadius:10,background:'rgba(255,77,106,0.06)',color:'#ff4d6a',fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:'.05em',transition:'all .2s'}}
              onClick={()=>setConfirmCancel(true)}>
              {'\u{1F6AB} \u041E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F \u043E\u0442 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u0430'}
            </button>
          ) : (
            <div style={{marginTop:16,background:'rgba(255,77,106,0.08)',border:'1px solid rgba(255,77,106,0.2)',borderRadius:12,padding:14}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#ff4d6a',fontWeight:700,marginBottom:8,textAlign:'center'}}>{'\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B?'}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.5)',marginBottom:12,textAlign:'center',lineHeight:1.4}}>
                {'\u0417\u0430\u0434\u0430\u043D\u0438\u0435 \u0431\u0443\u0434\u0435\u0442 \u0434\u0435\u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D\u043E, \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u044B \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u044B. \u041F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0435\u0440\u0435\u0437 30 \u0434\u043D\u0435\u0439.'}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button style={{flex:1,padding:'10px',border:'none',borderRadius:8,background:'rgba(26,95,255,0.1)',color:'rgba(232,242,255,0.5)',fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,cursor:'pointer'}}
                  onClick={()=>setConfirmCancel(false)}>{'\u041E\u0442\u043C\u0435\u043D\u0430'}</button>
                <button style={{flex:1,padding:'10px',border:'none',borderRadius:8,background:'linear-gradient(135deg,#ff4d6a,#cc0033)',color:'#fff',fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,cursor:'pointer'}}
                  disabled={cancelling}
                  onClick={async()=>{
                    setCancelling(true)
                    try {
                      await api.post('/api/partnership/cancel')
                      showToast('\u041F\u0430\u0440\u0442\u043D\u0451\u0440\u0441\u0442\u0432\u043E \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E')
                      setConfirmCancel(false)
                      const r = await api.get('/api/partnership/my')
                      setInfo(r.data)
                      setTask(null)
                    } catch(e) { showToast(e?.response?.data?.error || '\u041E\u0448\u0438\u0431\u043A\u0430', true) }
                    setCancelling(false)
                  }}>{cancelling ? '\u23F3...' : '\u0414\u0430, \u043E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== PENDING ======== */}
      {p?.status === 'pending' && (
        <div className="p-status pending">
          <div className="ps-icon">⏳</div>
          <div className="ps-title">ЗАЯВКА НА РАССМОТРЕНИИ</div>
          <div className="ps-desc">Мы проверяем вашу заявку. После одобрения ваш канал появится в заданиях TonEra.</div>
          <div className="ps-channel">{p.channel_url}</div>
          <button style={{width:'100%',marginTop:14,padding:'10px',border:'1px solid rgba(255,77,106,0.2)',borderRadius:8,background:'rgba(255,77,106,0.06)',color:'#ff4d6a',fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer'}}
            disabled={cancelling}
            onClick={async()=>{
              if(!window.confirm('\u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443?')) return
              setCancelling(true)
              try {
                await api.post('/api/partnership/cancel')
                showToast('\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043E\u0437\u0432\u0430\u043D\u0430')
                const r = await api.get('/api/partnership/my')
                setInfo(r.data); setTask(null)
              } catch(e) { showToast(e?.response?.data?.error || '\u041E\u0448\u0438\u0431\u043A\u0430', true) }
              setCancelling(false)
            }}>{cancelling ? '\u23F3...' : '\u274C \u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443'}</button>
        </div>
      )}

      {/* ======== REJECTED ======== */}
      {p?.status === 'rejected' && (
        <div className="p-status rejected">
          <div className="ps-icon">❌</div>
          <div className="ps-title">ЗАЯВКА ОТКЛОНЕНА</div>
          <div className="ps-desc">Убедитесь что пост содержит ссылку на бота и канал публичный</div>
          <button style={S.btn('rgba(168,85,247,0.15)','#a855f7')} onClick={() => { setWizardStep(1); setChannelInfo(null); setBotChecked(false); setPostChecked(false) }}>
            🔄 ПОДАТЬ ЗАНОВО
          </button>
        </div>
      )}


      {/* ======== CANCELLED (cooldown) ======== */}
      {p?.status === 'cancelled' && info?.cooldown_until && (
        <div className="p-status rejected">
          <div className="ps-icon">{'\u23F3'}</div>
          <div className="ps-title">{'\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E'}</div>
          <div className="ps-desc">
            {'\u0412\u044B \u043E\u0442\u043A\u0430\u0437\u0430\u043B\u0438\u0441\u044C \u043E\u0442 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u0430. \u041F\u043E\u0432\u0442\u043E\u0440\u043D\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u0430 \u043F\u043E\u0441\u043B\u0435:'}
          </div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#ffb300',textAlign:'center',margin:'12px 0'}}>
            {new Date(info.cooldown_until).toLocaleDateString('ru', {day:'numeric',month:'long',year:'numeric'})}
          </div>
          <div style={{height:6,background:'rgba(26,95,255,0.1)',borderRadius:3,overflow:'hidden',marginBottom:10}}>
            <div style={{height:'100%',borderRadius:3,background:'linear-gradient(90deg,#ffb300,#ff4d6a)',width:Math.max(0, Math.min(100, (1 - (new Date(info.cooldown_until) - new Date()) / (30*24*60*60*1000)) * 100))+'%',transition:'width 0.5s'}}/>
          </div>
          <div style={{fontSize:10,color:'rgba(232,242,255,0.3)',textAlign:'center'}}>
            {'\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C: ' + Math.max(0, Math.ceil((new Date(info.cooldown_until) - new Date()) / (24*60*60*1000))) + ' \u0434\u043D.'}
          </div>
        </div>
      )}

      {/* ======== CANCELLED (cooldown expired, can re-apply) ======== */}
      {p?.status === 'cancelled' && !info?.cooldown_until && (
        <div className="p-status pending">
          <div className="ps-icon">{'\u2705'}</div>
          <div className="ps-title">{'\u041C\u043E\u0436\u043D\u043E \u043F\u043E\u0434\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443'}</div>
          <div className="ps-desc">{'\u0421\u0440\u043E\u043A \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u0438\u0441\u0442\u0451\u043A. \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043F\u043E\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0437\u0430\u044F\u0432\u043A\u0443 \u043D\u0430 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u043E.'}</div>
          <button style={S.btn('rgba(0,230,118,0.15)','#00e676')} onClick={() => { setWizardStep(1); setChannelInfo(null); setBotChecked(false); setPostChecked(false) }}>
            {'\uD83E\uDD1D \u041F\u043E\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0437\u0430\u044F\u0432\u043A\u0443'}
          </button>
        </div>
      )}
      {/* ======== WIZARD ======== */}
      {(!p || (p?.status === 'cancelled' && !info?.cooldown_until)) && (
        <>
          {wizardStep === 0 && (
            <>
              {/* LANDING */}
              <div style={S.card}>
                <div style={{textAlign:'center',marginBottom:14}}>
                  <div style={{fontSize:40,marginBottom:8}}>🤝</div>
                  <div style={{fontFamily:'Orbitron',fontSize:14,fontWeight:900,color:'#e8f2ff',marginBottom:6}}>СТАНЬТЕ ПАРТНЁРОМ</div>
                  <div style={{fontSize:12,color:'rgba(232,242,255,0.5)',lineHeight:1.5}}>
                    Добавьте ваш канал в задания TonEra — тысячи пользователей будут подписываться на вас бесплатно
                  </div>
                </div>
              </div>

              <div style={S.card}>
                <div style={S.label}>ЧТО ВЫ ПОЛУЧИТЕ</div>
                {[
                  {icon:'🎯',title:'Бесплатный трафик',desc:'Ваш канал появится в заданиях — подписчики каждый день'},
                  {icon:'📣',title:'Публикация постов',desc:'Мы можем публиковать посты в вашем канале по договорённости'},
                  {icon:'🏅',title:'Уровни партнёрства',desc:'Больше подписчиков = больше выполнений задания'},
                ].map((b,i) => (
                  <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderTop:i?'1px solid rgba(26,95,255,0.08)':'none'}}>
                    <div style={{fontSize:20,flexShrink:0}}>{b.icon}</div>
                    <div><div style={{fontSize:12,fontWeight:700,color:'#e8f2ff',marginBottom:2}}>{b.title}</div><div style={{fontSize:10,color:'rgba(232,242,255,0.4)'}}>{b.desc}</div></div>
                  </div>
                ))}
              </div>

              <button style={S.btn('linear-gradient(135deg,rgba(168,85,247,0.3),rgba(0,212,255,0.3))','#e8f2ff')} onClick={() => setWizardStep(1)}>
                🚀 НАЧАТЬ ОФОРМЛЕНИЕ
              </button>
            </>
          )}

          {wizardStep >= 1 && (
            <>
              {/* PROGRESS BAR */}
              <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:16}}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{display:'flex',alignItems:'center',gap:4,flex:1}}>
                    <div style={{...S.stepNum, background:wizardStep>=n?'rgba(0,230,118,0.15)':'rgba(26,95,255,0.08)', color:wizardStep>=n?'#00e676':'rgba(232,242,255,0.3)', border:wizardStep===n?'2px solid rgba(0,230,118,0.4)':'2px solid transparent'}}>{wizardStep>n?'✓':n}</div>
                    {n<4 && <div style={S.stepLine(wizardStep===n,wizardStep>n)}/>}
                  </div>
                ))}
              </div>

              {/* STEP 1 — CHANNEL CHECK */}
              {wizardStep === 1 && (
                <div style={S.card}>
                  <div style={{textAlign:'center',marginBottom:12}}>
                    <div style={{fontSize:32,marginBottom:6}}>📢</div>
                    <div style={{fontFamily:'Orbitron',fontSize:12,fontWeight:900,color:'#e8f2ff'}}>ШАГ 1: ПРОВЕРКА КАНАЛА</div>
                    <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',marginTop:4}}>
                      Введите ссылку на ваш публичный Telegram-канал
                    </div>
                  </div>

                  <div style={S.label}>ССЫЛКА НА КАНАЛ</div>
                  <input style={{...S.input,marginBottom:12}} placeholder="https://t.me/yourchannel" value={channelUrl} onChange={e => setChannelUrl(e.target.value)} />

                  <div style={{fontSize:10,color:'rgba(232,242,255,0.3)',marginBottom:12,padding:'8px 10px',background:'rgba(26,95,255,0.04)',borderRadius:8}}>
                    ℹ️ Минимум <b>{info?.min_subs?.toLocaleString() || '1,000'}</b> подписчиков · Канал должен быть публичным
                  </div>

                  <button style={{...S.btn('rgba(0,230,118,0.15)','#00e676'),opacity:checking?0.5:1}} onClick={checkChannel} disabled={checking}>
                    {checking ? '⏳ ПРОВЕРЯЮ...' : '🔍 ПРОВЕРИТЬ КАНАЛ'}
                  </button>

                  <button style={{...S.btn('transparent','rgba(232,242,255,0.3)'),marginTop:6,fontSize:9}} onClick={() => setWizardStep(0)}>← Назад</button>
                </div>
              )}

              {/* STEP 2 — BOT ADMIN */}
              {wizardStep === 2 && (
                <div style={S.card}>
                  <div style={{textAlign:'center',marginBottom:12}}>
                    <div style={{fontSize:32,marginBottom:6}}>🤖</div>
                    <div style={{fontFamily:'Orbitron',fontSize:12,fontWeight:900,color:'#e8f2ff'}}>ШАГ 2: ДОБАВЬТЕ БОТА</div>
                    <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',marginTop:4}}>
                      Добавьте <b style={{color:'#00d4ff'}}>@{botUsername}</b> как администратора канала
                    </div>
                  </div>

                  {channelInfo && (
                    <div style={{background:'rgba(0,230,118,0.06)',border:'1px solid rgba(0,230,118,0.15)',borderRadius:8,padding:10,marginBottom:12,textAlign:'center'}}>
                      <div style={{fontFamily:'Orbitron',fontSize:11,fontWeight:700,color:'#00e676'}}>{channelInfo.title}</div>
                      <div style={{fontSize:10,color:'rgba(232,242,255,0.4)'}}>👥 {channelInfo.count.toLocaleString()} подписчиков</div>
                    </div>
                  )}

                  <div style={{fontSize:11,color:'rgba(232,242,255,0.5)',lineHeight:1.6,marginBottom:14,padding:'10px 12px',background:'rgba(26,95,255,0.04)',borderRadius:8}}>
                    <div style={{marginBottom:6}}><b>Как добавить:</b></div>
                    <div>1. Откройте настройки канала</div>
                    <div>2. «Администраторы» → «Добавить админа»</div>
                    <div>3. Найдите <b style={{color:'#00d4ff'}}>@{botUsername}</b></div>
                    <div>4. Включите «Публикация сообщений» ✅</div>
                    <div>5. Нажмите «Сохранить»</div>
                  </div>

                  <button style={{...S.btn('rgba(0,230,118,0.15)','#00e676'),opacity:checking?0.5:1}} onClick={checkBotAdmin} disabled={checking}>
                    {checking ? '⏳ ПРОВЕРЯЮ...' : '✅ ПРОВЕРИТЬ БОТА'}
                  </button>

                  <button style={{...S.btn('transparent','rgba(232,242,255,0.3)'),marginTop:6,fontSize:9}} onClick={() => setWizardStep(1)}>← Назад</button>
                </div>
              )}

              {/* STEP 3 — EDIT & PUBLISH POST */}
              {wizardStep === 3 && (
                <div style={S.card}>
                  <div style={{textAlign:'center',marginBottom:12}}>
                    <div style={{fontSize:32,marginBottom:6}}>📝</div>
                    <div style={{fontFamily:'Orbitron',fontSize:12,fontWeight:900,color:'#e8f2ff'}}>ШАГ 3: РЕКЛАМНЫЙ ПОСТ</div>
                    <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',marginTop:4}}>
                      Отредактируйте текст и нажмите «Опубликовать» — бот опубликует пост в вашем канале
                    </div>
                  </div>

                  {/* LOGO PREVIEW */}
                  <div style={{textAlign:'center',marginBottom:12}}>
                    <img src="/logo.png" alt="TonEra" style={{width:120,height:120,borderRadius:12,border:'1px solid rgba(26,95,255,0.15)'}} />
                    <div style={{fontSize:9,color:'rgba(232,242,255,0.25)',marginTop:4}}>📷 Логотип (нельзя изменить)</div>
                  </div>

                  {/* PROMO CODE INFO */}
                  {promoCode && (
                    <div style={{background:'rgba(168,85,247,0.06)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:8,padding:10,marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{fontFamily:'Orbitron',fontSize:10,fontWeight:700,color:'#a855f7'}}>🎁 ПРОМОКОД</div>
                        <div style={{fontFamily:'Orbitron',fontSize:12,fontWeight:900,color:'#e8f2ff',letterSpacing:1}}>{promoCode.code}</div>
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:9,color:'rgba(232,242,255,0.4)'}}>
                        <span>💰 {promoCode.amount} TON</span>
                        <span>👥 {promoCode.max_uses} использований</span>
                        <span>⏰ {new Date(promoCode.expires_at).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                    </div>
                  )}

                  <div style={S.label}>ТЕКСТ ПОСТА</div>
                  <textarea
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    rows={10}
                    style={{...S.input,resize:'vertical',lineHeight:1.5,minHeight:160}}
                  />

                  <div style={{fontSize:9,color:'rgba(232,242,255,0.25)',marginTop:4,marginBottom:8}}>
                    ⚠️ Пост должен содержать ссылку: <b style={{color:'#00d4ff'}}>{refLink}</b>
                  </div>

                  <button style={S.btnSm('rgba(168,85,247,0.12)','#a855f7')} onClick={() => setPostText(makeDefaultPost(promoCode))}>↺ СБРОСИТЬ ТЕКСТ</button>

                  <div style={{marginTop:12}}/>
                  <button style={{...S.btn('linear-gradient(135deg,rgba(0,230,118,0.2),rgba(0,212,255,0.2))','#00e676'),opacity:checking?0.5:1}} onClick={publishPromo} disabled={checking}>
                    {checking ? '⏳ ПУБЛИКУЮ...' : '📢 ОПУБЛИКОВАТЬ В КАНАЛЕ'}
                  </button>

                  <button style={{...S.btn('transparent','rgba(232,242,255,0.3)'),marginTop:6,fontSize:9}} onClick={() => setWizardStep(2)}>← Назад</button>
                </div>
              )}

              {/* STEP 4 — VERIFY POST */}
              {wizardStep === 4 && (
                <div style={S.card}>
                  <div style={{textAlign:'center',marginBottom:12}}>
                    <div style={{fontSize:32,marginBottom:6}}>✅</div>
                    <div style={{fontFamily:'Orbitron',fontSize:12,fontWeight:900,color:'#e8f2ff'}}>ШАГ 4: ПРОВЕРКА ПУБЛИКАЦИИ</div>
                    <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',marginTop:4}}>
                      Проверяем что пост успешно опубликован в канале
                    </div>
                  </div>

                  {postUrl && (
                    <div style={{background:'rgba(26,95,255,0.04)',border:'1px solid rgba(26,95,255,0.1)',borderRadius:8,padding:10,marginBottom:12}}>
                      <div style={{fontSize:9,color:'rgba(232,242,255,0.3)',marginBottom:4}}>ССЫЛКА НА ПОСТ</div>
                      <div style={{fontSize:11,color:'#00d4ff',wordBreak:'break-all'}}>{postUrl}</div>
                    </div>
                  )}

                  {!postChecked ? (
                    <button style={{...S.btn('rgba(0,212,255,0.15)','#00d4ff'),opacity:checking?0.5:1}} onClick={checkPostPublished} disabled={checking}>
                      {checking ? '⏳ ПРОВЕРЯЮ...' : '🔍 ПРОВЕРИТЬ ПОСТ'}
                    </button>
                  ) : (
                    <>
                      <div style={{background:'rgba(0,230,118,0.08)',border:'1px solid rgba(0,230,118,0.2)',borderRadius:8,padding:10,textAlign:'center',marginBottom:12}}>
                        <div style={{fontFamily:'Orbitron',fontSize:11,fontWeight:700,color:'#00e676'}}>✅ ПОСТ ПРОВЕРЕН</div>
                        <div style={{fontSize:10,color:'rgba(232,242,255,0.4)',marginTop:4}}>Содержит ссылку на бота — всё в порядке!</div>
                      </div>
                      <button style={{...S.btn('linear-gradient(135deg,rgba(0,230,118,0.2),rgba(0,212,255,0.2))','#00e676'),opacity:loading?0.5:1}} onClick={submitApplication} disabled={loading}>
                        {loading ? '⏳ ОТПРАВКА...' : '🚀 ОТПРАВИТЬ ЗАЯВКУ'}
                      </button>
                    </>
                  )}

                  <button style={{...S.btn('transparent','rgba(232,242,255,0.3)'),marginTop:6,fontSize:9}} onClick={() => setWizardStep(3)}>← Назад</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
