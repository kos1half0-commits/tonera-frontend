import { useState, useEffect, useRef } from 'react'
import api from '../../api/index'
import './Admin.css'

const SETTING_GROUPS = [
  {
    id: 'spin_custom',
    title: '🎰 Спин',
    settings: []
  },
  {
    id: 'trading',
    title: '📈 Трейдинг',
    settings: [
      { key: 'trading_enabled', label: 'Статус (0=откл, 1=вкл, 2=тех.работы, 3=только админ)' },
      { key: 'trading_multiplier', label: 'Процент выплаты (%, напр. 90)' },
      { key: 'trading_bank',        label: 'Банк трейдинга (TON)' },
      { key: 'trading_commission',  label: 'Комиссия с каждой ставки (%)' },
      { key: 'trading_profit_fee',  label: '% с комиссии — чистая прибыль' },
    ]
  },
  {
    id: 'miner',
    title: '⛏ Майнинг',
    settings: [
      { key: 'miner_enabled',                  label: 'Статус (0=откл, 1=вкл, 2=только админ)' },
      { key: 'miner_price',                    label: 'Цена майнера (TON)' },
      { key: 'miner_speed_base',               label: 'Базовая скорость (TON/час)' },
      { key: 'miner_electricity_percent',      label: 'Стоимость электричества (% от дневного заработка)' },
      { key: 'miner_electricity_120',           label: 'Кнопка оплаты 120 дней (0=скрыта, 1=показана)' },
      { key: 'miner_electricity_hours',        label: 'Интервал оплаты (часов)' },
      { key: 'miner_upgrade_multiplier',   label: 'Множитель скорости за апгрейд' },
      { key: 'miner_upgrade_price',              label: 'Цена апгрейда (фиксированная, TON)' },
      { key: 'miner_min_collect',               label: 'Мин. вывод дохода (TON)' },
    ]
  },
  {
    id: 'ads_config',
    title: '📣 Реклама',
    settings: [
      { key: 'ad_banner_interval', label: 'Интервал прокрутки баннеров (сек)' },
      { key: 'ad_price_week',   label: 'Цена рекламы 1 неделя (TON)' },
      { key: 'ad_price_2weeks', label: 'Цена рекламы 2 недели (TON)' },
      { key: 'ad_price_month',  label: 'Цена рекламы 1 месяц (TON)' },
    ]
  },
  {
    id: 'slots',
    title: '🎰 Слоты',
    settings: [
      { key: 'slots_enabled', label: 'Статус (0=откл, 1=вкл, 2=тех.работы, 3=только админ)' },
      { key: 'slots_min_bet', label: 'Мин. ставка (TON)' },
      { key: 'slots_bank',       label: 'Банк слотов (TON)' },
      { key: 'slots_win_chance', label: 'Шанс выигрыша (%)' },
    ]
  },
  {
    id: 'partnership',
    title: '🤝 Партнёрство',
    settings: [
      { key: 'partnership_enabled',     label: 'Статус (0=откл, 1=вкл, 2=только админ)' },
      { key: 'partnership_min_subs',     label: 'Мин. подписчиков канала' },
      { key: 'partnership_task_execs',   label: 'Макс. выполнений задания (авто)' },
      { key: 'partnership_check_hours',  label: 'Часы проверки через запятую (напр. 9,21)' },
    ]
  },
  {
    id: 'staking',
    title: '📈 Стейкинг',
    settings: [
      { key: 'min_deposit',  label: 'Минимальный депозит (TON)' },
      { key: 'min_withdraw', label: 'Минимальный вывод (TON)' },
      { key: 'min_reinvest', label: 'Минимальный реинвест (TON)' },
      { key: 'min_collect',          label: 'Минимальный сбор (TON)' },
      { key: 'staking_withdraw_fee', label: 'Комиссия вывода из стейка (%)' },
    ]
  },
  {
    id: 'tasks',
    title: '✅ Задания',
    settings: [
      { key: 'task_reward',      label: 'Награда исполнителю (TON)' },
      { key: 'task_price',       label: 'Цена для заказчика (TON)' },
      { key: 'task_ref_bonus',   label: 'Реф. бонус за задание (TON)' },
      { key: 'task_project_fee', label: 'Комиссия проекта (TON)' },
    ]
  },

  {
    id: 'wallet',
    title: '💎 Кошелёк проекта',
    settings: [
      { key: 'project_wallet',  label: 'Адрес кошелька (TON)' },
      { key: 'min_deposit_ton', label: 'Мин. сумма депозита (TON)' },
      { key: 'withdraw_fee',    label: 'Комиссия за вывод (TON)' },
      { key: 'min_withdraw_ton', label: 'Минимальный вывод (TON)' },
    ]
  },
  {
    id: 'referrals',
    title: '👥 Рефералы',
    settings: [
      { key: 'ref_register_bonus',  label: 'Бонус за регистрацию (TON)' },
      { key: 'ref_task_percent',    label: '% от задания реферала' },
      { key: 'ref_deposit_percent', label: '% от депозита реферала' },
    ]
  },
]

function AdOrdersAdmin() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setT] = useState('')

  const showToast = m => { setT(m); setTimeout(()=>setT(''),3000) }
  const load = () => api.get('/api/ads/orders').then(r=>{setOrders(r.data||[]);setLoading(false)}).catch(()=>setLoading(false))
  useEffect(()=>{ load() },[])

  const approve = async id => { await api.put(`/api/ads/orders/${id}`,{status:'approved'}); load(); showToast('✅ Одобрено — баннер создан') }
  const reject  = async id => { await api.put(`/api/ads/orders/${id}`,{status:'rejected'}); load(); showToast('❌ Отклонено') }

  const S = { btn: (c={})=>({padding:'6px 10px',border:'none',borderRadius:7,fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',...c}) }

  if (loading) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}
      {!orders.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет заявок</div>}
      {orders.map(o => (
        <div key={o.id} style={{background:'#0e1c3a',border:`1px solid ${o.status==='approved'?'rgba(0,230,118,0.2)':o.status==='rejected'?'rgba(255,77,106,0.15)':'rgba(26,95,255,0.2)'}`,borderRadius:12,padding:12,marginBottom:8}}>
          {o.image_url && <img src={o.image_url} style={{width:'100%',borderRadius:8,maxHeight:100,objectFit:'cover',marginBottom:8}} onError={e=>e.target.style.display='none'}/>}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff',flex:1}}>{o.title}</span>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,padding:'3px 8px',borderRadius:6,fontWeight:700,
              background:o.status==='approved'?'rgba(0,230,118,0.15)':o.status==='rejected'?'rgba(255,77,106,0.15)':'rgba(255,179,0,0.15)',
              color:o.status==='approved'?'#00e676':o.status==='rejected'?'#ff4d6a':'#ffb300'
            }}>{o.status==='approved'?'ОДОБРЕНО':o.status==='rejected'?'ОТКЛ':'ОЖИДАЕТ'}</span>
          </div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:2}}>👤 {o.username?'@'+o.username:o.first_name}</div>
          {o.text && <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.5)',marginBottom:2}}>{o.text}</div>}
          {o.link && <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'#00d4ff',marginBottom:2}}>🔗 {o.link}</div>}
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.3)',marginBottom:6}}>📍 {o.pages} · 💰 {o.budget} TON</div>
          {o.status === 'pending' && (
            <div style={{display:'flex',gap:6}}>
              <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={()=>approve(o.id)}>✅ ОДОБРИТЬ</button>
              <button style={S.btn({flex:1,background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>reject(o.id)}>❌ ОТКЛОНИТЬ</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AdsAdmin() {
  const [ads, setAds] = useState([])
  const [form, setForm] = useState({ title:'', text:'', image_url:'', link:'', pages:'home,tasks,games,staking,miner,wallet', linkToAdOrder:false })
  const [editing, setEditing] = useState(null)
  const [toast, setAdsToast] = useState('')

  const showToast = m => { setAdsToast(m); setTimeout(()=>setAdsToast(''),3000) }
  const load = () => api.get('/api/ads/all').then(r=>setAds(r.data||[])).catch(()=>{})
  useEffect(()=>{ load() },[])

  const PAGE_OPTIONS = ['home','tasks','games','staking','miner','wallet']

  const save = async () => {
    if (editing) {
      await api.put(`/api/ads/${editing}`, {...form, active:true})
      setEditing(null)
    } else {
      await api.post('/api/ads', form)
    }
    setForm({ title:'', text:'', image_url:'', link:'', pages:'home,tasks,games,staking,miner,wallet' })
    await load(); showToast('✅ Сохранено')
  }

  const S = {
    input: {width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',marginBottom:8},
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3},
    btn: (c={}) => ({padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',...c}),
  }

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>
          {editing ? 'РЕДАКТИРОВАТЬ' : 'СОЗДАТЬ БАННЕР'}
        </div>
        <span style={S.label}>ЗАГОЛОВОК</span>
        <input style={S.input} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Заголовок рекламы"/>
        <span style={S.label}>ТЕКСТ</span>
        <textarea style={{...S.input,resize:'none'}} rows={2} value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))} placeholder="Описание..."/>
        <span style={S.label}>ФОТО БАННЕРА</span>
        {form.image_url ? (
          <div style={{position:'relative',marginBottom:8}}>
            <img src={form.image_url} style={{width:'100%',borderRadius:8,maxHeight:80,objectFit:'cover'}}/>
            <button onClick={()=>setForm(p=>({...p,image_url:''}))} style={{position:'absolute',top:4,right:4,padding:'3px 7px',border:'none',borderRadius:5,background:'rgba(255,77,106,0.8)',color:'#fff',cursor:'pointer',fontSize:10}}>✕</button>
          </div>
        ) : (
          <label style={{display:'block',padding:'10px',border:'1px dashed rgba(26,95,255,0.3)',borderRadius:8,textAlign:'center',cursor:'pointer',color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans,sans-serif',fontSize:12,marginBottom:8}}>
            📷 Загрузить фото
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
              const file = e.target.files[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => setForm(p=>({...p,image_url:ev.target.result}))
              reader.readAsDataURL(file)
            }}/>
          </label>
        )}
        <span style={S.label}>ССЫЛКА (КУДА ВЕДЁТ)</span>
        <input style={{...S.input,opacity:form.linkToAdOrder?0.3:1}} value={form.link} onChange={e=>setForm(p=>({...p,link:e.target.value}))} placeholder="https://..." disabled={form.linkToAdOrder}/>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginTop:4,marginBottom:4}}>
          <input type="checkbox" checked={!!form.linkToAdOrder} onChange={e=>setForm(p=>({...p,linkToAdOrder:e.target.checked,link:e.target.checked?'__adorder__':p.link}))}/>
          <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'rgba(232,242,255,0.6)'}}>📣 Ссылка на страницу заказа рекламы</span>
        </label>
        <span style={S.label}>СТРАНИЦЫ</span>
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
            {editing ? '✅ СОХРАНИТЬ' : '+ СОЗДАТЬ'}
          </button>
          {editing && <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>{setEditing(null);setForm({title:'',text:'',image_url:'',link:'',pages:'home,tasks,games,staking,miner,wallet'})}}>✕</button>}
        </div>
      </div>

      {ads.map(ad => (
        <div key={ad.id} style={{background:'#0e1c3a',border:`1px solid ${ad.active?'rgba(26,95,255,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
          {ad.image_url && <img src={ad.image_url} style={{width:'100%',borderRadius:8,marginBottom:6,maxHeight:80,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>}
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',marginBottom:2}}>{ad.title||'Без заголовка'}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:4}}>{ad.text}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(26,95,255,0.6)',marginBottom:8}}>📍 {ad.pages}</div>
          <div style={{display:'flex',gap:6}}>
            <button style={S.btn({flex:1,background:'rgba(26,95,255,0.15)',color:'#00d4ff'})} onClick={()=>{setEditing(ad.id);setForm({title:ad.title||'',text:ad.text||'',image_url:ad.image_url||'',link:ad.link||'',pages:ad.pages||''})}}>✏️ РЕДАКТИРОВАТЬ</button>
            <button style={S.btn({background:ad.active?'rgba(255,179,0,0.15)':'rgba(0,230,118,0.15)',color:ad.active?'#ffb300':'#00e676'})} onClick={async()=>{await api.put(`/api/ads/${ad.id}`,{...ad,active:!ad.active});load()}}>
              {ad.active?'⏸':'▶️'}
            </button>
            <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})} onClick={async()=>{await api.delete(`/api/ads/${ad.id}`);load()}}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MinersAdmin() {
  const [miners, setMiners] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    api.get('/api/miner/all').then(r => { setMiners(r.data||[]); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const openMiner = async (m) => {
    setSelected(m)
    setHistLoading(true)
    try {
      const r = await api.get(`/api/miner/admin/history/${m.user_id}`)
      setHistory(r.data||[])
    } catch {}
    setHistLoading(false)
  }

  if (loading) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>

  // Детальный просмотр
  if (selected) {
    const typeLabel = t => {
      if (t==='miner_buy') return '⛏ Покупка'
      if (t==='miner_upgrade') return '⬆️ Апгрейд'
      if (t==='miner_electricity') return '⚡ Электричество'
      if (t==='miner_collect') return '💰 Вывод'
      return t
    }
    return (
      <div>
        <button onClick={()=>setSelected(null)} style={{marginBottom:12,padding:'7px 14px',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,background:'transparent',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:9,cursor:'pointer'}}>← НАЗАД</button>
        <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:10}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:13,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>
            {selected.username?'@'+selected.username:selected.first_name}
          </div>
          {[
            ['ID', selected.telegram_id],
            ['Уровень', `LVL ${selected.level}`],
            ['Скорость', `${parseFloat(selected.speed).toFixed(6)} TON/ч`],
            ['В день', `${(parseFloat(selected.speed)*24).toFixed(6)} TON`],
            ['Статус', selected.active?'✅ Активен':'❌ Остановлен'],
            ['Куплен', new Date(selected.created_at).toLocaleDateString('ru')],
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(26,95,255,0.07)'}}>
              <span style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)'}}>{k}</span>
              <span style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#e8f2ff',fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8}}>ИСТОРИЯ ТРАНЗАКЦИЙ</div>
        {histLoading && <div style={{textAlign:'center',padding:10,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Загрузка...</div>}
        {!histLoading && !history.length && <div style={{textAlign:'center',padding:10,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет транзакций</div>}
        {history.map((h,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.1)',borderRadius:8,marginBottom:5}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'#e8f2ff'}}>{typeLabel(h.type)}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>{new Date(h.created_at).toLocaleString('ru')}</div>
            </div>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:parseFloat(h.amount)>0?'#00e676':'#ff4d6a'}}>
              {parseFloat(h.amount)>0?'+':''}{parseFloat(h.amount).toFixed(4)} TON
            </div>
          </div>
        ))}
        <button onClick={async()=>{
          if(!confirm('Удалить майнер?'))return
          await api.delete(`/api/miner/${selected.user_id}`)
          setSelected(null)
          api.get('/api/miner/all').then(r=>setMiners(r.data||[]))
        }} style={{width:'100%',marginTop:10,padding:'10px',border:'none',borderRadius:10,background:'rgba(255,77,106,0.15)',color:'#ff4d6a',fontFamily:'Orbitron,sans-serif',fontSize:10,cursor:'pointer',fontWeight:700}}>
          🗑 УДАЛИТЬ МАЙНЕР
        </button>
      </div>
    )
  }

  const active = miners.filter(m => m.active).length
  const totalSpeed = miners.reduce((s,m) => s + parseFloat(m.speed||0), 0)
  const avgLevel = miners.length ? (miners.reduce((s,m) => s + m.level, 0) / miners.length).toFixed(1) : 0
  const totalRevenue = miners.reduce((s,m) => s + Math.abs(parseFloat(m.upgrade_spent||0)), 0)

  const S = {
    stat: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 12px',flex:1,textAlign:'center'},
    row: (c={}) => ({display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,marginBottom:6,...c}),
  }

  return (
    <div>
      {/* СТАТИСТИКА */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
        <div style={S.stat}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#00d4ff'}}>{miners.length}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)'}}>Всего майнеров</div>
        </div>
        <div style={S.stat}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#00e676'}}>{active}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)'}}>Активных</div>
        </div>
        <div style={S.stat}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#ffb300'}}>{totalSpeed.toFixed(4)}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)'}}>TON/час суммарно</div>
        </div>
        <div style={S.stat}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#e8f2ff'}}>{avgLevel}</div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)'}}>Средний уровень</div>
        </div>
      </div>

      {/* СПИСОК */}
      <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8}}>СПИСОК МАЙНЕРОВ</div>
      {!miners.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет майнеров</div>}
      {miners.map(m => (
        <div key={m.id} style={{...S.row(),cursor:'pointer'}} onClick={()=>openMiner(m)}>
          <div style={{width:36,height:36,borderRadius:8,background:m.active?'rgba(0,230,118,0.15)':'rgba(255,77,106,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>⛏</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff'}}>{m.username ? '@'+m.username : m.first_name}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>LVL {m.level} · {parseFloat(m.speed).toFixed(6)} TON/ч · {new Date(m.created_at).toLocaleDateString('ru')}</div>
          </div>
          <div style={{textAlign:'right',marginRight:4}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,color:m.active?'#00e676':'#ff4d6a'}}>{m.active?'АКТИВЕН':'СТОП'}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>{parseFloat(m.speed*24).toFixed(4)} TON/д</div>
          </div>
          <div style={{color:'rgba(232,242,255,0.2)',fontSize:12}}>›</div>
        </div>
      ))}
    </div>
  )
}

function AdminsPanel() {
  const [admins, setAdmins] = useState([])
  const [tgId, setTgId] = useState('')
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }
  const load = () => api.get('/api/admin/admins').then(r => setAdmins(r.data||[])).catch(()=>{})
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!tgId.trim()) return
    setSaving(true)
    try {
      await api.post('/api/admin/admins', { telegram_id: tgId, username })
      setTgId(''); setUsername('')
      await load(); showToast('✅ Админ добавлен')
    } catch (e) { showToast('❌ ' + (e?.response?.data?.error || 'Ошибка')) }
    setSaving(false)
  }

  const S = {
    input: {background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',width:'100%'},
    btn: (c={}) => ({padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',...c}),
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3,marginTop:8},
  }

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>ДОБАВИТЬ АДМИНА</div>
        <span style={S.label}>TELEGRAM ID</span>
        <input style={S.input} value={tgId} onChange={e=>setTgId(e.target.value)} placeholder="123456789" type="number"/>
        <span style={S.label}>USERNAME</span>
        <div style={{display:'flex',gap:6}}>
          <input style={{...S.input,flex:1}} value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username"/>
          <button style={S.btn({background:'rgba(0,212,255,0.1)',color:'#00d4ff',border:'1px solid rgba(0,212,255,0.2)',flexShrink:0})}
            onClick={async()=>{
              if (!tgId.trim()) return
              try {
                const r = await api.get(`/api/admin/user-info/${tgId}`)
                if (r.data?.username) setUsername('@' + r.data.username)
                else if (r.data?.first_name) setUsername(r.data.first_name)
                else showToast('❌ Пользователь не найден в БД')
              } catch { showToast('❌ Не найден') }
            }}>🔍 НАЙТИ</button>
        </div>
        <button style={{...S.btn({background:'linear-gradient(135deg,#1a5fff,#0930cc)',color:'#fff',width:'100%',marginTop:10,padding:'10px'}),fontFamily:'Orbitron,sans-serif'}}
          onClick={add} disabled={saving}>
          {saving ? '...' : '+ ДОБАВИТЬ'}
        </button>
      </div>

      <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8}}>СПИСОК АДМИНОВ</div>
      {admins.length === 0 && <div style={{textAlign:'center',color:'rgba(232,242,255,0.25)',padding:16,fontFamily:'DM Sans'}}>Нет дополнительных админов</div>}
      {admins.map(a => (
        <div key={a.id} style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 12px',marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,color:'#e8f2ff',fontWeight:700}}>{a.username || 'Без username'}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)'}}>ID: {a.telegram_id}</div>
          </div>
          <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})}
            onClick={async()=>{ await api.delete(`/api/admin/admins/${a.id}`); load() }}>✕</button>
        </div>
      ))}
    </div>
  )
}

function PromoAdmin() {
  const [promos, setPromos] = useState([])
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [saving, setSaving] = useState(false)
  const [toast, setPromoToast] = useState('')

  const load = () => api.get('/api/promo/all').then(r => setPromos(r.data||[])).catch(()=>{})
  useEffect(() => { load() }, [])
  const showToast = (m) => { setPromoToast(m); setTimeout(() => setPromoToast(''), 3000) }

  const create = async () => {
    if (!code.trim() || !amount) return
    setSaving(true)
    try {
      await api.post('/api/promo/create', { code, amount: parseFloat(amount), max_uses: parseInt(maxUses)||1 })
      setCode(''); setAmount(''); setMaxUses('1')
      await load(); showToast('✅ Промокод создан')
    } catch (e) { showToast('❌ ' + (e?.response?.data?.error || 'Ошибка')) }
    setSaving(false)
  }

  const S = {
    input: {background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',width:'100%'},
    btn: (c={}) => ({padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',...c}),
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3,marginTop:8},
  }

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      {/* СОЗДАТЬ */}
      <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>СОЗДАТЬ ПРОМОКОД</div>
        <span style={S.label}>КОД</span>
        <div style={{display:'flex',gap:6}}>
          <input style={{...S.input,flex:1}} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="TONERA2024"/>
          <button style={S.btn({background:'rgba(0,212,255,0.1)',color:'#00d4ff',border:'1px solid rgba(0,212,255,0.2)',flexShrink:0})}
            onClick={()=>{
              const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
              const gen = Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join('')
              setCode(gen)
            }}>🎲 ГЕНЕРИРОВАТЬ</button>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{flex:1}}>
            <span style={S.label}>СУММА (TON)</span>
            <input style={S.input} type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.5"/>
          </div>
          <div style={{flex:1}}>
            <span style={S.label}>МАХ. ИСПОЛЬЗОВАНИЙ</span>
            <input style={S.input} type="number" value={maxUses} onChange={e=>setMaxUses(e.target.value)} placeholder="1"/>
          </div>
        </div>
        <button style={{...S.btn({background:'linear-gradient(135deg,#1a5fff,#0930cc)',color:'#fff',width:'100%',marginTop:10,padding:'10px'}),fontFamily:'Orbitron,sans-serif'}}
          onClick={create} disabled={saving}>
          {saving ? '...' : '+ СОЗДАТЬ'}
        </button>
      </div>

      {/* СПИСОК */}
      {promos.length === 0 && <div style={{textAlign:'center',color:'rgba(232,242,255,0.3)',padding:20,fontFamily:'DM Sans'}}>Нет промокодов</div>}
      {promos.map(p => (
        <div key={p.id} style={{background:'#0e1c3a',border:`1px solid ${p.active?'rgba(26,95,255,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:13,fontWeight:900,color:p.active?'#00d4ff':'rgba(232,242,255,0.3)',flex:1}}>{p.code}</span>
            <button style={S.btn({background:p.active?'rgba(255,179,0,0.15)':'rgba(0,230,118,0.15)',color:p.active?'#ffb300':'#00e676'})}
              onClick={async()=>{ await api.put(`/api/promo/${p.id}/toggle`); load() }}>
              {p.active?'⏸':'▶️'}
            </button>
            <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})}
              onClick={async()=>{ await api.delete(`/api/promo/${p.id}`); load() }}>✕</button>
          </div>
          <div style={{display:'flex',gap:12}}>
            <div>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#ffb300',fontWeight:700}}>{parseFloat(p.amount).toFixed(5)} TON</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>за 1 использование</div>
            </div>
            <div>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#00e676',fontWeight:700}}>{(parseFloat(p.amount)*p.uses).toFixed(4)} TON</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>потрачено ({p.uses} из {p.max_uses})</div>
            </div>
            <div>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#00d4ff',fontWeight:700}}>{(parseFloat(p.amount)*(p.max_uses-p.uses)).toFixed(4)} TON</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>осталось</div>
            </div>
            <div>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'rgba(232,242,255,0.5)',fontWeight:700}}>{(parseFloat(p.amount)*p.max_uses).toFixed(4)} TON</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>бюджет</div>
            </div>
          </div>
          <div style={{marginTop:6,height:4,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.min(100,p.uses/p.max_uses*100)}%`,background:'linear-gradient(90deg,#1a5fff,#00d4ff)',borderRadius:2}}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminTaskItem({ task: initialTask, onDelete, onRefresh }) {
  const [task, setTask] = useState(initialTask)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTask.title)
  const [reward, setReward] = useState(initialTask.reward)
  const [maxExec, setMaxExec] = useState(initialTask.max_executions || 0)
  const [buyers, setBuyers] = useState([])
  const [loadBuyers, setLoadBuyers] = useState(false)

  const reload = async () => {
    const r = await api.get(`/api/tasks/${task.id}`); setTask(r.data)
  }

  const openDetail = async () => {
    setOpen(o => !o)
    if (!open && buyers.length === 0) {
      setLoadBuyers(true)
      try {
        const r = await api.get(`/api/admin/task-buyers/${task.id}`)
        setBuyers(r.data || [])
      } catch {}
      setLoadBuyers(false)
    }
  }

  const save = async () => {
    await api.put(`/api/tasks/${task.id}`, { title, reward, max_executions: parseInt(maxExec) })
    await reload(); setEditing(false); onRefresh()
  }

  const pause = async () => {
    await api.put(`/api/tasks/${task.id}`, { active: !task.active })
    await reload()
  }

  const S = {
    btn: (c={}) => ({padding:'6px 10px',border:'none',borderRadius:7,fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',...c}),
    input: {width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'7px 10px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',marginBottom:6},
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3},
  }

  return (
    <div style={{background:'#0e1c3a',border:`1px solid ${task.active?'rgba(26,95,255,0.2)':'rgba(255,77,106,0.2)'}`,borderRadius:12,marginBottom:8,overflow:'hidden'}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer'}} onClick={openDetail}>
        {task.channel_photo
          ? <img src={task.channel_photo} style={{width:36,height:36,borderRadius:8,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
          : <div style={{width:36,height:36,borderRadius:8,background:'rgba(26,95,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{task.icon}</div>
        }
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,color:'#00d4ff'}}>+{task.reward} TON</span>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)'}}>{task.executions||0}/{task.max_executions||0} выполнений</span>
            {task.creator_username || task.creator_name ? (
              <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(255,179,0,0.6)'}}>👤 {task.creator_username ? '@'+task.creator_username : task.creator_name}</span>
            ) : (
              <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(26,95,255,0.5)'}}>📢 Системное</span>
            )}
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,color:task.active?'#00e676':'#ff4d6a'}}>{task.active?'АКТИВНО':'ПАУЗА'}</span>
          </div>
        </div>
        <span style={{color:'rgba(232,242,255,0.3)',fontSize:14,transition:'.2s',transform:open?'rotate(90deg)':'none'}}>›</span>
      </div>

      {/* DETAIL */}
      {open && (
        <div style={{padding:'0 12px 12px',borderTop:'1px solid rgba(26,95,255,0.08)'}}>
          {editing ? (
            <div style={{paddingTop:10}}>
              <span style={S.label}>НАЗВАНИЕ</span>
              <input style={S.input} value={title} onChange={e=>setTitle(e.target.value)}/>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <span style={S.label}>НАГРАДА (TON)</span>
                  <input style={S.input} type="number" step="0.001" value={reward} onChange={e=>setReward(e.target.value)}/>
                </div>
                <div style={{flex:1}}>
                  <span style={S.label}>МАКС. ВЫПОЛНЕНИЙ</span>
                  <input style={S.input} type="number" value={maxExec} onChange={e=>setMaxExec(e.target.value)}/>
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={save}>✅ СОХРАНИТЬ</button>
                <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>setEditing(false)}>✕ ОТМЕНА</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',gap:6,paddingTop:10,marginBottom:10}}>
              <button style={S.btn({flex:1,background:'rgba(26,95,255,0.2)',color:'#00d4ff'})} onClick={()=>{setEditing(true);setTitle(task.title);setReward(task.reward);setMaxExec(task.max_executions||0)}}>✏️ РЕДАКТИРОВАТЬ</button>
              <button style={S.btn({flex:1,background:task.active?'rgba(255,179,0,0.15)':'rgba(0,230,118,0.15)',color:task.active?'#ffb300':'#00e676'})} onClick={pause}>
                {task.active?'⏸ ПАУЗА':'▶️ АКТИВИРОВАТЬ'}
              </button>
              <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})} onClick={()=>onDelete(task.id)}>🗑</button>
            </div>
          )}

          {/* КТО ЗАКАЗАЛ */}
          <div style={{marginTop:8}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',marginBottom:6}}>КТО ВЫПОЛНИЛ ({buyers.length})</div>
            {loadBuyers ? (
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>
            ) : buyers.length === 0 ? (
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.25)'}}>Никто ещё не выполнил</div>
            ) : (
              <div style={{maxHeight:150,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
                {buyers.map((b,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:'1px solid rgba(26,95,255,0.06)'}}>
                    <span style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'#e8f2ff',flex:1}}>{b.username ? '@'+b.username : b.first_name}</span>
                    <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.3)'}}>{new Date(b.completed_at).toLocaleDateString('ru',{day:'numeric',month:'short'})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PartnershipAdmin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [task, setTask] = useState(null)
  const [taskLoading, setTaskLoading] = useState(false)
  const [editTask, setEditTask] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskReward, setTaskReward] = useState('')
  const [taskMaxExec, setTaskMaxExec] = useState('')
  const [postText, setPostText] = useState('')
  const [showPost, setShowPost] = useState(false)
  const [posting, setPosting] = useState(false)
  const [toast, setPartToast] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTplTitle, setNewTplTitle] = useState('')
  const [savingTpl, setSavingTpl] = useState(false)
  const [postPhoto, setPostPhoto] = useState(null)
  const [postPhotoPreview, setPostPhotoPreview] = useState(null)

  const showToast = (msg) => { setPartToast(msg); setTimeout(() => setPartToast(''), 3000) }
  const load = () => api.get('/api/partnership/all').then(r => { setItems(r.data||[]); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const approve = async (id) => { await api.post(`/api/partnership/approve/${id}`); load(); showToast('✅ Одобрено — задание создано') }
  const reject  = async (id) => { await api.post(`/api/partnership/reject/${id}`);  load(); showToast('❌ Отклонено') }

  const openPartner = async (p) => {
    setSelected(p); setTask(null); setEditTask(false); setShowPost(false); setCheckResult(null)
    if (p.task_id) {
      setTaskLoading(true)
      try {
        const r = await api.get(`/api/tasks/${p.task_id}`)
        setTask(r.data); setTaskTitle(r.data.title); setTaskReward(r.data.reward); setTaskMaxExec(r.data.max_executions || 100)
      } catch {}
      setTaskLoading(false)
    }
  }

  const saveTask = async () => {
    await api.put(`/api/tasks/${task.id}`, { title: taskTitle, reward: taskReward, max_executions: parseInt(taskMaxExec) })
    const r = await api.get(`/api/tasks/${task.id}`)
    setTask(r.data); setEditTask(false); showToast('✅ Задание обновлено')
  }

  const pauseTask = async () => {
    await api.put(`/api/tasks/${task.id}`, { active: !task.active })
    const r = await api.get(`/api/tasks/${task.id}`)
    setTask(r.data); showToast(task.active ? '⏸ Задание на паузе' : '▶️ Задание активно')
  }

  const deletePartner = async () => {
    if (!confirm('Удалить партнёра и его задание?')) return
    if (selected.task_id) await api.delete(`/api/tasks/${selected.task_id}`).catch(()=>{})
    await api.delete(`/api/partnership/${selected.id}`).catch(()=>{})
    setSelected(null); load(); showToast('🗑 Партнёр удалён')
  }

  const sendPost = async () => {
    setPosting(true)
    try {
      let photoData = null
      if (postPhoto) {
        photoData = await new Promise((res, rej) => {
          const r = new FileReader()
          r.onload = () => res(r.result)
          r.onerror = rej
          r.readAsDataURL(postPhoto)
        })
      } else if (postPhotoPreview) {
        // Фото из шаблона — уже base64
        photoData = postPhotoPreview
      }
      await api.post(`/api/partnership/post/${selected.id}`, { text: postText, photo: photoData })
      showToast('✅ Пост опубликован!')
      setShowPost(false); setPostText(''); setPostPhoto(null); setPostPhotoPreview(null)
    } catch (e) { showToast('❌ ' + (e?.response?.data?.error || 'Ошибка')) }
    setPosting(false)
  }

  const S = {
    card: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:12,padding:12,cursor:'pointer'},
    row: {display:'flex',alignItems:'center',gap:8,marginBottom:6},
    btn: (c) => ({padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',...c}),
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,letterSpacing:'.08em',color:'rgba(232,242,255,0.4)',marginBottom:4,display:'block'},
    input: {width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',marginBottom:8},
    back: {background:'transparent',border:'none',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',marginBottom:12,display:'block'},
  }

  if (loading) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>

  // ДЕТАЛЬНЫЙ ВИД ПАРТНЁРА
  if (selected) return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}
      <button style={S.back} onClick={() => setSelected(null)}>← НАЗАД</button>

      {/* ИНФО */}
      <div style={{...S.card,cursor:'default',marginBottom:10}}>
        <div style={S.row}>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#00d4ff'}}>#{selected.id}</span>
          <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:700,color:'#e8f2ff',flex:1}}>{selected.username ? '@'+selected.username : selected.first_name}</span>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,padding:'3px 8px',borderRadius:6,fontWeight:700,
            background:selected.status==='approved'?'rgba(0,230,118,0.15)':'rgba(255,179,0,0.15)',
            color:selected.status==='approved'?'#00e676':'#ffb300'
          }}>{selected.status==='approved'?'ОДОБРЕН':'ОЖИДАЕТ'}</span>
        </div>
        <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:3}}>📢 {selected.channel_url}</div>
        {selected.post_url && <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.3)'}}>🔗 {selected.post_url}</div>}
      </div>

      {/* ЗАДАНИЕ */}
      {selected.task_id && (
        <div style={{...S.card,cursor:'default',marginBottom:10}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:8}}>📋 ЗАДАНИЕ</div>
          {taskLoading ? <div style={{color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans,sans-serif',fontSize:12}}>Загрузка...</div> : task ? (
            editTask ? (
              <>
                <span style={S.label}>НАЗВАНИЕ</span>
                <input style={S.input} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} />
                <span style={S.label}>НАГРАДА (TON)</span>
                <input style={{...S.input}} type="number" step="0.001" value={taskReward} onChange={e=>setTaskReward(e.target.value)} />
                <span style={S.label}>МАКС. ПРОСМОТРОВ</span>
                <div style={{display:'flex',gap:6,marginBottom:10}}>
                  <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a',fontSize:14})} onClick={()=>setTaskMaxExec(v=>Math.max(1,parseInt(v)-10))}>−10</button>
                  <input style={{...S.input,marginBottom:0,flex:1,textAlign:'center'}} type="number" value={taskMaxExec} onChange={e=>setTaskMaxExec(e.target.value)} />
                  <button style={S.btn({background:'rgba(0,230,118,0.15)',color:'#00e676',fontSize:14})} onClick={()=>setTaskMaxExec(v=>parseInt(v)+10)}>+10</button>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={saveTask}>✅ СОХРАНИТЬ</button>
                  <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>setEditTask(false)}>✕</button>
                </div>
              </>
            ) : (
              <>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'rgba(232,242,255,0.7)',marginBottom:4}}>{task.title}</div>
                <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
                  <span style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00d4ff'}}>💰 {task.reward} TON</span>
                  <span style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>👁 {task.executions||0}/{task.max_executions||100} просмотров</span>
                  <span style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:task.active?'#00e676':'#ffb300'}}>{task.active?'▶ АКТИВНО':'⏸ ПАУЗА'}</span>
                </div>
                <div style={{display:'flex',gap:6,marginBottom:8}}>
                  <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={async()=>{await api.put(`/api/tasks/${task.id}`,{max_executions:Math.max(1,(task.max_executions||100)-10)});const r=await api.get(`/api/tasks/${task.id}`);setTask(r.data)}}>−10 просм.</button>
                  <button style={S.btn({background:'rgba(0,230,118,0.15)',color:'#00e676'})} onClick={async()=>{await api.put(`/api/tasks/${task.id}`,{max_executions:(task.max_executions||100)+10});const r=await api.get(`/api/tasks/${task.id}`);setTask(r.data)}}>+10 просм.</button>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button style={S.btn({flex:1,background:'rgba(26,95,255,0.2)',color:'#00d4ff'})} onClick={()=>setEditTask(true)}>✏️ РЕДАКТИРОВАТЬ</button>
                  <button style={S.btn({flex:1,background:task.active?'rgba(255,179,0,0.15)':'rgba(0,230,118,0.15)',color:task.active?'#ffb300':'#00e676'})} onClick={pauseTask}>
                    {task.active ? '⏸ ПАУЗА' : '▶️ ВОЗОБНОВИТЬ'}
                  </button>
                </div>
              </>
            )
          ) : <div style={{color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans,sans-serif',fontSize:12}}>Задание не найдено</div>}
        </div>
      )}

      {/* ПОСТ В КАНАЛ */}
      {selected.status === 'approved' && (
        <div style={{...S.card,cursor:'default',marginBottom:10}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:8}}>📤 ПОСТ В КАНАЛ</div>
          {showPost ? (
            <>
              {/* ШАБЛОНЫ */}
              {templates.length > 0 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)',letterSpacing:'.08em',marginBottom:4}}>ШАБЛОНЫ</div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:100,overflowY:'auto'}}>
                    {templates.map(t => (
                      <div key={t.id} style={{display:'flex',gap:4}}>
                        <button onClick={()=>{ setPostText(t.text); if(t.photo_url){setPostPhotoPreview(t.photo_url)} else {setPostPhoto(null);setPostPhotoPreview(null)} }} style={{...S.btn({flex:1,background:'rgba(26,95,255,0.1)',color:'#00d4ff',textAlign:'left',fontSize:9,padding:'5px 8px'})}}>
                          📄 {t.title}
                        </button>
                        <button onClick={async()=>{
                          await api.delete(`/api/partnership/templates/${t.id}`)
                          const r = await api.get('/api/partnership/templates')
                          setTemplates(r.data||[])
                        }} style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a',fontSize:9,padding:'5px 8px'})}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ФОТО */}
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)',letterSpacing:'.08em',marginBottom:4}}>ФОТО (НЕОБЯЗАТЕЛЬНО)</div>
                {postPhotoPreview ? (
                  <div style={{position:'relative',marginBottom:6}}>
                    <img src={postPhotoPreview} style={{width:'100%',borderRadius:10,maxHeight:150,objectFit:'cover'}}/>
                    <button onClick={()=>{setPostPhoto(null);setPostPhotoPreview(null)}}
                      style={{position:'absolute',top:6,right:6,...S.btn({background:'rgba(255,77,106,0.8)',color:'#fff',fontSize:10})}}>✕</button>
                  </div>
                ) : (
                  <label style={{display:'block',width:'100%',padding:'10px',border:'1px dashed rgba(26,95,255,0.3)',borderRadius:10,textAlign:'center',cursor:'pointer',color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans,sans-serif',fontSize:12}}>
                    📷 Выбрать фото
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                      const file = e.target.files[0]
                      if (!file) return
                      setPostPhoto(file)
                      const reader = new FileReader()
                      reader.onload = ev => setPostPhotoPreview(ev.target.result)
                      reader.readAsDataURL(file)
                    }}/>
                  </label>
                )}
              </div>
              <textarea value={postText} onChange={e=>setPostText(e.target.value)} rows={4}
                placeholder="Текст поста (HTML: <b>, <i>, <a href=''>)"
                style={{...S.input,resize:'none',marginBottom:6}}/>
              {/* СОХРАНИТЬ КАК ШАБЛОН */}
              {showTemplates ? (
                <div style={{display:'flex',gap:6,marginBottom:6}}>
                  <input value={newTplTitle} onChange={e=>setNewTplTitle(e.target.value)}
                    placeholder="Название шаблона" style={{...S.input,marginBottom:0,flex:1,padding:'6px 10px'}}/>
                  <button style={S.btn({background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={async()=>{
                    if (!newTplTitle.trim()) { showToast('Введите название шаблона'); return }
                    setSavingTpl(true)
                    try {
                      await api.post('/api/partnership/templates', { title: newTplTitle, text: postText, photo_url: postPhotoPreview || null })
                      const r = await api.get('/api/partnership/templates')
                      setTemplates(r.data||[])
                      setNewTplTitle(''); setShowTemplates(false)
                      showToast('✅ Шаблон сохранён')
                    } catch (e) { showToast('❌ ' + (e?.response?.data?.error || 'Ошибка')) }
                    setSavingTpl(false)
                  }} disabled={savingTpl}>💾</button>
                  <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})} onClick={()=>setShowTemplates(false)}>✕</button>
                </div>
              ) : (
                <button style={{...S.btn({width:'100%',background:'transparent',color:'rgba(232,242,255,0.3)'}),border:'1px dashed rgba(26,95,255,0.2)',marginBottom:6}}
                  onClick={()=>setShowTemplates(true)}>
                  💾 СОХРАНИТЬ КАК ШАБЛОН
                </button>
              )}
              <div style={{display:'flex',gap:6}}>
                <button style={S.btn({flex:1,background:'rgba(26,95,255,0.3)',color:'#00d4ff'})} onClick={sendPost} disabled={posting}>
                  {posting?'...':'📤 ОПУБЛИКОВАТЬ'}
                </button>
                <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>{setShowPost(false);setShowTemplates(false)}}>✕</button>
              </div>
            </>
          ) : (
            <button style={S.btn({width:'100%',background:'rgba(26,95,255,0.15)',color:'#00d4ff'})} onClick={async()=>{
              setShowPost(true)
              const r = await api.get('/api/partnership/templates')
              setTemplates(r.data||[])
            }}>
              📝 НАПИСАТЬ ПОСТ
            </button>
          )}
        </div>
      )}

      {/* ПРОВЕРИТЬ */}
      <div style={{marginBottom:10}}>
        <button style={S.btn({width:'100%',background:'rgba(0,212,255,0.1)',color:'#00d4ff',border:'1px solid rgba(0,212,255,0.2)',marginBottom:6})}
          onClick={async()=>{
            setChecking(true); setCheckResult(null)
            try {
              const r = await api.post(`/api/partnership/check-status/${selected.id}`)
              setCheckResult(r.data)
            } catch (e) { setCheckResult({ ok: false, issues: ['❌ Ошибка: ' + (e?.response?.data?.error || 'нет связи')] }) }
            setChecking(false)
          }} disabled={checking}>
          {checking ? '⏳ ПРОВЕРЯЮ...' : '🔍 ПРОВЕРИТЬ ПАРТНЁРА'}
        </button>
        {checkResult && (
          <div style={{background:checkResult.ok?'rgba(0,230,118,0.08)':'rgba(255,77,106,0.08)',border:`1px solid ${checkResult.ok?'rgba(0,230,118,0.2)':'rgba(255,77,106,0.2)'}`,borderRadius:10,padding:'10px 12px'}}>
            {checkResult.issues.map((iss,i) => (
              <div key={i} style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'#e8f2ff',marginBottom:3}}>{iss}</div>
            ))}
          </div>
        )}
      </div>

      {/* УДАЛИТЬ */}
      <button style={S.btn({width:'100%',background:'rgba(255,77,106,0.1)',color:'#ff4d6a',border:'1px solid rgba(255,77,106,0.2)'})} onClick={deletePartner}>
        🗑 УДАЛИТЬ ПАРТНЁРА
      </button>
    </div>
  )

  // СПИСОК
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:4}}>{toast}</div>}
      {!items.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет заявок</div>}
      {items.map(p => (
        <div key={p.id} style={S.card} onClick={() => openPartner(p)}>
          <div style={S.row}>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00d4ff'}}>#{p.id}</span>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff',flex:1}}>{p.username ? '@'+p.username : p.first_name}</span>
            <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,padding:'3px 8px',borderRadius:6,
              background:p.status==='approved'?'rgba(0,230,118,0.15)':p.status==='rejected'?'rgba(255,77,106,0.15)':'rgba(255,179,0,0.15)',
              color:p.status==='approved'?'#00e676':p.status==='rejected'?'#ff4d6a':'#ffb300'
            }}>{p.status==='approved'?'ОДОБРЕН':p.status==='rejected'?'ОТКЛ':'ОЖИДАЕТ'}</span>
            <span style={{color:'rgba(232,242,255,0.3)',fontSize:14}}>›</span>
          </div>
          <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)'}}>{p.channel_url}</div>
          {p.status === 'pending' && (
            <div style={{display:'flex',gap:6,marginTop:8}} onClick={e=>e.stopPropagation()}>
              <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={()=>approve(p.id)}>✅ ОДОБРИТЬ</button>
              <button style={S.btn({flex:1,background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>reject(p.id)}>❌ ОТКЛОНИТЬ</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AdminChart({ data, metric }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#060f2a'
    ctx.fillRect(0, 0, W, H)

    const values = data.map(d => parseFloat(d[metric]) || 0)
    const maxV = Math.max(...values, 1)
    const pad = { l: 36, r: 12, t: 16, b: 28 }
    const chartW = W - pad.l - pad.r
    const chartH = H - pad.t - pad.b

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * i / 4
      ctx.strokeStyle = 'rgba(26,95,255,0.1)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke()
      ctx.fillStyle = 'rgba(232,242,255,0.3)'
      ctx.font = '8px Orbitron,sans-serif'
      ctx.textAlign = 'right'
      const lbl = maxV * (1 - i/4)
      ctx.fillText(lbl >= 1 ? Math.round(lbl) : lbl.toFixed(2), pad.l - 4, y + 3)
    }

    // Bars
    const bw = chartW / data.length * 0.6
    const gap = chartW / data.length

    data.forEach((d, i) => {
      const v = parseFloat(d[metric]) || 0
      const x = pad.l + i * gap + gap * 0.2
      const bh = (v / maxV) * chartH
      const y = pad.t + chartH - bh

      const grad = ctx.createLinearGradient(0, y, 0, pad.t + chartH)
      grad.addColorStop(0, '#1a5fff')
      grad.addColorStop(1, 'rgba(26,95,255,0.2)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, bw, bh, 3)
      ctx.fill()

      // Date label
      const date = new Date(d.date)
      ctx.fillStyle = 'rgba(232,242,255,0.4)'
      ctx.font = '7px DM Sans,sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${date.getDate()}.${date.getMonth()+1}`, x + bw/2, H - 6)

      // Value on top
      if (v > 0) {
        ctx.fillStyle = '#00d4ff'
        ctx.font = '8px Orbitron,sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(v >= 1 ? Math.round(v) : v.toFixed(2), x + bw/2, y - 4)
      }
    })
  }, [data, metric])

  return <canvas ref={canvasRef} width={340} height={180} style={{width:'100%',height:'auto',borderRadius:12,display:'block'}} />
}

export default function Admin() {
  const [tab, setTab] = useState('stats')
  const [settingsTab, setSettingsTab] = useState('staking')
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState({})
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState('')
  const [toastErr, setToastErr] = useState(false)
  const [saving, setSaving] = useState(null)
  const [loadingChannel, setLoadingChannel] = useState(false)
  const [botCheck, setBotCheck] = useState(null) // null | {ok, status}
  const [form, setForm] = useState({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at') // created_at | balance_ton | referral_count
  const [sortDir, setSortDir] = useState('desc')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [usersTab, setUsersTab] = useState('all')
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPages, setUsersPages] = useState(1)
  const [usersLoading, setUsersLoading] = useState(false)
  const [taskTemplates, setTaskTemplates] = useState([])
  const [showTaskTemplates, setShowTaskTemplates] = useState(false)
  const [tickets, setTickets] = useState([])
  const [news, setNews] = useState([])
  const [newsTitle, setNewsTitle] = useState('')
  const [newsBody, setNewsBody] = useState('')
  const [activeTicket, setActiveTicket] = useState(null)
  const [replyMsg, setReplyMsg] = useState('') // all | donors
  const [chartData, setChartData] = useState([])
  const [replyText, setReplyText] = useState('')
  const [replyId, setReplyId] = useState(null)
  const [chartDays, setChartDays] = useState(7)
  const [chartMetric, setChartMetric] = useState('new_users')
  const chartRef = useRef(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [maintenance, setMaintenance] = useState(false)
  const [spinSectors, setSpinSectors] = useState([])
  const [editSector, setEditSector] = useState(null)
  const [uptime, setUptime] = useState('')
  const [dbBackup, setDbBackup] = useState(null)
  const linkTimer = useRef(null)

  const showToast = (msg, err=false) => {
    setToast(msg); setToastErr(err)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (tab === 'users') loadUsers(1, search, usersTab) }, [tab])
  useEffect(() => { if (tab === 'users') loadUsers(1, search, usersTab) }, [usersTab])

  const loadUsers = async (p=1, s='', f='all') => {
    setUsersLoading(true)
    try {
      const r = await api.get(`/api/admin/users?page=${p}&search=${encodeURIComponent(s)}&filter=${f}`)
      setUsers(r.data?.users || [])
      setUsersTotal(r.data?.total || 0)
      setUsersPages(r.data?.pages || 1)
      setUsersPage(p)
    } catch(e) { console.log('USERS ERR:', e?.response?.data, e?.message) }
    setUsersLoading(false)
  }

  const loadAll = async () => {
    try {
      const [s, se, t, u, w, maint] = await Promise.all([
        api.get('/api/admin/stats').catch(()=>({data:{}})),
        api.get('/api/admin/settings').catch(()=>({data:{}})),
        api.get('/api/admin/tasks').catch(()=>({data:[]})),
        api.get('/api/admin/users').catch(()=>({data:[]})),
        api.get('/api/admin/withdrawals').catch(()=>({data:[]})),
        api.get('/api/admin/maintenance').catch(()=>({data:{}})),
      ])
      setStats(s.data)
      setSettings(se.data)
      setTasks(t.data)
      setUsers(u.data?.users || u.data || [])
      setUsersTotal(u.data?.total || 0)
      setUsersPages(u.data?.pages || 1)
      setWithdrawals(w.data || [])
      try {
        const spinInfo = await api.get('/api/spin/info')
        setSpinSectors(spinInfo.data.sectors || [])
      } catch {}
      setMaintenance(maint.data?.maintenance === '1')
      const chart = await api.get('/api/admin/chart?days=7')
      setChartData(chart.data || [])
      const sup = await api.get('/api/support/all')
      setTickets(sup.data || [])
      const nws = await api.get('/api/news')
      setNews(nws.data || [])
      const tpl = await api.get('/api/admin/task-templates')
      setTaskTemplates(tpl.data || [])
    } catch {}
  }

  const saveSetting = async (key) => {
    setSaving(key)
    try {
      await api.post('/api/admin/settings', { key, value: settings[key] })
      showToast('СОХРАНЕНО ✓')
    } catch { showToast('ОШИБКА', true) }
    setSaving(null)
  }

  const handleLinkChange = async (link) => {
    if (!link) return
    let normalizedLink = link.trim()
    if (normalizedLink.startsWith('@')) {
      normalizedLink = 'https://t.me/' + normalizedLink.slice(1)
    } else if (!normalizedLink.includes('t.me/')) {
      normalizedLink = 'https://t.me/' + normalizedLink
    } else if (!normalizedLink.startsWith('http')) {
      normalizedLink = 'https://' + normalizedLink
    }
    link = normalizedLink
    setForm(p => ({...p, link}))
    setLoadingChannel(true)
    setBotCheck(null)
    try {
      const infoRes = await api.get(`/api/channels/info?link=${encodeURIComponent(link)}`)
      setForm(p => ({ ...p, title: infoRes.data.title || p.title, channel_title: infoRes.data.title || '', channel_photo: infoRes.data.photo || '', icon: p.type === 'bot' ? '🤖' : '✈️' }))
      if (form.type === 'subscribe') {
        const checkRes = await api.get(`/api/channels/check?link=${encodeURIComponent(link)}`)
        setBotCheck(checkRes.data)
      }
    } catch {}
    setLoadingChannel(false)
  }

  const addTask = async () => {
    if (!form.title.trim()) { showToast('ВВЕДИ НАЗВАНИЕ', true); return }
    try {
      await api.post('/api/admin/tasks', form)
      showToast('ЗАДАНИЕ ДОБАВЛЕНО ✓')
      setForm({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' })
      setBotCheck(null)
      const r = await api.get('/api/admin/tasks')
      setTasks(r.data)
    } catch { showToast('ОШИБКА', true) }
  }

  const deleteTask = async (id) => {
    try {
      await api.delete(`/api/admin/tasks/${id}`)
      setTasks(prev => prev.filter(t => t.id !== id))
      showToast('УДАЛЕНО')
    } catch { showToast('ОШИБКА', true) }
  }

  const blockUser = async (user) => {
    try {
      await api.post(`/api/admin/users/${user.id}/block`)
      setUsers(prev => prev.map(u => u.id === user.id ? {...u, is_blocked: true} : u))
      showToast('ЗАБЛОКИРОВАН')
    } catch { showToast('ОШИБКА', true) }
  }

  const unblockUser = async (user) => {
    try {
      await api.post(`/api/admin/users/${user.id}/unblock`)
      setUsers(prev => prev.map(u => u.id === user.id ? {...u, is_blocked: false} : u))
      showToast('РАЗБЛОКИРОВАН')
    } catch { showToast('ОШИБКА', true) }
  }

  useEffect(() => {
    const launchDate = settings?.launch_date || '2025-03-01'
    const START = new Date(launchDate)
    const update = () => {
      const diff = Date.now() - START.getTime()
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setUptime(`${days}д ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [settings?.launch_date])

  const toggleMaintenance = async () => {
    try {
      const newVal = !maintenance
      await api.post('/api/admin/maintenance', { value: newVal ? '1' : '0' })
      setMaintenance(newVal)
      showToast(newVal ? 'ТЕХ ОБСЛУЖИВАНИЕ ВКЛЮЧЕНО' : 'ПРОЕКТ АКТИВЕН')
    } catch { showToast('ОШИБКА', true) }
  }

  const restoreBackup = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.users) { showToast('НЕВЕРНЫЙ ФАЙЛ', true); return }
      if (!window.confirm(`Восстановить из бэкапа от ${data.date?.slice(0,10)}? Данные будут перезаписаны.`)) return
      const r = await api.post('/api/admin/restore', data)
      showToast(`ВОССТАНОВЛЕНО: ${r.data.restored.users} юзеров, ${r.data.restored.stakes} стейков`)
      await loadAll()
    } catch (e) { showToast(e?.response?.data?.error || 'ОШИБКА', true) }
  }

  const downloadBackup = async () => {
    try {
      const r = await api.get('/api/admin/backup')
      const url = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `tonera-backup-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('БЭКАП СКАЧАН')
    } catch { showToast('ОШИБКА БЭКАПА', true) }
  }

  const openUserStats = async (user) => {
    setSelectedUser(user)
    try {
      const r = await api.get(`/api/admin/users/${user.id}/stats`)
      setUserStats(r.data)
    } catch {}
  }

  const markWithdrawalDone = async (id) => {
    try {
      await api.post(`/api/admin/withdrawals/${id}/complete`)
      setWithdrawals(prev => prev.map(w => w.id === id ? {...w, status:'completed'} : w))
      showToast('ОТМЕЧЕНО КАК ВЫПЛАЧЕНО')
    } catch { showToast('ОШИБКА', true) }
  }

  const deleteUser = async (user) => {
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setConfirmDelete(null)
      showToast('УДАЛЁН')
    } catch (e) { showToast(e?.response?.data?.error || 'ОШИБКА', true) }
  }

  const currentGroup = SETTING_GROUPS.find(g => g.id === settingsTab)

  return (
    <>
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-title">УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ?</div>
            <div className="confirm-name">{confirmDelete.username || confirmDelete.first_name}</div>
            <div className="confirm-warn">Это действие нельзя отменить</div>
            <div className="confirm-btns">
              <button className="mbtn mb-c" type="button" onClick={() => { setConfirmDelete(null) }}>Отмена</button>
              <button className="mbtn mb-del" type="button" onClick={() => { const u = confirmDelete; setConfirmDelete(null); deleteUser(u) }}>УДАЛИТЬ</button>
            </div>
          </div>
        </div>
      )}
    <div className="admin-wrap">
      {toast && <div className={`admin-toast ${toastErr ? 'err' : ''}`}>{toast}</div>}

      <div className="admin-header">
        <div className="admin-title">⚙️ Админ панель</div>
        <div className="admin-only-note">🔒 Только для администратора</div>
      </div>

      <div className="admin-tabs">
        {[
          {id:'stats',icon:'📊',label:'СТАТ'},
          {id:'settings',icon:'⚙️',label:'НАСТР'},
          {id:'tasks',icon:'✅',label:'ЗАДАНИЯ'},
          {id:'users',icon:'👥',label:'ЮЗЕРЫ'},
          {id:'support',icon:'💬',label:'ТИКЕТЫ'},
          {id:'news',icon:'📢',label:'НОВОСТИ'},
          {id:'partnerships',icon:'🤝',label:'ПАРТНЁРЫ'},
          {id:'withdrawals',icon:'💸',label:`ЗАЯВКИ${withdrawals.filter(w=>w.status==='pending').length > 0 ? ' ('+withdrawals.filter(w=>w.status==='pending').length+')' : ''}`},
          {id:'promo',icon:'🎁',label:'ПРОМО'},
          {id:'ads',icon:'📣',label:'РЕКЛАМА'},
          {id:'adorders',icon:'📋',label:'ЗАЯВКИ РЕК'},
          {id:'miners',icon:'⛏',label:'МАЙНЕРЫ'},
          {id:'admins',icon:'👑',label:'АДМИНЫ'},
          {id:'system',icon:'🔧',label:'СИСТЕМА'},
        ].map(t => (
          <button key={t.id} className={`atab ${tab===t.id?'on':''}`} onClick={() => setTab(t.id)}>
            <span style={{fontSize:24,display:'block',lineHeight:1,marginBottom:4}}>{t.icon}</span>
            <span style={{fontSize:7,display:'block',letterSpacing:'.05em'}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && stats && (
        <div className="admin-section">
          <div className="stats-section-title">👥 ПОЛЬЗОВАТЕЛИ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-lbl">Всего</div><div className="astat-val">{stats.total_users}</div></div>
            <div className="astat-card"><div className="astat-lbl">Заблокировано</div><div className="astat-val">{stats.blocked_users}</div></div>
            <div className="astat-card"><div className="astat-lbl">Заданий выполнено</div><div className="astat-val">{stats.tasks_completed}</div></div>
          </div>

          <div className="stats-section-title">📈 СТЕЙКИНГ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-lbl">Активных стейков</div><div className="astat-val">{stats.active_stakes}</div></div>
            <div className="astat-card"><div className="astat-lbl">TON в стейке</div><div className="astat-val">{parseFloat(stats.total_staked).toFixed(2)}</div></div>
            <div className="astat-card fee"><div className="astat-lbl">Комиссия стейкинга</div><div className="astat-val">{parseFloat(stats.staking_fee_earned||0).toFixed(4)}</div></div>
          </div>

          <div className="stats-section-title">✅ ЗАДАНИЯ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-lbl">Активных заданий</div><div className="astat-val">{stats.active_tasks||0}</div></div>
            <div className="astat-card fee"><div className="astat-lbl">Комиссия заданий</div><div className="astat-val">{parseFloat(stats.task_fee_earned||0).toFixed(4)}</div></div>
          </div>

          {/* CHART */}
          <div className="stats-section-title">📊 ГРАФИК</div>
          <div className="chart-controls">
            {[7,14,30].map(d => (
              <button key={d} className={`chart-day-btn ${chartDays===d?'on':''}`} onClick={async()=>{
                setChartDays(d)
                const r = await api.get(`/api/admin/chart?days=${d}`)
                setChartData(r.data || [])
              }}>{d}д</button>
            ))}
            <select className="chart-metric-sel" value={chartMetric} onChange={e=>setChartMetric(e.target.value)}>
              <option value="new_users">Новые юзеры</option>
              <option value="active_users">Активные юзеры</option>
              <option value="deposits">Депозиты (TON)</option>
              <option value="withdrawals">Выводы (TON)</option>
              <option value="profit">Доход проекта</option>
              <option value="trading_bets">Ставки трейдинга</option>
              <option value="spins">Спины</option>
              <option value="ads_viewed">Просмотры рекламы</option>
            </select>
          </div>
          <AdminChart data={chartData} metric={chartMetric} />

          <div className="stats-section-title">📈 ТРЕЙДИНГ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-lbl">Всего ставок</div><div className="astat-val">{stats.trading_total||0}</div></div>
            <div className="astat-card green"><div className="astat-lbl">Выигрышей</div><div className="astat-val">{stats.trading_wins||0}</div></div>
            <div className="astat-card red"><div className="astat-lbl">Проигрышей</div><div className="astat-val">{stats.trading_loses||0}</div></div>
            <div className="astat-card"><div className="astat-lbl">Возвратов</div><div className="astat-val">{stats.trading_refunds||0}</div></div>
            <div className="astat-card" style={{borderColor:'rgba(0,212,255,0.3)',background:'rgba(0,212,255,0.05)'}}><div className="astat-val" style={{color:'#00d4ff'}}>{parseFloat(stats.trading_bank||0).toFixed(4)}</div><div className="astat-lbl">Банк трейдинга</div></div>
            <div className="astat-card fee"><div className="astat-lbl">Чистая прибыль</div><div className="astat-val">{parseFloat(stats.trading_profit||0).toFixed(4)}</div></div>
          </div>

          <div className="stats-section-title">🎰 СЛОТЫ</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-lbl">Всего спинов</div><div className="astat-val">{stats.slots_total||0}</div></div>
            <div className="astat-card green"><div className="astat-lbl">Выигрышей</div><div className="astat-val">{stats.slots_wins||0}</div></div>
            <div className="astat-card" style={{borderColor:'rgba(0,212,255,0.3)',background:'rgba(0,212,255,0.05)'}}><div className="astat-val" style={{color:'#00d4ff'}}>{parseFloat(stats.slots_bank||0).toFixed(4)}</div><div className="astat-lbl">Банк слотов</div></div>
          </div>

          <div className="stats-section-title">🎰 СПИН</div>
          <div className="stats-cards">
            <div className="astat-card"><div className="astat-lbl">Всего спинов</div><div className="astat-val">{stats.total_spins||0}</div></div>
            <div className="astat-card fee"><div className="astat-lbl">Доход со спинов</div><div className="astat-val">{parseFloat(stats.spin_revenue||0).toFixed(4)}</div></div>
            <div className="astat-card green"><div className="astat-lbl">Чистая прибыль</div><div className="astat-val">{parseFloat(stats.spin_profit||0).toFixed(4)}</div></div>
            <div className="astat-card" style={{borderColor:'rgba(255,179,0,0.3)',background:'rgba(255,179,0,0.05)'}}><div className="astat-val" style={{color:'#ffb300'}}>{parseFloat(stats.current_jackpot||0).toFixed(4)}</div><div className="astat-lbl">Джекпот сейчас</div></div>
            <div className="astat-card green"><div className="astat-lbl">Пул выплат</div><div className="astat-val">{parseFloat(stats.spin_pool||0).toFixed(4)}</div></div>
          </div>

          <div className="stats-section-title">💰 ФИНАНСЫ ПРОЕКТА</div>
          <div className="stats-cards">
            <div className="astat-card green"><div className="astat-lbl">Пополнено</div><div className="astat-val">+{parseFloat(stats.total_deposited||0).toFixed(2)}</div></div>
            <div className="astat-card red"><div className="astat-lbl">Выведено</div><div className="astat-val">-{parseFloat(stats.total_withdrawn||0).toFixed(2)}</div></div>
            <div className="astat-card fee"><div className="astat-lbl">Баланс проекта</div><div className="astat-val">{(parseFloat(stats.total_deposited||0) - parseFloat(stats.total_withdrawn||0)).toFixed(2)}</div></div>
          </div>

          <button className="reload-btn" onClick={loadAll}>↻ Обновить</button>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div className="admin-section">
          <div className="settings-tabs">
            {SETTING_GROUPS.map(g => (
              <button key={g.id} className={`stab ${settingsTab===g.id?'on':''}`} onClick={() => setSettingsTab(g.id)}>
                {g.title}
              </button>
            ))}
          </div>

          {currentGroup && (
            <div className="settings-group-card">
              <div className="sg-title">{currentGroup.title}</div>
              {currentGroup.settings.map(s => (
                <div key={s.key} className="setting-item">
                  <div className="setting-label">{s.label}</div>
                  <div className="setting-row">
                    {s.key === 'project_wallet' ? (
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                        <div style={{padding:'10px 14px',background:'#0b1630',border:'1px solid rgba(26,95,255,0.4)',borderRadius:10,fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00d4ff',wordBreak:'break-all',lineHeight:1.6,minHeight:40}}>
                          {settings[s.key] || 'Не задан'}
                        </div>
                        <button style={{padding:'9px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.4)',borderRadius:10,fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',cursor:'pointer'}}
                          onClick={() => {
                            const val = prompt('Введите адрес TON кошелька:', settings['project_wallet'] || '')
                            if (val !== null) setSettings(p => ({...p, project_wallet: val.trim()}))
                          }}>
                          ✏️ ИЗМЕНИТЬ АДРЕС
                        </button>
                      </div>
                    ) : (
                      <input
                        className="setting-input"
                        type="number"
                        step="0.0001"
                        value={settings[s.key] ?? ''}
                        onChange={e => setSettings(p => ({...p, [s.key]: e.target.value}))}
                      />
                    )}
                    <button
                      className="save-btn"
                      onClick={() => saveSetting(s.key)}
                    >
                      {saving === s.key ? '...' : 'СОХР'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TASKS */}
      {tab === 'tasks' && (
        <div className="admin-section">
          <div className="add-task-form">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div className="atf-title" style={{marginBottom:0}}>ДОБАВИТЬ ЗАДАНИЕ</div>
              <button style={{padding:'5px 10px',border:'1px solid rgba(0,212,255,0.3)',borderRadius:8,background:'rgba(0,212,255,0.08)',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer'}}
                onClick={async()=>{
                  setShowTaskTemplates(t=>!t)
                  if (!showTaskTemplates) {
                    const r = await api.get('/api/admin/task-templates')
                    setTaskTemplates(r.data||[])
                  }
                }}>
                📋 ШАБЛОНЫ
              </button>
            </div>
            {showTaskTemplates && (
              <div style={{marginBottom:12,background:'#060f2a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:10}}>
                {taskTemplates.length === 0 ? (
                  <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.3)',textAlign:'center',padding:'8px 0'}}>Нет шаблонов</div>
                ) : taskTemplates.map(t => (
                  <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid rgba(26,95,255,0.08)'}}>
                    {t.channel_photo ? <img src={t.channel_photo} style={{width:28,height:28,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/> : <span style={{fontSize:16}}>{t.icon}</span>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                      <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>{t.type==='bot'?'БОТ':'ПОДПИСКА'} · {t.reward} TON</div>
                    </div>
                    <button onClick={()=>{
                      setForm({title:t.title,link:t.link||'',type:t.type||'subscribe',icon:t.icon||'✈️',channel_title:t.channel_title||'',channel_photo:t.channel_photo||''})
                      setShowTaskTemplates(false)
                    }} style={{padding:'4px 8px',border:'none',borderRadius:6,background:'rgba(26,95,255,0.2)',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer'}}>
                      ПРИМЕНИТЬ
                    </button>
                    {t.link && (
                      <button onClick={()=>window.Telegram?.WebApp?.openLink(t.link)||window.open(t.link,'_blank')}
                        style={{padding:'4px 6px',border:'none',borderRadius:6,background:'rgba(0,212,255,0.08)',color:'#00d4ff',cursor:'pointer',fontSize:12}}>🔗</button>
                    )}
                    <button onClick={async()=>{
                      await api.delete(`/api/admin/task-templates/${t.id}`)
                      const r = await api.get('/api/admin/task-templates')
                      setTaskTemplates(r.data||[])
                    }} style={{padding:'4px 6px',border:'none',borderRadius:6,background:'rgba(255,77,106,0.1)',color:'#ff4d6a',cursor:'pointer',fontSize:10}}>✕</button>
                  </div>
                ))}
                {/* Сохранить текущую форму как шаблон */}
                {form.title && (
                  <button onClick={async()=>{
                    await api.post('/api/admin/task-templates', form)
                    const r = await api.get('/api/admin/task-templates')
                    setTaskTemplates(r.data||[])
                    showToast('✅ Шаблон сохранён')
                  }} style={{width:'100%',marginTop:8,padding:'7px',border:'1px dashed rgba(26,95,255,0.3)',borderRadius:8,background:'transparent',color:'rgba(232,242,255,0.4)',fontFamily:'Orbitron,sans-serif',fontSize:8,cursor:'pointer'}}>
                    💾 СОХРАНИТЬ ТЕКУЩУЮ ФОРМУ КАК ШАБЛОН
                  </button>
                )}
              </div>
            )}
            <div className="atf-row">
              <label className="atf-label">ТИП</label>
              <div className="type-btns">
                <button className={`type-btn ${form.type==='subscribe'?'on':''}`} onClick={() => { setForm({ title:'', link:'', type:'subscribe', icon:'✈️', channel_title:'', channel_photo:'' }); setBotCheck(null) }}>✈️ Подписка</button>
                <button className={`type-btn ${form.type==='bot'?'on':''}`} onClick={() => { setForm({ title:'', link:'', type:'bot', icon:'🤖', channel_title:'', channel_photo:'' }); setBotCheck(null) }}>🤖 Бот</button>
              </div>
            </div>
            <div className="atf-row">
              <label className="atf-label">ССЫЛКА</label>
              <div className="atf-link-wrap">
                <input className="atf-input" placeholder="https://t.me/username" value={form.link} onChange={e => setForm(p=>({...p,link:e.target.value}))}/>
                <button className="atf-check-btn" onClick={() => handleLinkChange(form.link)} disabled={loadingChannel || !form.link}>
                  {loadingChannel ? '...' : '→'}
                </button>
              </div>
            </div>
            {form.channel_photo && (
              <div className="channel-preview">
                <img src={form.channel_photo} className="ch-photo" onError={e=>e.target.style.display='none'}/>
                <div className="ch-info"><div className="ch-title">{form.channel_title}</div><div className="ch-link">{form.link}</div></div>
              </div>
            )}
            {botCheck !== null && form.type === 'subscribe' && (
              <div className={`bot-check ${botCheck.ok ? 'ok' : 'fail'}`}>
                {botCheck.ok ? (
                  <span>✅ Бот является администратором канала</span>
                ) : (
                  <div>
                    <div>❌ Бот не является администратором</div>
                    <div className="bot-check-hint">
                      Добавь @tonera_bot в канал как администратора:<br/>
                      1. Открой настройки канала<br/>
                      2. Администраторы → Добавить администратора<br/>
                      3. Найди @tonera_bot и добавь
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="atf-row">
              <label className="atf-label">НАЗВАНИЕ</label>
              <input className="atf-input" placeholder="Название задания" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}/>
            </div>
            <div className="atf-reward-info">Награда: <span>{settings.task_reward || '0.001'} TON</span></div>
            <button className="atf-add-btn" onClick={addTask}>+ ДОБАВИТЬ</button>
          </div>

          <div className="tasks-list">
            {tasks.length === 0 && <div className="no-tasks">Нет заданий</div>}
            {tasks.map(task => (
              <AdminTaskItem key={task.id} task={task} onDelete={deleteTask} onRefresh={async()=>{
                const r = await api.get('/api/admin/tasks'); setTasks(r.data)
              }}/>
            ))}
          </div>
        </div>
      )}

      {/* WITHDRAWALS */}
      {tab === 'withdrawals' && (
        <div className="admin-section">
          <div className="users-count">{withdrawals.filter(w=>w.status==='pending').length} ожидают обработки</div>
          {withdrawals.length === 0 && <div className="no-tasks">Нет заявок</div>}
          {withdrawals.map(w => {
            // Парсим адрес и net сумму из label
            const labelParts = (w.label || '').split('|net:')
            const addr = labelParts[0]?.replace('Вывод на ', '') || '—'
            const netAmount = labelParts[1] ? parseFloat(labelParts[1]).toFixed(4) : Math.abs(parseFloat(w.amount)).toFixed(4)
            const amount = netAmount
            return (
              <div key={w.id} className={`withdrawal-item ${w.status}`}>
                <div className="wi-info">
                  <div className="wi-user">{w.username || w.first_name || 'Пользователь'}</div>
                  <div className="wi-date">{new Date(w.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  <div className="wi-copy-row">
                    <div className="wi-addr-short">{addr.length > 20 ? addr.slice(0,10)+'...'+addr.slice(-6) : addr}</div>
                    <button className="wi-copy-btn" onClick={() => { navigator.clipboard.writeText(addr); showToast('АДРЕС СКОПИРОВАН') }}>📋 Адрес</button>
                    <button className="wi-copy-btn wi-copy-amt" onClick={() => { navigator.clipboard.writeText(amount); showToast('СУММА СКОПИРОВАНА') }}>📋 {amount}</button>
                  </div>
                </div>
                <div className="wi-right">
                  <div className={`wi-status ${w.status}`}>{w.status==='pending'?'ОЖИДАЕТ':w.status==='cancelled'?'ОТМЕНЁН':'ВЫПЛАЧЕНО'}</div>
                  {w.status === 'pending' && (
                    <div style={{display:'flex',gap:4,marginTop:6}}>
                    <button style={{padding:'6px 10px',border:'none',borderRadius:7,background:'rgba(0,230,118,0.2)',color:'#00e676',fontFamily:'Orbitron,sans-serif',fontSize:8,cursor:'pointer',fontWeight:700}} onClick={() => markWithdrawalDone(w.id)}>✅ ВЫПЛАЧЕНО</button>
                    <button style={{padding:'6px 10px',border:'none',borderRadius:7,background:'rgba(255,77,106,0.15)',color:'#ff4d6a',fontFamily:'Orbitron,sans-serif',fontSize:8,cursor:'pointer',fontWeight:700}} onClick={() => {
                      const max = Math.abs(parseFloat(w.amount)).toFixed(4)
                      const amt = prompt(`Сумма возврата юзеру (макс. ${max} TON):`, max)
                      if (!amt) return
                      api.post(`/api/admin/withdrawals/${w.id}/cancel`, { refund_amount: parseFloat(amt) })
                        .then(r => { setWithdrawals(prev => prev.map(x => x.id===w.id ? {...x, status:'cancelled'} : x)); showToast(`↩️ Возвращено ${amt} TON`) })
                        .catch(e => showToast(e?.response?.data?.error || 'Ошибка', true))
                    }}>↩️ ОТМЕНИТЬ</button>
                    </div>
                  )}
                  {w.status === 'cancelled' && (
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#ff4d6a'}}>↩️ ОТМЕНЁН</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* SPIN SETTINGS */}
      {tab === 'settings' && settingsTab === 'spin_custom' && (
        <div className="admin-section">
          <div className="stats-section-title">🎰 НАСТРОЙКИ СПИНА</div>
          <div className="setting-item">
            <div className="setting-label">Цена спина (TON)</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="0.01" value={settings['spin_price']||''} onChange={e=>setSettings(p=>({...p,spin_price:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_price')}>{saving==='spin_price'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">Включён (1/0)</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1" value={settings['spin_enabled']||''} onChange={e=>setSettings(p=>({...p,spin_enabled:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_enabled')}>{saving==='spin_enabled'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">% от спина в джекпот</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1" value={settings['spin_jackpot_fee']||''} onChange={e=>setSettings(p=>({...p,spin_jackpot_fee:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_jackpot_fee')}>{saving==='spin_jackpot_fee'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-label">% чистой прибыли проекту</div>
            <div className="setting-row">
              <input className="setting-input" type="number" step="1" value={settings['spin_profit_fee']||''} onChange={e=>setSettings(p=>({...p,spin_profit_fee:e.target.value}))}/>
              <button className="save-btn" onClick={()=>saveSetting('spin_profit_fee')}>{saving==='spin_profit_fee'?'...':'СОХР'}</button>
            </div>
          </div>
          <div className="stats-section-title" style={{marginTop:16}}>СЕКТОРЫ</div>
          {spinSectors.map((s,i) => (
            <div key={i} className="sector-item">
              <div className="si-info">
                <div className="si-label">{s.label}</div>
                <div className="si-meta">Шанс: {s.chance}% · Приз: {s.type==='jackpot'?'ДЖЕКПОТ':`${s.value} TON`}</div>
              </div>
              <button className="si-edit" onClick={()=>setEditSector({...s,index:i})}>✏️</button>
            </div>
          ))}
        </div>
      )}

      {/* SECTOR EDIT MODAL */}
      {editSector && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setEditSector(null)}>
          <div className="modal-inner">
            <div className="modal-title">РЕДАКТОР СЕКТОРА</div>
            <div className="cf-row"><div className="cf-label">НАЗВАНИЕ</div>
              <input className="cf-input" value={editSector.label} onChange={e=>setEditSector(p=>({...p,label:e.target.value}))}/>
            </div>
            <div className="cf-row"><div className="cf-label">ТИП (ton/nothing/jackpot)</div>
              <input className="cf-input" value={editSector.type} onChange={e=>setEditSector(p=>({...p,type:e.target.value}))}/>
            </div>
            <div className="cf-row"><div className="cf-label">ПРИЗ (TON)</div>
              <input className="cf-input" type="number" step="0.01" value={editSector.value} onChange={e=>setEditSector(p=>({...p,value:parseFloat(e.target.value)||0}))}/>
            </div>
            <div className="cf-row"><div className="cf-label">ШАНС (%)</div>
              <input className="cf-input" type="number" step="1" value={editSector.chance} onChange={e=>setEditSector(p=>({...p,chance:parseFloat(e.target.value)||0}))}/>
            </div>
            <div className="mbtns" style={{marginTop:14}}>
              <button className="mbtn mb-c" onClick={()=>setEditSector(null)}>Отмена</button>
              <button className="mbtn mb-ok" onClick={async()=>{
                const updated = [...spinSectors]
                updated[editSector.index] = {label:editSector.label,type:editSector.type,value:editSector.value,chance:editSector.chance}
                await api.post('/api/admin/settings',{key:'spin_sectors',value:JSON.stringify(updated)})
                setSpinSectors(updated)
                setEditSector(null)
                showToast('СЕКТОР СОХРАНЁН')
              }}>СОХРАНИТЬ</button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT */}
      {tab === 'partnerships' && (
        <div className="admin-section">
          <div className="stats-section-title">🤝 ЗАЯВКИ НА ПАРТНЁРСТВО</div>
          <PartnershipAdmin />
        </div>
      )}

      {tab === 'promo' && (
        <div className="admin-section">
          <div className="stats-section-title">🎁 ПРОМОКОДЫ</div>
          <PromoAdmin />
        </div>
      )}

      {tab === 'news' && (
        <div className="admin-section">
          <div className="stats-section-title">📢 НОВОСТИ ПРОЕКТА</div>
          <div className="news-admin-form">
            <input className="news-admin-input" placeholder="Заголовок" value={newsTitle} onChange={e=>setNewsTitle(e.target.value)}/>
            <textarea className="news-admin-textarea" placeholder="Текст новости..." value={newsBody} onChange={e=>setNewsBody(e.target.value)} rows={3}/>
            <button className="news-admin-btn" onClick={async()=>{
              if(!newsTitle.trim()||!newsBody.trim()) return
              await api.post('/api/news',{title:newsTitle,body:newsBody})
              setNewsTitle(''); setNewsBody('')
              const r = await api.get('/api/news'); setNews(r.data||[])
              showToast('НОВОСТЬ ОПУБЛИКОВАНА')
            }}>📢 ОПУБЛИКОВАТЬ</button>
          </div>
          {news.length === 0 && <div style={{textAlign:'center',color:'rgba(232,242,255,0.3)',padding:20,fontFamily:'DM Sans'}}>Нет новостей</div>}
          {news.map(n => (
            <div key={n.id} className="news-admin-item">
              <div className="news-admin-header">
                <div className="news-admin-title">{n.title}</div>
                <button className="news-del-btn" onClick={async()=>{
                  await api.delete(`/api/news/${n.id}`)
                  const r = await api.get('/api/news'); setNews(r.data||[])
                }}>✕</button>
              </div>
              <div className="news-admin-body">{n.body}</div>
              <div className="news-item-date">{new Date(n.created_at).toLocaleDateString('ru',{day:'numeric',month:'long'})}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'support' && !activeTicket && (
        <div className="admin-section">
          <div className="stats-section-title">💬 ОБРАЩЕНИЯ</div>
          {tickets.length === 0 && <div style={{textAlign:'center',color:'rgba(232,242,255,0.3)',padding:20,fontFamily:'DM Sans'}}>Нет обращений</div>}
          {tickets.map(t => (
            <div key={t.id} className="sup-ticket" style={{cursor:'pointer'}} onClick={() => setActiveTicket(t)}>
              <div className="sup-t-header">
                <span className="sup-t-id">#{t.id} · {t.username ? '@'+t.username : t.first_name}</span>
                <span className="sup-t-status" style={{color: t.status==='answered'?'#26a69a':t.status==='closed'?'#888':'#ffb300'}}>
                  {t.status==='answered'?'Отвечено':t.status==='closed'?'Закрыто':'Открыт'}
                </span>
              </div>
              <div className="sup-t-msg">{t.message}</div>
              <div className="sup-t-date">{new Date(t.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'support' && activeTicket && (
        <div className="admin-section">
          <button className="sup-back" onClick={() => setActiveTicket(null)} style={{marginBottom:12}}>← Назад</button>
          <div className="stats-section-title">Тикет #{activeTicket.id} · {activeTicket.username ? '@'+activeTicket.username : activeTicket.first_name}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            <div className="sup-msg user"><div className="sup-msg-text">{activeTicket.message}</div></div>
            {(activeTicket.replies||[]).map((r,i) => (
              <div key={i} className={`sup-msg ${r.from_admin?'admin':'user'}`}>
                {r.from_admin && <div className="sup-admin-label">Поддержка</div>}
                <div className="sup-msg-text">{r.message}</div>
              </div>
            ))}
          </div>
          {activeTicket.status !== 'closed' && (
            <>
              <textarea className="sup-textarea" placeholder="Ответ..." value={replyMsg} onChange={e=>setReplyMsg(e.target.value)} rows={3}/>
              <div className="mbtns" style={{marginTop:10}}>
                <button className="mbtn mb-c" onClick={async()=>{
                  await api.post('/api/support/admin/close',{ticket_id:activeTicket.id})
                  setActiveTicket(null)
                  const r = await api.get('/api/support/admin/all')
                  setTickets(r.data||[])
                }}>Закрыть</button>
                <button className="mbtn mb-ok" disabled={!replyMsg.trim()} onClick={async()=>{
                  await api.post('/api/support/admin/reply',{ticket_id:activeTicket.id,message:replyMsg})
                  setReplyMsg('')
                  const r = await api.get('/api/support/admin/all')
                  setTickets(r.data||[])
                  setActiveTicket(r.data?.find(t=>t.id===activeTicket.id)||null)
                }}>Отправить</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SYSTEM */}
      {tab === 'adorders' && (
        <div className="admin-section">
          <AdOrdersAdmin />
        </div>
      )}

      {tab === 'ads' && (
        <div className="admin-section">
          <AdsAdmin />
        </div>
      )}

      {tab === 'miners' && (
        <div className="admin-section">
          <MinersAdmin />
        </div>
      )}

      {tab === 'admins' && (
        <div className="admin-section">
          <AdminsPanel />
        </div>
      )}

      {tab === 'system' && (
        <div className="admin-section">
          <div className="system-card">
            <div className="sys-title">⏱ ПРОЕКТ РАБОТАЕТ</div>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:22,fontWeight:700,color:'#00d4ff',textAlign:'center',padding:'10px 0',letterSpacing:'.05em'}}>{uptime}</div>
            <div style={{textAlign:'center',marginTop:4}}>
              <button className="sys-btn" style={{width:'auto',padding:'8px 16px',fontSize:9}} onClick={() => {
                const val = prompt('Дата запуска (ГГГГ-ММ-ДД):', settings?.launch_date || '2025-03-01')
                if (val) { api.post('/api/admin/settings', { key: 'launch_date', value: val }).then(() => setSettings(p => ({...p, launch_date: val}))).catch(() => {}) }
              }}>✏️ ИЗМЕНИТЬ ДАТУ</button>
            </div>
          </div>
          <div className="system-card">
            <div className="sys-title">🔧 ТЕХ ОБСЛУЖИВАНИЕ</div>
            <div className="sys-desc">При включении юзеры не смогут зайти в приложение</div>
            <button className={`sys-toggle ${maintenance ? 'on' : ''}`} onClick={toggleMaintenance}>
              {maintenance ? '🔴 ВЫКЛЮЧИТЬ (сейчас активно)' : '🟢 ВКЛЮЧИТЬ'}
            </button>
          </div>
          <div className="system-card">
            <div className="sys-title">💾 РЕЗЕРВНАЯ КОПИЯ БД</div>
            <div className="sys-desc">Скачать все данные проекта в формате JSON для переноса на другой сервер</div>
            <button className="sys-btn" onClick={downloadBackup} style={{marginBottom:8}}>⬇ СКАЧАТЬ БЭКАП</button>
            <label className="sys-btn" style={{display:'block',textAlign:'center',cursor:'pointer'}}>
              ⬆ ВОССТАНОВИТЬ ИЗ ФАЙЛА
              <input type="file" accept=".json" style={{display:'none'}} onChange={e => { if(e.target.files[0]) restoreBackup(e.target.files[0]) }}/>
            </label>
          </div>
          <div className="system-card">
            <div className="sys-title">📤 ВОССТАНОВИТЬ ИЗ БЭКАПА</div>
            <div className="sys-desc">Загрузи JSON файл бэкапа для восстановления данных</div>
            <input type="file" accept=".json" id="restore-file" style={{display:'none'}} onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              try {
                const text = await file.text()
                const data = JSON.parse(text)
                if (!window.confirm(`Восстановить из бэкапа от ${data.date?.slice(0,10)}?
Юзеров: ${data.users?.length}, Стейков: ${data.stakes?.length}`)) return
                const r = await api.post('/api/admin/restore', data)
                showToast(`ВОССТАНОВЛЕНО: ${r.data.restored.users} юзеров, ${r.data.restored.stakes} стейков`)
              } catch (err) {
                showToast('ОШИБКА: ' + (err?.response?.data?.error || err.message), true)
              }
              e.target.value = ''
            }}/>
            <button className="sys-btn" style={{borderColor:'rgba(0,230,118,0.4)',color:'#00e676'}} onClick={() => document.getElementById('restore-file').click()}>
              ⬆ ЗАГРУЗИТЬ БЭКАП
            </button>
          </div>
          <div className="system-card">
            <div className="sys-title">♻️ ВОССТАНОВЛЕНИЕ ИЗ БЭКАПА</div>
            <div className="sys-desc">Загрузи JSON файл бэкапа для восстановления данных. Существующие данные будут перезаписаны.</div>
            <label className="sys-btn" style={{display:'block',textAlign:'center',cursor:'pointer'}}>
              ⬆ ЗАГРУЗИТЬ БЭКАП
              <input type="file" accept=".json" style={{display:'none'}} onChange={e => e.target.files[0] && restoreBackup(e.target.files[0])}/>
            </label>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && !selectedUser && (
        <div className="admin-section">
          <div className="users-search-row">
            <div style={{display:'flex',gap:6,marginBottom:8}}>
              <input className="users-search" style={{flex:1}} placeholder="🔍 Поиск по имени или ID..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadUsers(1,search,usersTab)}/>
              <button onClick={()=>loadUsers(1,search,usersTab)} style={{padding:'6px 12px',border:'none',borderRadius:8,background:'rgba(26,95,255,0.3)',color:'#00d4ff',cursor:'pointer',fontFamily:'Orbitron,sans-serif',fontSize:9}}>НАЙТИ</button>
            </div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.3)',marginBottom:6}}>Показано {users.length} из {usersTotal}</div>
          </div>
          <div className="users-sort-row">
            <div className="users-tabs">
              <button className={`utab ${usersTab==='all'?'on':''}`} onClick={() => { setUsersTab('all') }}>ВСЕ</button>
              <button className={`utab ${usersTab==='donors'?'on':''}`} onClick={() => { setUsersTab('donors') }}>💎 ДОНАТОРЫ</button>
              <button className={`utab ${usersTab==='traders'?'on':''}`} onClick={() => setUsersTab('traders')}>📊 ТРЕЙДЕРЫ</button>
              <button className={`utab ${usersTab==='spinners'?'on':''}`} onClick={() => setUsersTab('spinners')}>🎰 СПИНЕРЫ</button>
              <button className={`utab ${usersTab==='sloters'?'on':''}`} onClick={() => setUsersTab('sloters')}>🎰 СЛОТЕРЫ</button>
              <button className={`utab ${usersTab==='stakers'?'on':''}`} onClick={() => { setUsersTab('stakers') }}>💰 СТЕЙКЕРЫ</button>
            </div>
            <div className="sort-btns">
              {[{k:'created_at',l:'ДАТА'},{k:'balance_ton',l:'БАЛАНС'},{k:'referral_count',l:'РЕФЫ'}].map(s => (
                <button key={s.k} className={`sort-btn ${sortBy===s.k?'on':''}`} onClick={() => { if(sortBy===s.k) setSortDir(d=>d==='desc'?'asc':'desc'); else { setSortBy(s.k); setSortDir('desc') } }}>
                  {s.l}{sortBy===s.k ? (sortDir==='desc'?' ↓':' ↑') : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="users-count">{usersLoading ? 'Загрузка...' : `${users.length} из ${usersTotal}`}</div>
          {!usersLoading && users.map(u => (
            <div key={u.id} className={`admin-user-item ${u.is_blocked ? 'blocked' : ''}`} onClick={() => openUserStats(u)} style={{cursor:'pointer'}}>
              <div className="aui-avatar">{(u.username||u.first_name||'?')[0].toUpperCase()}</div>
              <div className="aui-info">
                <div className="aui-name">
                  {u.username || u.first_name || 'Пользователь'}
                  {u.is_blocked && <span className="blocked-badge">БЛОК</span>}
                </div>
                <div className="aui-meta">ID: {u.telegram_id} · Рефов: {u.referral_count}</div>
                {usersTab === 'donors' && parseFloat(u.total_deposited||0) > 0 && (
                  <div className="aui-meta" style={{color:'#00d4ff',marginTop:2}}>💎 Депозит: {parseFloat(u.total_deposited).toFixed(4)} TON</div>
                )}
                {usersTab === 'traders' && parseInt(u.trading_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#26a69a',marginTop:2}}>📊 Ставок: {u.trading_count} · Объём: {parseFloat(u.trading_volume||0).toFixed(4)} TON</div>
                )}
                {usersTab === 'spinners' && parseInt(u.spin_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#ffb300',marginTop:2}}>🎰 Спинов: {u.spin_count} · Потрачено: {parseFloat(u.spin_volume||0).toFixed(4)} TON</div>
                )}
                {usersTab === 'stakers' && parseFloat(u.staking_amount||0) > 0 && (
                  <div className="uu-extra">
                    <span>💰 В стейке: <b>{parseFloat(u.staking_amount).toFixed(4)} TON</b></span>
                    <span>📊 Активных: <b>{u.staking_count}</b></span>
                  </div>
                )}
                {usersTab === 'sloters' && parseInt(u.slots_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#a855f7',marginTop:2}}>🎰 Слотов: {u.slots_count} · Потрачено: {parseFloat(u.slots_volume||0).toFixed(4)} TON</div>
                )}
                {usersTab === 'slotters' && parseInt(u.slots_count||0) > 0 && (
                  <div className="aui-meta" style={{color:'#a855f7',marginTop:2}}>🎲 Слотов: {u.slots_count} · Потрачено: {parseFloat(u.slots_volume||0).toFixed(4)} TON</div>
                )}
              </div>
              <div className="aui-balance">{parseFloat(u.balance_ton).toFixed(4)}</div>
              <div className="aui-actions" onClick={e => e.stopPropagation()}>
                {u.is_blocked
                  ? <button className="aui-btn unblock" onClick={() => unblockUser(u)}>✓</button>
                  : <button className="aui-btn block" onClick={() => blockUser(u)}>🚫</button>
                }
                <button className="aui-btn del" onClick={() => setConfirmDelete(u)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USER STATS */}
      {tab === 'users' && selectedUser && (
        <div className="admin-section">
          <button className="back-btn" onClick={() => { setSelectedUser(null); setUserStats(null) }}>← Назад</button>
          <div className="user-profile">
            <div className="up-avatar">{(selectedUser.username||selectedUser.first_name||'?')[0].toUpperCase()}</div>
            <div className="up-name">{selectedUser.username || selectedUser.first_name}</div>
            <div className="up-id">ID: {selectedUser.telegram_id}</div>
          </div>
          {userStats ? (
            <>
              <div className="stats-cards">
                <div className="astat-card"><div className="astat-lbl">Баланс TON</div><div className="astat-val">{parseFloat(selectedUser.balance_ton).toFixed(4)}</div></div>
                <div className="astat-card"><div className="astat-lbl">Депозитов</div><div className="astat-val">{userStats.stats.totalDeposit.toFixed(4)}</div></div>
                <div className="astat-card"><div className="astat-lbl">Выводов</div><div className="astat-val">{userStats.stats.totalWithdraw.toFixed(4)}</div></div>
                <div className="astat-card"><div className="astat-lbl">Заданий</div><div className="astat-val">{userStats.stats.tasksCount}</div></div>
                <div className="astat-card"><div className="astat-lbl">Рефералов</div><div className="astat-val">{selectedUser.referral_count}</div></div>
                <div className="astat-card"><div className="astat-lbl">В стейке</div><div className="astat-val">{userStats.stats.totalStaked.toFixed(4)}</div></div>
              </div>
              <div className="ut-section-title">ТРАНЗАКЦИИ</div>
              {userStats.txs.map(tx => (
                <div key={tx.id} className="ut-tx">
                  <div className="ut-tx-label">{tx.label?.split('|net:')[0]}</div>
                  <div className={`ut-tx-amt ${parseFloat(tx.amount)>0?'pos':'neg'}`}>{parseFloat(tx.amount)>0?'+':''}{parseFloat(tx.amount).toFixed(4)}</div>
                </div>
              ))}
            </>
          ) : <div className="spinner" style={{margin:'20px auto'}}/>}
        </div>
      )}
    </div>
    </>
  )
}
