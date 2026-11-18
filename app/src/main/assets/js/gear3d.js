/* #Bash Armory · Paper doll, Warmane 3D, Bash 3D */
/* ---------- Paper doll + 3D model (Warmane's own viewer, in-app) ---------- */
const DOLL_L=[1,2,3,16,5,4,19,9], DOLL_R=[10,6,7,8,11,11,12,12], DOLL_B=["mh","oh",15];
function dollSlots(ch){
  const by={}; (ch._eq||[]).forEach((e,k)=>{ const s=e._i&&e._i.slot; if(!s) return;
    let key = s===20?5 : s===14||s===23||s===22?"oh" : s===21||s===17?"mh" : s===13?(by.mh?"oh":"mh") : (s===25||s===26||s===28)?15 : s;
    (by[key]=by[key]||[]).push(k); });
  return by;
}
function dollCell(ch, by, key, used){
  const list=by[key]||[]; const idx=(used[key]=(used[key]||0)); used[key]++;
  const k=list[idx]; const e=k!=null?ch._eq[k]:null; const i=e&&e._i; const t=e&&e._t&&S.look?e._t:null;
  const u=(t||i)?iconUrl((t||i).icon):"";
  return `<div class="slot ${i?"b"+i.quality:""}" ${k!=null?`onclick="showTip(${k})"`:""} style="${u?`background-image:url('${u}')`:""}">${t?`<span class="tm">T</span>`:""}${u?"":(i?esc(slotName(i.slot).slice(0,4)):"")}</div>`;
}
const warmaneUrl = (ch, page="summary") => `${ARMORY}/character/${encodeURIComponent(ch.name)}/${encodeURIComponent(ch.realm)}/${page}`;
function open3D(){
  const ch=S.cur; if(!ch) return;
  if (S.params.realm==="DEMO"){ toast("3D radi za prave likove"); return; }
  const url=warmaneUrl(ch,"summary");
  if (window.BashNative && window.BashNative.openWeb) window.BashNative.openWeb(url, ch.name+" · 3D", true);
  else window.open(url,"_blank");
}
function openBash3D(){
  const ch=S.cur; if(!ch) return;
  const race=RACE_ID[ch.race]; const gender=String(ch.gender||"").toLowerCase().startsWith("f")?1:0;
  if (!race){ toast("Nepoznata rasa"); return; }
  if (!(window.BashNative && window.BashNative.openModel)){ toast("Bash 3D radi u APK-u"); return; }
  const items=(ch._eq||[]).filter(e=>e._i).map(e=>({item:itemIdOf(e), transmog:e._tm||0, inv:e._i.slot||0, display:e._i.displayId||0}));
  window.BashNative.openModel(JSON.stringify({name:ch.name, race, gender, items}), ch.name+" · Bash 3D");
}
function openWarmane(page,title){
  const ch=S.cur; if(!ch) return; const url=warmaneUrl(ch,page);
  if (window.BashNative && window.BashNative.openWeb) window.BashNative.openWeb(url, title||ch.name, false);
  else window.open(url,"_blank");
}
function tabModel(ch){
  const by=dollSlots(ch), used={}; const col=CLASS[ch.class]||"#8cff2e";
  return `<div class="card" style="text-align:center">
    <div class="sm mut" style="margin-bottom:10px">3D lik s tvojim gearom${tmCount(ch)?" i transmogom":""}, kao u igri. Vrti ga prstom.</div>
    <button class="btn" style="width:100%;padding:16px;font-size:17px" onclick="openBash3D()">▶ Bash 3D lik</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="open3D()">Warmane 3D</button></div>
  <div class="card"><b>Oprema</b>${tmCount(ch)?`<div style="margin-top:8px">${lookToggle()}</div>`:""}<div class="doll" style="margin-top:10px">
    <div class="side">${DOLL_L.map(s=>dollCell(ch,by,s,used)).join("")}</div>
    <div class="center" style="color:${col}">
      <svg class="sil" viewBox="0 0 100 200" fill="currentColor" opacity=".35"><circle cx="50" cy="22" r="15"/><path d="M28 42h44l10 50-10 4-6-30v52l4 66H58l-8-56-8 56H30l4-66V66l-6 30-10-4z"/></svg>
      <div class="hand" style="margin-top:6px;font-size:20px">${esc(ch.name)}</div>
      <div class="sm mut">${esc(ch.race)} ${esc(ch.class)}</div>
      <div class="gs" style="margin:6px 0 10px;color:${gsColor(ch._gs)}">${ch._gs||""}</div>
    </div>
    <div class="side">${DOLL_R.map(s=>dollCell(ch,by,s,used)).join("")}</div>
    <div class="bottom">${DOLL_B.map(s=>dollCell(ch,by,s,used)).join("")}</div>
  </div></div>`;
}

/* ---------- Warmane-style panel on top of the profile (APK) ---------- */
const hasPanel = () => !!(window.BashNative && window.BashNative.showPanel);
S.panelOff = LS.get("panelOff", false);
function panelData(ch){
  const by=dollSlots(ch), used={};
  const cell=key=>{ const list=by[key]||[]; const idx=(used[key]=(used[key]||0)); used[key]++; const k=list[idx]; if(k==null) return null;
    const e=ch._eq[k], i=e._i, t=S.look&&e._t?e._t:null, src=t||i;
    return {k, icon:src&&src.icon?String(src.icon).toLowerCase():"", q:i?i.quality:1, tm:!!t, miss:!!(ch._audit&&ch._audit.known&&((e._needEnch&&!e._ench)||(e._gemCount<e._needGems)))}; };
  const a=ch._audit;
  return { panel:true, name:ch.name, level:ch.level, raceName:ch.race, className:ch.class, guild:ch.guild||"", online:!!ch.online,
    color:CLASS[ch.class]||"#8cff2e", gs:ch._gs||0, gsColor:gsColor(ch._gs||0),
    audit: a&&a.known ? `✦${a.en}/${a.enNeed} 💎${a.gm}/${a.gmNeed}` : "", auditOk: a&&a.en===a.enNeed&&a.gm===a.gmNeed,
    race:RACE_ID[ch.race]||1, gender:String(ch.gender||"").toLowerCase().startsWith("f")?1:0,
    left:DOLL_L.map(cell), right:DOLL_R.map(cell), bottom:DOLL_B.map(cell),
    items:(ch._eq||[]).filter(e=>e._i).map(e=>({item:itemIdOf(e), transmog:e._tm||0, inv:e._i.slot||0, display:e._i.displayId||0})) };
}
function showCharPanel(ch){
  if (!hasPanel() || S.panelOff || S.params.realm==="DEMO" || !RACE_ID[ch.race]) return;
  const tmKey=(ch._eq||[]).map(e=>e._tm||0).join(",");
  window.BashNative.showPanel(JSON.stringify(panelData(ch)), ch.realm+"/"+ch.name+"/"+tmKey+"/"+S.look);
}
function hideCharPanel(){ if (hasPanel()) window.BashNative.hidePanel(); }
window.onPanelCollapsed = function(){ S.panelOff=true; LS.set("panelOff",true); if (S.view==="char") viewChar(S.params); };
function panelToggleBtn(){ return hasPanel() && S.panelOff && S.params.realm!=="DEMO" ? `<button class="btn ghost sm" style="width:100%;margin-bottom:10px" onclick="S.panelOff=false;LS.set('panelOff',false);showCharPanel(S.cur);viewChar(S.params)">▾ Prikaži 3D lika</button>` : ""; }
