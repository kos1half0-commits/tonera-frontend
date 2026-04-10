import { useState, useEffect } from 'react'
import api from '../../api/index'

const AD_NETWORK_SETTINGS = [
  { key: 'ad_cooldown_seconds', label: '⏱ Кулдаун между рекламой (секунды)', type: 'number' },
  { key: 'adsgram_enabled',   label: '🎬 Adsgram: ВКЛ/ВЫКЛ (1/0)', type: 'number' },
  { key: 'adsgram_block_id', label: '🎬 Adsgram: Block ID', type: 'text' },
  { key: 'adsgram_reward',   label: '🎬 Adsgram: Награда за просмотр (TON)', type: 'number' },
  { key: 'adsgram_daily_limit', label: '🎬 Adsgram: Лимит просмотров в день', type: 'number' },
  { key: 'monetag_enabled',    label: '📺 Monetag: ВКЛ/ВЫКЛ (1/0)', type: 'number' },
  { key: 'monetag_zone_id',    label: '📺 Monetag: Zone ID', type: 'text' },
  { key: 'monetag_reward',     label: '📺 Monetag: Награда за просмотр (TON)', type: 'number' },
  { key: 'monetag_daily_limit', label: '📺 Monetag: Лимит просмотров в день', type: 'number' },
  { key: 'onclicka_enabled',    label: '🔵 OnClickA: ВКЛ/ВЫКЛ (1/0)', type: 'number' },
  { key: 'onclicka_spot_id',    label: '🔵 OnClickA: Spot ID', type: 'text' },
  { key: 'onclicka_reward',     label: '🔵 OnClickA: Награда за просмотр (TON)', type: 'number' },
  { key: 'onclicka_daily_limit', label: '🔵 OnClickA: Лимит просмотров в день', type: 'number' },
  { key: 'richads_enabled',    label: '💚 RichAds: ВКЛ/ВЫКЛ (1/0)', type: 'number' },
  { key: 'richads_widget_id',  label: '💚 RichAds: Widget ID (pubId-appId)', type: 'text' },
  { key: 'richads_reward',     label: '💚 RichAds: Награда за просмотр (TON)', type: 'number' },
  { key: 'richads_daily_limit', label: '💚 RichAds: Лимит просмотров в день', type: 'number' },
  { key: 'tads_enabled',    label: '🟠 Tads.me: ВКЛ/ВЫКЛ (1/0)', type: 'number' },
  { key: 'tads_widget_id',  label: '🟠 Tads.me: Widget ID', type: 'text' },
  { key: 'tads_reward',     label: '🟠 Tads.me: Награда за просмотр (TON)', type: 'number' },
  { key: 'tads_daily_limit', label: '🟠 Tads.me: Лимит просмотров в день', type: 'number' },
]

export default function AdsAdmin() {
  const [ads, setAds] = useState([])
  const [form, setForm] = useState({ title:'', text:'', image_url:'', link:'', pages:'home,tasks,games,staking,miner,wallet', linkToAdOrder:false, expires_at:'' })
  const [editing, setEditing] = useState(null)
  const [toast, setAdsToast] = useState('')
  const [adsTab, setAdsTab] = useState('stats')
  // Network stats
  const [netStats, setNetStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  // Settings
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState(null)

  const showToast = m => { setAdsToast(m); setTimeout(()=>setAdsToast(''),3000) }
  const load = () => api.get('/api/ads/all').then(r=>setAds(r.data||[])).catch(()=>{})
  useEffect(()=>{
    load()
    api.get('/api/ads/admin-stats').then(r => { setNetStats(r.data); setStatsLoading(false) }).catch(() => setStatsLoading(false))
    api.get('/api/admin/settings').then(r => setSettings(r.data || {})).catch(()=>{})
  },[])

  const saveSetting = async (key) => {
    setSaving(key)
    try {
      await api.post('/api/admin/settings', { key, value: settings[key] })
      showToast('✅ Сохранено')
    } catch { showToast('❌ Ошибка') }
    setSaving(null)
  }

  const PAGE_OPTIONS = ['home','tasks','games','staking','miner','wallet']

  const save = async () => {
    if (editing) {
      await api.put(`/api/ads/${editing}`, {...form, active:true})
      setEditing(null)
    } else {
      await api.post('/api/ads', form)
    }
    setForm({ title:'', text:'', image_url:'', link:'', pages:'home,tasks,games,staking,miner,wallet', expires_at:'' })
    await load(); showToast('✅ Сохранено')
  }

  const manualAds = ads.filter(a => !a.type || a.type === 'manual')
  const partnerAds = ads.filter(a => a.type === 'partner')

  // Totals
  const totalClicks = ads.reduce((s,a) => s + parseInt(a.clicks||0), 0)
  const totalViews = ads.reduce((s,a) => s + parseInt(a.views||0), 0)

  const S = {
    input: {width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',marginBottom:8,boxSizing:'border-box'},
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3},
    btn: (c={}) => ({padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',...c}),
    ptab: (a) => ({padding:'8px 16px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',background:a?'rgba(0,212,255,0.15)':'rgba(26,95,255,0.06)',color:a?'#00d4ff':'rgba(232,242,255,0.3)',transition:'all .2s'}),
    statCard: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 14px',flex:1,minWidth:70},
    statVal: (color) => ({fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color,lineHeight:1.2}),
    statLbl: {fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)',marginTop:2},
  }

  const fmtDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'})
  }

  const daysLeft = (d) => {
    if (!d) return null
    const diff = Math.ceil((new Date(d) - new Date()) / (1000*60*60*24))
    return diff
  }

  const renderAd = (ad) => {
    const isPartner = ad.type === 'partner'
    const isExpired = ad.expires_at && new Date(ad.expires_at) < new Date()
    const statusColor = !ad.active ? '#ff4d6a' : isExpired ? '#ffb300' : '#00e676'
    const statusText = !ad.active ? 'Выкл' : isExpired ? 'Истёк' : 'Активен'
    const clicks = parseInt(ad.clicks||0)
    const views = parseInt(ad.views||0)
    const ctr = views > 0 ? (clicks / views * 100).toFixed(1) : '0'
    const days = daysLeft(ad.expires_at)

    return (
      <div key={ad.id} style={{background:'#0e1c3a',border:`1px solid ${ad.active && !isExpired?'rgba(26,95,255,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
        {ad.image_url && <img src={ad.image_url} style={{width:'100%',borderRadius:8,marginBottom:6,maxHeight:80,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',flex:1}}>{ad.title||'Без названия'}</div>
          <span style={{fontSize:8,fontFamily:'Orbitron',fontWeight:700,color:statusColor,background:`${statusColor}15`,padding:'3px 8px',borderRadius:5}}>{statusText}</span>
          {isPartner && <span style={{fontSize:8,fontFamily:'Orbitron',fontWeight:700,color:'#a855f7',background:'rgba(168,85,247,0.1)',padding:'3px 8px',borderRadius:5}}>Партнёр</span>}
        </div>
        <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:2}}>{ad.text}</div>
        <div style={{display:'flex',gap:8,marginBottom:6,marginTop:6}}>
          <div style={{background:'rgba(0,212,255,0.06)',border:'1px solid rgba(0,212,255,0.12)',borderRadius:8,padding:'5px 10px',flex:1,textAlign:'center'}}>
            <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'#00d4ff'}}>{views}</div>
            <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>ПОКАЗЫ</div>
          </div>
          <div style={{background:'rgba(0,230,118,0.06)',border:'1px solid rgba(0,230,118,0.12)',borderRadius:8,padding:'5px 10px',flex:1,textAlign:'center'}}>
            <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'#00e676'}}>{clicks}</div>
            <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>КЛИКИ</div>
          </div>
          <div style={{background:'rgba(255,179,0,0.06)',border:'1px solid rgba(255,179,0,0.12)',borderRadius:8,padding:'5px 10px',flex:1,textAlign:'center'}}>
            <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'#ffb300'}}>{ctr}%</div>
            <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>CTR</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,fontSize:9,color:'rgba(232,242,255,0.3)',marginBottom:6,flexWrap:'wrap'}}>
          <span>{'📄 '+ad.pages}</span>
          {isPartner && ad.username && <span>{'👤 @'+ad.username}</span>}
          {ad.expires_at && <span>{'⏰ '+fmtDate(ad.expires_at)}</span>}
          {days !== null && days > 0 && <span style={{color:'#00e676'}}>{'✅ '+days+' дн.'}</span>}
          {days !== null && days <= 0 && <span style={{color:'#ff4d6a'}}>{'❌ истёк'}</span>}
        </div>
        {ad.expires_at && (
          <div style={{height:3,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
            <div style={{height:'100%',borderRadius:2,background:isExpired?'#ff4d6a':'linear-gradient(90deg,#1a5fff,#00d4ff)',width:isExpired?'100%':(Math.max(0,Math.min(100,(new Date(ad.expires_at)-new Date())/(14*24*60*60*1000)*100))+'%'),transition:'width .5s'}}/>
          </div>
        )}
        <div style={{display:'flex',gap:6}}>
          {!isPartner && <button style={S.btn({flex:1,background:'rgba(26,95,255,0.15)',color:'#00d4ff'})} onClick={()=>{setEditing(ad.id);setForm({title:ad.title||'',text:ad.text||'',image_url:ad.image_url||'',link:ad.link||'',pages:ad.pages||'',expires_at:ad.expires_at?ad.expires_at.substring(0,10):''})}}>✏️ Ред.</button>}
          <button style={S.btn({background:ad.active?'rgba(255,179,0,0.15)':'rgba(0,230,118,0.15)',color:ad.active?'#ffb300':'#00e676'})} onClick={async()=>{await api.put(`/api/ads/${ad.id}`,{...ad,active:!ad.active});load()}}>
            {ad.active?'⏸':'▶️'}
          </button>
          <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})} onClick={async()=>{await api.delete(`/api/ads/${ad.id}`);load()}}>🗑</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        <button style={S.ptab(adsTab==='stats')} onClick={()=>setAdsTab('stats')}>📊 Статистика</button>
        <button style={S.ptab(adsTab==='settings')} onClick={()=>setAdsTab('settings')}>⚙️ Настройки сетей</button>
        <button style={S.ptab(adsTab==='manual')} onClick={()=>setAdsTab('manual')}>🎯 Баннеры ({manualAds.length})</button>
        <button style={S.ptab(adsTab==='partner')} onClick={()=>setAdsTab('partner')}>🤝 Партнёрские ({partnerAds.length})</button>
      </div>

      {/* === STATS TAB === */}
      {adsTab === 'stats' && (
        <div>
          {/* Banner stats */}
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            <div style={S.statCard}>
              <div style={S.statVal('#00d4ff')}>{ads.length}</div>
              <div style={S.statLbl}>Всего баннеров</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statVal('#00e676')}>{ads.filter(a=>a.active).length}</div>
              <div style={S.statLbl}>Активных</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statVal('#00d4ff')}>{totalViews}</div>
              <div style={S.statLbl}>Показов</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statVal('#ffb300')}>{totalClicks}</div>
              <div style={S.statLbl}>Кликов</div>
            </div>
          </div>

          {statsLoading && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>}
          {netStats && (<>
            {/* Combined totals */}
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8}}>📊 РЕКЛАМНЫЕ СЕТИ</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
              <div style={{...S.statCard,textAlign:'center'}}>
                <div style={S.statVal('#00d4ff')}>{netStats.todayAll}</div>
                <div style={S.statLbl}>Сегодня</div>
              </div>
              <div style={{...S.statCard,textAlign:'center'}}>
                <div style={S.statVal('#00e676')}>{parseFloat(netStats.earnedAll).toFixed(4)}</div>
                <div style={S.statLbl}>Выплачено TON</div>
              </div>
              <div style={{...S.statCard,textAlign:'center'}}>
                <div style={S.statVal('#ffb300')}>{netStats.totalAll}</div>
                <div style={S.statLbl}>Всего просм.</div>
              </div>
            </div>

            {/* Per-network cards */}
            {netStats.stats.map(net => {
              const maxToday = Math.max(...netStats.stats.map(n => n.today), 1)
              const barWidth = Math.max(5, (net.today / maxToday) * 100)
              const colors = { adsgram:'#ffb300', monetag:'#a855f7', onclicka:'#3b82f6', richads:'#10b981', tads:'#f59e0b' }
              const color = colors[net.key] || '#00d4ff'
              return (
                <div key={net.key} style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.12)',borderRadius:12,padding:'12px 14px',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <span style={{fontSize:16}}>{net.icon}</span>
                    <span style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color,flex:1}}>{net.label}</span>
                    <span style={{fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,color:net.today > 0 ? '#00e676' : 'rgba(232,242,255,0.2)',padding:'3px 8px',borderRadius:6,background:net.today > 0 ? 'rgba(0,230,118,0.1)' : 'rgba(26,95,255,0.05)'}}>
                      {net.today > 0 ? 'АКТИВНА' : 'НЕТ ДАННЫХ'}
                    </span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:8}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color}}>{net.today}</div>
                      <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>СЕГОДНЯ</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'rgba(232,242,255,0.6)'}}>{net.yesterday}</div>
                      <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>ВЧЕРА</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'#00d4ff'}}>{net.week}</div>
                      <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>НЕДЕЛЯ</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'Orbitron',fontSize:13,fontWeight:900,color:'#e8f2ff'}}>{net.total}</div>
                      <div style={{fontSize:7,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron'}}>ВСЕГО</div>
                    </div>
                  </div>
                  <div style={{height:4,background:'rgba(26,95,255,0.08)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
                    <div style={{height:'100%',width:barWidth+'%',background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:2,transition:'width .5s'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,fontFamily:'DM Sans,sans-serif',color:'rgba(232,242,255,0.35)'}}>
                    <span>💰 {parseFloat(net.earned).toFixed(4)} TON</span>
                    <span>👥 {net.users} юзеров</span>
                  </div>
                </div>
              )
            })}

            {/* Top users */}
            {netStats.topUsers?.length > 0 && (<>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8,marginTop:12}}>🏆 ТОП-10 ПО РЕКЛАМЕ</div>
              {netStats.topUsers.map((u, i) => (
                <div key={u.telegram_id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.1)',borderRadius:8,marginBottom:4}}>
                  <div style={{width:22,height:22,borderRadius:6,background:i < 3 ? 'rgba(255,179,0,0.15)' : 'rgba(26,95,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Orbitron',fontSize:9,fontWeight:900,color:i < 3 ? '#ffb300' : 'rgba(232,242,255,0.3)',flexShrink:0}}>
                    {i + 1}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {u.username ? '@' + u.username : u.first_name || 'User'}
                    </div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)'}}>
                      {parseInt(u.views)} просмотров
                    </div>
                  </div>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00e676',flexShrink:0}}>
                    {parseFloat(u.earned).toFixed(4)} TON
                  </div>
                </div>
              ))}
            </>)}
          </>)}
        </div>
      )}

      {/* === SETTINGS TAB === */}
      {adsTab === 'settings' && (
        <div>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:12}}>⚙️ НАСТРОЙКИ РЕКЛАМНЫХ СЕТЕЙ</div>
          {AD_NETWORK_SETTINGS.map(s => (
            <div key={s.key} style={{marginBottom:8}}>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.5)',marginBottom:3}}>{s.label}</div>
              <div style={{display:'flex',gap:6}}>
                <input
                  style={{...S.input,marginBottom:0,flex:1}}
                  type={s.type || 'text'}
                  step={s.type === 'number' ? '0.0001' : undefined}
                  value={settings[s.key] ?? ''}
                  onChange={e => setSettings(p => ({...p, [s.key]: e.target.value}))}
                />
                <button
                  style={S.btn({background:'linear-gradient(135deg,#1a5fff,#0930cc)',color:'#fff',padding:'8px 14px',flexShrink:0})}
                  onClick={() => saveSetting(s.key)}
                >
                  {saving === s.key ? '...' : '💾'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === BANNERS TABS === */}
      {(adsTab === 'manual' || adsTab === 'partner') && (<>
        {/* Create form — only for manual tab */}
        {adsTab === 'manual' && (
          <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>
              {editing ? '✏️ Редактирование' : '➕ Новый баннер'}
            </div>
            <span style={S.label}>Заголовок</span>
            <input style={S.input} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder='Заголовок рекламы'/>
            <span style={S.label}>Текст</span>
            <textarea style={{...S.input,resize:'none'}} rows={2} value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))} placeholder='Описание...'/>
            <span style={S.label}>Картинка</span>
            {form.image_url ? (
              <div style={{position:'relative',marginBottom:8}}>
                <img src={form.image_url} style={{width:'100%',borderRadius:8,maxHeight:80,objectFit:'cover'}}/>
                <button onClick={()=>setForm(p=>({...p,image_url:''}))} style={{position:'absolute',top:4,right:4,padding:'3px 7px',border:'none',borderRadius:5,background:'rgba(255,77,106,0.8)',color:'#fff',cursor:'pointer',fontSize:10}}>✕</button>
              </div>
            ) : (
              <label style={{display:'block',padding:'10px',border:'1px dashed rgba(26,95,255,0.3)',borderRadius:8,textAlign:'center',cursor:'pointer',color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans,sans-serif',fontSize:12,marginBottom:8}}>
                📷 Загрузить
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                  const file = e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => setForm(p=>({...p,image_url:ev.target.result}))
                  reader.readAsDataURL(file)
                }}/>
              </label>
            )}
            <span style={S.label}>Ссылка (опц.)</span>
            <input style={{...S.input,opacity:form.linkToAdOrder?0.3:1}} value={form.link} onChange={e=>setForm(p=>({...p,link:e.target.value}))} placeholder="https://..." disabled={form.linkToAdOrder}/>
            <span style={S.label}>Срок действия</span>
            <input style={S.input} type="date" value={form.expires_at||''} onChange={e=>setForm(p=>({...p,expires_at:e.target.value}))} placeholder="DD.MM.YYYY"/>
            <span style={S.label}>Страницы</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
              {PAGE_OPTIONS.map(p => {
                const active = form.pages.split(',').includes(p)
                return (
                  <button key={p} style={S.btn({background:active?'rgba(26,95,255,0.3)':'rgba(26,95,255,0.08)',color:active?'#00d4ff':'rgba(232,242,255,0.3)',border:`1px solid ${active?'rgba(0,212,255,0.4)':'rgba(26,95,255,0.15)'}`})}
                    onClick={()=>{
                      const cur = form.pages.split(',').filter(Boolean)
                      const next = active ? cur.filter(x=>x!==p) : [...cur,p]
                      setForm(f=>({...f,pages:next.join(',')}))
                    }}>{p}</button>
                )
              })}
            </div>
            <div style={{display:'flex',gap:6}}>
              <button style={S.btn({flex:1,background:'linear-gradient(135deg,#1a5fff,#0930cc)',color:'#fff',padding:'10px'})} onClick={save}>
                {editing ? '💾 Сохранить' : '➕ Создать'}
              </button>
              {editing && <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>{setEditing(null);setForm({title:'',text:'',image_url:'',link:'',pages:'home,tasks,games,staking,miner,wallet',expires_at:''})}}>✕</button>}
            </div>
          </div>
        )}

        {/* Ad list */}
        {(adsTab === 'manual' ? manualAds : partnerAds).length === 0 && (
          <div style={{textAlign:'center',color:'rgba(232,242,255,0.25)',padding:'30px 20px',fontFamily:'DM Sans',fontSize:13}}>
            {adsTab === 'manual' && '🎯 Нет ручных баннеров'}
            {adsTab === 'partner' && '🤝 Нет партнёрских баннеров'}
          </div>
        )}
        {(adsTab === 'manual' ? manualAds : partnerAds).map(ad => renderAd(ad))}
      </>)}
    </div>
  )
}
