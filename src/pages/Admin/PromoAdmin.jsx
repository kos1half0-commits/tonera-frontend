// PromoAdmin component — полное управление промокодами
import { useState, useEffect } from 'react'
import api from '../../api/index'

export default function PromoAdmin() {
  const [promos, setPromos] = useState([])
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setPromoToast] = useState('')
  const [toastErr, setPromoToastErr] = useState(false)
  const [promoTab, setPromoTab] = useState('manual')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirmDel, setConfirmDel] = useState(null)

  const load = () => api.get('/api/promo/all').then(r => setPromos(r.data||[])).catch(()=>{})
  useEffect(() => { load() }, [])
  const showToast = (m, err=false) => { setPromoToast(m); setPromoToastErr(err); setTimeout(() => setPromoToast(''), 3000) }

  const create = async () => {
    if (!code.trim() || !amount) { showToast('\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043a\u043e\u0434 \u0438 \u0441\u0443\u043c\u043c\u0443', true); return }
    setSaving(true)
    try {
      await api.post('/api/promo/create', {
        code, amount: parseFloat(amount), max_uses: parseInt(maxUses)||1,
        expires_at: expiresAt || null
      })
      setCode(''); setAmount(''); setMaxUses('1'); setExpiresAt('')
      await load(); showToast('\u2705 \u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u0441\u043e\u0437\u0434\u0430\u043d!')
    } catch (e) { showToast(e?.response?.data?.error || '\u041e\u0448\u0438\u0431\u043a\u0430', true) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/api/promo/${id}/edit`, editForm)
      setEditingId(null); setEditForm({})
      await load(); showToast('\u2705 \u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e')
    } catch (e) { showToast(e?.response?.data?.error || '\u041e\u0448\u0438\u0431\u043a\u0430', true) }
  }

  const manualPromos = promos.filter(p => (!p.type || p.type === 'manual') && p.active)
  const partnerPromos = promos.filter(p => p.type === 'partner' && p.active)
  const archivePromos = promos.filter(p => !p.active || (p.expires_at && new Date(p.expires_at) < new Date()) || p.uses >= p.max_uses)

  const totalPromos = promos.length
  const activePromos = promos.filter(p => p.active).length
  const totalUses = promos.reduce((s, p) => s + (p.uses || 0), 0)
  const totalSpent = promos.reduce((s, p) => s + parseFloat(p.amount || 0) * (p.uses || 0), 0)
  const totalBudget = promos.reduce((s, p) => s + parseFloat(p.amount || 0) * (p.max_uses || 0), 0)

  const S = {
    input: {background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'},
    btn: (c={}) => ({padding:'7px 14px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',transition:'all .2s',...c}),
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3,marginTop:8,textTransform:'uppercase'},
    ptab: (a) => ({padding:'8px 16px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',background:a?'rgba(0,212,255,0.15)':'rgba(26,95,255,0.06)',color:a?'#00d4ff':'rgba(232,242,255,0.3)',transition:'all .2s'}),
    statCard: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 14px',flex:1,minWidth:70},
    statVal: (color) => ({fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color,lineHeight:1.2}),
    statLbl: {fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)',marginTop:2},
  }

  const getPromoStatus = (p) => {
    if (!p.active) return { text: '\u0412\u044b\u043a\u043b', color: '#ff4d6a' }
    if (p.expires_at && new Date(p.expires_at) < new Date()) return { text: '\u0418\u0441\u0442\u0451\u043a', color: '#ff4d6a' }
    if (p.uses >= p.max_uses) return { text: '\u0418\u0441\u0447\u0435\u0440\u043f\u0430\u043d', color: '#ffb300' }
    return { text: '\u0410\u043a\u0442\u0438\u0432\u0435\u043d', color: '#00e676' }
  }

  const renderPromo = (p) => {
    const status = getPromoStatus(p)
    const isEditing = editingId === p.id
    const progress = p.max_uses > 0 ? Math.min(100, p.uses / p.max_uses * 100) : 0

    return (
      <div key={p.id} style={{background:'#0e1c3a',border:`1px solid ${status.color === '#00e676' ? 'rgba(26,95,255,0.2)' : 'rgba(255,77,106,0.15)'}`,borderRadius:12,padding:'12px 14px',marginBottom:8,transition:'all .2s'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <span style={{fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color:status.color === '#00e676' ? '#00d4ff' : 'rgba(232,242,255,0.35)',flex:1,letterSpacing:'.05em'}}>{p.code}</span>
          <span style={{fontSize:8,fontFamily:'Orbitron',fontWeight:700,color:status.color,background:`${status.color}15`,padding:'3px 8px',borderRadius:5}}>{status.text}</span>
          {p.type === 'partner' && <span style={{fontSize:8,fontFamily:'Orbitron',fontWeight:700,color:'#a855f7',background:'rgba(168,85,247,0.1)',padding:'3px 8px',borderRadius:5}}>{'\u041f\u0430\u0440\u0442\u043d\u0451\u0440'}</span>}
        </div>

        {/* Info row */}
        {!isEditing && (
          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:8}}>
            <div>
              <div style={{fontFamily:'Orbitron',fontSize:11,color:'#ffb300',fontWeight:700}}>{parseFloat(p.amount).toFixed(4)} TON</div>
              <div style={{fontSize:8,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>{'\u041d\u0430\u0433\u0440\u0430\u0434\u0430'}</div>
            </div>
            <div>
              <div style={{fontFamily:'Orbitron',fontSize:11,color:'#00e676',fontWeight:700}}>{p.uses} / {p.max_uses}</div>
              <div style={{fontSize:8,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>{'\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043e'}</div>
            </div>
            <div>
              <div style={{fontFamily:'Orbitron',fontSize:11,color:'#00d4ff',fontWeight:700}}>{(parseFloat(p.amount) * p.uses).toFixed(4)} TON</div>
              <div style={{fontSize:8,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>{'\u041f\u043e\u0442\u0440\u0430\u0447\u0435\u043d\u043e'}</div>
            </div>
            {p.expires_at && <div>
              <div style={{fontFamily:'Orbitron',fontSize:11,color:new Date(p.expires_at)<new Date()?'#ff4d6a':'#a855f7',fontWeight:700}}>
                {new Date(p.expires_at)<new Date()?'\u0418\u0441\u0442\u0451\u043a':new Date(p.expires_at).toLocaleString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{fontSize:8,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>{'\u0421\u0440\u043e\u043a'}</div>
            </div>}
            {p.channel_name && <div>
              <div style={{fontFamily:'Orbitron',fontSize:11,color:'#a855f7',fontWeight:700}}>{p.channel_name}</div>
              <div style={{fontSize:8,color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans'}}>{'\u041a\u0430\u043d\u0430\u043b'}</div>
            </div>}
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
            <div style={{flex:'1 1 100px'}}>
              <span style={S.label}>{'\u041a\u043e\u0434'}</span>
              <input style={S.input} value={editForm.code||''} onChange={e=>setEditForm(f=>({...f,code:e.target.value}))} />
            </div>
            <div style={{flex:'0 0 80px'}}>
              <span style={S.label}>{'\u0421\u0443\u043c\u043c\u0430'}</span>
              <input style={S.input} type="number" step="0.001" value={editForm.amount||''} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))} />
            </div>
            <div style={{flex:'0 0 60px'}}>
              <span style={S.label}>{'\u041c\u0430\u043a\u0441'}</span>
              <input style={S.input} type="number" value={editForm.max_uses||''} onChange={e=>setEditForm(f=>({...f,max_uses:e.target.value}))} />
            </div>
            <div style={{flex:'0 0 140px'}}>
              <span style={S.label}>{'\u0418\u0441\u0442\u0435\u043a\u0430\u0435\u0442'}</span>
              <input style={S.input} type="datetime-local" value={editForm.expires_at||''} onChange={e=>setEditForm(f=>({...f,expires_at:e.target.value}))} />
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div style={{height:4,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden',marginBottom:8}}>
          <div style={{height:'100%',width:`${progress}%`,background:progress>=100?'linear-gradient(90deg,#ff4d6a,#ffb300)':'linear-gradient(90deg,#1a5fff,#00d4ff)',borderRadius:2,transition:'width .5s ease'}}/>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {isEditing ? (
            <>
              <button style={S.btn({background:'linear-gradient(135deg,#1a5fff,#0930cc)',color:'#fff',flex:1})} onClick={()=>saveEdit(p.id)}>{'\uD83D\uDCBE \u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}</button>
              <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})} onClick={()=>{setEditingId(null);setEditForm({})}}>{'✕'}</button>
            </>
          ) : (
            <>
              <button style={S.btn({background:'rgba(0,212,255,0.1)',color:'#00d4ff'})} onClick={()=>{
                setEditingId(p.id)
                setEditForm({
                  code: p.code,
                  amount: String(p.amount),
                  max_uses: String(p.max_uses),
                  expires_at: p.expires_at ? new Date(p.expires_at).toISOString().slice(0,16) : ''
                })
              }}>{'\u270F\uFE0F'}</button>
              <button style={S.btn({background:p.active?'rgba(255,179,0,0.12)':'rgba(0,230,118,0.12)',color:p.active?'#ffb300':'#00e676'})}
                onClick={async()=>{await api.put(`/api/promo/${p.id}/toggle`);load()}}>{p.active?'\u23F8':'\u25B6\uFE0F'}</button>
              {confirmDel === p.id ? (
                <>
                  <button style={S.btn({background:'rgba(255,77,106,0.2)',color:'#ff4d6a',flex:1})} onClick={async()=>{await api.delete(`/api/promo/${p.id}`);setConfirmDel(null);load();showToast('\u0423\u0434\u0430\u043b\u0435\u043d\u043e')}}>{'\u0414\u0430, \u0443\u0434\u0430\u043b\u0438\u0442\u044c'}</button>
                  <button style={S.btn({background:'rgba(26,95,255,0.1)',color:'rgba(232,242,255,0.5)'})} onClick={()=>setConfirmDel(null)}>{'\u041d\u0435\u0442'}</button>
                </>
              ) : (
                <button style={S.btn({background:'rgba(255,77,106,0.08)',color:'#ff4d6a'})} onClick={()=>setConfirmDel(p.id)}>{'\uD83D\uDDD1'}</button>
              )}
              <button style={S.btn({background:'rgba(168,85,247,0.1)',color:'#a855f7',marginLeft:'auto'})} onClick={()=>{navigator.clipboard.writeText(p.code);showToast('\uD83D\uDCCB \u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e')}}>{'\uD83D\uDCCB'}</button>
            </>
          )}
        </div>
      </div>
    )
  }

  const getFilteredPromos = () => {
    if (promoTab === 'manual') return manualPromos
    if (promoTab === 'partner') return partnerPromos
    if (promoTab === 'archive') return archivePromos
    return promos
  }

  return (
    <div>
      {/* Toast */}
      {toast && <div style={{background:toastErr?'rgba(255,77,106,0.1)':'rgba(0,230,118,0.1)',border:`1px solid ${toastErr?'rgba(255,77,106,0.3)':'rgba(0,230,118,0.3)'}`,borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron',fontSize:10,color:toastErr?'#ff4d6a':'#00e676',marginBottom:12,textAlign:'center',fontWeight:700}}>{toast}</div>}

      {/* Stats row */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <div style={S.statCard}>
          <div style={S.statVal('#00d4ff')}>{totalPromos}</div>
          <div style={S.statLbl}>{'\u0412\u0441\u0435\u0433\u043e'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('#00e676')}>{activePromos}</div>
          <div style={S.statLbl}>{'\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('#ffb300')}>{totalUses}</div>
          <div style={S.statLbl}>{'\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u0439'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('#a855f7')}>{totalSpent.toFixed(2)}</div>
          <div style={S.statLbl}>{'\u0412\u044b\u0434\u0430\u043d\u043e TON'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('rgba(232,242,255,0.5)')}>{totalBudget.toFixed(2)}</div>
          <div style={S.statLbl}>{'\u0411\u044e\u0434\u0436\u0435\u0442 TON'}</div>
        </div>
      </div>

      {/* Create form */}
      <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,color:'#00d4ff',fontWeight:700,marginBottom:10,letterSpacing:'.08em'}}>{'\u2795 \u0421\u041E\u0417\u0414\u0410\u0422\u042C \u041F\u0420\u041E\u041C\u041E\u041A\u041E\u0414'}</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 120px'}}>
            <span style={S.label}>{'\u041a\u043e\u0434'}</span>
            <input style={S.input} value={code} onChange={e=>setCode(e.target.value)} placeholder="TONERA2025" />
          </div>
          <div style={{flex:'0 0 90px'}}>
            <span style={S.label}>{'\u0421\u0443\u043c\u043c\u0430 (TON)'}</span>
            <input style={S.input} type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.5"/>
          </div>
          <div style={{flex:'0 0 70px'}}>
            <span style={S.label}>{'\u041c\u0430\u043a\u0441. \u0438\u0441\u043f.'}</span>
            <input style={S.input} type="number" value={maxUses} onChange={e=>setMaxUses(e.target.value)} placeholder="1"/>
          </div>
          <div style={{flex:'0 0 160px'}}>
            <span style={S.label}>{'\u0418\u0441\u0442\u0435\u043a\u0430\u0435\u0442 (\u043e\u043f\u0446.)'}</span>
            <input style={S.input} type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} />
          </div>
        </div>
        <button style={{padding:'11px 14px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,cursor:'pointer',background:'linear-gradient(135deg,#1a5fff,#0930cc)',color:'#fff',width:'100%',marginTop:12}}
          onClick={create} disabled={saving}>
          {saving ? '\u23F3 \u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435...' : '\u2728 \u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        <button style={S.ptab(promoTab==='manual')} onClick={()=>setPromoTab('manual')}>{'\uD83C\uDFAF \u0420\u0443\u0447\u043d\u044b\u0435 ('+manualPromos.length+')'}</button>
        <button style={S.ptab(promoTab==='partner')} onClick={()=>setPromoTab('partner')}>{'\uD83E\uDD1D \u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0438\u0435 ('+partnerPromos.length+')'}</button>
        <button style={S.ptab(promoTab==='archive')} onClick={()=>setPromoTab('archive')}>{'\uD83D\uDCE6 \u0410\u0440\u0445\u0438\u0432 ('+archivePromos.length+')'}</button>
        <button style={S.ptab(promoTab==='all')} onClick={()=>setPromoTab('all')}>{'\uD83D\uDCCA \u0412\u0441\u0435 ('+promos.length+')'}</button>
      </div>

      {/* Promo list */}
      {getFilteredPromos().length === 0 && (
        <div style={{textAlign:'center',color:'rgba(232,242,255,0.25)',padding:'30px 20px',fontFamily:'DM Sans',fontSize:13}}>
          {promoTab === 'manual' && '\uD83C\uDFAF \u041d\u0435\u0442 \u0440\u0443\u0447\u043d\u044b\u0445 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u043e\u0432'}
          {promoTab === 'partner' && '\uD83E\uDD1D \u041d\u0435\u0442 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0438\u0445 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u043e\u0432'}
          {promoTab === 'archive' && '\uD83D\uDCE6 \u0410\u0440\u0445\u0438\u0432 \u043f\u0443\u0441\u0442'}
          {promoTab === 'all' && '\u041d\u0435\u0442 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u043e\u0432'}
        </div>
      )}
      {getFilteredPromos().map(p => renderPromo(p))}
    </div>
  )
}
