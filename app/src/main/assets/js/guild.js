/* #Bash Armory · Guild: lista članova, "Online sada" po ulogama, praćenje */

/* Uloga po glavnom talent stablu (WotLK). Feral i DK Frost mogu biti i tank i DPS. */
const HEAL_TREES = { Paladin:["Holy"], Priest:["Holy","Discipline"], Druid:["Restoration"], Shaman:["Restoration"] };
const TANK_TREES = { Warrior:["Protection"], Paladin:["Protection"], "Death Knight":["Blood"] };
const FLEX_TREES = { Druid:["Feral Combat","Feral"], "Death Knight":["Frost"] };
function roleOf(cls, tree){
  if (!tree) return "?";
  if ((HEAL_TREES[cls]||[]).includes(tree)) return "heal";
  if ((TANK_TREES[cls]||[]).includes(tree)) return "tank";
  if ((FLEX_TREES[cls]||[]).includes(tree)) return "flex";
  return "dps";
}
const ROLE_LABEL = { tank:"🛡 Tankovi", heal:"✚ Healeri", dps:"⚔ DPS", flex:"⇄ Tank ili DPS", "?":"❔ Nepoznat spec" };

async function viewGuild(p){
  const app=$("#app");
  app.innerHTML = head(esc(p.name), esc(p.realm), true) + `<div class="spin"></div>`;
  let gd; try { gd = await apiGuild(p.name,p.realm); } catch(e){ app.innerHTML = head(esc(p.name), esc(p.realm), true)+`<div class="card err">${esc(e.message)}</div>`; return; }
  if (S.view!=="guild" || S.params!==p) return;
  const roster=(gd.roster||gd.members||[]).map(m=>({...m, realm:p.realm}));
  const online = roster.filter(m=>m.online);
  const mode = p.mode||"now";
  const watched = isWatchedGuild(gd.name||p.name, p.realm);
  let html = head(`&lt;${esc(gd.name||p.name)}&gt;`, `${esc(p.realm)} · ${roster.length} članova · ${online.length} online`, true) + `
   <div class="row" style="gap:8px;margin-bottom:10px">
     ${[["now",`🟢 Online sada (${online.length})`],["list","Svi članovi"]].map(([k,l])=>`<button class="tab ${mode===k?"on":""}" style="flex:1" onclick="S.params.mode='${k}';viewGuild(S.params)">${l}</button>`).join("")}</div>
   <button class="btn ${watched?"":"ghost"} sm" style="width:100%;margin-bottom:10px" onclick="toggleWatchGuild(${J({name:gd.name||p.name,realm:p.realm})})">${watched?"🔔 Pratiš ovaj guild · obavijest kad neko uđe u igru":"🔕 Prati guild (obavijest kad neko uđe u igru)"}</button>`;
  if (mode==="now"){ app.innerHTML = html + `<div id="gnow"><div class="spin"></div><div class="empty sm">Gledam specove online članova…</div></div>`; guildNow(p, online); return; }
  const f = p.filter||"all", sort = p.sort||"level";
  const classes = {}; roster.forEach(m=>classes[m.class]=(classes[m.class]||0)+1);
  const list = roster.filter(m=> f==="all" || (f==="online"&&m.online) || m.class===f);
  list.sort((a,b)=> sort==="name"? String(a.name).localeCompare(b.name) : sort==="ach"? num(b.achievementpoints)-num(a.achievementpoints) : num(b.level)-num(a.level) || (b.online?1:0)-(a.online?1:0));
  app.innerHTML = html + `
   <div class="card"><div class="chips" style="margin-bottom:8px">
     ${[["all","Svi"],["online","Online"]].map(([k,l])=>`<button class="chip ${f===k?"on":""}" onclick="S.params.filter='${k}';viewGuild(S.params)">${l}</button>`).join("")}
     ${Object.keys(classes).sort().map(c=>`<button class="chip ${f===c?"on":""}" style="color:${CLASS[c]||"#fff"}" onclick="S.params.filter='${esc(c)}';viewGuild(S.params)">${esc(c)} ${classes[c]}</button>`).join("")}</div>
     <div class="chips">${[["level","Level"],["name","Ime"],["ach","Achievementi"]].map(([k,l])=>`<button class="chip ${sort===k?"on":""}" onclick="S.params.sort='${k}';viewGuild(S.params)">↕ ${l}</button>`).join("")}</div></div>
   <div class="card list">${list.length?list.map(charRow).join(""):`<div class="empty">Nema članova.</div>`}</div>`;
}

/* Online članovi grupisani po ulozi; spec se čita iz profila svakog lika (6 odjednom). */
async function guildNow(p, online){
  const box=()=>$("#gnow");
  if (!online.length){ if(box()) box().innerHTML=`<div class="card empty">Niko iz guilda trenutno nije u igri.</div>`; return; }
  const out=[]; let i=0;
  async function worker(){ while (i<online.length){ const m=online[i++];
    let tree=null; try { const c = p.realm==="DEMO" ? DEMO_SPECS[m.name] : await apiChar(m.name, p.realm); tree = typeof c==="string" ? c : (c && c.talents && c.talents[0] && c.talents[0].tree); } catch(e){}
    out.push({...m, tree, role:roleOf(m.class, tree)}); } }
  await Promise.all(Array.from({length:Math.min(6,online.length)}, worker));
  if (S.view!=="guild" || S.params!==p || !box()) return;
  const groups={tank:[],heal:[],flex:[],dps:[],"?":[]}; out.forEach(m=>groups[m.role].push(m));
  const at80 = out.filter(m=>num(m.level)>=80).length;
  box().innerHTML = `<div class="card"><div class="stats" style="margin-top:0">
      <div class="stat"><b>${groups.tank.length}${groups.flex.length?`<span class="mut" style="font-size:12px">+${groups.flex.length}</span>`:""}</b><span>Tank</span></div>
      <div class="stat"><b>${groups.heal.length}</b><span>Heal</span></div>
      <div class="stat"><b>${groups.dps.length}</b><span>DPS</span></div></div>
      <div class="sm mut" style="text-align:center;margin-top:8px">${at80} online na 80 · ${at80>=25?"dovoljno za 25-man ✓":at80>=10?"dovoljno za 10-man ✓":"još nema za raid"}</div></div>
    ${Object.keys(groups).filter(r=>groups[r].length).map(r=>`<div class="card"><b>${ROLE_LABEL[r]} (${groups[r].length})</b><div class="list" style="margin-top:4px">
      ${groups[r].sort((a,b)=>num(b.level)-num(a.level)).map(m=>`<div class="it" onclick="go('char',${J({name:m.name,realm:p.realm})})"><span class="dot on"></span>
        <div style="flex:1"><div style="color:${CLASS[m.class]||"#fff"};font-weight:700">${esc(m.name)}</div><div class="sm mut">${esc(m.level)} ${esc(m.class)}${m.tree?" · "+esc(m.tree):""}</div></div></div>`).join("")}</div></div>`).join("")}
    <button class="btn ghost sm" style="width:100%;margin-bottom:12px" onclick="viewGuild(S.params)">↻ Osvježi</button>`;
}

/* ---------- Praćenje: obavijest kad neko uđe u igru (WatchJob u APK-u) ---------- */
S.watch = LS.get("watch", { on:true, favs:true, guilds:[] });
const hasWatch = () => !!(window.BashNative && window.BashNative.setWatch);
function isWatchedGuild(n, r){ return S.watch.guilds.some(g=>g.name.toLowerCase()===String(n).toLowerCase() && g.realm===r); }
function toggleWatchGuild(g){
  if (isWatchedGuild(g.name,g.realm)) S.watch.guilds=S.watch.guilds.filter(x=>!(x.name.toLowerCase()===g.name.toLowerCase()&&x.realm===g.realm));
  else { S.watch.guilds.push(g); if(!hasWatch()) toast("Obavijesti rade u APK-u"); }
  LS.set("watch",S.watch); syncWatch(); if (S.view==="guild") viewGuild(S.params); else render();
}
function syncWatch(){
  if (!hasWatch()) return;
  const chars = S.watch.favs ? S.favs.filter(f=>f.realm!=="DEMO").map(f=>({name:f.name, realm:f.realm})) : [];
  window.BashNative.setWatch(JSON.stringify({ on:!!S.watch.on, chars, guilds:S.watch.guilds.filter(g=>g.realm!=="DEMO") }));
}
function watchCard(){
  const w=S.watch;
  return `<div class="card col"><div class="row" style="justify-content:space-between"><b>Obavijesti: ušao u igru</b>
      <button class="chip ${w.on?"on":""}" onclick="S.watch.on=!S.watch.on;LS.set('watch',S.watch);syncWatch();render()">${w.on?"Uključeno":"Isključeno"}</button></div>
    <div class="sm mut">Telefon provjerava Warmane otprilike svakih 15 min i javi kad neko koga pratiš uđe u igru.</div>
    <label class="mrow"><input type="checkbox" ${w.favs?"checked":""} onchange="S.watch.favs=this.checked;LS.set('watch',S.watch);syncWatch()"><span>Favoriti (${S.favs.length})</span></label>
    ${w.guilds.map(g=>`<div class="mrow"><span style="flex:1">&lt;${esc(g.name)}&gt; <span class="mut sm">${esc(g.realm)}</span></span><button class="chip" onclick="toggleWatchGuild(${J(g)})">Ukloni</button></div>`).join("")}
    <div class="sm mut">Guild dodaješ na stranici guilda: 🔕 Prati guild.</div>
    ${hasWatch()?"":`<div class="sm" style="color:#ffb84d">Obavijesti rade samo u APK-u.</div>`}</div>`;
}
