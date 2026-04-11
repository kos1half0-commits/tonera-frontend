import { useState, useEffect, useRef } from 'react'
import api from '../../api/index'
import './Admin.css'
import PromoAdmin from './PromoAdmin'
import AdsAdmin from './AdsAdmin'

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
    title: '⛏ Майнинг (CT Pool)',
    settings: [
      { key: 'miner_enabled',                  label: 'Статус (0=откл, 1=вкл, 2=только админ)' },
      { key: 'miner_wallet',                   label: 'Кошелёк для оплаты майнера (отдельный)' },
      { key: 'miner_rate_per_gh',              label: 'Ставка TON за 1 GH/s в час' },
      { key: 'miner_min_withdraw',             label: 'Мин. вывод с майнера (TON)' },
      { key: 'miner_plan_free_enabled',        label: '🆓 Free: Вкл/Выкл (1/0)' },
      { key: 'miner_plan_free_hashrate',       label: '🆓 Free: Хешрейт (GH/s)' },
      { key: 'miner_plan_free_days',           label: '🆓 Free: Дней' },
      { key: 'miner_plan_starter_price',       label: '💚 Starter: Цена (TON)' },
      { key: 'miner_plan_starter_hashrate',    label: '💚 Starter: Хешрейт (GH/s)' },
      { key: 'miner_plan_starter_days',        label: '💚 Starter: Дней' },
      { key: 'miner_plan_advanced_price',      label: '💙 Advanced: Цена (TON)' },
      { key: 'miner_plan_advanced_hashrate',   label: '💙 Advanced: Хешрейт (GH/s)' },
      { key: 'miner_plan_advanced_days',       label: '💙 Advanced: Дней' },
      { key: 'miner_plan_pro_price',           label: '💜 Pro: Цена (TON)' },
      { key: 'miner_plan_pro_hashrate',        label: '💜 Pro: Хешрейт (GH/s)' },
      { key: 'miner_plan_pro_days',            label: '💜 Pro: Дней' },
      { key: 'miner_plan_elite_price',         label: '💛 Elite: Цена (TON)' },
      { key: 'miner_plan_elite_hashrate',      label: '💛 Elite: Хешрейт (GH/s)' },
      { key: 'miner_plan_elite_days',          label: '💛 Elite: Дней' },
    ]
  },
  {
    id: 'ads_config',
    title: '📣 Баннеры',
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
      { key: 'partnership_enabled',     label: 'Статус (0=откл, 1=вкл, 2=только админ, 3=тест)' },
      { key: 'partnership_min_subs',     label: 'Мин. подписчиков канала' },
      { key: 'partnership_task_execs',   label: 'Макс. выполнений (по умолч.)' },
      { key: 'partnership_check_hours',  label: 'Часы проверки через запятую (напр. 9,21)' },
      { key: 'partnership_lvl_bronze_execs',  label: '🥉 Bronze: макс. выполнений' },
      { key: 'partnership_lvl_silver_execs',  label: '🥈 Silver (5K+): макс. выполнений' },
      { key: 'partnership_lvl_gold_execs',    label: '🥇 Gold (20K+): макс. выполнений' },
      { key: 'partnership_lvl_diamond_execs', label: '💎 Diamond (50K+): макс. выполнений' },
      { key: 'partner_promo_expiry_hours',    label: '⏰ Промокод: срок действия (часов)' },
      { key: 'partner_promo_bronze_reward',   label: '🥉 Промо Bronze: награда TON' },
      { key: 'partner_promo_bronze_uses',     label: '🥉 Промо Bronze: макс. использований' },
      { key: 'partner_promo_silver_reward',   label: '🥈 Промо Silver: награда TON' },
      { key: 'partner_promo_silver_uses',     label: '🥈 Промо Silver: макс. использований' },
      { key: 'partner_promo_gold_reward',     label: '🥇 Промо Gold: награда TON' },
      { key: 'partner_promo_gold_uses',       label: '🥇 Промо Gold: макс. использований' },
      { key: 'partner_promo_diamond_reward',  label: '💎 Промо Diamond: награда TON' },
      { key: 'partner_promo_diamond_uses',    label: '💎 Промо Diamond: макс. использований' },
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
      { key: 'ref_deposit_percent', label: '% от депозита реферала' },
    ]
  },
  {
    id: 'auction',
    title: '🏛 Аукцион рефералов',
    settings: [
      { key: 'auction_enabled',      label: 'Статус (0=откл, 1=вкл)' },
      { key: 'auction_test_mode',    label: 'Тестовый режим (1=тест, 0=боевой)' },
      { key: 'auction_min_price',    label: 'Мин. начальная цена (TON)' },
      { key: 'auction_min_step',     label: 'Мин. шаг ставки (TON)' },
      { key: 'auction_commission',   label: 'Комиссия платформы (%)' },
      { key: 'auction_max_duration', label: 'Макс. длительность (часов)' },
      { key: 'auction_min_tasks',    label: 'Мин. заданий у реферала для продажи' },
      { key: 'auction_min_activity_days', label: 'Макс. дней неактивности реферала' },
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


function MinersAdmin() {
  const [contracts, setContracts] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [minerUsers, setMinerUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('users') // users | contracts | withdrawals
  const [toast, setMinerToast] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ hashrate: '', days: '', plan_id: 'admin', price_paid: '0', earned: '0' })
  const [addHashForm, setAddHashForm] = useState({ hashrate: '', days: '' })
  const [userSearch, setUserSearch] = useState('')
  const [freeStats, setFreeStats] = useState(null)
  const [freeEditing, setFreeEditing] = useState(false)
  const [freeForm, setFreeForm] = useState({ hashrate: '', days: '' })
  const [freeToggling, setFreeToggling] = useState(false)

  const showToast = m => { setMinerToast(m); setTimeout(()=>setMinerToast(''),3000) }

  const load = async () => {
    try {
      const [c, w, s, u, fs] = await Promise.all([
        api.get('/api/miner/all'),
        api.get('/api/miner/admin/withdrawals'),
        api.get('/api/miner/admin/stats'),
        api.get('/api/miner/admin/users'),
        api.get('/api/miner/admin/free-stats'),
      ])
      setContracts(c.data||[])
      setWithdrawals(w.data||[])
      setStats(s.data)
      setMinerUsers(u.data||[])
      setFreeStats(fs.data)
      setFreeForm({ hashrate: String(fs.data?.hashrate || 5), days: String(fs.data?.days || 30) })
    } catch {}
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const approve = async id => { await api.post(`/api/miner/admin/approve/${id}`); load(); showToast('✅ Вывод одобрен') }
  const reject = async id => { await api.post(`/api/miner/admin/reject/${id}`); load(); showToast('❌ Отклонено') }
  const deleteContract = async id => { if(!confirm('Удалить контракт?'))return; await api.delete(`/api/miner/contract/${id}`); load(); loadUser(selectedUser?.telegram_id); showToast('🗑 Удалено') }

  const loadUser = async (tgId) => {
    if (!tgId) return
    setProfileLoading(true)
    try {
      const r = await api.get(`/api/miner/admin/user/${tgId}`)
      setUserProfile(r.data)
      setSelectedUser(r.data.user)
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка', true); setSelectedUser(null) }
    setProfileLoading(false)
  }

  const openUser = (u) => {
    setSelectedUser(u)
    loadUser(u.telegram_id)
    setEditingContract(null)
    setShowCreate(false)
  }

  const searchUser = async () => {
    const q = userSearch.trim()
    if (!q) return
    setProfileLoading(true)
    try {
      const r = await api.get(`/api/miner/admin/user/${q}`)
      setUserProfile(r.data)
      setSelectedUser(r.data.user)
      setSubTab('users')
    } catch (e) {
      showToast('Юзер не найден или нет контрактов')
    }
    setProfileLoading(false)
  }

  const editContract = async (id) => {
    try {
      await api.put(`/api/miner/admin/contract/${id}`, editForm)
      showToast('✅ Контракт обновлён')
      setEditingContract(null)
      setEditForm({})
      loadUser(selectedUser?.telegram_id)
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
  }

  const createContract = async () => {
    try {
      await api.post('/api/miner/admin/create-contract', {
        telegram_id: selectedUser.telegram_id,
        ...createForm,
      })
      showToast('✅ Контракт создан')
      setShowCreate(false)
      setCreateForm({ hashrate: '', days: '', plan_id: 'admin', price_paid: '0', earned: '0' })
      loadUser(selectedUser.telegram_id)
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
  }

  const addHashrate = async () => {
    try {
      await api.post(`/api/miner/admin/add-hashrate/${selectedUser.telegram_id}`, addHashForm)
      showToast(`✅ +${addHashForm.hashrate} GH/s на ${addHashForm.days}д`)
      setAddHashForm({ hashrate: '', days: '' })
      loadUser(selectedUser.telegram_id)
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
  }

  const setEarned = async (contractId, val, isAdd) => {
    try {
      await api.post(`/api/miner/admin/set-earned/${contractId}`, isAdd ? { add: val } : { earned: val })
      showToast(`✅ Earned обновлён`)
      loadUser(selectedUser.telegram_id)
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
  }

  const S = {
    stat: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 12px',textAlign:'center'},
    btn: (c={})=>({padding:'6px 10px',border:'none',borderRadius:7,fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',...c}),
    tab: (active) => ({padding:'8px 14px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',background:active?'rgba(26,95,255,0.3)':'rgba(26,95,255,0.08)',color:active?'#00d4ff':'rgba(232,242,255,0.4)'}),
    input: (c={}) => ({background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'7px 10px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:11,outline:'none',width:'100%',boxSizing:'border-box',...c}),
    label: {fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)',marginBottom:3,display:'block'},
  }

  if (loading) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>

  const pendingWds = withdrawals.filter(w=>w.status==='pending').length

  // =================== USER PROFILE VIEW ===================
  if (selectedUser) {
    const p = userProfile
    return (
      <div>
        {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

        <button onClick={()=>{setSelectedUser(null);setUserProfile(null)}} style={{marginBottom:10,padding:'7px 14px',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,background:'transparent',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:9,cursor:'pointer'}}>← НАЗАД</button>

        {profileLoading && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>}

        {p && !profileLoading && (<>
          {/* USER INFO */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:10}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:700,color:'#e8f2ff',marginBottom:8}}>
              {p.user.username?'@'+p.user.username:p.user.first_name}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                ['Telegram ID', p.user.telegram_id],
                ['Хешрейт', `${parseFloat(p.totalHashrate).toFixed(0)} GH/s`],
                ['Заработано', `${parseFloat(p.totalEarned).toFixed(6)} TON`],
                ['Выведено', `${parseFloat(p.totalWithdrawn).toFixed(6)} TON`],
                ['Доступно', `${parseFloat(p.availableBalance).toFixed(6)} TON`],
                ['Контрактов', p.contracts.length],
              ].map(([k,v]) => (
                <div key={k} style={{background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 8px'}}>
                  <div style={{fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)'}}>{k}</div>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00d4ff'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK ADD HASHRATE */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(0,230,118,0.2)',borderRadius:12,padding:12,marginBottom:10}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)',letterSpacing:'.08em',marginBottom:8}}>🎁 БЫСТРОЕ ДОБАВЛЕНИЕ ХЕШРЕЙТА</div>
            <div style={{display:'flex',gap:6,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={S.label}>GH/s</div>
                <input style={S.input()} type="number" placeholder="100" value={addHashForm.hashrate} onChange={e=>setAddHashForm(f=>({...f,hashrate:e.target.value}))}/>
              </div>
              <div style={{flex:1}}>
                <div style={S.label}>Дней</div>
                <input style={S.input()} type="number" placeholder="30" value={addHashForm.days} onChange={e=>setAddHashForm(f=>({...f,days:e.target.value}))}/>
              </div>
              <button style={S.btn({background:'rgba(0,230,118,0.2)',color:'#00e676',alignSelf:'flex-end',padding:'9px 14px'})} onClick={addHashrate}>➕</button>
            </div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {[
                {h:100,d:7},{h:500,d:30},{h:1000,d:30},{h:1500,d:60},{h:5000,d:90}
              ].map(({h,d},i) => (
                <button key={i} style={S.btn({background:'rgba(0,230,118,0.08)',color:'#00e676',border:'1px solid rgba(0,230,118,0.2)'})}
                  onClick={()=>{setAddHashForm({hashrate:String(h),days:String(d)})}}>{h} GH/s · {d}д</button>
              ))}
            </div>
          </div>

          {/* CREATE CONTRACT */}
          {showCreate ? (
            <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:12,marginBottom:10}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)',letterSpacing:'.08em',marginBottom:8}}>📝 СОЗДАТЬ КОНТРАКТ</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
                <div><div style={S.label}>Хешрейт (GH/s)</div><input style={S.input()} type="number" value={createForm.hashrate} onChange={e=>setCreateForm(f=>({...f,hashrate:e.target.value}))}/></div>
                <div><div style={S.label}>Дней</div><input style={S.input()} type="number" value={createForm.days} onChange={e=>setCreateForm(f=>({...f,days:e.target.value}))}/></div>
                <div><div style={S.label}>План ID</div><input style={S.input()} value={createForm.plan_id} onChange={e=>setCreateForm(f=>({...f,plan_id:e.target.value}))}/></div>
                <div><div style={S.label}>Цена (TON)</div><input style={S.input()} type="number" value={createForm.price_paid} onChange={e=>setCreateForm(f=>({...f,price_paid:e.target.value}))}/></div>
                <div><div style={S.label}>Earned (TON)</div><input style={S.input()} type="number" value={createForm.earned} onChange={e=>setCreateForm(f=>({...f,earned:e.target.value}))}/></div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676',padding:'9px'})} onClick={createContract}>✅ СОЗДАТЬ</button>
                <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a',padding:'9px 14px'})} onClick={()=>setShowCreate(false)}>✕</button>
              </div>
            </div>
          ) : (
            <button style={{...S.btn({width:'100%',background:'rgba(26,95,255,0.08)',color:'#00d4ff',border:'1px solid rgba(26,95,255,0.2)',padding:'10px',marginBottom:10,borderRadius:10}),display:'block'}} onClick={()=>setShowCreate(true)}>
              ➕ СОЗДАТЬ КОНТРАКТ ВРУЧНУЮ
            </button>
          )}

          {/* CONTRACTS LIST */}
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8,marginTop:6}}>⛏ КОНТРАКТЫ ({p.contracts.length})</div>
          {!p.contracts.length && <div style={{textAlign:'center',padding:15,color:'rgba(232,242,255,0.2)',fontFamily:'DM Sans'}}>Нет контрактов</div>}
          {p.contracts.map(c => {
            const isActive = c.status==='active' && new Date(c.expires_at) > new Date()
            const daysLeft = Math.max(0, Math.ceil((new Date(c.expires_at) - new Date()) / 86400000))
            const isEditing = editingContract === c.id
            return (
              <div key={c.id} style={{background:'#0e1c3a',border:`1px solid ${isActive?'rgba(0,230,118,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,padding:'3px 8px',borderRadius:6,fontWeight:700,
                    background:isActive?'rgba(0,230,118,0.15)':'rgba(255,77,106,0.15)',
                    color:isActive?'#00e676':'#ff4d6a'
                  }}>{c.plan_id.toUpperCase()}</span>
                  <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)',flex:1}}>ID: {c.id}</span>
                  <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,color:isActive?'#00e676':'#ff4d6a',fontWeight:700}}>
                    {isActive?`${daysLeft}д`:c.status==='expired'?'ИСТЁК':'СТОП'}
                  </span>
                </div>

                {/* CONTRACT STATS */}
                <div style={{display:'flex',gap:10,marginBottom:8}}>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,color:'#00d4ff',fontWeight:700}}>{parseFloat(c.hashrate).toFixed(0)} GH/s</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)'}}>хешрейт</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,color:'#ffb300',fontWeight:700}}>{parseFloat(c.earned).toFixed(6)}</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)'}}>earned</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,color:'#a855f7',fontWeight:700}}>{(parseFloat(c.pendingEarned)||0).toFixed(6)}</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)'}}>pending</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,color:'#e8f2ff',fontWeight:700}}>{parseFloat(c.price_paid).toFixed(2)}</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)'}}>цена</div>
                  </div>
                </div>

                {/* EDIT FORM */}
                {isEditing ? (
                  <div style={{background:'rgba(26,95,255,0.04)',border:'1px solid rgba(26,95,255,0.15)',borderRadius:8,padding:10,marginBottom:6}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
                      <div><div style={S.label}>Хешрейт (GH/s)</div><input style={S.input()} type="number" placeholder={parseFloat(c.hashrate).toFixed(0)} onChange={e=>setEditForm(f=>({...f,hashrate:e.target.value||undefined}))}/></div>
                      <div><div style={S.label}>Earned (TON)</div><input style={S.input()} type="number" placeholder={parseFloat(c.earned).toFixed(6)} onChange={e=>setEditForm(f=>({...f,earned:e.target.value||undefined}))}/></div>
                      <div><div style={S.label}>+/- Дней</div><input style={S.input()} type="number" placeholder="0" onChange={e=>setEditForm(f=>({...f,days_add:e.target.value||undefined}))}/></div>
                      <div>
                        <div style={S.label}>Статус</div>
                        <select style={{...S.input(),appearance:'auto'}} onChange={e=>setEditForm(f=>({...f,status:e.target.value||undefined}))}>
                          <option value="">— без изменений —</option>
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="expired">expired</option>
                        </select>
                      </div>
                      <div><div style={S.label}>План ID</div><input style={S.input()} placeholder={c.plan_id} onChange={e=>setEditForm(f=>({...f,plan_id:e.target.value||undefined}))}/></div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676',padding:'9px'})} onClick={()=>editContract(c.id)}>💾 СОХРАНИТЬ</button>
                      <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a',padding:'9px 14px'})} onClick={()=>{setEditingContract(null);setEditForm({})}}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    <button style={S.btn({background:'rgba(26,95,255,0.1)',color:'#00d4ff'})} onClick={()=>{setEditingContract(c.id);setEditForm({})}}>✏️ РЕДАКТ.</button>
                    <button style={S.btn({background:'rgba(0,230,118,0.08)',color:'#00e676'})} onClick={()=>{
                      const v = prompt('Добавить к earned (TON):','0.001')
                      if(v) setEarned(c.id,parseFloat(v),true)
                    }}>💰 +EARNED</button>
                    {isActive && <button style={S.btn({background:'rgba(255,179,0,0.1)',color:'#ffb300'})} onClick={()=>{
                      const d = prompt('Добавить дней к контракту:','7')
                      if(d) api.put(`/api/miner/admin/contract/${c.id}`, {days_add:parseInt(d)}).then(()=>{loadUser(selectedUser.telegram_id);load();showToast(`+${d}д`)})
                    }}>📅 +ДНЕЙ</button>}
                    <button style={S.btn({background:'rgba(255,77,106,0.08)',color:'#ff4d6a'})} onClick={()=>deleteContract(c.id)}>🗑</button>
                  </div>
                )}
              </div>
            )
          })}

          {/* WITHDRAWALS */}
          {p.withdrawals?.length > 0 && (<>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',letterSpacing:'.1em',marginBottom:8,marginTop:12}}>💰 ВЫВОДЫ ({p.withdrawals.length})</div>
            {p.withdrawals.map(w => (
              <div key={w.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.1)',borderRadius:8,marginBottom:5}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:w.status==='completed'?'#00e676':w.status==='pending'?'#ffb300':'#ff4d6a',minWidth:70}}>
                  {parseFloat(w.amount).toFixed(6)}
                </div>
                <div style={{flex:1,fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>
                  {w.wallet_address?.slice(0,12)}... · {new Date(w.created_at).toLocaleDateString('ru')}
                </div>
                <span style={{fontFamily:'Orbitron,sans-serif',fontSize:7,padding:'2px 6px',borderRadius:4,fontWeight:700,
                  background:w.status==='pending'?'rgba(255,179,0,0.15)':w.status==='completed'?'rgba(0,230,118,0.15)':'rgba(255,77,106,0.15)',
                  color:w.status==='pending'?'#ffb300':w.status==='completed'?'#00e676':'#ff4d6a'
                }}>{w.status==='pending'?'ОЖИДАЕТ':w.status==='completed'?'ВЫПЛАЧЕНО':'ОТКЛОНЕНО'}</span>
                {w.status === 'pending' && (<>
                  <button style={S.btn({background:'rgba(0,230,118,0.15)',color:'#00e676',padding:'4px 8px'})} onClick={()=>{approve(w.id);setTimeout(()=>loadUser(selectedUser.telegram_id),500)}}>✅</button>
                  <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a',padding:'4px 8px'})} onClick={()=>{reject(w.id);setTimeout(()=>loadUser(selectedUser.telegram_id),500)}}>❌</button>
                </>)}
              </div>
            ))}
          </>)}
        </>)}
      </div>
    )
  }

  // =================== MAIN LIST VIEW ===================
  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      {/* FREE PLAN MANAGEMENT */}
      {freeStats && (
        <div style={{background:'#0e1c3a',border:`1px solid ${freeStats.enabled?'rgba(0,200,83,0.3)':'rgba(255,77,106,0.2)'}`,borderRadius:14,padding:14,marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:20}}>🆓</span>
              <div>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff'}}>БЕСПЛАТНЫЙ ТАРИФ</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)',marginTop:2}}>
                  {freeStats.hashrate} GH/s · {freeStats.days} дней
                </div>
              </div>
            </div>
            <button
              onClick={async()=>{
                setFreeToggling(true)
                try {
                  const r = await api.post('/api/miner/admin/free-toggle')
                  setFreeStats(prev=>({...prev, enabled: r.data.enabled}))
                  showToast(r.data.enabled ? '✅ Free тариф ВКЛЮЧЁН' : '❌ Free тариф ВЫКЛЮЧЕН')
                } catch(e) { showToast('Ошибка') }
                setFreeToggling(false)
              }}
              disabled={freeToggling}
              style={{
                padding:'8px 16px',border:'none',borderRadius:8,
                fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',
                background: freeStats.enabled ? 'rgba(0,230,118,0.2)' : 'rgba(255,77,106,0.15)',
                color: freeStats.enabled ? '#00e676' : '#ff4d6a',
                transition:'all .2s'
              }}
            >
              {freeToggling ? '...' : freeStats.enabled ? '✅ ВКЛ' : '❌ ВЫКЛ'}
            </button>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <button
              onClick={async()=>{
                try {
                  const r = await api.post('/api/miner/admin/free-notify-toggle')
                  setFreeStats(prev=>({...prev, notifyAdmin: r.data.notifyAdmin}))
                  showToast(r.data.notifyAdmin ? '\u2705 \u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u043A\u043B' : '\uD83D\uDD07 \u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0432\u044B\u043A\u043B')
                } catch { showToast('\u041E\u0448\u0438\u0431\u043A\u0430') }
              }}
              style={{
                padding:'7px 14px',border:'none',borderRadius:8,
                fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',
                background: freeStats.notifyAdmin ? 'rgba(0,230,118,0.15)' : 'rgba(255,77,106,0.1)',
                color: freeStats.notifyAdmin ? '#00e676' : '#ff4d6a',
                transition:'all .2s'
              }}
            >
              {freeStats.notifyAdmin ? '\uD83D\uDD14 \u0423\u0432\u0435\u0434. \u0412\u041A\u041B' : '\uD83D\uDD07 \u0423\u0432\u0435\u0434. \u0412\u042B\u041A\u041B'}
            </button>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.3)'}}>{'\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0430\u0434\u043C\u0438\u043D\u0443 \u043E \u0431\u0435\u0441\u043F\u043B. \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u044F\u0445'}</span>
          </div>
          {/* FREE PLAN STATS */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:10}}>
            <div style={{background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#00d4ff'}}>{freeStats.totalActivated}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>всего актив.</div>
            </div>
            <div style={{background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#00e676'}}>{freeStats.activeCount}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>сейчас актив.</div>
            </div>
            <div style={{background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#ffb300'}}>{freeStats.totalEarned.toFixed(4)}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>заработано TON</div>
            </div>
            <div style={{background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff'}}>{freeStats.activeHashrate.toFixed(0)}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>GH/s нагрузка</div>
            </div>
          </div>

          {/* FREE PLAN EDIT */}
          {freeEditing ? (
            <div style={{background:'rgba(26,95,255,0.04)',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:10}}>
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={S.label}>Хешрейт (GH/s)</div>
                  <input style={S.input()} type="number" value={freeForm.hashrate} onChange={e=>setFreeForm(f=>({...f,hashrate:e.target.value}))}/>
                </div>
                <div style={{flex:1}}>
                  <div style={S.label}>Дней</div>
                  <input style={S.input()} type="number" value={freeForm.days} onChange={e=>setFreeForm(f=>({...f,days:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676',padding:'9px'})} onClick={async()=>{
                  try {
                    await api.post('/api/miner/admin/free-update', { hashrate: parseFloat(freeForm.hashrate), days: parseInt(freeForm.days) })
                    setFreeStats(prev=>({...prev, hashrate: parseFloat(freeForm.hashrate), days: parseInt(freeForm.days)}))
                    setFreeEditing(false)
                    showToast('✅ Настройки Free обновлены')
                  } catch { showToast('Ошибка') }
                }}>💾 СОХРАНИТЬ</button>
                <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a',padding:'9px 14px'})} onClick={()=>setFreeEditing(false)}>✕</button>
              </div>
            </div>
          ) : (
            <button style={{...S.btn({width:'100%',background:'rgba(26,95,255,0.08)',color:'#00d4ff',border:'1px solid rgba(26,95,255,0.2)',padding:'8px',borderRadius:8}),display:'block',textAlign:'center'}} onClick={()=>setFreeEditing(true)}>
              ✏️ НАСТРОИТЬ FREE ТАРИФ
            </button>
          )}
        </div>
      )}

      {/* SEARCH */}
      <div style={{display:'flex',gap:6,marginBottom:10}}>
        <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchUser()} placeholder="🔍 Telegram ID пользователя" style={{flex:1,...S.input()}}/>
        <button style={S.btn({background:'rgba(26,95,255,0.2)',color:'#00d4ff',padding:'8px 14px'})} onClick={searchUser}>НАЙТИ</button>
      </div>

      {/* STATS */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#00d4ff'}}>{parseInt(stats.active_contracts)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Активных</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#00e676'}}>{parseFloat(stats.total_revenue).toFixed(2)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Выручка TON</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#ffb300'}}>{parseFloat(stats.network_hashrate).toFixed(0)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>GH/s сеть</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#e8f2ff'}}>{parseInt(stats.total_miners)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Майнеров</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#ff4d6a'}}>{parseInt(stats.pending_withdrawals)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Ожид. выводов</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#a855f7'}}>{parseFloat(stats.paid_amount).toFixed(4)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Выплачено</div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        <button style={S.tab(subTab==='users')} onClick={()=>setSubTab('users')}>👤 ЮЗЕРЫ ({minerUsers.length})</button>
        <button style={S.tab(subTab==='contracts')} onClick={()=>setSubTab('contracts')}>⛏ КОНТРАКТЫ ({contracts.length})</button>
        <button style={S.tab(subTab==='withdrawals')} onClick={()=>setSubTab('withdrawals')}>
          💰 ВЫВОДЫ {pendingWds>0?`(${pendingWds} ⏳)`:`(${withdrawals.length})`}
        </button>
      </div>

      {/* USERS TAB */}
      {subTab==='users' && (
        <div>
          {!minerUsers.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет юзеров с контрактами</div>}
          {minerUsers.map(u => (
            <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,marginBottom:6,cursor:'pointer'}} onClick={()=>openUser(u)}>
              <div style={{width:36,height:36,borderRadius:8,background:parseInt(u.active_count)>0?'rgba(0,230,118,0.15)':'rgba(255,77,106,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>⛏</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff'}}>{u.username ? '@'+u.username : u.first_name || 'User'}</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>ID: {u.telegram_id} · {u.contract_count} контр. · {parseInt(u.active_count)} актив.</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00d4ff'}}>{parseFloat(u.total_hashrate).toFixed(0)} GH/s</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>{parseFloat(u.total_earned).toFixed(4)} TON</div>
              </div>
              <div style={{color:'rgba(232,242,255,0.2)',fontSize:14}}>›</div>
            </div>
          ))}
        </div>
      )}

      {/* CONTRACTS TAB */}
      {subTab==='contracts' && (
        <div>
          {!contracts.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет контрактов</div>}
          {contracts.map(c => {
            const isActive = c.status==='active' && new Date(c.expires_at) > new Date()
            const daysLeft = Math.max(0, Math.ceil((new Date(c.expires_at) - new Date()) / 86400000))
            const progress = Math.min(100, ((c.duration_days - daysLeft) / c.duration_days) * 100)
            return (
              <div key={c.id} style={{background:'#0e1c3a',border:`1px solid ${isActive?'rgba(0,230,118,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:'pointer'}} onClick={()=>openUser({telegram_id:c.telegram_id,username:c.username,first_name:c.first_name})}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff',flex:1}}>
                    {c.username?'@'+c.username:c.first_name}
                  </span>
                  <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,padding:'3px 8px',borderRadius:6,fontWeight:700,
                    background:isActive?'rgba(0,230,118,0.15)':'rgba(255,77,106,0.15)',
                    color:isActive?'#00e676':'#ff4d6a'
                  }}>{c.plan_id.toUpperCase()}</span>
                </div>
                <div style={{display:'flex',gap:12,marginBottom:6}}>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#00d4ff',fontWeight:700}}>{parseFloat(c.hashrate).toFixed(0)} GH/s</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>хешрейт</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#ffb300',fontWeight:700}}>{parseFloat(c.earned).toFixed(6)}</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>заработано</div>
                  </div>
                  <div>
                    <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#e8f2ff',fontWeight:700}}>{isActive?`${daysLeft}д`:'Истёк'}</div>
                    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)'}}>осталось</div>
                  </div>
                </div>
                <div style={{height:3,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
                  <div style={{height:'100%',width:`${progress}%`,background:isActive?'linear-gradient(90deg,#1a5fff,#00d4ff)':'rgba(255,77,106,0.4)',borderRadius:2}}/>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* WITHDRAWALS TAB */}
      {subTab==='withdrawals' && (
        <div>
          {!withdrawals.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет заявок</div>}
          {withdrawals.map(w => (
            <div key={w.id} style={{background:'#0e1c3a',border:`1px solid ${w.status==='pending'?'rgba(255,179,0,0.2)':w.status==='completed'?'rgba(0,230,118,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff',flex:1,cursor:'pointer',textDecoration:'underline',textDecorationColor:'rgba(26,95,255,0.3)'}} onClick={()=>openUser({telegram_id:w.telegram_id,username:w.username,first_name:w.first_name})}>
                  {w.username?'@'+w.username:w.first_name}
                </span>
                <span style={{fontFamily:'Orbitron,sans-serif',fontSize:8,padding:'3px 8px',borderRadius:6,fontWeight:700,
                  background:w.status==='pending'?'rgba(255,179,0,0.15)':w.status==='completed'?'rgba(0,230,118,0.15)':'rgba(255,77,106,0.15)',
                  color:w.status==='pending'?'#ffb300':w.status==='completed'?'#00e676':'#ff4d6a'
                }}>{w.status==='pending'?'ОЖИДАЕТ':w.status==='completed'?'ВЫПЛАЧЕНО':'ОТКЛОНЕНО'}</span>
              </div>
              <div style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:'#00d4ff',marginBottom:4}}>
                {parseFloat(w.amount).toFixed(6)} TON
              </div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.4)',marginBottom:6,wordBreak:'break-all'}}>
                📬 {w.wallet_address}
              </div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.3)',marginBottom:6}}>
                {new Date(w.created_at).toLocaleString('ru')}
              </div>
              {w.status === 'pending' && (
                <div style={{display:'flex',gap:6}}>
                  <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={()=>approve(w.id)}>✅ ОДОБРИТЬ</button>
                  <button style={S.btn({flex:1,background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>reject(w.id)}>❌ ОТКЛОНИТЬ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AuctionsAdmin() {
  const [auctions, setAuctions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setAucToast] = useState('')
  const [filter, setFilter] = useState('all') // all | active | completed | cancelled
  const [orphans, setOrphans] = useState([])
  const [showOrphans, setShowOrphans] = useState(false)
  const [orphanSearch, setOrphanSearch] = useState('')
  const [sellUserId, setSellUserId] = useState(null)
  const [sellPrice, setSellPrice] = useState('0.1')
  const [sellHours, setSellHours] = useState('24')
  const [orphanCriteria, setOrphanCriteria] = useState(null)
  const [sellLoading, setSellLoading] = useState(false)

  const showToast = m => { setAucToast(m); setTimeout(()=>setAucToast(''),3000) }
  const load = async () => {
    try {
      const [a, s] = await Promise.all([
        api.get('/api/admin/auctions'),
        api.get('/api/admin/auction-stats'),
      ])
      setAuctions(a.data || [])
      setStats(s.data)
    } catch {}
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const loadOrphans = async () => {
    try {
      const r = await api.get('/api/admin/orphan-users')
      setOrphans(r.data?.users || [])
      setOrphanCriteria({ min_tasks: r.data?.min_tasks, min_activity_days: r.data?.min_activity_days })
    } catch {}
  }

  const toggleOrphans = () => {
    if (!showOrphans && orphans.length === 0) loadOrphans()
    setShowOrphans(!showOrphans)
  }

  const closeAuction = async (id) => {
    if (!confirm('Принудительно закрыть аукцион?')) return
    try {
      await api.post(`/api/admin/auctions/${id}/close`)
      showToast('✅ Аукцион закрыт')
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
  }

  const deleteAuction = async (id) => {
    if (!confirm('Удалить аукцион и все его ставки?')) return
    try {
      await api.delete(`/api/admin/auctions/${id}`)
      showToast('🗑 Аукцион удалён')
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
  }

  const sellOrphan = async (userId) => {
    setSellLoading(true)
    try {
      await api.post('/api/admin/auction/create-orphan', {
        user_id: userId,
        start_price: sellPrice,
        duration_hours: sellHours,
      })
      showToast('✅ Юзер выставлен на аукцион')
      setSellUserId(null)
      loadOrphans()
      load()
    } catch (e) { showToast(e?.response?.data?.error || 'Ошибка') }
    setSellLoading(false)
  }

  const S = {
    stat: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 12px',textAlign:'center'},
    btn: (c={})=>({padding:'6px 10px',border:'none',borderRadius:7,fontFamily:'Orbitron,sans-serif',fontSize:8,fontWeight:700,cursor:'pointer',...c}),
    tab: (active) => ({padding:'8px 14px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',background:active?'rgba(168,85,247,0.3)':'rgba(26,95,255,0.08)',color:active?'#a855f7':'rgba(232,242,255,0.4)',border:active?'1px solid rgba(168,85,247,0.3)':'1px solid transparent'}),
  }

  if (loading) return <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)'}}>Загрузка...</div>

  const filtered = filter === 'all' ? auctions : auctions.filter(a => a.status === filter)
  const filteredOrphans = orphanSearch
    ? orphans.filter(o => (o.username||'').toLowerCase().includes(orphanSearch.toLowerCase()) || (o.first_name||'').toLowerCase().includes(orphanSearch.toLowerCase()) || String(o.telegram_id).includes(orphanSearch))
    : orphans

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      {/* STATS */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12}}>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#a855f7'}}>{parseInt(stats.total_auctions)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Всего аукционов</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#00e676'}}>{parseInt(stats.active_auctions)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Активных</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#00d4ff'}}>{parseInt(stats.completed_auctions)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Завершённых</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#ffb300'}}>{parseInt(stats.total_bids)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Всего ставок</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:'#e8f2ff'}}>{parseFloat(stats.total_volume).toFixed(4)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Объём TON</div>
          </div>
          <div style={S.stat}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:16,fontWeight:900,color:parseInt(stats.test_auctions)>0?'#ffb300':'#00e676'}}>{parseInt(stats.test_auctions)}</div>
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)'}}>Тестовых</div>
          </div>
        </div>
      )}

      {/* ORPHAN USERS SELL BUTTON */}
      <button style={{
        width:'100%',padding:'10px',border:'1px solid rgba(168,85,247,0.3)',borderRadius:10,
        background:showOrphans?'rgba(168,85,247,0.15)':'rgba(168,85,247,0.06)',color:'#a855f7',fontFamily:'Orbitron,sans-serif',
        fontSize:10,fontWeight:700,cursor:'pointer',marginBottom:12
      }} onClick={toggleOrphans}>
        {showOrphans ? '▼' : '▶'} БЕЗ РЕФЕРЕРА — ПОДХОДЯТ ({orphans.length || '...'})
      </button>
      {showOrphans && orphanCriteria && (
        <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.35)',marginBottom:8,marginTop:-8,textAlign:'center'}}>
          Фильтр: ≥{orphanCriteria.min_tasks} заданий, активность за {orphanCriteria.min_activity_days} дней
        </div>
      )}

      {/* ORPHAN USERS LIST */}
      {showOrphans && (
        <div style={{marginBottom:16,background:'#0a1628',border:'1px solid rgba(168,85,247,0.15)',borderRadius:12,padding:10}}>
          <input
            placeholder="🔍 Поиск по имени или TG ID..."
            value={orphanSearch}
            onChange={e => setOrphanSearch(e.target.value)}
            style={{width:'100%',padding:'8px 12px',background:'rgba(26,95,255,0.06)',border:'1px solid rgba(26,95,255,0.15)',borderRadius:8,color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,marginBottom:8,boxSizing:'border-box',outline:'none'}}
          />
          <div style={{maxHeight:400,overflow:'auto'}}>
            {filteredOrphans.length === 0 && <div style={{textAlign:'center',padding:12,color:'rgba(232,242,255,0.3)',fontSize:11}}>Нет юзеров</div>}
            {filteredOrphans.map(o => {
              const name = o.username ? `@${o.username}` : o.first_name || `ID:${o.telegram_id}`
              const isOnAuction = o.on_auction
              const isSelected = sellUserId === o.id
              return (
                <div key={o.id} style={{
                  background: isSelected ? 'rgba(168,85,247,0.1)' : 'rgba(26,95,255,0.04)',
                  border: `1px solid ${isOnAuction ? 'rgba(255,179,0,0.2)' : isSelected ? 'rgba(168,85,247,0.3)' : 'rgba(26,95,255,0.08)'}`,
                  borderRadius:10,padding:10,marginBottom:6
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'rgba(168,85,247,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Orbitron',fontSize:12,fontWeight:700,color:'#a855f7',flexShrink:0}}>
                      {name[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
                      <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.35)'}}>
                        📋 {o.tasks_completed} заданий · 📊 {o.activity_30d} акт./30д
                      </div>
                    </div>
                    {isOnAuction ? (
                      <span style={{padding:'4px 8px',borderRadius:6,fontFamily:'Orbitron',fontSize:7,fontWeight:700,background:'rgba(255,179,0,0.12)',color:'#ffb300',flexShrink:0}}>НА АУКЦИОНЕ</span>
                    ) : (
                      <button style={S.btn({background:'rgba(168,85,247,0.15)',color:'#a855f7',padding:'6px 12px',fontSize:9})} onClick={() => setSellUserId(isSelected ? null : o.id)}>
                        {isSelected ? '✕' : '🏛 ПРОДАТЬ'}
                      </button>
                    )}
                  </div>
                  {/* SELL FORM */}
                  {isSelected && (
                    <div style={{marginTop:8,display:'flex',gap:6,alignItems:'center'}}>
                      <input placeholder="Цена" value={sellPrice} onChange={e=>setSellPrice(e.target.value)}
                        style={{flex:1,padding:'7px 10px',background:'rgba(26,95,255,0.06)',border:'1px solid rgba(26,95,255,0.15)',borderRadius:7,color:'#e8f2ff',fontFamily:'DM Sans',fontSize:11,outline:'none'}} />
                      <input placeholder="Часы" value={sellHours} onChange={e=>setSellHours(e.target.value)}
                        style={{width:50,padding:'7px 10px',background:'rgba(26,95,255,0.06)',border:'1px solid rgba(26,95,255,0.15)',borderRadius:7,color:'#e8f2ff',fontFamily:'DM Sans',fontSize:11,outline:'none',textAlign:'center'}} />
                      <button disabled={sellLoading} style={S.btn({background:'rgba(0,230,118,0.15)',color:'#00e676',padding:'7px 14px',fontSize:9})} onClick={() => sellOrphan(o.id)}>
                        {sellLoading ? '...' : '✓'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        {[
          {id:'all',label:`ВСЕ (${auctions.length})`},
          {id:'active',label:`АКТИВНЫЕ (${auctions.filter(a=>a.status==='active').length})`},
          {id:'completed',label:`ЗАВЕРШЁННЫЕ (${auctions.filter(a=>a.status==='completed').length})`},
          {id:'cancelled',label:`ОТМЕН. (${auctions.filter(a=>a.status==='cancelled').length})`},
        ].map(f => (
          <button key={f.id} style={S.tab(filter===f.id)} onClick={()=>setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {/* AUCTION LIST */}
      {!filtered.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет аукционов</div>}
      {filtered.map(a => {
        const isActive = a.status === 'active'
        const isCompleted = a.status === 'completed'
        const isCancelled = a.status === 'cancelled'
        const sellerName = a.seller_username ? '@'+a.seller_username : a.seller_name || 'User'
        const refName = a.ref_username ? '@'+a.ref_username : a.ref_name || 'User'
        const winnerName = a.winner_username ? '@'+a.winner_username : a.winner_name || ''
        const timeLeft = isActive ? Math.max(0, Math.ceil((new Date(a.ends_at) - new Date()) / 60000)) : 0
        const timeStr = timeLeft > 60 ? `${Math.floor(timeLeft/60)}ч ${timeLeft%60}м` : `${timeLeft}м`

        return (
          <div key={a.id} style={{
            background:'#0e1c3a',
            border:`1px solid ${isActive?'rgba(0,230,118,0.2)':isCompleted?'rgba(0,212,255,0.2)':'rgba(255,77,106,0.15)'}`,
            borderRadius:12,padding:12,marginBottom:8,position:'relative'
          }}>
            {/* HEADER */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{
                width:36,height:36,borderRadius:10,
                background:isActive?'rgba(0,230,118,0.1)':isCompleted?'rgba(0,212,255,0.1)':'rgba(255,77,106,0.08)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontFamily:'Orbitron,sans-serif',fontWeight:700,color:isActive?'#00e676':isCompleted?'#00d4ff':'#ff4d6a',
                fontSize:14,flexShrink:0
              }}>{refName[0].toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {refName}
                </div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(232,242,255,0.35)'}}>
                  продавец: {sellerName}
                </div>
              </div>
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                <span style={{
                  padding:'3px 8px',borderRadius:6,fontFamily:'Orbitron,sans-serif',fontSize:7,fontWeight:700,
                  background:isActive?'rgba(0,230,118,0.12)':isCompleted?'rgba(0,212,255,0.12)':'rgba(255,77,106,0.12)',
                  color:isActive?'#00e676':isCompleted?'#00d4ff':'#ff4d6a'
                }}>
                  {isActive?'АКТИВЕН':isCompleted?'ПРОДАН':'ОТМЕНА'}
                </span>
                {a.is_test && <span style={{padding:'3px 8px',borderRadius:6,fontFamily:'Orbitron,sans-serif',fontSize:7,fontWeight:700,background:'rgba(255,179,0,0.12)',color:'#ffb300'}}>ТЕСТ</span>}
              </div>
            </div>

            {/* STATS ROW */}
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <div style={{flex:1,textAlign:'center',background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 4px'}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#00e676'}}>{parseFloat(a.current_price).toFixed(4)}</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>ТЕКУЩАЯ</div>
              </div>
              <div style={{flex:1,textAlign:'center',background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 4px'}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#00d4ff'}}>{parseFloat(a.start_price).toFixed(4)}</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>НАЧАЛЬНАЯ</div>
              </div>
              <div style={{flex:1,textAlign:'center',background:'rgba(26,95,255,0.04)',borderRadius:8,padding:'6px 4px'}}>
                <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#a855f7'}}>{a.bid_count || 0}</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>СТАВКИ</div>
              </div>
              {isActive && (
                <div style={{flex:1,textAlign:'center',background:'rgba(255,179,0,0.06)',borderRadius:8,padding:'6px 4px'}}>
                  <div style={{fontFamily:'Orbitron,sans-serif',fontSize:12,fontWeight:700,color:'#ffb300'}}>{timeStr}</div>
                  <div style={{fontFamily:'DM Sans,sans-serif',fontSize:7,color:'rgba(232,242,255,0.3)'}}>ОСТАЛОСЬ</div>
                </div>
              )}
            </div>

            {/* WINNER */}
            {isCompleted && winnerName && (
              <div style={{textAlign:'center',padding:'6px',fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:6}}>
                🏆 Победитель: <span style={{color:'#00e676',fontWeight:700}}>{winnerName}</span>
              </div>
            )}

            {/* META */}
            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:9,color:'rgba(232,242,255,0.25)',marginBottom:8}}>
              ID: {a.id} · {a.duration_hours}ч · {new Date(a.created_at).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
            </div>

            {/* ACTIONS */}
            <div style={{display:'flex',gap:6}}>
              {isActive && (
                <button style={S.btn({flex:1,background:'rgba(255,179,0,0.15)',color:'#ffb300',padding:'8px'})} onClick={()=>closeAuction(a.id)}>
                  ⏹ ЗАКРЫТЬ
                </button>
              )}
              <button style={S.btn({flex:isActive?0:1,background:'rgba(255,77,106,0.1)',color:'#ff4d6a',padding:'8px'})} onClick={()=>deleteAuction(a.id)}>
                🗑 УДАЛИТЬ
              </button>
            </div>
          </div>
        )
      })}

      {/* REFRESH */}
      <button style={{
        width:'100%',padding:'10px',border:'1px solid rgba(26,95,255,0.2)',borderRadius:10,
        background:'rgba(26,95,255,0.06)',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',
        fontSize:9,fontWeight:700,cursor:'pointer',marginTop:8
      }} onClick={load}>↻ ОБНОВИТЬ</button>
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
  const [filterStatus, setFilterStatus] = useState('all')
  const [partnerTab, setPartnerTab] = useState('list') // list | settings
  const [pSettings, setPSettings] = useState({})
  const [pSaving, setPSaving] = useState(null)

  const showToast = (msg) => { setPartToast(msg); setTimeout(() => setPartToast(''), 3000) }
  const load = () => api.get('/api/partnership/all').then(r => { setItems(r.data||[]); setLoading(false) }).catch(() => setLoading(false))
  const loadSettings = () => api.get('/api/admin/settings').then(r => setPSettings(r.data || {})).catch(() => {})
  useEffect(() => { load(); loadSettings() }, [])

  const savePSetting = async (key) => {
    setPSaving(key)
    try {
      await api.post('/api/admin/settings', { key, value: pSettings[key] })
      showToast('✅ Сохранено')
    } catch { showToast('❌ Ошибка') }
    setPSaving(null)
  }

  const PARTNER_SETTINGS = [
    { key: 'partnership_enabled', label: 'Статус (0=откл, 1=вкл, 2=админ, 3=тест)' },
    { key: 'partnership_min_subs', label: 'Мин. подписчиков канала' },
    { key: 'partnership_task_execs', label: 'Макс. выполнений (по умолч.)' },
    { key: 'partnership_lvl_bronze_execs', label: '🥉 Bronze: вып./мес' },
    { key: 'partnership_lvl_silver_execs', label: '🥈 Silver (5K+): вып./мес' },
    { key: 'partnership_lvl_gold_execs', label: '🥇 Gold (20K+): вып./мес' },
    { key: 'partnership_lvl_diamond_execs', label: '💎 Diamond (50K+): вып./мес' },
    { key: 'partner_promo_expiry_hours', label: '⏰ Промо: срок (часов)' },
    { key: 'partner_promo_bronze_reward', label: '🥉 Промо: награда TON' },
    { key: 'partner_promo_bronze_uses', label: '🥉 Промо: макс. исп.' },
    { key: 'partner_promo_silver_reward', label: '🥈 Промо: награда TON' },
    { key: 'partner_promo_silver_uses', label: '🥈 Промо: макс. исп.' },
    { key: 'partner_promo_gold_reward', label: '🥇 Промо: награда TON' },
    { key: 'partner_promo_gold_uses', label: '🥇 Промо: макс. исп.' },
    { key: 'partner_promo_diamond_reward', label: '💎 Промо: награда TON' },
    { key: 'partner_promo_diamond_uses', label: '💎 Промо: макс. исп.' },
  ]

  const statusBadge = (status) => {
    const map = {
      approved:  { bg:'rgba(0,230,118,0.15)', color:'#00e676', text:'ОДОБРЕН' },
      pending:   { bg:'rgba(255,179,0,0.15)', color:'#ffb300', text:'ОЖИДАЕТ' },
      rejected:  { bg:'rgba(255,77,106,0.15)', color:'#ff4d6a', text:'ОТКЛ' },
      suspended: { bg:'rgba(255,77,106,0.25)', color:'#ff4d6a', text:'🚨 БЛОК' },
      cancelled: { bg:'rgba(232,242,255,0.08)', color:'rgba(232,242,255,0.4)', text:'ОТМЕНЁН' },
    }
    const s = map[status] || map.pending
    return { background: s.bg, color: s.color, fontFamily:'Orbitron,sans-serif', fontSize:8, fontWeight:700, padding:'3px 8px', borderRadius:6, text: s.text }
  }

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
          {(() => { const b = statusBadge(selected.status); return <span style={{background:b.background,color:b.color,fontFamily:b.fontFamily,fontSize:b.fontSize,fontWeight:b.fontWeight,padding:b.padding,borderRadius:b.borderRadius}}>{b.text}</span> })()}
        </div>
        <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:3}}>📢 {selected.channel_url}</div>
        {selected.post_url && <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.3)',marginBottom:3}}>🔗 {selected.post_url}</div>}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:4}}>
          {selected.last_checked_at && <span style={{fontFamily:'DM Sans',fontSize:9,color:'rgba(232,242,255,0.25)'}}>🔍 Проверка: {new Date(selected.last_checked_at).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>}
          {selected.last_renewed_at && <span style={{fontFamily:'DM Sans',fontSize:9,color:'rgba(232,242,255,0.25)'}}>🔄 Обновление: {new Date(selected.last_renewed_at).toLocaleString('ru',{day:'numeric',month:'short'})}</span>}
          <span style={{fontFamily:'DM Sans',fontSize:9,color:'rgba(232,242,255,0.25)'}}>📅 Создан: {new Date(selected.created_at).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'})}</span>
        </div>
      </div>

      {/* SUSPENDED REASON */}
      {selected.status === 'suspended' && (
        <div style={{...S.card,cursor:'default',marginBottom:10,borderColor:'rgba(255,77,106,0.25)',background:'rgba(255,77,106,0.04)'}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#ff4d6a',marginBottom:8}}>🚨 ПАРТНЁРСТВО ЗАБЛОКИРОВАНО</div>
          {selected.suspended_reason && (
            <div style={{fontFamily:'DM Sans',fontSize:11,color:'rgba(232,242,255,0.55)',lineHeight:1.6,marginBottom:10,padding:'8px 10px',background:'rgba(255,77,106,0.06)',borderRadius:8}}>
              {selected.suspended_reason.split('; ').map((r,i) => <div key={i}>{r}</div>)}
            </div>
          )}
          <button style={S.btn({width:'100%',background:'rgba(0,230,118,0.15)',color:'#00e676',border:'1px solid rgba(0,230,118,0.2)'})} onClick={async()=>{
            try {
              await api.post(`/api/partnership/unsuspend/${selected.id}`)
              showToast('✅ Партнёрство разблокировано')
              load()
              const r = await api.get('/api/partnership/all')
              const updated = (r.data||[]).find(p => p.id === selected.id)
              if (updated) setSelected(updated)
            } catch(e) { showToast('❌ '+(e?.response?.data?.error||'Ошибка')) }
          }}>✅ РАЗБЛОКИРОВАТЬ ПАРТНЁРА</button>
        </div>
      )}

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
  const counts = {
    all: items.length,
    pending: items.filter(p => p.status === 'pending').length,
    approved: items.filter(p => p.status === 'approved').length,
    suspended: items.filter(p => p.status === 'suspended').length,
  }
  const filtered = filterStatus === 'all' ? items : items.filter(p => p.status === filterStatus)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:4}}>{toast}</div>}

      {/* TABS */}
      <div style={{display:'flex',gap:6,marginBottom:4}}>
        <button onClick={()=>setPartnerTab('list')} style={{flex:1,padding:'8px',border:'none',borderRadius:8,fontFamily:'Orbitron',fontSize:9,fontWeight:700,cursor:'pointer',background:partnerTab==='list'?'rgba(0,212,255,0.15)':'rgba(26,95,255,0.06)',color:partnerTab==='list'?'#00d4ff':'rgba(232,242,255,0.35)',borderBottom:partnerTab==='list'?'2px solid #00d4ff':'2px solid transparent'}}>📋 СПИСОК</button>
        <button onClick={()=>setPartnerTab('settings')} style={{flex:1,padding:'8px',border:'none',borderRadius:8,fontFamily:'Orbitron',fontSize:9,fontWeight:700,cursor:'pointer',background:partnerTab==='settings'?'rgba(168,85,247,0.15)':'rgba(26,95,255,0.06)',color:partnerTab==='settings'?'#a855f7':'rgba(232,242,255,0.35)',borderBottom:partnerTab==='settings'?'2px solid #a855f7':'2px solid transparent'}}>⚙️ НАСТРОЙКИ</button>
      </div>

      {/* SETTINGS TAB */}
      {partnerTab === 'settings' && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {/* DEFAULT POST */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(168,85,247,0.2)',borderRadius:12,padding:14}}>
            <div style={{fontFamily:'Orbitron',fontSize:10,fontWeight:700,color:'#a855f7',marginBottom:10}}>📝 СТАНДАРТНЫЙ ПОСТ</div>
            <div style={{fontFamily:'DM Sans',fontSize:9,color:'rgba(232,242,255,0.3)',marginBottom:8,lineHeight:1.5}}>
              Подстановки: <span style={{color:'#00d4ff'}}>{'{REF_LINK}'}</span> — реф. ссылка, <span style={{color:'#a855f7'}}>{'{PROMO}'}</span> — блок промокода
            </div>
            <textarea
              rows={8}
              style={{width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:10,padding:'10px 12px',color:'#e8f2ff',fontFamily:'DM Sans',fontSize:12,outline:'none',resize:'vertical',lineHeight:1.5,whiteSpace:'pre-wrap',marginBottom:8,boxSizing:'border-box'}}
              value={(pSettings['partnership_default_post'] ?? '').replace(/\\n/g, '\n')}
              onChange={e => setPSettings(p => ({...p, partnership_default_post: e.target.value.replace(/\n/g, '\\n')}))}
              placeholder="🚀 Зарабатывай TON каждый день!\n..."
            />

            {/* PHOTO */}
            <div style={{marginBottom:8}}>
              <div style={{fontFamily:'Orbitron',fontSize:8,fontWeight:700,color:'rgba(232,242,255,0.35)',letterSpacing:'.06em',marginBottom:4}}>📷 ФОТО (НЕОБЯЗАТЕЛЬНО)</div>
              {pSettings['partnership_default_post_photo'] ? (
                <div style={{position:'relative',marginBottom:6}}>
                  <img src={pSettings['partnership_default_post_photo']} style={{width:'100%',borderRadius:10,maxHeight:160,objectFit:'cover'}}/>
                  <button onClick={async()=>{
                    setPSettings(p => ({...p, partnership_default_post_photo: ''}))
                    await api.post('/api/admin/settings', { key: 'partnership_default_post_photo', value: '' })
                    showToast('🗑 Фото удалено')
                  }} style={{position:'absolute',top:6,right:6,padding:'4px 10px',border:'none',borderRadius:8,background:'rgba(255,77,106,0.85)',color:'#fff',fontFamily:'Orbitron',fontSize:9,fontWeight:700,cursor:'pointer'}}>✕ УДАЛИТЬ</button>
                </div>
              ) : (
                <label style={{display:'block',width:'100%',padding:'12px',border:'1px dashed rgba(168,85,247,0.3)',borderRadius:10,textAlign:'center',cursor:'pointer',color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans',fontSize:12,boxSizing:'border-box'}}>
                  📷 Выбрать фото
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={async e=>{
                    const file = e.target.files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = async ev => {
                      const base64 = ev.target.result
                      setPSettings(p => ({...p, partnership_default_post_photo: base64}))
                      await api.post('/api/admin/settings', { key: 'partnership_default_post_photo', value: base64 })
                      showToast('✅ Фото загружено')
                    }
                    reader.readAsDataURL(file)
                  }}/>
                </label>
              )}
            </div>

            <button onClick={()=>savePSetting('partnership_default_post')} style={{width:'100%',padding:'9px',border:'none',borderRadius:8,fontFamily:'Orbitron',fontSize:9,fontWeight:700,cursor:'pointer',background:'rgba(168,85,247,0.2)',color:'#a855f7'}}>
              {pSaving === 'partnership_default_post' ? '...' : '💾 СОХРАНИТЬ ПОСТ'}
            </button>
          </div>

          {/* OTHER SETTINGS */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:12,padding:14}}>
            <div style={{fontFamily:'Orbitron',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>⚙️ ПАРАМЕТРЫ</div>
            {PARTNER_SETTINGS.map(s => (
              <div key={s.key} style={{marginBottom:8}}>
                <div style={{fontFamily:'Orbitron',fontSize:8,fontWeight:700,color:'rgba(232,242,255,0.35)',letterSpacing:'.06em',marginBottom:3}}>{s.label}</div>
                <div style={{display:'flex',gap:6}}>
                  <input
                    style={{flex:1,background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'7px 10px',color:'#e8f2ff',fontFamily:'DM Sans',fontSize:12,outline:'none'}}
                    value={pSettings[s.key] ?? ''}
                    onChange={e => setPSettings(p => ({...p, [s.key]: e.target.value}))}
                  />
                  <button onClick={()=>savePSetting(s.key)} style={{padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron',fontSize:8,fontWeight:700,cursor:'pointer',background:'rgba(0,212,255,0.12)',color:'#00d4ff',flexShrink:0}}>
                    {pSaving === s.key ? '...' : 'СОХР'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {partnerTab === 'list' && (<>
        {/* STATS ROW */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:4}}>
          {[
            {k:'all',label:'ВСЕ',count:counts.all,color:'#00d4ff'},
            {k:'pending',label:'ОЖИД.',count:counts.pending,color:'#ffb300'},
            {k:'approved',label:'АКТИВ.',count:counts.approved,color:'#00e676'},
            {k:'suspended',label:'БЛОК',count:counts.suspended,color:'#ff4d6a'},
          ].map(f => (
            <div key={f.k} onClick={()=>setFilterStatus(f.k)} style={{cursor:'pointer',textAlign:'center',padding:'6px 4px',borderRadius:8,background:filterStatus===f.k?f.color+'15':'rgba(26,95,255,0.04)',border:`1px solid ${filterStatus===f.k?f.color+'30':'rgba(26,95,255,0.08)'}`,transition:'all .2s'}}>
              <div style={{fontFamily:'Orbitron',fontSize:14,fontWeight:900,color:filterStatus===f.k?f.color:'rgba(232,242,255,0.5)'}}>{f.count}</div>
              <div style={{fontFamily:'Orbitron',fontSize:7,color:'rgba(232,242,255,0.3)',letterSpacing:'.06em'}}>{f.label}</div>
            </div>
          ))}
        </div>

        {!filtered.length && <div style={{textAlign:'center',padding:20,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>Нет заявок</div>}
        {filtered.map(p => {
          const b = statusBadge(p.status)
          return (
            <div key={p.id} style={{...S.card,borderColor:p.status==='suspended'?'rgba(255,77,106,0.2)':'rgba(26,95,255,0.15)'}} onClick={() => openPartner(p)}>
              <div style={S.row}>
                <span style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#00d4ff'}}>#{p.id}</span>
                <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,color:'#e8f2ff',flex:1}}>{p.username ? '@'+p.username : p.first_name}</span>
                <span style={{background:b.background,color:b.color,fontFamily:b.fontFamily,fontSize:b.fontSize,fontWeight:b.fontWeight,padding:b.padding,borderRadius:b.borderRadius}}>{b.text}</span>
                <span style={{color:'rgba(232,242,255,0.3)',fontSize:14}}>›</span>
              </div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)'}}>{p.channel_url}</div>
              {p.status === 'suspended' && p.suspended_reason && (
                <div style={{fontFamily:'DM Sans',fontSize:9,color:'#ff4d6a',marginTop:4,opacity:0.7}}>{p.suspended_reason.split('; ')[0]}</div>
              )}
              {p.status === 'pending' && (
                <div style={{display:'flex',gap:6,marginTop:8}} onClick={e=>e.stopPropagation()}>
                  <button style={S.btn({flex:1,background:'rgba(0,230,118,0.2)',color:'#00e676'})} onClick={()=>approve(p.id)}>✅ ОДОБРИТЬ</button>
                  <button style={S.btn({flex:1,background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>reject(p.id)}>❌ ОТКЛОНИТЬ</button>
                </div>
              )}
            </div>
          )
        })}

        <button style={{width:'100%',padding:'10px',border:'1px solid rgba(26,95,255,0.2)',borderRadius:10,background:'rgba(26,95,255,0.06)',color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',marginTop:4}} onClick={load}>↻ ОБНОВИТЬ</button>
      </>)}
    </div>
  )
}

function AdminChart({ data, metric, chartType = 'bar' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    const dpr = 2
    const cssW = 340, cssH = 200
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, cssW, cssH)

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, cssH)
    bgGrad.addColorStop(0, '#0a1428')
    bgGrad.addColorStop(1, '#060e20')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, cssW, cssH)

    const values = data.map(d => parseFloat(d[metric]) || 0)
    const maxV = Math.max(...values, 1) * 1.15
    const pad = { l: 42, r: 16, t: 20, b: 30 }
    const chartW = cssW - pad.l - pad.r
    const chartH = cssH - pad.t - pad.b

    // Grid lines with subtle gradient
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH * i / 4
      ctx.strokeStyle = 'rgba(26,95,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(cssW - pad.r, y); ctx.stroke()
      ctx.fillStyle = 'rgba(232,242,255,0.25)'
      ctx.font = '8px Orbitron,sans-serif'
      ctx.textAlign = 'right'
      const lbl = maxV * (1 - i/4)
      ctx.fillText(lbl >= 1 ? Math.round(lbl) : lbl.toFixed(2), pad.l - 6, y + 3)
    }

    const gap = chartW / data.length
    const colors = {
      new_users: ['#00d4ff', 'rgba(0,212,255,0.15)'],
      active_users: ['#a855f7', 'rgba(168,85,247,0.15)'],
      deposits: ['#00e676', 'rgba(0,230,118,0.15)'],
      withdrawals: ['#ff4d6a', 'rgba(255,77,106,0.15)'],
      profit: ['#ffb300', 'rgba(255,179,0,0.15)'],
      trading_bets: ['#1a5fff', 'rgba(26,95,255,0.15)'],
      spins: ['#e040fb', 'rgba(224,64,251,0.15)'],
      ads_viewed: ['#00bcd4', 'rgba(0,188,212,0.15)'],
    }
    const [mainColor, subColor] = colors[metric] || ['#1a5fff', 'rgba(26,95,255,0.15)']

    if (chartType === 'line') {
      // Smooth line chart with area fill
      const points = data.map((d, i) => ({
        x: pad.l + i * gap + gap / 2,
        y: pad.t + chartH - ((parseFloat(d[metric]) || 0) / maxV) * chartH
      }))

      // Area fill
      const areaGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH)
      areaGrad.addColorStop(0, subColor.replace('0.15', '0.25'))
      areaGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = areaGrad
      ctx.beginPath()
      ctx.moveTo(points[0].x, pad.t + chartH)
      // Bezier curve
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          ctx.lineTo(points[i].x, points[i].y)
        } else {
          const xc = (points[i - 1].x + points[i].x) / 2
          ctx.bezierCurveTo(xc, points[i - 1].y, xc, points[i].y, points[i].x, points[i].y)
        }
      }
      ctx.lineTo(points[points.length - 1].x, pad.t + chartH)
      ctx.closePath()
      ctx.fill()

      // Line
      ctx.strokeStyle = mainColor
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          ctx.moveTo(points[i].x, points[i].y)
        } else {
          const xc = (points[i - 1].x + points[i].x) / 2
          ctx.bezierCurveTo(xc, points[i - 1].y, xc, points[i].y, points[i].x, points[i].y)
        }
      }
      ctx.stroke()

      // Dots with glow
      points.forEach((p, i) => {
        const v = parseFloat(data[i][metric]) || 0
        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = subColor.replace('0.15', '0.3')
        ctx.fill()
        // Dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = mainColor
        ctx.fill()
        ctx.strokeStyle = '#0a1428'
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
    } else {
      // Animated-style bar chart with rounded tops and glow
      const bw = Math.min(gap * 0.55, 20)
      data.forEach((d, i) => {
        const v = parseFloat(d[metric]) || 0
        const x = pad.l + i * gap + (gap - bw) / 2
        const bh = (v / maxV) * chartH
        const y = pad.t + chartH - bh

        // Bar glow
        ctx.shadowColor = mainColor
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 0

        const grad = ctx.createLinearGradient(0, y, 0, pad.t + chartH)
        grad.addColorStop(0, mainColor)
        grad.addColorStop(0.6, subColor.replace('0.15', '0.4'))
        grad.addColorStop(1, 'rgba(0,0,0,0.1)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x, y, bw, bh, [4, 4, 0, 0])
        ctx.fill()

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0

        // Value on top
        if (v > 0) {
          ctx.fillStyle = mainColor
          ctx.font = 'bold 8px Orbitron,sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(v >= 1 ? Math.round(v) : v.toFixed(2), x + bw/2, y - 6)
        }
      })
    }

    // Date labels
    data.forEach((d, i) => {
      const date = new Date(d.date)
      ctx.fillStyle = 'rgba(232,242,255,0.3)'
      ctx.font = '7px DM Sans,sans-serif'
      ctx.textAlign = 'center'
      const x = pad.l + i * gap + gap / 2
      ctx.fillText(`${date.getDate()}.${date.getMonth()+1}`, x, cssH - 8)
    })
  }, [data, metric, chartType])

  return <canvas ref={canvasRef} width={680} height={400} style={{width:'100%',height:'auto',borderRadius:14,display:'block',border:'1px solid rgba(26,95,255,0.08)'}} />
}

// Mini donut chart for ratios
function MiniDonut({ value, max, color = '#00d4ff', size = 44, label }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = 2
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)
    const cx = size / 2, cy = size / 2, r = size / 2 - 4, lw = 5
    const pct = max > 0 ? Math.min(value / max, 1) : 0
    // Background arc
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(26,95,255,0.1)'
    ctx.lineWidth = lw
    ctx.stroke()
    // Value arc
    if (pct > 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct)
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    // Center text
    ctx.fillStyle = '#e8f2ff'
    ctx.font = `bold ${size > 36 ? 10 : 8}px Orbitron,sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(Math.round(pct * 100) + '%', cx, cy)
  }, [value, max, color, size])
  return (
    <div className="mini-donut-wrap">
      <canvas ref={canvasRef} width={size * 2} height={size * 2} style={{width:size,height:size}} />
      {label && <div className="mini-donut-label">{label}</div>}
    </div>
  )
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
  const [chartType, setChartType] = useState('bar')
  const chartRef = useRef(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [maintenance, setMaintenance] = useState(false)
  const [spinSectors, setSpinSectors] = useState([])
  const [editSector, setEditSector] = useState(null)
  const [uptime, setUptime] = useState('')
  const [dbBackup, setDbBackup] = useState(null)
  const linkTimer = useRef(null)
  const [activityTxs, setActivityTxs] = useState([])
  const [activityTotal, setActivityTotal] = useState(0)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityAutoRefresh, setActivityAutoRefresh] = useState(true)
  const [activityFilter, setActivityFilter] = useState('all')
  const activityTimer = useRef(null)
  const activityLastTime = useRef(null)

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
          {id:'auctions',icon:'🏛',label:'АУКЦИОН'},
          {id:'activity',icon:'⚡',label:'АКТИВНОСТЬ'},
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
        <div className="admin-section dash-stats">

          {/* ===== HERO SUMMARY ===== */}
          <div className="dash-hero">
            <div className="dash-hero-left">
              <div className="dash-hero-label">Баланс проекта</div>
              <div className="dash-hero-value">{(parseFloat(stats.total_deposited||0) - parseFloat(stats.total_withdrawn||0)).toFixed(2)} <span>TON</span></div>
            </div>
            <div className="dash-hero-right">
              <MiniDonut value={parseFloat(stats.total_withdrawn||0)} max={parseFloat(stats.total_deposited||0) || 1} color="#ff4d6a" size={52} label="Выведено" />
            </div>
          </div>

          {/* ===== QUICK METRICS BAR ===== */}
          <div className="dash-quick-row">
            <div className="dash-quick-item">
              <div className="dqi-icon">👥</div>
              <div className="dqi-val">{stats.total_users}</div>
              <div className="dqi-lbl">Юзеры</div>
            </div>
            <div className="dash-quick-item">
              <div className="dqi-icon">📈</div>
              <div className="dqi-val">{stats.today_users || 0}</div>
              <div className="dqi-lbl">Сегодня</div>
            </div>
            <div className="dash-quick-item">
              <div className="dqi-icon">🔥</div>
              <div className="dqi-val">{stats.week_users || 0}</div>
              <div className="dqi-lbl">За неделю</div>
            </div>
            <div className="dash-quick-item">
              <div className="dqi-icon">🚫</div>
              <div className="dqi-val">{stats.blocked_users}</div>
              <div className="dqi-lbl">Блок</div>
            </div>
          </div>

          {/* ===== CHART ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">📊</div>
              <div className="dash-sh-title">АНАЛИТИКА</div>
            </div>
            <div className="dash-chart-controls">
              <div className="dash-chart-days">
                {[7,14,30].map(d => (
                  <button key={d} className={`dcc-day ${chartDays===d?'on':''}`} onClick={async()=>{
                    setChartDays(d)
                    const r = await api.get(`/api/admin/chart?days=${d}`)
                    setChartData(r.data || [])
                  }}>{d}д</button>
                ))}
              </div>
              <div className="dash-chart-type-toggle">
                <button className={`dctt-btn ${chartType==='bar'?'on':''}`} onClick={()=>setChartType('bar')}>▊</button>
                <button className={`dctt-btn ${chartType==='line'?'on':''}`} onClick={()=>setChartType('line')}>╱</button>
              </div>
            </div>
            <select className="dash-chart-metric" value={chartMetric} onChange={e=>setChartMetric(e.target.value)}>
              <option value="new_users">👥 Новые юзеры</option>
              <option value="active_users">🔥 Активные юзеры</option>
              <option value="deposits">💎 Депозиты (TON)</option>
              <option value="withdrawals">💸 Выводы (TON)</option>
              <option value="profit">💰 Доход проекта</option>
              <option value="trading_bets">📈 Ставки трейдинга</option>
              <option value="spins">🎰 Спины</option>
              <option value="ads_viewed">📣 Просмотры рекламы</option>
            </select>
            <AdminChart data={chartData} metric={chartMetric} chartType={chartType} />
          </div>

          {/* ===== ФИНАНСЫ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">💰</div>
              <div className="dash-sh-title">ФИНАНСЫ ПРОЕКТА</div>
            </div>
            <div className="dash-finance-row">
              <div className="dash-fin-card dash-fin-in">
                <div className="dfc-icon">↗</div>
                <div className="dfc-info">
                  <div className="dfc-val">+{parseFloat(stats.total_deposited||0).toFixed(2)}</div>
                  <div className="dfc-lbl">Пополнения</div>
                </div>
              </div>
              <div className="dash-fin-card dash-fin-out">
                <div className="dfc-icon">↘</div>
                <div className="dfc-info">
                  <div className="dfc-val">-{parseFloat(stats.total_withdrawn||0).toFixed(2)}</div>
                  <div className="dfc-lbl">Выводы</div>
                </div>
              </div>
            </div>
            {/* Revenue progress bar */}
            <div className="dash-progress-card">
              <div className="dpc-header">
                <span className="dpc-lbl">Удержание средств</span>
                <span className="dpc-pct">{(parseFloat(stats.total_deposited||0) > 0 ? ((1 - parseFloat(stats.total_withdrawn||0) / parseFloat(stats.total_deposited||0)) * 100).toFixed(1) : 100)}%</span>
              </div>
              <div className="dpc-bar">
                <div className="dpc-fill" style={{width: `${parseFloat(stats.total_deposited||0) > 0 ? Math.max(0, (1 - parseFloat(stats.total_withdrawn||0) / parseFloat(stats.total_deposited||0)) * 100) : 100}%`}} />
              </div>
            </div>
          </div>

          {/* ===== СТЕЙКИНГ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">📈</div>
              <div className="dash-sh-title">СТЕЙКИНГ</div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-metric-card">
                <div className="dmc-val">{stats.active_stakes}</div>
                <div className="dmc-lbl">Активных</div>
              </div>
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{parseFloat(stats.total_staked).toFixed(2)}</div>
                <div className="dmc-lbl">В стейке TON</div>
              </div>
              <div className="dash-metric-card dmc-gold">
                <div className="dmc-val">{parseFloat(stats.staking_fee_earned||0).toFixed(4)}</div>
                <div className="dmc-lbl">Комиссия</div>
              </div>
            </div>
          </div>

          {/* ===== ТРЕЙДИНГ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">📊</div>
              <div className="dash-sh-title">ТРЕЙДИНГ</div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card">
                <div className="dmc-val">{stats.trading_total||0}</div>
                <div className="dmc-lbl">Всего ставок</div>
              </div>
              <div className="dash-metric-card dmc-gold">
                <div className="dmc-val">{parseFloat(stats.trading_profit||0).toFixed(4)}</div>
                <div className="dmc-lbl">Прибыль</div>
              </div>
            </div>
            <div className="dash-grid-4">
              <div className="dash-mini-stat dms-green">
                <div className="dmst-val">{stats.trading_wins||0}</div>
                <div className="dmst-lbl">WIN</div>
              </div>
              <div className="dash-mini-stat dms-red">
                <div className="dmst-val">{stats.trading_loses||0}</div>
                <div className="dmst-lbl">LOSE</div>
              </div>
              <div className="dash-mini-stat">
                <div className="dmst-val">{stats.trading_refunds||0}</div>
                <div className="dmst-lbl">REF</div>
              </div>
              <div className="dash-mini-stat dms-blue">
                <div className="dmst-val">{parseFloat(stats.trading_bank||0).toFixed(2)}</div>
                <div className="dmst-lbl">БАНК</div>
              </div>
            </div>
            {/* Win rate donut */}
            {parseInt(stats.trading_total||0) > 0 && (
              <div className="dash-donut-row">
                <MiniDonut value={parseInt(stats.trading_wins||0)} max={parseInt(stats.trading_total||0)} color="#00e676" size={48} label="Винрейт" />
                <MiniDonut value={parseInt(stats.trading_loses||0)} max={parseInt(stats.trading_total||0)} color="#ff4d6a" size={48} label="Проигрыши" />
                <MiniDonut value={parseInt(stats.trading_refunds||0)} max={parseInt(stats.trading_total||0)} color="#ffb300" size={48} label="Возвраты" />
              </div>
            )}
          </div>

          {/* ===== СЛОТЫ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">🎰</div>
              <div className="dash-sh-title">СЛОТЫ</div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-metric-card">
                <div className="dmc-val">{stats.slots_total||0}</div>
                <div className="dmc-lbl">Спинов</div>
              </div>
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{stats.slots_wins||0}</div>
                <div className="dmc-lbl">Выигрышей</div>
              </div>
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{parseFloat(stats.slots_bank||0).toFixed(2)}</div>
                <div className="dmc-lbl">Банк</div>
              </div>
            </div>
          </div>

          {/* ===== СПИН ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">🎡</div>
              <div className="dash-sh-title">КОЛЕСО ФОРТУНЫ</div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card">
                <div className="dmc-val">{stats.total_spins||0}</div>
                <div className="dmc-lbl">Всего спинов</div>
              </div>
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{parseFloat(stats.spin_profit||0).toFixed(4)}</div>
                <div className="dmc-lbl">Прибыль</div>
              </div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-mini-stat dms-gold">
                <div className="dmst-val">{parseFloat(stats.spin_revenue||0).toFixed(4)}</div>
                <div className="dmst-lbl">Доход</div>
              </div>
              <div className="dash-mini-stat dms-amber">
                <div className="dmst-val">{parseFloat(stats.current_jackpot||0).toFixed(4)}</div>
                <div className="dmst-lbl">Джекпот</div>
              </div>
              <div className="dash-mini-stat dms-green">
                <div className="dmst-val">{parseFloat(stats.spin_pool||0).toFixed(4)}</div>
                <div className="dmst-lbl">Пул</div>
              </div>
            </div>
          </div>

          {/* ===== ЗАДАНИЯ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">✅</div>
              <div className="dash-sh-title">ЗАДАНИЯ</div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-metric-card">
                <div className="dmc-val">{stats.active_tasks||0}</div>
                <div className="dmc-lbl">Активных</div>
              </div>
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{stats.tasks_completed}</div>
                <div className="dmc-lbl">Выполнено</div>
              </div>
              <div className="dash-metric-card dmc-gold">
                <div className="dmc-val">{parseFloat(stats.task_fee_earned||0).toFixed(4)}</div>
                <div className="dmc-lbl">Комиссия</div>
              </div>
            </div>
          </div>

          {/* ===== РЕФЕРАЛЫ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">👥</div>
              <div className="dash-sh-title">РЕФЕРАЛЫ</div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{stats.total_referrals||0}</div>
                <div className="dmc-lbl">Всего рефералов</div>
              </div>
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{parseInt(stats.users_with_referrer||0)}</div>
                <div className="dmc-lbl">С реферером</div>
              </div>
              <div className="dash-metric-card" style={{borderColor:'rgba(255,77,106,0.1)',background:'rgba(255,77,106,0.03)'}}>
                <div className="dmc-val" style={{color:'#ff4d6a'}}>{parseInt(stats.users_without_referrer||0)}</div>
                <div className="dmc-lbl">Без реферера</div>
              </div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card dmc-gold">
                <div className="dmc-val">{parseFloat(stats.ref_bonuses_paid||0).toFixed(4)}</div>
                <div className="dmc-lbl">Бонусов выплачено</div>
              </div>
              <div className="dash-metric-card">
                <div className="dmc-val">{parseInt(stats.ref_active_referrers||0)}</div>
                <div className="dmc-lbl">Активных рефереров</div>
              </div>
            </div>
            {parseInt(stats.total_users) > 0 && (
              <div className="dash-donut-row">
                <MiniDonut value={parseInt(stats.users_with_referrer||0)} max={parseInt(stats.total_users)} color="#00e676" size={48} label="С реферером" />
                <MiniDonut value={parseInt(stats.users_without_referrer||0)} max={parseInt(stats.total_users)} color="#ff4d6a" size={48} label="Без реферера" />
                <MiniDonut value={parseInt(stats.total_referrals||0)} max={parseInt(stats.total_users)} color="#a855f7" size={48} label="Реферальность" />
              </div>
            )}
          </div>

          {/* ===== МАЙНИНГ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">⛏</div>
              <div className="dash-sh-title">CT POOL МАЙНИНГ</div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{parseInt(stats.miner_active_contracts||0)}</div>
                <div className="dmc-lbl">Контрактов</div>
              </div>
              <div className="dash-metric-card">
                <div className="dmc-val">{parseInt(stats.miner_total_users||0)}</div>
                <div className="dmc-lbl">Майнеров</div>
              </div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-mini-stat dms-blue">
                <div className="dmst-val">{parseFloat(stats.miner_total_hashrate||0).toFixed(0)}</div>
                <div className="dmst-lbl">GH/s сеть</div>
              </div>
              <div className="dash-mini-stat dms-green">
                <div className="dmst-val">{parseFloat(stats.miner_total_revenue||0).toFixed(2)}</div>
                <div className="dmst-lbl">Выручка</div>
              </div>
              <div className="dash-mini-stat dms-red">
                <div className="dmst-val">{parseInt(stats.miner_pending_withdrawals||0)}</div>
                <div className="dmst-lbl">Ожид. вывод</div>
              </div>
            </div>
            <div className="dash-progress-card">
              <div className="dpc-header">
                <span className="dpc-lbl">Выплачено / Заработано</span>
                <span className="dpc-pct">{parseFloat(stats.miner_total_earned||0) > 0 ? ((parseFloat(stats.miner_paid_amount||0) / parseFloat(stats.miner_total_earned||0)) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="dpc-bar dpc-bar-purple">
                <div className="dpc-fill dpc-fill-purple" style={{width: `${parseFloat(stats.miner_total_earned||0) > 0 ? Math.min(100, (parseFloat(stats.miner_paid_amount||0) / parseFloat(stats.miner_total_earned||0)) * 100) : 0}%`}} />
              </div>
            </div>
          </div>

          {/* ===== РЕКЛАМА ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">📣</div>
              <div className="dash-sh-title">РЕКЛАМА</div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{parseInt(stats.ads_active||0)}</div>
                <div className="dmc-lbl">Активных баннеров</div>
              </div>
              <div className="dash-metric-card">
                <div className="dmc-val">{parseInt(stats.ads_total||0)}</div>
                <div className="dmc-lbl">Всего баннеров</div>
              </div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-mini-stat dms-amber">
                <div className="dmst-val">{parseInt(stats.ad_orders_pending||0)}</div>
                <div className="dmst-lbl">Ожид. заявок</div>
              </div>
              <div className="dash-mini-stat">
                <div className="dmst-val">{parseInt(stats.ad_orders_total||0)}</div>
                <div className="dmst-lbl">Всего заявок</div>
              </div>
            </div>
          </div>

          {/* ===== АУКЦИОН ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">🏛</div>
              <div className="dash-sh-title">АУКЦИОН РЕФЕРАЛОВ</div>
            </div>
            <div className="dash-grid-3">
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{parseInt(stats.auction_active||0)}</div>
                <div className="dmc-lbl">Активных</div>
              </div>
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{parseInt(stats.auction_completed||0)}</div>
                <div className="dmc-lbl">Завершённых</div>
              </div>
              <div className="dash-metric-card">
                <div className="dmc-val">{parseInt(stats.auction_total||0)}</div>
                <div className="dmc-lbl">Всего</div>
              </div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-mini-stat dms-blue">
                <div className="dmst-val">{parseInt(stats.auction_total_bids||0)}</div>
                <div className="dmst-lbl">Ставок</div>
              </div>
              <div className="dash-mini-stat dms-gold">
                <div className="dmst-val">{parseFloat(stats.auction_volume||0).toFixed(2)}</div>
                <div className="dmst-lbl">Объём TON</div>
              </div>
            </div>
          </div>

          {/* ===== ПАРТНЁРЫ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">🤝</div>
              <div className="dash-sh-title">ПАРТНЁРСТВО</div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{parseInt(stats.partners_total||0)}</div>
                <div className="dmc-lbl">Всего заявок</div>
              </div>
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{parseInt(stats.partners_approved||0)}</div>
                <div className="dmc-lbl">Одобрено</div>
              </div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-mini-stat dms-amber">
                <div className="dmst-val">{parseInt(stats.partners_pending||0)}</div>
                <div className="dmst-lbl">Ожидают</div>
              </div>
              <div className="dash-mini-stat dms-red">
                <div className="dmst-val">{parseInt(stats.partners_rejected||0)}</div>
                <div className="dmst-lbl">Отклонено</div>
              </div>
            </div>
          </div>

          {/* ===== ПРОМОКОДЫ ===== */}
          <div className="dash-section">
            <div className="dash-section-header">
              <div className="dash-sh-icon">🎁</div>
              <div className="dash-sh-title">ПРОМОКОДЫ</div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-metric-card dmc-accent">
                <div className="dmc-val">{parseInt(stats.promo_total||0)}</div>
                <div className="dmc-lbl">Всего</div>
              </div>
              <div className="dash-metric-card dmc-green">
                <div className="dmc-val">{parseInt(stats.promo_active||0)}</div>
                <div className="dmc-lbl">Активных</div>
              </div>
            </div>
            <div className="dash-grid-2">
              <div className="dash-mini-stat dms-blue">
                <div className="dmst-val">{parseInt(stats.promo_total_uses||0)}</div>
                <div className="dmst-lbl">Использований</div>
              </div>
              <div className="dash-mini-stat dms-gold">
                <div className="dmst-val">{parseFloat(stats.promo_total_amount||0).toFixed(2)}</div>
                <div className="dmst-lbl">Выплачено TON</div>
              </div>
            </div>
          </div>

          <button className="dash-reload-btn" onClick={loadAll}>
            <span className="drb-icon">↻</span> Обновить данные
          </button>
        </div>
      )}

      {/* ACTIVITY — Live Transactions */}
      {tab === 'activity' && (
        <div className="admin-section dash-stats">
          <div className="dash-section" style={{paddingBottom:8}}>
            <div className="dash-section-header" style={{marginBottom:8}}>
              <div className="dash-sh-icon">⚡</div>
              <div className="dash-sh-title">АКТИВНОСТЬ В РЕАЛЬНОМ ВРЕМЕНИ</div>
              <div className="activity-live-badge" style={{marginLeft:'auto'}}>
                {activityAutoRefresh && <span className="alb-dot" />}
                <span>{activityAutoRefresh ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
            <div className="activity-controls">
              <button className={`act-toggle-btn ${activityAutoRefresh?'on':''}`} onClick={() => {
                const next = !activityAutoRefresh
                setActivityAutoRefresh(next)
                if (next) {
                  // Start polling
                  const poll = async () => {
                    try {
                      const r = await api.get(`/api/admin/activity?limit=50${activityLastTime.current ? '&after='+activityLastTime.current : ''}`)
                      const d = r.data
                      if (d.transactions?.length) {
                        setActivityTxs(prev => {
                          const ids = new Set(prev.map(t => t.id))
                          const news = d.transactions.filter(t => !ids.has(t.id))
                          const merged = [...news, ...prev].slice(0, 200)
                          return merged
                        })
                        activityLastTime.current = d.server_time
                      }
                      setActivityTotal(d.total||0)
                    } catch {}
                  }
                  poll()
                  activityTimer.current = setInterval(poll, 5000)
                } else {
                  clearInterval(activityTimer.current)
                }
              }}>
                {activityAutoRefresh ? '⏸ Пауза' : '▶ Запустить'}
              </button>
              <select className="act-filter" value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
                <option value="all">Все транзакции</option>
                <option value="deposit">💎 Депозиты</option>
                <option value="withdraw">💸 Выводы</option>
                <option value="trading">📈 Трейдинг</option>
                <option value="spin_result">🎡 Спин</option>
                <option value="slots">🎰 Слоты</option>
                <option value="fee">💰 Комиссии</option>
                <option value="bonus">🎁 Бонусы</option>
                <option value="task">✅ Задания</option>
                <option value="ref_bonus">👥 Реф. бонусы</option>
                <option value="admin_adjust">👑 Админ</option>
              </select>
              <button className="act-refresh-btn" onClick={async () => {
                setActivityLoading(true)
                try {
                  const r = await api.get('/api/admin/activity?limit=100')
                  setActivityTxs(r.data.transactions || [])
                  setActivityTotal(r.data.total || 0)
                  activityLastTime.current = r.data.server_time
                } catch {}
                setActivityLoading(false)
              }}>↻</button>
            </div>
            <div className="activity-total">
              Всего транзакций: <span>{activityTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="activity-feed">
            {activityTxs.length === 0 && !activityLoading && (
              <div style={{textAlign:'center',padding:40,color:'rgba(232,242,255,0.3)',fontFamily:'Orbitron,sans-serif',fontSize:11}}>
                {activityAutoRefresh ? 'Ожидание транзакций...' : 'Нажмите ↻ чтобы загрузить'}
              </div>
            )}
            {activityLoading && (
              <div style={{textAlign:'center',padding:30,color:'#00d4ff',fontFamily:'Orbitron,sans-serif',fontSize:10}}>Загрузка...</div>
            )}
            {activityTxs
              .filter(tx => activityFilter === 'all' || tx.type === activityFilter)
              .map(tx => {
              const amt = parseFloat(tx.amount)
              const isPos = amt > 0
              const typeMap = {
                deposit: {icon: '💎', color: '#00e676', lbl: 'Депозит'},
                withdraw: {icon: '💸', color: '#ff4d6a', lbl: 'Вывод'},
                trading: {icon: '📈', color: '#1a5fff', lbl: 'Трейдинг'},
                trading_profit: {icon: '📊', color: '#ffb300', lbl: 'Прибыль трейд'},
                spin_result: {icon: '🎡', color: '#e040fb', lbl: 'Спин'},
                spin_profit: {icon: '🎯', color: '#ffb300', lbl: 'Прибыль спин'},
                slots: {icon: '🎰', color: '#a855f7', lbl: 'Слоты'},
                fee: {icon: '💰', color: '#ffb300', lbl: 'Комиссия'},
                bonus: {icon: '🎁', color: '#00e676', lbl: 'Бонус'},
                task: {icon: '✅', color: '#00d4ff', lbl: 'Задание'},
                ref_bonus: {icon: '👥', color: '#a855f7', lbl: 'Реф. бонус'},
                admin_adjust: {icon: '👑', color: '#ffb300', lbl: 'Админ'},
                staking: {icon: '📈', color: '#00d4ff', lbl: 'Стейкинг'},
              }
              const info = typeMap[tx.type] || {icon: '📋', color: '#6b7280', lbl: tx.type}
              const ago = (() => {
                const d = (Date.now() - new Date(tx.created_at).getTime()) / 1000
                if (d < 60) return `${Math.floor(d)}с`
                if (d < 3600) return `${Math.floor(d/60)}м`
                if (d < 86400) return `${Math.floor(d/3600)}ч`
                return `${Math.floor(d/86400)}д`
              })()
              return (
                <div key={tx.id} className="act-tx-item" style={{'--act-color': info.color}}>
                  <div className="act-tx-icon">{info.icon}</div>
                  <div className="act-tx-body">
                    <div className="act-tx-top">
                      <span className="act-tx-type" style={{color: info.color}}>{info.lbl}</span>
                      <span className="act-tx-time">{ago} назад</span>
                    </div>
                    <div className="act-tx-user">
                      {tx.username ? `@${tx.username}` : tx.first_name || `ID:${tx.telegram_id}`}
                    </div>
                    {tx.label && <div className="act-tx-label">{tx.label}</div>}
                  </div>
                  <div className={`act-tx-amount ${isPos ? 'pos' : 'neg'}`}>
                    {isPos ? '+' : ''}{amt.toFixed(4)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Auto-start polling on mount */}
          {(() => {
            if (activityTxs.length === 0 && !activityTimer.current && activityAutoRefresh) {
              setTimeout(async () => {
                try {
                  const r = await api.get('/api/admin/activity?limit=100')
                  setActivityTxs(r.data.transactions || [])
                  setActivityTotal(r.data.total || 0)
                  activityLastTime.current = r.data.server_time
                  if (activityAutoRefresh && !activityTimer.current) {
                    activityTimer.current = setInterval(async () => {
                      try {
                        const r2 = await api.get(`/api/admin/activity?limit=50&after=${activityLastTime.current}`)
                        if (r2.data.transactions?.length) {
                          setActivityTxs(prev => {
                            const ids = new Set(prev.map(t => t.id))
                            const news = r2.data.transactions.filter(t => !ids.has(t.id))
                            return [...news, ...prev].slice(0, 200)
                          })
                          activityLastTime.current = r2.data.server_time
                        }
                        setActivityTotal(r2.data.total || 0)
                      } catch {}
                    }, 5000)
                  }
                } catch {}
              }, 100)
            }
            return null
          })()}
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
                    ) : s.type === 'textarea' ? (
                      <textarea
                        className="setting-input"
                        rows={6}
                        style={{resize:'vertical',minHeight:80,fontFamily:'DM Sans,sans-serif',lineHeight:1.5,whiteSpace:'pre-wrap'}}
                        value={(settings[s.key] ?? '').replace(/\\n/g, '\n')}
                        onChange={e => setSettings(p => ({...p, [s.key]: e.target.value.replace(/\n/g, '\\n')}))}
                        placeholder="Используйте {REF_LINK} и {PROMO} для подстановки"
                      />
                    ) : (
                      <input
                        className="setting-input"
                        type={s.key.includes('wallet') || s.key.includes('_id') || s.key.includes('block_id') ? 'text' : 'number'}
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
                    <button className="wi-copy-btn" style={{color:'#a78bfa'}} onClick={()=>{
                      setSelectedUser({id:w.user_id, username:w.username, first_name:w.first_name, telegram_id:w.telegram_id, balance_ton:0})
                      openUserStats({id:w.user_id, username:w.username, first_name:w.first_name, telegram_id:w.telegram_id, balance_ton:0})
                      setTab('users')
                    }}>👤 Профиль</button>
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
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div className="stats-section-title" style={{marginBottom:0}}>Тикет #{activeTicket.id} · {activeTicket.username ? '@'+activeTicket.username : activeTicket.first_name}</div>
            <button style={{padding:'6px 12px',border:'none',borderRadius:8,background:'rgba(167,139,250,0.15)',color:'#a78bfa',fontFamily:'Orbitron,sans-serif',fontSize:9,cursor:'pointer',fontWeight:700}}
              onClick={()=>{
                setSelectedUser({id:activeTicket.user_id, username:activeTicket.username, first_name:activeTicket.first_name, telegram_id:activeTicket.telegram_id, balance_ton:0})
                openUserStats({id:activeTicket.user_id, username:activeTicket.username, first_name:activeTicket.first_name, telegram_id:activeTicket.telegram_id, balance_ton:0})
                setActiveTicket(null)
                setTab('users')
              }}>👤 ПРОФИЛЬ</button>
          </div>
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

      {tab === 'auctions' && (
        <div className="admin-section">
          <AuctionsAdmin />
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

          {/* ПОПОЛНЕНИЕ БАЛАНСА */}
          <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:12,marginBottom:10}}>
            <div style={{fontFamily:'Orbitron,sans-serif',fontSize:9,color:'rgba(232,242,255,0.4)',letterSpacing:'.08em',marginBottom:8}}>💰 ИЗМЕНИТЬ БАЛАНС</div>
            <div style={{display:'flex',gap:6,marginBottom:6}}>
              <input id="bal-amount" type="number" step="0.0001" placeholder="Сумма (- для списания)"
                style={{flex:1,background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 10px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none'}}/>
            </div>
            <input id="bal-comment" placeholder="Комментарий (необязательно)"
              style={{width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 10px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',marginBottom:6}}/>
            <div style={{display:'flex',gap:6}}>
              <button style={{flex:1,padding:'8px',border:'none',borderRadius:8,background:'rgba(0,230,118,0.2)',color:'#00e676',fontFamily:'Orbitron,sans-serif',fontSize:9,cursor:'pointer',fontWeight:700}}
                onClick={async()=>{
                  const amt = parseFloat(document.getElementById('bal-amount').value)
                  const comment = document.getElementById('bal-comment').value
                  if (!amt) return showToast('Укажите сумму', true)
                  try {
                    const r = await api.post(`/api/admin/users/${selectedUser.id}/balance`, { amount: amt, comment })
                    setSelectedUser(u => ({...u, balance_ton: r.data.new_balance}))
                    document.getElementById('bal-amount').value = ''
                    document.getElementById('bal-comment').value = ''
                    showToast(`✅ Баланс изменён на ${amt > 0 ? '+' : ''}${amt} TON`)
                  } catch(e) { showToast(e?.response?.data?.error || 'Ошибка', true) }
                }}>✅ ПРИМЕНИТЬ</button>
            </div>
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
