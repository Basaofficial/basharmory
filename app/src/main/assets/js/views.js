/* #Bash Armory · Početna, favoriti, postavke, profil lika, gear, profesije, PvP */
/* ---------- Views ---------- */
function charRow(c){
  const col = CLASS[c.class]||"#8cff2e";
  return `<div class="it" onclick="go('char',${J({name:c.name,realm:c.realm})})">
    ${avatarHtml(c,38)}
    <div style="flex:1"><div style="color:${col};font-weight:700">${esc(c.name)}</div>
    <div class="sm mut">${c.level?esc(c.level)+" · ":""}${esc(c.race||"")} ${esc(c.class||"")} · ${esc(c.realm)}</div></div>
    ${c.gs?`<b style="color:${gsColor(c.gs)}">${c.gs}</b>`:""}</div>`;
}
function viewHome(){
  return head("#Bash Armory","Warmane · WotLK 3.3.5") + `
  <form class="card col" id="sform">
    <div class="row"><select id="stype" style="flex:1"><option value="char">Lik</option><option value="guild">Guild</option></select>
    <select id="srealm" style="flex:1.4">${REALMS.map(r=>`<option ${r===S.realm?"selected":""}>${r}</option>`).join("")}<option value="DEMO">DEMO</option></select></div>
    <input id="sname" placeholder="Ime lika ili guilda" autocomplete="off" autocapitalize="words">
    <button class="btn">Pretraži</button>
  </form>
  <div class="card"><div class="row" style="justify-content:space-between"><b>Nedavno</b>
    ${S.recent.length?`<button class="btn ghost sm" onclick="S.recent=[];LS.set('recent',[]);render()">Obriši</button>`:""}</div>
    <div class="list">${S.recent.length?S.recent.map(charRow).join(""):`<div class="empty">Još ništa. Probaj realm <b>DEMO</b> za primjer.</div>`}</div></div>`;
}
function viewFavs(){
  return head("Favoriti", S.favs.length+" likova") + `<div class="card">
   ${S.favs.length?`<button class="btn ghost sm" style="margin-bottom:6px" onclick="refreshFavs(this)">↻ Osvježi online status</button>`:""}
   <div class="list">${S.favs.length?S.favs.map(charRow).join(""):`<div class="empty">Dodaj lik u favorite zvjezdicom ★ na profilu.</div>`}</div></div>`;
}
async function refreshFavs(btn){
  btn.disabled=true; btn.textContent="Osvježavam…";
  for (const f of S.favs){ try{ const c=await apiChar(f.name,f.realm); f.online=!!c.online; f.level=c.level; }catch(e){} }
  LS.set("favs",S.favs); render();
}
function viewSettings(){
  return head("Postavke","") + updCard() + watchCard() + `<div class="card col">
   <b>CORS proxy (samo za web verziju)</b>
   <div class="sm mut">APK ne treba proxy. U browseru Warmane blokira direktne zahtjeve, pa unesi URL svog Cloudflare Workera (npr. https://ime.workers.dev/?url=).</div>
   <input id="px" value="${esc(S.proxy)}" placeholder="https://...workers.dev/?url=">
   <button class="btn" onclick="S.proxy=$('#px').value.trim();LS.set('proxy',S.proxy);toast('Snimljeno')">Snimi</button></div>
  <div class="card col"><b>Keš</b><div class="sm mut">Podaci o itemima se čuvaju na telefonu da se brže učitava.</div>
   <button class="btn ghost" onclick="Object.keys(localStorage).filter(k=>k.startsWith('ba_it_')).forEach(k=>localStorage.removeItem(k));toast('Keš obrisan')">Obriši keš itema</button></div>
  <div class="card sm mut">#Bash Armory · by <a style="color:var(--g)" href="https://instagram.com/basa.gtm">@basa.gtm</a><br>
  Podaci: Warmane Armory API · itemi i 3D: Wowhead. Neslužbena fan aplikacija.<br>
  <a style="color:var(--g)" href="https://paypal.me/basagtm">☕ Buy me a coffee</a></div>`;
}

function rememberRecent(ch){
  const e={name:ch.name,realm:ch.realm,class:ch.class,race:ch.race,level:ch.level,online:!!ch.online,gs:ch._gs};
  S.recent=[e,...S.recent.filter(r=>!(r.name===e.name&&r.realm===e.realm))].slice(0,15); LS.set("recent",S.recent);
  const f=S.favs.find(r=>r.name===e.name&&r.realm===e.realm); if(f){Object.assign(f,e);LS.set("favs",S.favs);}
}
function isFav(n,r){return S.favs.some(f=>f.name===n&&f.realm===r)}
function toggleFav(){
  const ch=S.cur; if(!ch) return;
  if (isFav(ch.name,ch.realm)) S.favs=S.favs.filter(f=>!(f.name===ch.name&&f.realm===ch.realm));
  else S.favs.unshift({name:ch.name,realm:ch.realm,class:ch.class,race:ch.race,level:ch.level,online:!!ch.online,gs:ch._gs});
  LS.set("favs",S.favs); $("#favb").textContent=isFav(ch.name,ch.realm)?"★":"☆"; syncWatch();
}

async function loadChar(name, realm){
  const k=realm+"/"+name.toLowerCase();
  if (S.cache[k]) return S.cache[k];
  const ch = await apiChar(name, realm); ch.realm = ch.realm || realm;
  await enrich(ch); S.cache[k]=ch; return ch;
}
async function viewChar(p){
  const app=$("#app");
  app.innerHTML = head(esc(p.name), esc(p.realm), true) + `<div class="spin"></div><div class="empty sm">Učitavam lik i gear…</div>`;
  showPanelLoading(p);
  let ch; try { ch = await loadChar(p.name, p.realm); } catch(e){
    hideCharPanel();
    app.innerHTML = head(esc(p.name), esc(p.realm), true) + `<div class="card err">${esc(e.message)}</div>`; return; }
  if (S.view!=="char" || S.params!==p) return;
  S.cur = ch; rememberRecent(ch); showCharPanel(ch);
  const col = CLASS[ch.class]||"#8cff2e";
  const panelOn = panelActive(p);
  const TABS = (panelOn?[]:[["gear","Gear"]]).concat([["raid","Raid check"],["talents","Talenti"],["prof","Profesije"],["pvp","PvP"]]);
  const tab = TABS.some(t=>t[0]===p.tab) ? p.tab : TABS[0][0];
  app.innerHTML = head(esc(ch.name), `${esc(ch.realm)}${p.realm==="DEMO"?' · <span class="badge">DEMO</span>':""}`, true) + `
  <div class="card">
    <div class="hero">
      ${avatarHtml(ch,72,true)}
      <div style="flex:1;min-width:0">
        <h2 style="color:${col}">${esc(ch.name)}</h2>
        <div class="mut sm">${esc(ch.level)} ${esc(ch.race)} ${esc(ch.class)} · ${esc(ch.faction||"")}</div>
        ${ch.guild?`<div class="sm" style="margin-top:3px;cursor:pointer;color:var(--g)" onclick="go('guild',${J({name:ch.guild,realm:p.realm})})">&lt;${esc(ch.guild)}&gt;</div>`:""}
      </div>
      <button id="favb" class="back" style="font-size:20px" onclick="toggleFav()">${isFav(ch.name,ch.realm)?"★":"☆"}</button>
    </div>
    <div class="stats">
      <div class="stat"><b style="color:${gsColor(ch._gs)}">${ch._gs||"–"}</b><span>GearScore</span></div>
      <div class="stat"><b>${ch._ilvl||"–"}</b><span>Prosj. ilvl</span></div>
      <div class="stat"><b><span class="dot ${ch.online?"on":""}" style="display:inline-block"></span> ${ch.online?"Online":"Offline"}</b><span>Status</span></div>
      <div class="stat"><b>${fmt(ch.achievementpoints)}</b><span>Achievementi</span></div>
      <div class="stat"><b>${fmt(ch.honorablekills)}</b><span>Honor killovi</span></div>
      ${auditStat(ch)}
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn ghost sm" style="flex:1" onclick="addCmp()">⚔ Dodaj u poređenje</button>
      <button class="btn ghost sm" style="flex:1" onclick="open3D()">Warmane 3D ↗</button>
    </div>
    <button class="btn ghost sm" style="width:100%;margin-top:8px;opacity:.7" onclick="showRaw()">🛠 Sirovi podaci (za debug)</button>
  </div>
  ${panelToggleBtn()}<div class="tabs">${TABS.map(([k,l])=>`<button class="tab ${k===tab?"on":""}" onclick="S.params.tab='${k}';viewChar(S.params)">${l}</button>`).join("")}</div>
  <div id="tabc"></div>`;
  const t=$("#tabc");
  if (tab==="gear") t.innerHTML = tabGear(ch);
  else if (tab==="raid") tabRaid(ch, t);
  else if (tab==="talents") tabTalentTrees(ch, t);
  else if (tab==="prof") t.innerHTML = tabProf(ch);
  else if (tab==="pvp") t.innerHTML = tabPvp(ch);
}
function icoHtml(i, label, cls="ico"){
  const q = i?i.quality:0, u = i?iconUrl(i.icon):"";
  return `<div class="${cls} b${q}" style="${u?`background-image:url('${u}')`:""}">${u?"":esc(label||"")}</div>`;
}
const tmCount = ch => (ch._eq||[]).filter(e=>e._t).length;
function auditStat(ch){
  const a=ch._audit;
  if (!a || !a.known) return `<div class="stat"><b>${(ch._eq||[]).length}</b><span>Itema</span></div>`;
  const ok = a.en===a.enNeed && a.gm===a.gmNeed;
  return `<div class="stat" style="border-color:${ok?"#8cff2e55":"#ff5a5a55"}"><b style="color:${ok?"var(--g)":"#ff6b6b"};font-size:14px">✦${a.en}/${a.enNeed} 💎${a.gm}/${a.gmNeed}</b><span>Ench · Gemovi</span></div>`;
}
function auditBadges(ch,e){
  const a=ch._audit; if (!a || !a.known || !e._i) return "";
  const b=[];
  if (e._needEnch) b.push(e._ench?`<span class="badge" style="font-size:10px">✦ enchant</span>`:`<span class="badge" style="font-size:10px;color:#ff6b6b;border-color:#ff6b6b66;background:transparent">✗ bez enchanta</span>`);
  if (e._needGems) { const okg=e._gemCount>=e._needGems; b.push(`<span class="badge" style="font-size:10px;${okg?"":"color:#ff6b6b;border-color:#ff6b6b66;background:transparent"}">💎 ${Math.min(e._gemCount,e._needGems)}/${e._needGems}${e._i.slot===6&&!okg?" (buckle?)":""}</span>`); }
  return b.length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px">${b.join("")}</div>`:"";
}
function tabGear(ch){
  const eq=ch._eq||[]; if(!eq.length) return `<div class="card empty">Nema podataka o opremi.</div>`;
  return `<div class="card">${eq.map((e,k)=>{ const i=e._i; const q=i?i.quality:1; const t=e._t;
    return `<div class="item" onclick="showTip(${k})"><div style="position:relative">${icoHtml(i, slotName(i&&i.slot).slice(0,4))}${t&&t.icon?`<span class="tmm" style="background-image:url('${iconUrl(t.icon)}')"></span>`:""}</div>
      <div style="flex:1;min-width:0"><div class="nm q${q}">${esc((i&&i.name)||e.name||("Item "+itemIdOf(e)))}</div>
      <div class="sm mut">${slotName(i&&i.slot)}${i&&i.ilvl?" · ilvl "+i.ilvl:""}</div>
      ${t?`<div class="sm" style="color:#c070ff">👁 izgleda kao: <span class="q${t.quality}">${esc(t.name)}</span></div>`:""}
      ${auditBadges(ch,e)}</div>
      ${e._gs?`<span class="sm" style="color:${gsColor(ch._gs)}">${e._gs}</span>`:""}</div>`; }).join("")}</div>`;
}
const SLOT_NAMES={1:"Glava",2:"Vrat",3:"Ramena",4:"Košulja",5:"Prsa",20:"Prsa",6:"Pojas",7:"Noge",8:"Stopala",9:"Zglobovi",10:"Ruke",11:"Prsten",12:"Trinket",13:"Jednoručno",21:"Glavna ruka",22:"Druga ruka",23:"Druga ruka",14:"Štit",15:"Daljinsko",25:"Bacanje",26:"Daljinsko",28:"Relic",16:"Plašt",17:"Dvoručno",19:"Tabard"};
const slotName = s => SLOT_NAMES[s]||"Item";
function showTip(k){
  const ch=S.cur; const e=ch&&ch._eq[k]; if(!e) return; const i=e._i; closeTip();
  const d=document.createElement("div"); d.className="tip";
  const a=ch._audit&&ch._audit.known;
  d.innerHTML = `<div class="tiphead">${icoHtml(i,"")}<div style="flex:1;min-width:0"><b class="q${i?i.quality:1}" style="font-size:16px">${esc((i&&i.name)||e.name||"")}</b>
      <div class="sm mut">${slotName(i&&i.slot)}${i&&i.ilvl?" · ilvl "+i.ilvl:""}${e._gs?" · GS "+e._gs:""}</div>${a?auditBadges(ch,e):""}</div>
      <button class="btn sm" onclick="closeTip()">✕</button></div>
   ${e._t?`<div class="tipmog">${icoHtml(e._t,"")}<div><div class="sm" style="color:#c070ff;font-weight:700">👁 TRANSMOG · izgleda kao</div><b class="q${e._t.quality}">${esc(e._t.name)}</b>${e._manual?' <span class="sm mut">(ručno)</span>':""}</div></div>`:""}
   ${i&&i.tooltip?`<div>${sanitizeTip(i.tooltip)}</div>`:`<div class="mut">Tooltip nije dostupan.</div>`}
   <div style="margin-top:8px"><a href="https://www.wowhead.com/wotlk/item=${itemIdOf(e)}" target="_blank">Otvori na Wowheadu ↗</a></div>
   <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px"><b style="color:#c070ff">👁 Promijeni transmog</b>
     <div class="sm mut" style="margin:4px 0 6px">Upiši Wowhead link ili ID itema kako izgleda u igri.</div>
     <div class="row"><input id="tmin" placeholder="npr. wowhead.com/wotlk/item=34322" style="flex:1"><button class="btn sm" onclick="setTmog(${k})">Postavi</button></div>
     ${e._tm||e._manual?`<button class="btn ghost sm" style="margin-top:6px;width:100%" onclick="setTmog(${k},true)">${e._manual?"Vrati na Warmane":"Ukloni transmog"}</button>`:""}</div>`;
  document.body.appendChild(d);
}
function showRaw(){
  const ch=S.cur; if(!ch) return; closeTip();
  const clean=JSON.parse(JSON.stringify(ch,(k,v)=>k.startsWith("_")?undefined:v));
  const d=document.createElement("div"); d.className="tip";
  d.innerHTML=`<div class="row" style="justify-content:space-between;margin-bottom:6px"><b>Sirovi podaci</b><button class="btn sm" onclick="closeTip()">✕</button></div>
    <div class="sm mut">Transmog nađen: ${(ch._eq||[]).filter(e=>e._t).length} · ${esc(S.tmDebug||"API")}</div>
    <pre style="white-space:pre-wrap;word-break:break-all;font-size:11px;color:#bfffa0">${esc(JSON.stringify((clean.equipment||[]).slice(0,4),null,1))}</pre>
    <div class="sm mut">Napravi screenshot i pošalji.</div>`;
  document.body.appendChild(d);
}
async function setTmog(k, clear){
  const ch=S.cur; const e=ch._eq[k]; const key="tm_"+(ch.realm||"")+"/"+String(ch.name).toLowerCase();
  const man=LS.get(key,{}); const id=itemIdOf(e);
  if (clear){ if (e._manual) delete man[id]; else man[id]=-1; }
  else { const v=($("#tmin").value||"").trim(); const m=v.match(/item[=\/](\d+)/i)||v.match(/^(\d{2,6})$/); if(!m){ toast("Upiši link ili ID"); return; } man[id]=num(m[1]); }
  LS.set(key,man); closeTip();
  delete S.cache[S.params.realm+"/"+String(S.params.name).toLowerCase()];
  toast(clear?"Transmog uklonjen":"Transmog postavljen"); viewChar(S.params);
}
function closeTip(){ document.querySelectorAll(".tip").forEach(t=>t.remove()); }
function sanitizeTip(h){ const d=document.createElement("div"); d.innerHTML=h;
  d.querySelectorAll("script,iframe,object,embed,style,link").forEach(n=>n.remove());
  d.querySelectorAll("*").forEach(n=>{[...n.attributes].forEach(a=>{ if(/^on/i.test(a.name)||(a.name==="href"&&/^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name); });
    if (n.tagName==="A"){ const h=n.getAttribute("href")||""; if(h.startsWith("/")) n.setAttribute("href","https://www.wowhead.com"+h); n.setAttribute("target","_blank"); } });
  return d.innerHTML; }

function tabTalents(ch){
  const t=ch.talents; if(!t||!t.length) return `<div class="card empty">Nema talenata.</div>`;
  return t.map((s,ix)=>{ let pts="";
    if (Array.isArray(s.points)) { const arr=s.points.map(p=>Array.isArray(p)?p.reduce((a,b)=>a+num(b),0):num(p)); pts=arr.join(" / "); }
    return `<div class="card"><div class="row" style="justify-content:space-between"><b>${ix===0?"Glavni spec":"Drugi spec"}</b><span class="badge">${esc(s.tree||"?")}</span></div>
    ${pts?`<div class="gs hand" style="margin-top:8px;color:var(--g)">${pts}</div>`:""}</div>`; }).join("");
}
function tabProf(ch){
  const p=ch.professions; if(!p||!p.length) return `<div class="card empty">Nema profesija.</div>`;
  return `<div class="card">${p.map(x=>{const s=num(x.skill),m=450; return `<div style="margin:6px 0 12px">
    <div class="row" style="justify-content:space-between"><b>${esc(x.name)}</b><span class="mut">${s}/${m}</span></div>
    <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100,s/m*100)}%"></i></div></div>`}).join("")}</div>`;
}
function tabPvp(ch){
  const t=ch.pvpteams||[];
  return `<div class="card"><div class="stats" style="margin-top:0">
    <div class="stat"><b>${fmt(ch.honorablekills)}</b><span>Honor killovi</span></div>
    <div class="stat"><b>${t.length}</b><span>Arena timova</span></div>
    <div class="stat"><b>${t.length?Math.max(...t.map(x=>num(x.rating))):"–"}</b><span>Najbolji rating</span></div></div></div>
   ${t.map(x=>`<div class="card row"><span class="badge">${esc(x.type||"")}</span><div style="flex:1"><b>${esc(x.name||"")}</b>
     ${x.rank?`<div class="sm mut">Rank ${esc(x.rank)}</div>`:""}</div><div class="gs" style="font-size:22px;color:var(--g)">${esc(x.rating||"")}</div></div>`).join("")}`;
}
