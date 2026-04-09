import { useState, useEffect } from 'react'
import api from '../../api/index'

export default function AdsAdmin() {
  const [ads, setAds] = useState([])
  const [form, setForm] = useState({ title:'', text:'', image_url:'', link:'', pages:'home,tasks,games,staking,miner,wallet', linkToAdOrder:false })
  const [editing, setEditing] = useState(null)
  const [toast, setAdsToast] = useState('')
  const [adsTab, setAdsTab] = useState('manual')

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
    await load(); showToast('\u2705 \u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e')
  }

  const manualAds = ads.filter(a => !a.type || a.type === 'manual')
  const partnerAds = ads.filter(a => a.type === 'partner')

  const S = {
    input: {width:'100%',background:'#0b1630',border:'1px solid rgba(26,95,255,0.3)',borderRadius:8,padding:'8px 12px',color:'#e8f2ff',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',marginBottom:8,boxSizing:'border-box'},
    label: {fontFamily:'Orbitron,sans-serif',fontSize:8,color:'rgba(232,242,255,0.35)',letterSpacing:'.08em',display:'block',marginBottom:3},
    btn: (c={}) => ({padding:'7px 12px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',...c}),
    ptab: (a) => ({padding:'8px 16px',border:'none',borderRadius:8,fontFamily:'Orbitron,sans-serif',fontSize:9,fontWeight:700,cursor:'pointer',background:a?'rgba(0,212,255,0.15)':'rgba(26,95,255,0.06)',color:a?'#00d4ff':'rgba(232,242,255,0.3)',transition:'all .2s'}),
    statCard: {background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.15)',borderRadius:10,padding:'10px 14px',flex:1,minWidth:70},
    statVal: (color) => ({fontFamily:'Orbitron,sans-serif',fontSize:14,fontWeight:900,color,lineHeight:1.2}),
    statLbl: {fontFamily:'DM Sans,sans-serif',fontSize:8,color:'rgba(232,242,255,0.3)',marginTop:2},
  }

  const renderAd = (ad) => {
    const isPartner = ad.type === 'partner'
    const isExpired = ad.expires_at && new Date(ad.expires_at) < new Date()
    const statusColor = !ad.active ? '#ff4d6a' : isExpired ? '#ffb300' : '#00e676'
    const statusText = !ad.active ? '\u0412\u044b\u043a\u043b' : isExpired ? '\u0418\u0441\u0442\u0451\u043a' : '\u0410\u043a\u0442\u0438\u0432\u0435\u043d'

    return (
      <div key={ad.id} style={{background:'#0e1c3a',border:`1px solid ${ad.active && !isExpired?'rgba(26,95,255,0.2)':'rgba(255,77,106,0.15)'}`,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
        {ad.image_url && <img src={ad.image_url} style={{width:'100%',borderRadius:8,marginBottom:6,maxHeight:80,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:11,fontWeight:700,color:'#e8f2ff',flex:1}}>{ad.title||'\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f'}</div>
          <span style={{fontSize:8,fontFamily:'Orbitron',fontWeight:700,color:statusColor,background:`${statusColor}15`,padding:'3px 8px',borderRadius:5}}>{statusText}</span>
          {isPartner && <span style={{fontSize:8,fontFamily:'Orbitron',fontWeight:700,color:'#a855f7',background:'rgba(168,85,247,0.1)',padding:'3px 8px',borderRadius:5}}>{'\u041f\u0430\u0440\u0442\u043d\u0451\u0440'}</span>}
        </div>
        <div style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'rgba(232,242,255,0.4)',marginBottom:2}}>{ad.text}</div>
        <div style={{display:'flex',gap:8,fontSize:9,color:'rgba(232,242,255,0.3)',marginBottom:6,flexWrap:'wrap'}}>
          <span>{'\uD83D\uDCC4 '+ad.pages}</span>
          {isPartner && ad.username && <span>{'\uD83D\uDC64 @'+ad.username}</span>}
          {ad.expires_at && <span>{'\u23F0 '+new Date(ad.expires_at).toLocaleDateString('ru',{day:'numeric',month:'short'})}</span>}
        </div>
        {ad.expires_at && (
          <div style={{height:3,background:'rgba(26,95,255,0.1)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
            <div style={{height:'100%',borderRadius:2,background:isExpired?'#ff4d6a':'linear-gradient(90deg,#1a5fff,#00d4ff)',width:isExpired?'100%':(Math.max(0,Math.min(100,(new Date(ad.expires_at)-new Date())/(14*24*60*60*1000)*100))+'%'),transition:'width .5s'}}/>
          </div>
        )}
        <div style={{display:'flex',gap:6}}>
          {!isPartner && <button style={S.btn({flex:1,background:'rgba(26,95,255,0.15)',color:'#00d4ff'})} onClick={()=>{setEditing(ad.id);setForm({title:ad.title||'',text:ad.text||'',image_url:ad.image_url||'',link:ad.link||'',pages:ad.pages||''})}}>{'\u270F\uFE0F \u0420\u0435\u0434.'}</button>}
          <button style={S.btn({background:ad.active?'rgba(255,179,0,0.15)':'rgba(0,230,118,0.15)',color:ad.active?'#ffb300':'#00e676'})} onClick={async()=>{await api.put(`/api/ads/${ad.id}`,{...ad,active:!ad.active});load()}}>
            {ad.active?'\u23F8':'\u25B6\uFE0F'}
          </button>
          <button style={S.btn({background:'rgba(255,77,106,0.1)',color:'#ff4d6a'})} onClick={async()=>{await api.delete(`/api/ads/${ad.id}`);load()}}>{'\uD83D\uDDD1'}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toast && <div style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'Orbitron,sans-serif',fontSize:9,color:'#00e676',marginBottom:10}}>{toast}</div>}

      {/* Stats */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <div style={S.statCard}>
          <div style={S.statVal('#00d4ff')}>{ads.length}</div>
          <div style={S.statLbl}>{'\u0412\u0441\u0435\u0433\u043e'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('#00e676')}>{ads.filter(a=>a.active).length}</div>
          <div style={S.statLbl}>{'\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('#a855f7')}>{partnerAds.length}</div>
          <div style={S.statLbl}>{'\u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0438\u0445'}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statVal('#ffb300')}>{manualAds.length}</div>
          <div style={S.statLbl}>{'\u0420\u0443\u0447\u043d\u044b\u0445'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        <button style={S.ptab(adsTab==='manual')} onClick={()=>setAdsTab('manual')}>{'\uD83C\uDFAF \u0420\u0443\u0447\u043d\u044b\u0435 ('+manualAds.length+')'}</button>
        <button style={S.ptab(adsTab==='partner')} onClick={()=>setAdsTab('partner')}>{'\uD83E\uDD1D \u041f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0438\u0435 ('+partnerAds.length+')'}</button>
        <button style={S.ptab(adsTab==='all')} onClick={()=>setAdsTab('all')}>{'\uD83D\uDCCA \u0412\u0441\u0435 ('+ads.length+')'}</button>
      </div>

      {/* Create form — only for manual tab */}
      {adsTab !== 'partner' && (
        <div style={{background:'#0e1c3a',border:'1px solid rgba(26,95,255,0.2)',borderRadius:12,padding:14,marginBottom:12}}>
          <div style={{fontFamily:'Orbitron,sans-serif',fontSize:10,fontWeight:700,color:'#e8f2ff',marginBottom:10}}>
            {editing ? '\u270F\uFE0F \u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435' : '\u2795 \u041d\u043e\u0432\u044b\u0439 \u0431\u0430\u043d\u043d\u0435\u0440'}
          </div>
          <span style={S.label}>{'\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a'}</span>
          <input style={S.input} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder={'\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0440\u0435\u043a\u043b\u0430\u043c\u044b'}/>
          <span style={S.label}>{'\u0422\u0435\u043a\u0441\u0442'}</span>
          <textarea style={{...S.input,resize:'none'}} rows={2} value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))} placeholder={'\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435...'}/>
          <span style={S.label}>{'\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0430'}</span>
          {form.image_url ? (
            <div style={{position:'relative',marginBottom:8}}>
              <img src={form.image_url} style={{width:'100%',borderRadius:8,maxHeight:80,objectFit:'cover'}}/>
              <button onClick={()=>setForm(p=>({...p,image_url:''}))} style={{position:'absolute',top:4,right:4,padding:'3px 7px',border:'none',borderRadius:5,background:'rgba(255,77,106,0.8)',color:'#fff',cursor:'pointer',fontSize:10}}>{'\u2715'}</button>
            </div>
          ) : (
            <label style={{display:'block',padding:'10px',border:'1px dashed rgba(26,95,255,0.3)',borderRadius:8,textAlign:'center',cursor:'pointer',color:'rgba(232,242,255,0.3)',fontFamily:'DM Sans,sans-serif',fontSize:12,marginBottom:8}}>
              {'\uD83D\uDCF7 \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c'}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => setForm(p=>({...p,image_url:ev.target.result}))
                reader.readAsDataURL(file)
              }}/>
            </label>
          )}
          <span style={S.label}>{'\u0421\u0441\u044b\u043b\u043a\u0430 (\u043e\u043f\u0446.)'}</span>
          <input style={{...S.input,opacity:form.linkToAdOrder?0.3:1}} value={form.link} onChange={e=>setForm(p=>({...p,link:e.target.value}))} placeholder="https://..." disabled={form.linkToAdOrder}/>
          <span style={S.label}>{'\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u044b'}</span>
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
              {editing ? '\uD83D\uDCBE \u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c' : '\u2795 \u0421\u043e\u0437\u0434\u0430\u0442\u044c'}
            </button>
            {editing && <button style={S.btn({background:'rgba(255,77,106,0.15)',color:'#ff4d6a'})} onClick={()=>{setEditing(null);setForm({title:'',text:'',image_url:'',link:'',pages:'home,tasks,games,staking,miner,wallet'})}}>{'\u2715'}</button>}
          </div>
        </div>
      )}

      {/* Ad list */}
      {(adsTab === 'manual' ? manualAds : adsTab === 'partner' ? partnerAds : ads).length === 0 && (
        <div style={{textAlign:'center',color:'rgba(232,242,255,0.25)',padding:'30px 20px',fontFamily:'DM Sans',fontSize:13}}>
          {adsTab === 'manual' && '\uD83C\uDFAF \u041d\u0435\u0442 \u0440\u0443\u0447\u043d\u044b\u0445 \u0431\u0430\u043d\u043d\u0435\u0440\u043e\u0432'}
          {adsTab === 'partner' && '\uD83E\uDD1D \u041d\u0435\u0442 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u0441\u043a\u0438\u0445 \u0431\u0430\u043d\u043d\u0435\u0440\u043e\u0432'}
          {adsTab === 'all' && '\u041d\u0435\u0442 \u0431\u0430\u043d\u043d\u0435\u0440\u043e\u0432'}
        </div>
      )}
      {(adsTab === 'manual' ? manualAds : adsTab === 'partner' ? partnerAds : ads).map(ad => renderAd(ad))}
    </div>
  )
}
