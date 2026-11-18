/* #Bash Armory · DKP sistem */
/* ---------- DKP system ---------- */
const DKP_PRESETS = [["Boss kill",10],["ICC LK kill",25],["HC boss",15],["LK HC",40],["Na vrijeme",5],["Cijeli raid",10],["Wipe night",5]];
S.dkp = LS.get("dkp", {pools:[], cur:null});
const dkpSave = () => LS.set("dkp", S.dkp);
const dkpPool = () => S.dkp.pools.find(p=>p.id===S.dkp.cur) || S.dkp.pools[0] || null;
function dkpPoints(pool){
  const pts={}; Object.keys(pool.members).forEach(n=>pts[n]=0);
  for (const e of pool.log){
    if (e.type==="decay"){ Object.keys(pts).forEach(n=>{ pts[n]=Math.round(pts[n]*(1-e.pct/100)*10)/10; }); continue; }
    (e.who||[]).forEach(n=>{ if (pts[n]==null) pts[n]=0; pts[n]=Math.round((pts[n]+e.amt)*10)/10; });
  }
  return pts;
}
function sheet(html){ closeSheet(); const sh=document.createElement("div"); sh.className="shade"; sh.id="shade"; sh.onclick=closeSheet;
  const d=document.createElement("div"); d.className="sheet"; d.id="sheet"; d.innerHTML=html; document.body.append(sh,d); }
function closeSheet(){ ["shade","sheet"].forEach(id=>{const e=document.getElementById(id); if(e) e.remove();}); }
const _bb = window.bashBack; window.bashBack = function(){ if (document.getElementById("sheet")){ closeSheet(); return true; } return _bb(); };

function viewDkp(){
  const pool=dkpPool();
  if (!pool || S.dkpCreating) return head("DKP","Bodovi za raid i loot") + `<div class="card col"><b>Napravi DKP listu</b>
    <div class="sm mut">Npr. za svoj guild ili stalnu ICC grupu. Članove možeš uvesti direktno iz Warmane guilda.</div>
    <input id="dkn" placeholder="Naziv (npr. ICC25 Bash Squad)"><select id="dkr">${REALMS.map(r=>`<option ${r===S.realm?"selected":""}>${r}</option>`).join("")}<option value="DEMO">DEMO</option></select>
    <button class="btn" onclick="dkpCreate()">Napravi</button></div>
    <div class="card col"><b>Imaš kod od nekoga?</b><button class="btn ghost" onclick="dkpImportSheet()">Uvezi DKP listu</button></div>`;
  const pts=dkpPoints(pool); const sort=S.dkpSort||"pts";
  const list=Object.keys(pool.members).sort((a,b)=> sort==="name"?a.localeCompare(b) : (pts[b]-pts[a])||a.localeCompare(b));
  return head("DKP", esc(pool.name)+" · "+esc(pool.realm)) + `
   ${S.dkp.pools.length>1?`<div class="chips" style="margin-bottom:10px">${S.dkp.pools.map(p=>`<button class="chip ${p.id===pool.id?"on":""}" onclick="S.dkp.cur='${p.id}';dkpSave();render()">${esc(p.name)}</button>`).join("")}</div>`:""}
   <div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
     <button class="btn" onclick="dkpAwardSheet()">+ Bodovi</button>
     <button class="btn" style="background:#c070ff;box-shadow:0 6px 20px #c070ff40" onclick="dkpLootSheet()">💎 Loot</button>
     <button class="btn ghost sm" onclick="dkpMemberSheet()">+ Član / guild</button>
     <button class="btn ghost sm" onclick="dkpHistory()">📜 Historija</button>
     <button class="btn ghost sm" onclick="dkpShare()">📤 Podijeli listu</button>
     <button class="btn ghost sm" onclick="dkpMore()">⚙ Više</button></div></div>
   <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:4px"><b>Stanje (${list.length})</b>
     <div class="chips">${[["pts","Bodovi"],["name","Ime"]].map(([k,l])=>`<button class="chip ${sort===k?"on":""}" onclick="S.dkpSort='${k}';render()">${l}</button>`).join("")}</div></div>
     ${list.length?list.map((n,i)=>{const m=pool.members[n]; const col=CLASS[m.cls]||"#e8ffe0";
       return `<div class="mrow" onclick="dkpMemberInfo(${J(n)})"><span class="mut sm" style="width:22px">${i+1}.</span>
         <div style="flex:1;min-width:0"><b style="color:${col}">${esc(n)}</b><div class="sm mut">${esc(m.cls||"")}</div></div>
         <span class="pts ${pts[n]<0?"neg":"pos"}">${pts[n]}</span></div>`}).join(""):`<div class="empty">Dodaj članove: <b>+ Član / guild</b></div>`}</div>`;
}
function dkpCreate(){ const n=$("#dkn").value.trim(); if(!n){toast("Upiši naziv");return;}
  const p={id:"p"+Date.now(), name:n, realm:$("#dkr").value, members:{}, log:[]}; S.dkp.pools.push(p); S.dkp.cur=p.id; S.dkpCreating=false; dkpSave(); render(); dkpMemberSheet(); }
function dkpLog(e){ const p=dkpPool(); e.t=Date.now(); p.log.push(e); dkpSave(); }
function memberChecks(pool, sel){
  const names=Object.keys(pool.members).sort();
  return `<div class="row" style="justify-content:space-between;margin:8px 0"><b>Ko dobija</b><button class="chip" onclick="document.querySelectorAll('.dkc').forEach(c=>c.checked=!c.checked)">Obrni sve</button></div>
   ${names.map(n=>`<label class="mrow"><input type="checkbox" class="dkc" value="${esc(n)}" ${sel?"checked":""}><b style="color:${CLASS[pool.members[n].cls]||"#e8ffe0"}">${esc(n)}</b></label>`).join("")}`;
}
function dkpAwardSheet(){
  const pool=dkpPool(); if(!Object.keys(pool.members).length){ toast("Prvo dodaj članove"); return; }
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:18px">+ DKP bodovi</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <div class="chips" style="margin:10px 0">${DKP_PRESETS.map(([l,v])=>`<button class="chip" onclick="$('#dka').value=${v};$('#dkw').value='${l}'">${l} +${v}</button>`).join("")}</div>
   <div class="row"><input id="dka" type="number" inputmode="decimal" placeholder="Bodovi" style="flex:1"><input id="dkw" placeholder="Razlog (npr. ICC25 HC)" style="flex:2"></div>
   <div class="sm mut" style="margin-top:4px">Negativan broj oduzima bodove (kazna).</div>
   ${memberChecks(pool,true)}
   <button class="btn" style="width:100%;margin-top:12px" onclick="dkpAward()">Dodijeli</button>`);
}
function dkpAward(){ const amt=parseFloat($("#dka").value); if(isNaN(amt)||!amt){toast("Upiši bodove");return;}
  const who=[...document.querySelectorAll(".dkc:checked")].map(c=>c.value); if(!who.length){toast("Izaberi članove");return;}
  dkpLog({type:amt<0?"adjust":"award", who, amt, note:$("#dkw").value.trim()||"Bodovi"}); closeSheet(); toast(`${amt>0?"+":""}${amt} za ${who.length} igrača`); render(); }
function dkpLootSheet(){
  const pool=dkpPool(); const names=Object.keys(pool.members).sort(); if(!names.length){ toast("Prvo dodaj članove"); return; }
  const pts=dkpPoints(pool);
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:18px">💎 Loot</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <select id="dlw" style="margin-top:10px">${names.sort((a,b)=>pts[b]-pts[a]).map(n=>`<option value="${esc(n)}">${esc(n)} · ${pts[n]} DKP</option>`).join("")}</select>
   <input id="dli" placeholder="Item: naziv ili Wowhead ID / link" style="margin-top:8px">
   <div class="row" style="margin-top:8px"><input id="dlc" type="number" inputmode="decimal" placeholder="Cijena" style="flex:1">
   <button class="chip" onclick="$('#dlc').value=Math.max(0,Math.floor((pts[$('#dlw').value]||0)/2))">½ bodova</button></div>
   <div class="sm mut" style="margin-top:4px">Cijena se oduzima od bodova igrača.</div>
   <button class="btn" style="width:100%;margin-top:12px;background:#c070ff" onclick="dkpLoot()">Upiši loot</button>`);
  window.pts=pts;
}
async function dkpLoot(){
  const who=$("#dlw").value, cost=parseFloat($("#dlc").value); let item=$("#dli").value.trim();
  if (isNaN(cost)){ toast("Upiši cijenu"); return; } if(!item){ toast("Upiši item"); return; }
  let id=0; const m=item.match(/item[=\/](\d+)/i)||item.match(/^(\d{3,6})$/); if (m) id=num(m[1]);
  let q=4; if (id){ const i=await itemInfo(id).catch(()=>null); if (i&&i.name){ item=i.name; q=i.quality; } }
  dkpLog({type:"loot", who:[who], amt:-Math.abs(cost), note:item, item:id, q}); closeSheet(); toast(`${who}: ${item} (−${Math.abs(cost)})`); render();
}
function dkpMemberSheet(){
  const pool=dkpPool();
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:18px">Članovi</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <div class="col" style="margin-top:10px"><b>Uvezi iz Warmane guilda</b><div class="row"><input id="dgn" placeholder="Ime guilda" style="flex:1"><button class="btn" onclick="dkpGuildLoad()">Učitaj</button></div>
   <div id="dgl"></div>
   <b style="margin-top:8px">Ili dodaj ručno</b><div class="row"><input id="dmn" placeholder="Ime lika" style="flex:1">
   <select id="dmc" style="flex:1">${Object.keys(CLASS).filter(c=>c!=="Monk").map(c=>`<option>${c}</option>`).join("")}</select></div>
   <button class="btn ghost" onclick="dkpAddManual()">Dodaj</button></div>`);
}
function dkpAddManual(){ const n=$("#dmn").value.trim(); if(!n) return; const p=dkpPool();
  const nm=n[0].toUpperCase()+n.slice(1).toLowerCase(); p.members[nm]={cls:$("#dmc").value}; dkpSave(); $("#dmn").value=""; toast(nm+" dodan"); render(); }
async function dkpGuildLoad(){
  const p=dkpPool(); const g=$("#dgn").value.trim(); if(!g) return; const box=$("#dgl"); box.innerHTML=`<div class="spin"></div>`;
  try { const gd=await apiGuild(g,p.realm); const ros=(gd.roster||gd.members||[]).filter(m=>num(m.level)>=80||p.realm==="DEMO");
    S.dkpRoster=ros;
    box.innerHTML=`<div class="row" style="justify-content:space-between;margin:8px 0"><span class="sm mut">${ros.length} likova na 80</span><button class="chip" onclick="document.querySelectorAll('.dgc').forEach(c=>c.checked=!c.checked)">Obrni sve</button></div>
      ${ros.map((m,i)=>`<label class="mrow"><input type="checkbox" class="dgc" value="${i}" ${p.members[m.name]?"checked disabled":""}><b style="color:${CLASS[m.class]||"#fff"}">${esc(m.name)}</b><span class="sm mut">${esc(m.class)}</span></label>`).join("")}
      <button class="btn" style="width:100%;margin-top:10px" onclick="dkpGuildAdd()">Dodaj izabrane</button>`;
  } catch(e){ box.innerHTML=`<div class="sm" style="color:#ff8a8a;margin-top:6px">${esc(e.message)}</div>`; }
}
function dkpGuildAdd(){ const p=dkpPool(); let n=0;
  document.querySelectorAll(".dgc:checked:not(:disabled)").forEach(c=>{ const m=S.dkpRoster[num(c.value)]; if(m&&!p.members[m.name]){ p.members[m.name]={cls:m.class}; n++; } });
  dkpSave(); closeSheet(); toast(n+" članova dodano"); render(); }
function dkpMemberInfo(n){
  const p=dkpPool(); const pts=dkpPoints(p); const hist=p.log.map((e,i)=>({...e,i})).filter(e=>e.type==="decay"||(e.who||[]).includes(n)).reverse().slice(0,30);
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:20px;color:${CLASS[p.members[n].cls]||"#fff"}">${esc(n)}</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <div class="gs" style="margin:8px 0;color:${pts[n]<0?"#ff6b6b":"var(--g)"}">${pts[n]} DKP</div>
   <div class="row" style="gap:8px"><button class="btn ghost sm" style="flex:1" onclick="closeSheet();go('char',${J({name:n,realm:p.realm})})">Armory profil</button>
   <button class="btn ghost sm" style="flex:1;color:#ff8a8a;border-color:#ff8a8a" onclick="if(confirmTwice(this)){delete dkpPool().members[${J(n)}];dkpSave();closeSheet();render()}">Ukloni</button></div>
   <div style="margin-top:10px">${hist.length?hist.map(dkpLogRow).join(""):`<div class="empty sm">Još nema unosa.</div>`}</div>`);
}
function confirmTwice(btn){ if (btn.dataset.ok) return true; btn.dataset.ok=1; btn.textContent="Sigurno? Klikni opet"; return false; }
function dkpLogRow(e){
  const d=new Date(e.t); const dt=d.toLocaleDateString("de-DE")+" "+d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  const what = e.type==="decay" ? `Decay −${e.pct}%` : e.type==="loot" ? `💎 <span class="q${e.q||4}">${esc(e.note)}</span> → ${esc(e.who[0])}` : `${esc(e.note||"Bodovi")} · ${e.who.length} igrača`;
  return `<div class="mrow"><div style="flex:1;min-width:0"><div style="font-size:14px">${what}</div><div class="sm mut">${dt}</div></div>
    ${e.type==="decay"?"":`<span class="pts ${e.amt<0?"neg":"pos"}" style="font-size:15px">${e.amt>0?"+":""}${e.amt}</span>`}
    <button class="chip" style="padding:4px 8px" onclick="if(confirmTwice(this)){dkpPool().log.splice(${e.i},1);dkpSave();closeSheet();render();toast('Poništeno')}">↶</button></div>`;
}
function dkpHistory(){ const p=dkpPool(); const rows=p.log.map((e,i)=>({...e,i})).reverse();
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:18px">📜 Historija</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <div class="sm mut" style="margin:4px 0 8px">↶ poništi unos (klikni dvaput)</div>${rows.length?rows.map(dkpLogRow).join(""):`<div class="empty">Prazno.</div>`}`); }
function dkpText(p){ const pts=dkpPoints(p); return `◈ DKP – ${p.name} (${p.realm})\n`+Object.keys(p.members).sort((a,b)=>pts[b]-pts[a]).map((n,i)=>`${i+1}. ${n} – ${pts[n]}`).join("\n")+`\n\n#Bash Armory`; }
function dkpShare(){ const t=dkpText(dkpPool());
  if (window.BashNative && window.BashNative.share) window.BashNative.share(t);
  else { try { navigator.clipboard.writeText(t); toast("Kopirano"); } catch(e){} } }
function dkpCode(p){ return "BASHDKP:"+btoa(unescape(encodeURIComponent(JSON.stringify(p)))); }
function dkpMore(){ const p=dkpPool();
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:18px">⚙ DKP opcije</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <div class="col" style="margin-top:10px">
   <b>Decay (smanji svima)</b><div class="row"><input id="ddp" type="number" inputmode="decimal" placeholder="%" value="10" style="flex:1"><button class="btn" onclick="const v=parseFloat($('#ddp').value);if(v>0&&v<100){dkpLog({type:'decay',pct:v});closeSheet();render();toast('Decay '+v+'%')}">Primijeni</button></div>
   <b style="margin-top:6px">Dijeli s raid leaderom / officerima</b>
   <button class="btn ghost" onclick="const c=dkpCode(dkpPool());window.BashNative&&BashNative.share?BashNative.share(c):navigator.clipboard.writeText(c)">📤 Pošalji DKP kod</button>
   <button class="btn ghost" onclick="dkpImportSheet()">📥 Uvezi DKP kod</button>
   <b style="margin-top:6px">Liste</b>
   <button class="btn ghost" onclick="S.dkp.cur=null;closeSheet();dkpNewPool()">+ Nova DKP lista</button>
   <button class="btn ghost" style="color:#ff8a8a;border-color:#ff8a8a" onclick="if(confirmTwice(this)){S.dkp.pools=S.dkp.pools.filter(x=>x.id!==dkpPool().id);S.dkp.cur=S.dkp.pools[0]?S.dkp.pools[0].id:null;dkpSave();closeSheet();render()}">Obriši ovu listu</button></div>`); }
function dkpNewPool(){ S.dkpCreating=true; render(); window.scrollTo(0,0); }
function dkpImportSheet(){
  sheet(`<div class="row" style="justify-content:space-between"><b style="font-size:18px">📥 Uvezi DKP</b><button class="btn sm" onclick="closeSheet()">✕</button></div>
   <textarea id="dkimp" placeholder="Zalijepi BASHDKP:… kod" style="width:100%;height:120px;margin-top:10px;background:#050805;color:var(--txt);border:1px solid var(--line);border-radius:12px;padding:10px"></textarea>
   <button class="btn" style="width:100%;margin-top:10px" onclick="dkpImport()">Uvezi</button>`); }
function dkpImport(){ try { const t=$("#dkimp").value.trim().replace(/^BASHDKP:/,""); const p=JSON.parse(decodeURIComponent(escape(atob(t))));
    if(!p.members||!p.log) throw 0; const ex=S.dkp.pools.findIndex(x=>x.id===p.id); if(ex>=0) S.dkp.pools[ex]=p; else S.dkp.pools.push(p);
    S.dkp.cur=p.id; dkpSave(); closeSheet(); toast(ex>=0?"Lista ažurirana":"Lista uvezena"); S.stack=[]; go("dkp",{},false);
  } catch(e){ toast("Kod nije ispravan"); } }
