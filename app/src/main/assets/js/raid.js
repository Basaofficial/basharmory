/* #Bash Armory · Raid check (achievementi) */
/* ---------- Raid check (achievements) ---------- */
const W = (n,s)=>n.replace("X",s);
function iccSet(sz){ return [
  {n:`The Frozen Throne (${sz} player)`, t:"Lich King ubijen"},
  {n:`Storming the Citadel (${sz} player)`, t:"Krilo 1"}, {n:`The Plagueworks (${sz} player)`, t:"Plagueworks"},
  {n:`The Crimson Hall (${sz} player)`, t:"Crimson Hall"}, {n:`The Frostwing Halls (${sz} player)`, t:"Frostwing Halls"} ]; }
function iccHcSet(sz){ return [
  {n: sz===10?"Bane of the Fallen King":"The Light of Dawn", t:"Lich King HC ubijen", key:true},
  {n:`Heroic: Storming the Citadel (${sz} player)`, t:"Krilo 1 HC"}, {n:`Heroic: The Plagueworks (${sz} player)`, t:"Plagueworks HC"},
  {n:`Heroic: The Crimson Hall (${sz} player)`, t:"Crimson Hall HC"}, {n:`Heroic: The Frostwing Halls (${sz} player)`, t:"Frostwing Halls HC"} ]; }
const RAIDS = [
  {k:"ICC10",   g:"ICC", n:"ICC 10",    gs:5000, a:iccSet(10)},
  {k:"ICC10HC", g:"ICC", n:"ICC 10 HC", gs:5600, a:iccHcSet(10)},
  {k:"ICC25",   g:"ICC", n:"ICC 25",    gs:5400, a:iccSet(25)},
  {k:"ICC25HC", g:"ICC", n:"ICC 25 HC", gs:6000, a:iccHcSet(25)},
  {k:"RS10",    g:"RS",  n:"RS 10",     gs:5300, a:[{n:"The Twilight Destroyer (10 player)",t:"Halion"}]},
  {k:"RS10HC",  g:"RS",  n:"RS 10 HC",  gs:5800, a:[{n:"Heroic: The Twilight Destroyer (10 player)",t:"Halion HC"}]},
  {k:"RS25",    g:"RS",  n:"RS 25",     gs:5600, a:[{n:"The Twilight Destroyer (25 player)",t:"Halion"}]},
  {k:"RS25HC",  g:"RS",  n:"RS 25 HC",  gs:6100, a:[{n:"Heroic: The Twilight Destroyer (25 player)",t:"Halion HC"}]},
  {k:"TOC10",   g:"ToC", n:"ToC 10",    gs:4500, a:[{n:"Call of the Crusade (10 player)",t:"Anub'arak"}]},
  {k:"TOGC10",  g:"ToC", n:"ToGC 10",   gs:5000, a:[{n:"Call of the Grand Crusade (10 player)",t:"Anub'arak HC"}]},
  {k:"TOC25",   g:"ToC", n:"ToC 25",    gs:4800, a:[{n:"Call of the Crusade (25 player)",t:"Anub'arak"}]},
  {k:"TOGC25",  g:"ToC", n:"ToGC 25",   gs:5300, a:[{n:"Call of the Grand Crusade (25 player)",t:"Anub'arak HC"}]},
  {k:"ULD10",   g:"Ulduar", n:"Ulduar 10", gs:4000, a:[{n:"The Descent into Madness (10 player)",t:"Yogg-Saron"},{n:"Observed (10 player)",t:"Algalon"}]},
  {k:"ULD25",   g:"Ulduar", n:"Ulduar 25", gs:4300, a:[{n:"The Descent into Madness (25 player)",t:"Yogg-Saron"},{n:"Observed (25 player)",t:"Algalon"}]},
  {k:"NAXX10",  g:"Naxx", n:"Naxx 10",  gs:3500, a:[{n:"The Fall of Naxxramas (10 player)",t:"Kel'Thuzad"}]},
  {k:"NAXX25",  g:"Naxx", n:"Naxx 25",  gs:3800, a:[{n:"The Fall of Naxxramas (25 player)",t:"Kel'Thuzad"}]},
  {k:"ONY10",   g:"Ony",  n:"Onyxia 10", gs:4500, a:[{n:"Onyxia's Lair (10 player)",t:"Onyxia"}]},
  {k:"ONY25",   g:"Ony",  n:"Onyxia 25", gs:4800, a:[{n:"Onyxia's Lair (25 player)",t:"Onyxia"}]},
  {k:"OS10",    g:"OS",   n:"OS 10 +3", gs:3800, a:[{n:"Obsidian Slayer (10 player)",t:"Sartharion"},{n:"The Twilight Zone (10 player)",t:"+3 drakea"}]},
  {k:"OS25",    g:"OS",   n:"OS 25 +3", gs:4200, a:[{n:"Obsidian Slayer (25 player)",t:"Sartharion"},{n:"The Twilight Zone (25 player)",t:"+3 drakea"}]},
];
const RAID_CATS = [168, 14922, 14923, 15062, 14806, 14808];
const norm = t => String(t||"").toLowerCase().replace(/[’`´]/g,"'").replace(/\s+/g," ").trim();
async function postText(url, body){
  if (window.BashNative && window.BashNative.post){
    return new Promise((res,rej)=>{ const id="r"+(++reqId); pending[id]={res,rej}; window.BashNative.post(id,url,body);
      setTimeout(()=>{ if(pending[id]){delete pending[id];rej(new Error("Timeout"))} },30000); });
  }
  const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","X-Requested-With":"XMLHttpRequest"},body});
  if(!r.ok) throw new Error("HTTP "+r.status); return r.text();
}
function unwrapHtml(t){ try{ const j=JSON.parse(t); if(typeof j==="string") return j;
  if(j&&typeof j==="object") return [j.content,j.html,j.data,j.achievements].filter(x=>typeof x==="string").join("\n") || JSON.stringify(j);
} catch(e){} return t||""; }
const DATE_RE = /(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}-\d{2}-\d{2})/;
function judge(doc, name){
  const target=norm(name); let best=null;
  for (const el of doc.querySelectorAll("body *")){
    if (el.children.length>3) continue;
    const tx=norm(el.textContent); if (!tx || tx.length>120) continue;
    if (tx===target || (tx.startsWith(target) && tx.length<target.length+40)) { best=el; break; }
  }
  if (!best) return {state:"no"};
  for (let go=true; go;){ go=false; for (const c of best.children){ if (norm(c.textContent)===norm(best.textContent)){ best=c; go=true; break; } } }
  let box=best.parentElement||best, hop=0;
  while (box.parentElement && hop<5){ const c=(box.className||"")+" "+(box.id||"");
    if (/achiev|ach_|ach-|item|row|entry|li/i.test(c) || box.tagName==="LI" || box.tagName==="TR") break;
    if (box.parentElement.tagName==="BODY") break; box=box.parentElement; hop++; }
  const cls=(box.className||"")+" "+[...box.querySelectorAll("*")].map(n=>n.className).join(" ");
  const txt=box.textContent||"";
  const dm=txt.match(DATE_RE);
  if (/locked|incomplete|unearned|not[-_ ]?earned|disabled/i.test(cls) && !dm) return {state:"no"};
  if (dm) return {state:"yes", date:dm[1]};
  if (/\bearned\b|complete|completed|unlocked/i.test(cls)) return {state:"yes"};
  return {state:"maybe"};
}
async function loadRaidData(ch, realm){
  if (realm==="DEMO") return {ok:true, res:DEMO_RAID};
  const k="raid_"+realm+"/"+ch.name.toLowerCase(); if (S.cache[k]) return S.cache[k];
  const url=warmaneUrl(ch,"achievements");
  const parts=[];
  try { parts.push(unwrapHtml(await getText(url))); } catch(e){}
  for (const c of RAID_CATS){ try { parts.push(unwrapHtml(await postText(url,"category="+c))); } catch(e){} }
  const html=parts.join("\n");
  const doc=new DOMParser().parseFromString(html,"text/html");
  const all=RAIDS.flatMap(r=>r.a.map(x=>x.n));
  const res={}; let seen=0;
  all.forEach(n=>{ const r=judge(doc,n); res[n]=r; if(r.state!=="no") seen++; });
  const anyAch = /achiev/i.test(html) && seen>0;
  const out={ok:anyAch, res}; if (anyAch) S.cache[k]=out; return out;
}
function raidStatus(r, res){
  const key=r.a.find(x=>x.key)||r.a[0]; const st=res[key.n]||{state:"no"};
  return st.state;
}
const MARK = {yes:"✓", no:"✗", maybe:"?"};
const MCOL = {yes:"#8cff2e", no:"#ff5a5a", maybe:"#ffd23f"};
async function tabRaid(ch, el){
  el.innerHTML = `<div class="spin"></div><div class="empty sm">Provjeravam achievemente na Warmaneu…</div>`;
  let d; try { d = await loadRaidData(ch, S.params.realm); } catch(e){ d={ok:false,res:{}}; }
  if (S.view!=="char" || S.params.tab!=="raid") return;
  const f=S.params.rf||"ICC";
  const groups=["ICC","RS","ToC","Ulduar","Naxx","Ony","OS"];
  const quick=RAIDS.filter(r=>["ICC10","ICC10HC","ICC25","ICC25HC","RS25","RS25HC"].includes(r.k));
  const gs=ch._gs||0;
  let html = "";
  if (!d.ok){
    html += `<div class="card err"><b>Ne mogu automatski pročitati achievemente.</b><div class="sm" style="margin-top:6px">Warmane ih ne daje kroz API (ili je armory trenutno spor). Otvori ih direktno, kategorija <b>Dungeons &amp; Raids</b>.</div>
      <button class="btn" style="width:100%;margin-top:10px" onclick="openWarmane('achievements','${esc(ch.name)} · Achievementi')">Otvori achievemente</button></div>`;
  } else {
    html += `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><b>Brzi check</b><span class="sm mut">GS ${gs||"–"}</span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${quick.map(r=>{const st=raidStatus(r,d.res);
        return `<div class="stat" style="border-color:${MCOL[st]}55"><b style="color:${MCOL[st]}">${MARK[st]}</b><span>${r.n}</span></div>`}).join("")}</div></div>`;
  }
  html += `<div class="chips" style="margin:2px 0 10px">${groups.map(g=>`<button class="chip ${g===f?"on":""}" onclick="S.params.rf='${g}';viewChar(S.params)">${g}</button>`).join("")}</div>`;
  html += RAIDS.filter(r=>r.g===f).map(r=>{
    const st=d.ok?raidStatus(r,d.res):"maybe"; const gsOk=gs>=r.gs;
    return `<div class="card"><div class="row" style="justify-content:space-between">
      <b style="font-size:17px">${r.n}</b>
      <span class="badge" style="color:${gsOk?"var(--g)":"#ffb84d"};border-color:${gsOk?"#8cff2e55":"#ffb84d55"};background:transparent">GS ${gsOk?"✓":"✗"} ~${(r.gs/1000).toFixed(1)}k</span></div>
      ${d.ok?r.a.map(x=>{const s=d.res[x.n]||{state:"no"}; return `<div class="row" style="padding:7px 0;border-bottom:1px solid #ffffff08">
        <b style="color:${MCOL[s.state]};width:18px">${MARK[s.state]}</b><div style="flex:1"><div style="font-size:14px">${esc(x.n)}</div><div class="sm mut">${esc(x.t)}${s.date?" · "+esc(s.date):""}</div></div></div>`}).join(""):`<div class="sm mut" style="margin-top:6px">${r.a.map(x=>esc(x.n)).join(" · ")}</div>`}
    </div>`; }).join("");
  html += `<div class="sm mut" style="text-align:center;margin:4px 0 12px">✓ ima achievement · ✗ nema · ? nije sigurno. GS je okvirno ono što grupe obično traže.</div>`;
  el.innerHTML = html;
}
