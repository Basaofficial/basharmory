/* #Bash Armory · Auto update (kao #Bash Talk) */
/* ---------- Auto update (same as #Bash Talk) ---------- */
const hasUpd = () => !!(window.BashNative && window.BashNative.updInfo);
function updInfo(){ try { return JSON.parse(window.BashNative.updInfo()); } catch(e){ return {}; } }
S.upd = { state:"", msg:"" };
function updCard(){
  if (!hasUpd()) return `<div class="card col"><b>Ažuriranja</b><div class="sm mut">Automatski update radi u APK verziji.</div></div>`;
  const i=updInfo(); const st=S.upd;
  const stTxt = {checking:"Provjeravam…", none:"Imaš najnoviju verziju ✓", offline:"Nema interneta", available:"Nova verzija "+(st.ver||"")+" je dostupna!",
    downloading:"Preuzimam…", progress:"Preuzimam… "+(st.pct||0)+"%", installing:"Instaliram…", confirm:"Potvrdi instalaciju", perm:"Treba dozvola za instalaciju", error:"Greška: "+(st.msg||"")}[st.state]||"";
  return `<div class="card col"><div class="row" style="justify-content:space-between"><b>Ažuriranja</b><span class="badge">v${esc(i.ver||"?")}</span></div>
    <div class="chips">${[["auto","Automatski"],["ask","Pitaj me"],["off","Isključeno"]].map(([k,l])=>`<button class="chip ${i.mode===k?"on":""}" onclick="BashNative.updMode('${k}');render()">${l}</button>`).join("")}</div>
    <div class="sm mut">Automatski: sam skine i instalira novu verziju. Provjera se radi i u pozadini.</div>
    ${stTxt?`<div class="sm" style="color:${st.state==="error"?"#ff8a8a":"var(--g)"}">${esc(stTxt)}</div>`:""}
    ${st.state==="progress"?`<div class="bar"><i style="width:${st.pct||0}%"></i></div>`:""}
    <div class="row"><button class="btn" style="flex:1" onclick="S.upd={state:'checking'};BashNative.updCheck();render()">Provjeri sada</button>
    ${(st.state==="available"||st.state==="error"||i.latest)?`<button class="btn ghost" style="flex:1" onclick="BashNative.updInstall()">Instaliraj</button>`:""}</div>
    ${!i.canInstall?`<button class="btn ghost sm" onclick="BashNative.updPerm()">Dozvoli instalaciju ažuriranja</button>`:""}</div>`;
}
window.onUpdate = function(o){
  S.upd = o||{};
  if (o.state==="perm"){ showUpdBar(`Dozvoli #Bash Armory da instalira ažuriranja.`, `<button class="btn sm" onclick="BashNative.updPerm();closeUpdBar()">Dozvoli</button>`); }
  else if (o.state==="available"){ showUpdBar(`🆕 Nova verzija ${esc(o.ver||"")}<div class="sm mut">${esc(o.notes||"")}</div>`,
     `<button class="btn sm" onclick="BashNative.updInstall();closeUpdBar()">Instaliraj</button><button class="btn ghost sm" onclick="BashNative.updSnooze();closeUpdBar()">Kasnije</button>`); }
  else if (o.state==="progress" || o.state==="downloading"){ showUpdBar(`⬇️ Preuzimam update… ${o.pct||0}%<div class="bar" style="margin-top:6px"><i style="width:${o.pct||0}%"></i></div>`, ""); }
  else if (o.state==="installing"){ showUpdBar(`Instaliram novu verziju…`, ""); }
  else if (o.state==="error"){ showUpdBar(`Update nije uspio: ${esc(o.msg||"")}`, `<button class="btn ghost sm" onclick="closeUpdBar()">OK</button>`); }
  else if (o.state==="none" && S.view==="settings"){ toast("Imaš najnoviju verziju ✓"); }
  if (S.view==="settings") render();
};
window.openUpdate = function(){ S.stack=[]; go("settings",{},false); };
function showUpdBar(html, btns){ closeUpdBar(); const d=document.createElement("div"); d.className="updbar"; d.id="updbar";
  d.innerHTML=`<div>${html}</div>${btns?`<div class="row" style="margin-top:8px;gap:8px">${btns}</div>`:""}`; document.body.appendChild(d); }
function closeUpdBar(){ const d=document.getElementById("updbar"); if(d) d.remove(); }
