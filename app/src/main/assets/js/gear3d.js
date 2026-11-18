/* #Bash Armory · Paper doll, Warmane 3D, Bash 3D */
/* ---------- Paper doll + 3D model (Warmane's own viewer, in-app) ---------- */
const DOLL_L=[1,2,3,16,5,4,19,9], DOLL_R=[10,6,7,8,11,11,12,12], DOLL_B=["mh","oh",15];
function dollSlots(ch){
  const by={}; (ch._eq||[]).forEach((e,k)=>{ const s=e._i&&e._i.slot; if(!s) return;
    let key = s===20?5 : s===14||s===23||s===22?"oh" : s===21||s===17?"mh" : s===13?(by.mh?"oh":"mh") : (s===25||s===26||s===28)?15 : s;
    (by[key]=by[key]||[]).push(k); });
  return by;
}
const warmaneUrl = (ch, page="summary") => `${ARMORY}/character/${encodeURIComponent(ch.name)}/${encodeURIComponent(ch.realm)}/${page}`;
function open3D(){
  const ch=S.cur; if(!ch) return;
  if (S.params.realm==="DEMO"){ toast("3D radi za prave likove"); return; }
  const url=warmaneUrl(ch,"summary");
  if (window.BashNative && window.BashNative.openWeb) window.BashNative.openWeb(url, ch.name+" · 3D", true);
  else window.open(url,"_blank");
}
function openWarmane(page,title){
  const ch=S.cur; if(!ch) return; const url=warmaneUrl(ch,page);
  if (window.BashNative && window.BashNative.openWeb) window.BashNative.openWeb(url, title||ch.name, false);
  else window.open(url,"_blank");
}

/* ---------- Warmane-style panel on top of the profile (APK) ---------- */
const hasPanel = () => !!(window.BashNative && window.BashNative.showPanel);
S.panelOff = LS.get("panelOff", false);
function panelData(ch){
  const by=dollSlots(ch), used={};
  const cell=key=>{ const list=by[key]||[]; const idx=(used[key]=(used[key]||0)); used[key]++; const k=list[idx]; if(k==null) return null;
    const e=ch._eq[k], i=e._i, t=e._t;
    return {k, icon:i&&i.icon?String(i.icon).toLowerCase():"", q:i?i.quality:1, tmIcon:t&&t.icon?String(t.icon).toLowerCase():"", miss:!!(ch._audit&&ch._audit.known&&((e._needEnch&&!e._ench)||(e._gemCount<e._needGems)))}; };
  const a=ch._audit;
  return { panel:true, classIcon:CLASS_ICON[ch.class]||"", warmaneUrl:warmaneUrl(ch,"summary"), name:ch.name, level:ch.level, raceName:ch.race, className:ch.class, guild:ch.guild||"", online:!!ch.online,
    color:CLASS[ch.class]||"#8cff2e", gs:ch._gs||0, gsColor:gsColor(ch._gs||0),
    audit: a&&a.known ? `✦${a.en}/${a.enNeed} 💎${a.gm}/${a.gmNeed}` : "", auditOk: a&&a.en===a.enNeed&&a.gm===a.gmNeed,
    race:RACE_ID[ch.race]||1, gender:String(ch.gender||"").toLowerCase().startsWith("f")?1:0,
    left:DOLL_L.map(cell), right:DOLL_R.map(cell), bottom:DOLL_B.map(cell),
    items:(ch._eq||[]).filter(e=>e._i).map(e=>({item:itemIdOf(e), transmog:e._tm||0, inv:e._i.slot||0, display:e._i.displayId||0})) };
}
function showCharPanel(ch){
  if (!hasPanel() || S.panelOff || S.params.realm==="DEMO" || !RACE_ID[ch.race]) return;
  const tmKey=(ch._eq||[]).map(e=>e._tm||0).join(",");
  window.BashNative.showPanel(JSON.stringify(panelData(ch)), ch.realm+"/"+ch.name+"/"+tmKey);
}
function panelActive(p){ return hasPanel() && !S.panelOff && p.realm!=="DEMO"; }
function showPanelLoading(p){
  if (!panelActive(p)) return;
  const k=p.realm+"/"+String(p.name).toLowerCase();
  if (S.cache[k]) return; // već učitan → odmah pravi panel
  window.BashNative.showPanel(JSON.stringify({panel:true, loading:true, name:p.name}), "loading/"+k);
}
function hideCharPanel(){ if (hasPanel()) window.BashNative.hidePanel(); }
window.onPanelCollapsed = function(){ S.panelOff=true; LS.set("panelOff",true); if (S.view==="char") viewChar(S.params); };
function panelToggleBtn(){ return hasPanel() && S.panelOff && S.params.realm!=="DEMO" ? `<button class="btn ghost sm" style="width:100%;margin-bottom:10px" onclick="S.panelOff=false;LS.set('panelOff',false);showCharPanel(S.cur);viewChar(S.params)">▾ Prikaži lika</button>` : ""; }
