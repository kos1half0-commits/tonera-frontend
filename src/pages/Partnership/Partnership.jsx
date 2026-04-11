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
  const [banner, setBanner]           = useState(null)
  const [canCreateBanner, setCanCreateBanner] = useState(false)
  const [bannerForm, setBannerForm]   = useState({title:'',text:'',image_url:'',link:''})
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [bannerSaving, setBannerSaving] = useState(false)
  const [editPost, setEditPost] = useState(false)
  const [customPostText, setCustomPostText] = useState('')

  useEffect(() => {
    api.get('/api/partnership/my').then(r => {
      setInfo(r.data)
      if (r.data?.partnership?.task_id) {
        api.get(`/api/tasks/${r.data.partnership.task_id}`).then(t => setTask(t.data)).catch(() => {})
      }
    }).catch(() => {})
    api.get('/api/ads/my-banner').then(r => { setBanner(r.data?.banner || null); setCanCreateBanner(r.data?.can_create || false) }).catch(()=>{})
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
    const promoLine = code ? `\n\n🎁 Промокод: ${code.code}` : ''
    const defaultTemplate = `🚀 Зарабатывай TON каждый день!\n\n💎 TonEra — платформа для заработка TON:\n📈 Стейкинг — 1% в день\n🎰 Игры — крути и выигрывай\n✅ Задания — выполняй и получай TON{PROMO}\n\n👇 Заходи прямо сейчас:\n{REF_LINK}`
    const template = info?.default_post || defaultTemplate
    return template
      .replace(/\\n/g, '\n')
      .replace('{PROMO}', promoLine)
      .replace('{REF_LINK}', refLink)
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
      await api.post('/api/partnership/apply', { channel_url: channelUrl, post_url: postUrl, custom_post: postText })
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

          {info?.renewsAt && (
            <div style={{...S.card, borderColor:'rgba(0,212,255,0.15)', textAlign:'center'}}>
              <div style={{fontFamily:'Orbitron',fontSize:9,fontWeight:700,color:'#00d4ff',letterSpacing:'.08em',marginBottom:8}}>🔄 ОБНОВЛЕНИЕ ЗАДАНИЯ</div>
              <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:8}}>
                <div>
                  <div style={{fontFamily:'Orbitron',fontSize:18,fontWeight:900,color:'#e8f2ff'}}>{Math.max(0, Math.ceil((new Date(info.renewsAt) - new Date()) / (24*60*60*1000)))}</div>
                  <div style={{fontSize:9,color:'rgba(232,242,255,0.3)'}}>дней</div>
                </div>
              </div>
              <div style={{fontSize:10,color:'rgba(232,242,255,0.35)'}}>
                Следующее обновление: {new Date(info.renewsAt).toLocaleDateString('ru',{day:'numeric',month:'long'})}
              </div>
              <div style={{height:4,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden',marginTop:8}}>
                <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,#00d4ff,#1a5fff)',width:Math.max(0, Math.min(100, (1 - (new Date(info.renewsAt) - new Date()) / (30*24*60*60*1000)) * 100))+'%',transition:'width .5s'}}/>
              </div>
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


          {/* MY POST */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(168,85,247,0.15)',borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#a855f7',marginBottom:10,letterSpacing:'.08em'}}>📝 МОЙ ПОСТ</div>
            {editPost ? (
              <>
                <textarea
                  value={customPostText}
                  onChange={e => setCustomPostText(e.target.value)}
                  rows={8}
                  style={{...S.input,resize:'vertical',lineHeight:1.5,minHeight:120,marginBottom:8}}
                />
                <div style={{display:'flex',gap:6}}>
                  <button style={{...S.btnSm('rgba(0,230,118,0.15)','#00e676'),flex:1}} onClick={async()=>{
                    try {
                      await api.post('/api/partnership/update-post', { custom_post: customPostText })
                      showToast('✅ Пост сохранён')
                      setEditPost(false)
                      const r = await api.get('/api/partnership/my')
                      setInfo(r.data)
                    } catch(e) { showToast(e?.response?.data?.error||'Ошибка', true) }
                  }}>💾 СОХРАНИТЬ</button>
                  <button style={S.btnSm('rgba(255,77,106,0.1)','#ff4d6a')} onClick={()=>setEditPost(false)}>✕</button>
                </div>
              </>
            ) : (
              <>
                <div style={{background:'#0b1630',border:'1px solid rgba(26,95,255,0.15)',borderRadius:8,padding:10,marginBottom:8,fontFamily:'DM Sans',fontSize:11,color:'rgba(232,242,255,0.55)',whiteSpace:'pre-wrap',lineHeight:1.6,maxHeight:120,overflowY:'auto'}}>
                  {p.custom_post || makeDefaultPost(null)}
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button style={{...S.btnSm('rgba(168,85,247,0.12)','#a855f7'),flex:1}} onClick={()=>{setCustomPostText(p.custom_post || makeDefaultPost(null)); setEditPost(true)}}>✏️ РЕДАКТИРОВАТЬ ПОСТ</button>
                </div>
                <div style={{fontSize:9,color:'rgba(232,242,255,0.25)',marginTop:6}}>
                  💡 Этот текст будет использоваться при автоматическом постинге в ваш канал
                </div>
              </>
            )}
          </div>

          {/* AUTOPOST TIMER */}
          {info?.autopost?.enabled && (
            <div style={{background:'#0e1c3a',border:'1px solid rgba(0,230,118,0.15)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00e676',marginBottom:10,letterSpacing:'.08em'}}>📢 АВТО-ПОСТИНГ</div>
              <AutopostTimer next={info.autopost.next} last={info.autopost.last} intervalHours={info.autopost.interval_hours}/>
            </div>
          )}

          {/* Partner Banner */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00d4ff',marginBottom:10,letterSpacing:'.08em'}}>{'\uD83D\uDCE2 \u0411\u0415\u0421\u041F\u041B\u0410\u0422\u041D\u042B\u0419 \u0411\u0410\u041D\u041D\u0415\u0420'}</div>
            {banner && (
              <div style={{background:'#0b1630',border:'1px solid rgba(26,95,255,0.2)',borderRadius:10,padding:12}}>
                {banner.image_url && <img src={banner.image_url} style={{width:'100%',borderRadius:8,maxHeight:80,objectFit:'cover',marginBottom:8}} onError={e=>e.target.style.display='none'}/>}
                <div style={{fontFamily:'DM Sans',fontSize:12,fontWeight:700,color:'#e8f2ff',marginBottom:4}}>{banner.title}</div>
                {banner.text && <div style={{fontFamily:'DM Sans',fontSize:11,color:'rgba(232,242,255,0.5)',marginBottom:6}}>{banner.text}</div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(232,242,255,0.3)'}}>
                  <span>{banner.active ? '\u2705 Активен' : (!banner.expires_at ? '\u23f3 На модерации' : '\u23f8 Неактивен')}</span>
                  {banner.expires_at && <span>{'\u23F0 \u0414\u043E: '+new Date(banner.expires_at).toLocaleDateString('ru',{day:'numeric',month:'short'})}</span>}
                </div>
                {banner.expires_at && (
                  <div style={{height:4,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden',marginTop:6}}>
                    <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,#1a5fff,#00d4ff)',width:Math.max(0,Math.min(100,(new Date(banner.expires_at)-new Date())/(14*24*60*60*1000)*100))+'%',transition:'width .5s'}}/>
                  </div>
                )}
              </div>
            )}
            {!banner && canCreateBanner && !showBannerForm && (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:11,color:'rgba(232,242,255,0.5)',marginBottom:10,fontFamily:'DM Sans'}}>{'\u0412\u0430\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D 1 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0431\u0430\u043D\u043D\u0435\u0440 \u043D\u0430 2 \u043D\u0435\u0434\u0435\u043B\u0438!'}</div>
                <button style={S.btn('linear-gradient(135deg,#1a5fff,#0930cc)','#fff')} onClick={()=>setShowBannerForm(true)}>
                  {'\u2728 \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0431\u0430\u043D\u043D\u0435\u0440'}
                </button>
              </div>
            )}
            {!banner && !canCreateBanner && (
              <div style={{textAlign:'center',fontSize:11,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>
                {'\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0431\u0430\u043D\u043D\u0435\u0440 \u0443\u0436\u0435 \u0431\u044B\u043B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D'}
              </div>
            )}
            {showBannerForm && (
              <div style={{marginTop:10}}>
                <div style={{marginBottom:6}}>
                  <span style={S.label}>{'Заголовок'}</span>
                  <input style={S.input} value={bannerForm.title} onChange={e=>setBannerForm(f=>({...f,title:e.target.value}))} placeholder={'Название канала'}/>
                </div>
                <div style={{marginBottom:6}}>
                  <span style={S.label}>{'Описание'}</span>
                  <textarea style={{...S.input,resize:'none'}} rows={2} value={bannerForm.text} onChange={e=>setBannerForm(f=>({...f,text:e.target.value}))} placeholder={'Краткое описание...'}/>
                </div>
                <div style={{marginBottom:6}}>
                  <span style={S.label}>{'Ссылка (опц.)'}</span>
                  <input style={S.input} value={bannerForm.link} onChange={e=>setBannerForm(f=>({...f,link:e.target.value}))} placeholder={'https://t.me/...'}/>
                </div>
                {/* IMAGE UPLOAD */}
                <div style={{marginBottom:8}}>
                  <span style={{...S.label,color:bannerForm.image_url?'#00e676':'#ff4d6a'}}>📷 Изображение баннера {bannerForm.image_url ? '✅' : '(обязательно)'}</span>
                  {bannerForm.image_url ? (
                    <div style={{position:'relative',marginTop:6}}>
                      <img src={bannerForm.image_url} style={{width:'100%',borderRadius:8,maxHeight:120,objectFit:'cover'}} alt="banner"/>
                      <button onClick={()=>setBannerForm(f=>({...f,image_url:''}))} style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.6)',border:'none',borderRadius:'50%',width:24,height:24,color:'#ff4d6a',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </div>
                  ) : (
                    <label style={{display:'block',marginTop:6,padding:'14px',border:'2px dashed rgba(255,77,106,0.3)',borderRadius:10,textAlign:'center',cursor:'pointer',background:'rgba(255,77,106,0.04)',transition:'all .2s'}}>
                      <div style={{fontSize:24,marginBottom:4}}>📤</div>
                      <div style={{fontFamily:'DM Sans',fontSize:11,color:'rgba(232,242,255,0.5)'}}>Нажмите чтобы загрузить</div>
                      <div style={{fontFamily:'DM Sans',fontSize:9,color:'rgba(232,242,255,0.25)',marginTop:2}}>JPG, PNG · макс. 500 КБ</div>
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 512000) { showToast('❌ Файл больше 500 КБ', true); return }
                        const reader = new FileReader()
                        reader.onload = ev => setBannerForm(f=>({...f, image_url: ev.target.result}))
                        reader.readAsDataURL(file)
                      }}/>
                    </label>
                  )}
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button style={{...S.btn('linear-gradient(135deg,#1a5fff,#0930cc)','#fff'),opacity:(!bannerForm.title.trim()||!bannerForm.image_url||bannerSaving)?0.4:1}} disabled={bannerSaving || !bannerForm.title.trim() || !bannerForm.image_url}
                    onClick={async()=>{
                      setBannerSaving(true)
                      try {
                        await api.post('/api/ads/partner-banner', bannerForm)
                        showToast('\u2705 Баннер создан!')
                        setShowBannerForm(false)
                        const r = await api.get('/api/ads/my-banner')
                        setBanner(r.data?.banner||null); setCanCreateBanner(r.data?.can_create||false)
                      } catch(e) { showToast(e?.response?.data?.error||'\u041E\u0448\u0438\u0431\u043A\u0430',true) }
                      setBannerSaving(false)
                    }}>{bannerSaving ? '\u23F3...' : '\uD83D\uDCE2 \u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C'}</button>
                  <button style={S.btnSm('rgba(255,77,106,0.1)','#ff4d6a')} onClick={()=>setShowBannerForm(false)}>{'\u2715'}</button>
                </div>
              </div>
            )}
          </div>
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

      {/* ======== SUSPENDED (auto-blocked) ======== */}
      {p?.status === 'suspended' && (
        <div className="p-status rejected">
          <div className="ps-icon">🚨</div>
          <div className="ps-title">ПАРТНЁРСТВО ЗАБЛОКИРОВАНО</div>
          <div className="ps-desc" style={{marginBottom:12}}>
            Ваше партнёрство заблокировано из-за нарушения правил. Задание деактивировано.
          </div>
          {p.suspended_reason && (
            <div style={{background:'rgba(255,77,106,0.06)',border:'1px solid rgba(255,77,106,0.15)',borderRadius:10,padding:12,marginBottom:12,textAlign:'left'}}>
              <div style={{fontFamily:'Orbitron',fontSize:9,fontWeight:700,color:'#ff4d6a',letterSpacing:'.08em',marginBottom:8}}>ПРИЧИНЫ БЛОКИРОВКИ</div>
              {p.suspended_reason.split('; ').map((r,i) => (
                <div key={i} style={{fontSize:11,color:'rgba(232,242,255,0.6)',lineHeight:1.6,padding:'3px 0'}}>
                  {r}
                </div>
              ))}
            </div>
          )}
          <div style={{...S.card, borderColor:'rgba(0,212,255,0.15)', textAlign:'left'}}>
            <div style={{fontFamily:'Orbitron',fontSize:9,fontWeight:700,color:'#00d4ff',letterSpacing:'.08em',marginBottom:8}}>КАК РАЗБЛОКИРОВАТЬ</div>
            {[
              '1. Убедитесь что бот @' + botUsername + ' является админом канала',
              '2. Проверьте что у бота есть право "Публикация сообщений"',
              '3. Убедитесь что подписчиков не менее ' + (info?.min_subs?.toLocaleString() || '1 000'),
              '4. Обратитесь к администратору для разблокировки'
            ].map((s,i) => (
              <div key={i} style={{fontSize:11,color:'rgba(232,242,255,0.45)',lineHeight:1.6,padding:'2px 0'}}>{s}</div>
            ))}
          </div>
          <div className="ps-channel">{p.channel_url}</div>
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
              {/* HERO */}
              <div className="p-landing-hero">
                <div className="p-landing-hero-glow"/>
                <div style={{fontSize:52,marginBottom:10,filter:'drop-shadow(0 0 20px rgba(168,85,247,0.4))'}}>🤝</div>
                <div style={{fontFamily:'Orbitron',fontSize:18,fontWeight:900,color:'#e8f2ff',marginBottom:8,letterSpacing:'.04em'}}>СТАНЬТЕ ПАРТНЁРОМ</div>
                <div style={{fontSize:13,color:'rgba(232,242,255,0.55)',lineHeight:1.6,maxWidth:300,margin:'0 auto'}}>
                  Добавьте ваш Telegram-канал в задания TonEra — получайте подписчиков бесплатно
                </div>
              </div>

              {/* WHAT YOU GET */}
              <div style={S.card}>
                <div className="p-landing-section-title">
                  <span className="p-landing-section-emoji">🎁</span>
                  ЧТО ВЫ ПОЛУЧИТЕ
                </div>
                <div className="p-landing-benefits">
                  {[
                    {icon:'🎯',title:'Бесплатные подписчики',desc:'Ваш канал добавляется в задания — тысячи пользователей будут подписываться каждый день',color:'#00e676'},
                    {icon:'🎁',title:'Промокод для подписчиков',desc:'Автоматический промокод с вознаграждением TON — подписчики активируют и получают бонус',color:'#a855f7'},
                    {icon:'📢',title:'Бесплатный баннер',desc:'Рекламный баннер вашего канала на 2 недели — виден всем пользователям TonEra',color:'#00d4ff'},
                    {icon:'📈',title:'Система уровней',desc:'Чем больше подписчиков — тем больше выполнений задания и выше награды промокодов',color:'#ffb300'},
                    {icon:'📊',title:'Статистика в реальном времени',desc:'Отслеживайте количество подписок, статус задания и эффективность промокодов',color:'#ff6b6b'},
                    {icon:'✏️',title:'Управление заданием',desc:'Редактируйте название и описание задания прямо из приложения в любой момент',color:'#4ecdc4'},
                  ].map((b,i) => (
                    <div key={i} className="p-landing-benefit">
                      <div className="p-landing-benefit-icon" style={{background:`${b.color}15`,border:`1px solid ${b.color}25`}}>{b.icon}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:'#e8f2ff',marginBottom:3,fontFamily:'Orbitron,sans-serif',letterSpacing:'.02em'}}>{b.title}</div>
                        <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',lineHeight:1.5}}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HOW IT WORKS */}
              <div style={S.card}>
                <div className="p-landing-section-title">
                  <span className="p-landing-section-emoji">⚡</span>
                  КАК ЭТО РАБОТАЕТ
                </div>
                <div className="p-landing-steps">
                  {[
                    {num:'1',title:'Проверка канала',desc:'Введите ссылку на ваш публичный Telegram-канал. Мы проверим количество подписчиков.',icon:'📢'},
                    {num:'2',title:'Добавьте бота',desc:`Добавьте @${botUsername} как администратора канала с правом публикации сообщений.`,icon:'🤖'},
                    {num:'3',title:'Рекламный пост',desc:'Бот опубликует пост с вашей реферальной ссылкой и промокодом в вашем канале.',icon:'📝'},
                    {num:'4',title:'Получите партнёрство',desc:'После проверки ваш канал появится в заданиях — подписчики пойдут автоматически!',icon:'🚀'},
                  ].map((s,i) => (
                    <div key={i} className="p-landing-step">
                      <div className="p-landing-step-left">
                        <div className="p-landing-step-num">{s.num}</div>
                        {i < 3 && <div className="p-landing-step-line"/>}
                      </div>
                      <div className="p-landing-step-content">
                        <div style={{fontSize:12,fontWeight:700,color:'#e8f2ff',marginBottom:3,fontFamily:'Orbitron,sans-serif'}}>{s.icon} {s.title}</div>
                        <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',lineHeight:1.5}}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LEVELS */}
              <div style={S.card}>
                <div className="p-landing-section-title">
                  <span className="p-landing-section-emoji">🏆</span>
                  УРОВНИ ПАРТНЁРСТВА
                </div>
                <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:12,lineHeight:1.5}}>
                  Уровень определяется количеством подписчиков вашего канала. Задание обновляется каждый месяц — лимит выполнений сбрасывается.
                </div>
                <div className="p-landing-levels">
                  {(info?.levels || [
                    {emoji:'🥉',name:'Bronze',min:0,maxExecs:100,promoReward:0.01,color:'#cd7f32'},
                    {emoji:'🥈',name:'Silver',min:5000,maxExecs:500,promoReward:0.02,color:'#c0c0c0'},
                    {emoji:'🥇',name:'Gold',min:20000,maxExecs:2000,promoReward:0.05,color:'#ffd700'},
                    {emoji:'💎',name:'Diamond',min:50000,maxExecs:10000,promoReward:0.1,color:'#b9f2ff'},
                  ]).map((l,i) => (
                    <div key={i} className="p-landing-level" style={{borderColor:`${l.color}25`}}>
                      <div className="p-landing-level-left">
                        <div style={{fontSize:22}}>{l.emoji}</div>
                        <div>
                          <div style={{fontFamily:'Orbitron',fontSize:10,fontWeight:900,color:l.color,letterSpacing:'.05em'}}>{l.name.toUpperCase()}</div>
                          <div style={{fontSize:9,color:'rgba(232,242,255,0.3)'}}>от {l.min.toLocaleString()} подп.</div>
                        </div>
                      </div>
                      <div className="p-landing-level-right">
                        <div style={{fontSize:9,color:'rgba(232,242,255,0.35)'}}>Задание: <b style={{color:'#00d4ff'}}>{l.maxExecs.toLocaleString()}</b> вып./мес</div>
                        <div style={{fontSize:9,color:'rgba(232,242,255,0.35)'}}>Промо: <b style={{color:'#a855f7'}}>{l.promoReward} TON</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REQUIREMENTS */}
              <div style={S.card}>
                <div className="p-landing-section-title">
                  <span className="p-landing-section-emoji">📋</span>
                  ТРЕБОВАНИЯ
                </div>
                <div className="p-landing-reqs">
                  {[
                    {icon:'👥',text:`Минимум ${info?.min_subs?.toLocaleString() || '1 000'} подписчиков на канале`},
                    {icon:'🔓',text:'Канал должен быть публичным (не приватным)'},
                    {icon:'🤖',text:`Добавить бота @${botUsername} как администратора`},
                    {icon:'📝',text:'Опубликовать рекламный пост с реферальной ссылкой'},
                    {icon:'🚫',text:'Канал не должен нарушать правила Telegram'},
                  ].map((r,i) => (
                    <div key={i} className="p-landing-req">
                      <div className="p-landing-req-icon">{r.icon}</div>
                      <div className="p-landing-req-text">{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DAILY CHECKS */}
              <div style={S.card}>
                <div className="p-landing-section-title">
                  <span className="p-landing-section-emoji">🔍</span>
                  ЕЖЕДНЕВНЫЕ ПРОВЕРКИ
                </div>
                <div style={{fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:12,lineHeight:1.5}}>
                  Канал автоматически проверяется каждый день. При нарушении правил партнёрство блокируется.
                </div>
                <div className="p-landing-reqs">
                  {[
                    {icon:'🤖',text:'Бот является администратором канала',color:'#00e676'},
                    {icon:'✏️',text:'У бота есть право публикации сообщений',color:'#00d4ff'},
                    {icon:'👥',text:`Подписчиков не менее ${info?.min_subs?.toLocaleString() || '1 000'}`,color:'#a855f7'},
                    {icon:'📌',text:'Рекламный пост не удалён из канала',color:'#ffb300'},
                  ].map((r,i) => (
                    <div key={i} className="p-landing-req">
                      <div className="p-landing-req-icon" style={{background:`${r.color}12`,borderColor:`${r.color}25`}}>{r.icon}</div>
                      <div className="p-landing-req-text">{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RULES WARNING */}
              <div style={{...S.card, borderColor:'rgba(255,179,0,0.2)', background:'rgba(255,179,0,0.03)'}}>
                <div className="p-landing-section-title">
                  <span className="p-landing-section-emoji">⚠️</span>
                  ВАЖНО
                </div>
                <div style={{fontSize:11,color:'rgba(232,242,255,0.45)',lineHeight:1.7}}>
                  <div style={{marginBottom:6}}>• Если бот удалён из администраторов — партнёрство <b style={{color:'#ff4d6a'}}>блокируется автоматически</b></div>
                  <div style={{marginBottom:6}}>• Если количество подписчиков упадёт ниже минимума — партнёрство <b style={{color:'#ff4d6a'}}>блокируется</b></div>
                  <div style={{marginBottom:6}}>• Удаление рекламного поста приводит к <b style={{color:'#ffb300'}}>приостановке задания</b></div>
                  <div>• Для разблокировки необходимо устранить нарушения и обратиться к администратору</div>
                </div>
              </div>

              {/* CTA */}
              <button className="p-landing-cta" onClick={() => setWizardStep(1)}>
                <span className="p-landing-cta-glow"/>
                <span style={{position:'relative',zIndex:1}}>🚀 НАЧАТЬ ОФОРМЛЕНИЕ</span>
              </button>
              <div style={{textAlign:'center',fontSize:10,color:'rgba(232,242,255,0.2)',marginTop:8,fontFamily:'DM Sans'}}>
                Оформление займёт около 2 минут
              </div>
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
                  <div style={{textAlign:'center',marginBottom:14}}>
                    <div style={{fontSize:36,marginBottom:6}}>📝</div>
                    <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'#e8f2ff'}}>ШАГ 3: РЕКЛАМНЫЙ ПОСТ</div>
                    <div style={{fontSize:12,color:'rgba(232,242,255,0.5)',marginTop:6,lineHeight:1.6}}>
                      Отредактируйте текст и нажмите «Опубликовать» —<br/>бот опубликует пост в вашем канале
                    </div>
                  </div>

                  {/* REQUIREMENTS */}
                  <div style={{background:'rgba(255,179,0,0.04)',border:'1px solid rgba(255,179,0,0.2)',borderRadius:10,padding:12,marginBottom:14}}>
                    <div style={{fontFamily:'Orbitron',fontSize:9,fontWeight:700,color:'#ffb300',letterSpacing:'.08em',marginBottom:8}}>⚠️ ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>🔗</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:postText.includes('t.me/')?'#00e676':'#ff4d6a'}}>
                          {postText.includes('t.me/') ? '✅' : '❌'} Реферальная ссылка
                        </div>
                        <div style={{fontSize:10,color:'#00d4ff',fontFamily:'monospace',marginTop:2}}>{refLink}</div>
                      </div>
                    </div>
                    {promoCode && (
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:16}}>🎁</span>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:postText.includes(promoCode.code)?'#00e676':'#ff4d6a'}}>
                            {postText.includes(promoCode.code) ? '✅' : '❌'} Промокод
                          </div>
                          <div style={{fontSize:10,color:'#a855f7',fontFamily:'monospace',marginTop:2}}>{promoCode.code}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* LOGO PREVIEW */}
                  <div style={{textAlign:'center',marginBottom:14}}>
                    <img src="/logo.png" alt="TonEra" style={{width:100,height:100,borderRadius:12,border:'1px solid rgba(26,95,255,0.15)'}} />
                    <div style={{fontSize:9,color:'rgba(232,242,255,0.3)',marginTop:4}}>📷 Логотип прикрепляется автоматически</div>
                  </div>

                  {/* PROMO CODE INFO */}
                  {promoCode && (
                    <div style={{background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.25)',borderRadius:10,padding:12,marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{fontFamily:'Orbitron',fontSize:10,fontWeight:700,color:'#a855f7'}}>🎁 ВАШ ПРОМОКОД</div>
                        <div style={{fontFamily:'Orbitron',fontSize:14,fontWeight:900,color:'#e8f2ff',letterSpacing:2,background:'rgba(168,85,247,0.15)',padding:'4px 12px',borderRadius:6}}>{promoCode.code}</div>
                      </div>
                      <div style={{display:'flex',gap:14,fontSize:10,color:'rgba(232,242,255,0.5)'}}>
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

                  <div style={{display:'flex',gap:6,marginTop:6,marginBottom:10}}>
                    <button style={{...S.btnSm('rgba(168,85,247,0.12)','#a855f7'),flex:1}} onClick={() => setPostText(makeDefaultPost(promoCode))}>↺ СБРОСИТЬ ТЕКСТ</button>
                  </div>

                  {/* SAVE INFO */}
                  <div style={{background:'rgba(0,212,255,0.04)',border:'1px solid rgba(0,212,255,0.15)',borderRadius:10,padding:12,marginBottom:14}}>
                    <div style={{fontSize:11,color:'rgba(232,242,255,0.5)',lineHeight:1.6}}>
                      <span style={{color:'#00d4ff',fontWeight:700}}>💾 Ваш текст сохраняется</span> — при автоматическом постинге в канал всегда будет использоваться именно ваша версия поста
                    </div>
                  </div>

                  <button style={{...S.btn('linear-gradient(135deg,rgba(0,230,118,0.2),rgba(0,212,255,0.2))','#00e676'),opacity:checking?0.5:1,fontSize:12,padding:'14px'}} onClick={publishPromo} disabled={checking}>
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

function AutopostTimer({ next, last, intervalHours }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const nextDate = next ? new Date(next) : null
  const diff = nextDate ? nextDate.getTime() - now : 0

  if (!nextDate || diff <= 0) {
    return (
      <div>
        <div style={{fontSize:12,color:'#00e676',fontWeight:700,marginBottom:6}}>⏳ Постинг скоро...</div>
        {last && <div style={{fontSize:9,color:'rgba(232,242,255,0.3)'}}>Последний: {new Date(last).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>}
      </div>
    )
  }

  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  const progress = last ? Math.max(0, Math.min(100, (1 - diff / (intervalHours * 3600000)) * 100)) : 0

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontSize:11,color:'rgba(232,242,255,0.5)'}}>Следующий пост через:</div>
        <div style={{fontFamily:'Orbitron',fontSize:16,fontWeight:900,color:'#00e676',letterSpacing:2}}>
          {String(hours).padStart(2,'0')}:{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </div>
      </div>
      <div style={{height:4,background:'rgba(0,230,118,0.08)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
        <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,#00e676,#00d4ff)',width:`${progress}%`,transition:'width 1s linear'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(232,242,255,0.3)'}}>
        {last && <span>Последний: {new Date(last).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>}
        <span>Каждые {intervalHours}ч</span>
      </div>
    </div>
  )
}
