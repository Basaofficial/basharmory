/* #Bash Armory · Stanje, HTTP (native bridge), Warmane API, item podaci, GearScore */
/* ===================== #Bash Armory ===================== */
const REALMS = ["Icecrown","Lordaeron","Onyxia","Blackrock","Frostwolf","Frostmourne"];
const CLASS = {
  "Death Knight":"#C41E3A","Druid":"#FF7C0A","Hunter":"#AAD372","Mage":"#3FC7EB","Paladin":"#F48CBA",
  "Priest":"#FFFFFF","Rogue":"#FFF468","Shaman":"#0070DD","Warlock":"#8788EE","Warrior":"#C69B6D","Monk":"#00FF98"
};
const CLASS_ICON = {"Death Knight":"classicon_deathknight","Druid":"classicon_druid","Hunter":"classicon_hunter","Mage":"classicon_mage","Paladin":"classicon_paladin",
  "Priest":"classicon_priest","Rogue":"classicon_rogue","Shaman":"classicon_shaman","Warlock":"classicon_warlock","Warrior":"classicon_warrior"};
const PROF_ICON = {"alchemy":"trade_alchemy","blacksmithing":"trade_blacksmithing","enchanting":"trade_engraving","engineering":"trade_engineering",
  "herbalism":"spell_nature_naturetouchgrow","inscription":"inv_inscription_tradeskill01","jewelcrafting":"inv_misc_gem_01","leatherworking":"trade_leatherworking",
  "mining":"trade_mining","skinning":"inv_misc_pelt_wolf_01","tailoring":"trade_tailoring","cooking":"inv_misc_food_15","fishing":"trade_fishing","first aid":"spell_holy_sealofsacrifice"};
const RACE_ID = {"Human":1,"Orc":2,"Dwarf":3,"Night Elf":4,"Undead":5,"Tauren":6,"Gnome":7,"Troll":8,"Goblin":9,"Blood Elf":10,"Draenei":11,"Worgen":22};
const RACE_MODEL = {1:"human",2:"orc",3:"dwarf",4:"nightelf",5:"scourge",6:"tauren",7:"gnome",8:"troll",9:"goblin",10:"bloodelf",11:"draenei",22:"worgen"};
const ARMORY = "https://armory.warmane.com";
const LS = {
  get(k,d){try{const v=localStorage.getItem("ba_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem("ba_"+k,JSON.stringify(v))}catch(e){}}
};
const S = {
  realm: LS.get("realm","Icecrown"),
  favs: LS.get("favs",[]),
  recent: LS.get("recent",[]),
  proxy: LS.get("proxy",""),
  cmp: LS.get("cmp",[null,null]),
  view: "home", stack: [], cache:{}
};
const $ = s => document.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const J = o => esc(JSON.stringify(o));
const num = v => { const n = parseInt(v,10); return isNaN(n)?0:n; };
const fmt = n => num(n).toLocaleString("de-DE");
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}

/* ---------- HTTP: native bridge (APK, no CORS) -> direct -> proxy ---------- */
const pending = {}; let reqId = 0;
window.__nativeCb = (id, ok, body) => { const p = pending[id]; if(!p) return; delete pending[id]; ok ? p.res(body) : p.rej(new Error(body||"Mreža")); };
function nativeGet(url){
  return new Promise((res,rej)=>{ const id="r"+(++reqId); pending[id]={res,rej}; window.BashNative.get(id,url);
    setTimeout(()=>{ if(pending[id]){delete pending[id];rej(new Error("Timeout"))} },25000); });
}
async function getText(url){
  if (window.BashNative && window.BashNative.get) return nativeGet(url);
  try { const r = await fetch(url); if(!r.ok) throw new Error("HTTP "+r.status); return await r.text(); }
  catch(e){
    if (!S.proxy) throw new Error("Browser blokira zahtjev (CORS). Koristi APK ili dodaj proxy u Postavkama.");
    const r = await fetch(S.proxy + encodeURIComponent(url)); if(!r.ok) throw new Error("Proxy HTTP "+r.status); return await r.text();
  }
}
async function getJSON(url){
  const t = await getText(url);
  let j; try { j = JSON.parse(t); } catch(e){ throw new Error("Server nije vratio podatke (možda je armory trenutno nedostupan)."); }
  if (j && j.error) throw new Error(j.error);
  return j;
}

/* ---------- Warmane API ---------- */
async function apiChar(name, realm){
  if (realm === "DEMO") return JSON.parse(JSON.stringify(DEMO_CHAR));
  return getJSON(`${ARMORY}/api/character/${encodeURIComponent(name)}/${encodeURIComponent(realm)}/summary`);
}
async function apiGuild(name, realm){
  if (realm === "DEMO") return JSON.parse(JSON.stringify(DEMO_GUILD));
  return getJSON(`${ARMORY}/api/guild/${encodeURIComponent(name)}/${encodeURIComponent(realm)}/summary`);
}

/* ---------- Item data (Wowhead WotLK): ilvl, quality, slot, icon, displayId ---------- */
const SLOT_BY_NAME = {"head":1,"neck":2,"shoulder":3,"shirt":4,"chest":5,"waist":6,"legs":7,"feet":8,"wrist":9,"hands":10,"finger":11,"trinket":12,"one-hand":13,"shield":14,"ranged":15,"back":16,"two-hand":17,"tabard":19,"robe":20,"main hand":21,"off hand":22,"held in off-hand":23,"thrown":25,"relic":28};
function tmogOf(e){
  for (const k of ["transmog","transmogid","transmog_id","transmogrify","transmogrification","tmog","appearance","fakeentry","fake_entry","display"]){
    const v=e[k]; if (v==null || v==="" || v===0 || v==="0") continue;
    if (typeof v==="object"){ const n=num(v.item||v.entry||v.id||v.itemid); if(n && n!==itemIdOf(e)) return n; continue; }
    const n=num(v); if (n && n!==itemIdOf(e)) return n;
  }
  return 0;
}
/* Warmane's character page links every item like
   "item=51290&ench=3820&gems=3621:40113:0&transmog=34322" (wowhead tooltip format).
   The API has no gems/enchants, so we read them from there. Pure function → tested in tests/run.js */
function parseItemLinks(html){
  const out={}; const re=/item=(\d+)((?:(?:&amp;|&|;)[a-z_]+=[0-9:,.\-]*)*)/gi; let m;
  while ((m=re.exec(String(html||"")))){
    const id=m[1], q={}; m[2].replace(/(?:&amp;|&|;)([a-z_]+)=([0-9:,.\-]*)/gi,(_,k,v)=>{ q[k.toLowerCase()]=v; return ""; });
    const r=out[id]||{}; 
    if (q.ench && q.ench!=="0") r.ench=num(q.ench);
    if (q.gems!=null) r.gems=q.gems.split(/[:,]/).map(num).filter(Boolean);
    const t=q.transmog||q.tmog||q.fake; if (t && t!=="0" && t!==id) r.tm=num(t);
    if (Object.keys(q).length) r.seen=true;
    out[id]=r;
  }
  return out;
}
async function pageExtras(ch, eq){
  const html=await getText(`${ARMORY}/character/${encodeURIComponent(ch.name)}/${encodeURIComponent(ch.realm)}/summary`);
  const map=parseItemLinks(html); let found=0;
  eq.forEach(e=>{ const r=map[itemIdOf(e)]; if(!r) return; found++;
    if (r.tm && !e._tm) e._tm=r.tm;
    if (r.ench!=null) e._ench=r.ench; if (r.gems) e._gems=r.gems; if (r.seen) e._seen=true; });
  ch._extras = found>0;
  S.tmDebug = `${found}/${eq.length} itema nađeno na stranici · ${eq.filter(e=>e._tm).length} transmog`;
}
function itemIdOf(e){ return num(e && (e.item || e.itemid || e.id || e.entry)); }
async function itemInfo(id){
  if (!id) return null;
  if (DEMO_ITEMS[id]) return DEMO_ITEMS[id];
  const ck = LS.get("it_"+id, null); if (ck) return ck;
  let info = null;
  try { // XML: has displayId + inventorySlot (best, works in APK)
    const x = await getText(`https://www.wowhead.com/wotlk/item=${id}&xml`);
    const d = new DOMParser().parseFromString(x,"text/xml");
    const g = s => d.querySelector(s);
    if (g("item")) {
      info = { id, name: g("name")?.textContent||"", ilvl: num(g("level")?.textContent),
        quality: num(g("quality")?.getAttribute("id")), icon: g("icon")?.textContent||"",
        displayId: num(g("icon")?.getAttribute("displayId")), slot: num(g("inventorySlot")?.getAttribute("id")),
        tooltip: g("htmlTooltip")?.textContent||"" };
    }
  } catch(e){}
  if (!info) { try { // tooltip JSON fallback
    const j = JSON.parse(await getText(`https://nether.wowhead.com/wotlk/tooltip/item/${id}`));
    const tt = j.tooltip||"";
    const il = tt.match(/Item Level (?:<!--ilvl-->)?(\d+)/i);
    const sm = tt.match(/<td>(Head|Neck|Shoulder|Back|Chest|Shirt|Tabard|Wrist|Hands|Waist|Legs|Feet|Finger|Trinket|One-Hand|Two-Hand|Main Hand|Off Hand|Held In Off-hand|Ranged|Thrown|Relic)<\/td>/i);
    let slot = sm ? SLOT_BY_NAME[sm[1].toLowerCase()] : 0;
    if (slot===22 && /Shield/i.test(tt)) slot = 14;
    info = { id, name:j.name||"", ilvl: il?num(il[1]):0, quality:num(j.quality), icon:j.icon||"", displayId:0, slot, tooltip:tt };
  } catch(e){} }
  if (info) LS.set("it_"+id, info);
  return info;
}
/* Avatar: ikonica klase, okvir u boji klase, online tačka, ispod mini ikonice profesija */
function avatarHtml(c, size=40, withProfs=false){
  const col=CLASS[c.class]||"#8cff2e", ic=CLASS_ICON[c.class];
  const profs = withProfs ? (c.professions||[]).filter(p=>PROF_ICON[String(p.name).toLowerCase()]).slice(0,2) : [];
  return `<div class="av" style="width:${size}px;height:${size}px;border-color:${col};box-shadow:0 0 ${Math.round(size/3)}px ${col}55;${ic?`background-image:url('${iconUrl(ic)}')`:`background:${col}`}">
    ${ic?"":`<b>${esc((c.class||"?")[0])}</b>`}${c.online!=null?`<span class="avdot ${c.online?"on":""}"></span>`:""}
    ${profs.length?`<div class="avprof">${profs.map(p=>`<span title="${esc(p.name)} ${esc(p.skill)}" style="background-image:url('${iconUrl(PROF_ICON[String(p.name).toLowerCase()])}')"></span>`).join("")}</div>`:""}</div>`;
}
const iconUrl = (icon, size="large") => icon ? `https://wow.zamimg.com/images/wow/icons/${size}/${String(icon).toLowerCase()}.jpg` : "";

/* ---------- GearScore (GearScoreLite 3.3.5 formula) ---------- */
const GS_A = {4:[91.45,0.65],3:[81.375,0.8125],2:[73,1]};
const GS_B = {4:[26,1.2],3:[0.75,1.8],2:[8,2],1:[0,2.25]};
const GS_SLOTMOD = {1:1,2:0.5625,3:0.75,5:1,20:1,6:0.75,7:1,8:0.75,9:0.5625,10:0.75,11:0.5625,12:0.5625,16:0.5625,13:1,21:1,22:1,23:1,14:1,17:2,15:0.3164,25:0.3164,26:0.3164,28:0.3164,4:0,19:0};
function itemGS(info, hunter){
  if (!info || !info.ilvl) return 0;
  let q = info.quality, il = info.ilvl, qs = 1;
  if (q===5){qs=1.3;q=4} else if (q===0||q===1){qs=0.005;q=2} else if (q===7){q=3;il=187.05}
  if (q<2||q>4) q = Math.min(4,Math.max(2,q));
  let mod = GS_SLOTMOD[info.slot]; if (mod==null) return 0;
  if (hunter){ if ([13,21,22,17].includes(info.slot)) mod*=0.3164; if ([15,25,26].includes(info.slot)) mod*=5.3224; }
  const T = il>120 ? GS_A : GS_B; const ab = T[q] || T[2]; if (!ab) return 0;
  return Math.max(0, Math.floor(((il-ab[0])/ab[1]) * mod * 1.8618 * qs));
}
function gsColor(gs){
  if (gs>=6000) return "#ff8000"; if (gs>=5500) return "#ff3df0"; if (gs>=5000) return "#a335ee";
  if (gs>=4000) return "#0070dd"; if (gs>=3000) return "#1eff00"; return "#cfcfcf";
}
/* ---------- Gem & enchant check ---------- */
function socketsOf(i){ if (i && i.sockets!=null) return i.sockets; return i && i.tooltip ? (i.tooltip.match(/class="socket-(?:meta|red|yellow|blue|prismatic)/g)||[]).length : 0; }
function hasProf(ch, name, min=400){ return (ch.professions||[]).some(p=>String(p.name).toLowerCase()===name && num(p.skill)>=min); }
function shouldEnchant(ch, slot){
  if ([1,3,16,5,20,9,10,7,8,13,17,21,14].includes(slot)) return true;
  if (slot===22) return true;                       // off-hand weapon
  if ([15,26].includes(slot)) return ch.class==="Hunter";
  if (slot===11) return hasProf(ch,"enchanting");
  return false;
}
function audit(ch){
  const bs=hasProf(ch,"blacksmithing");
  let en=0, enNeed=0, gm=0, gmNeed=0;
  (ch._eq||[]).forEach(e=>{ const i=e._i; if(!i) return;
    e._needEnch = shouldEnchant(ch, i.slot);
    e._needGems = socketsOf(i) + (i.slot===6?1:0) + (bs&&(i.slot===9||i.slot===10)?1:0);
    e._gemCount = (e._gems||[]).length;
    if (e._needEnch){ enNeed++; if (e._ench) en++; }
    gmNeed += e._needGems; gm += Math.min(e._gemCount, e._needGems);
  });
  ch._audit = { en, enNeed, gm, gmNeed, known: !!ch._extras };
}

async function enrich(ch){
  const eq = (ch.equipment||[]).filter(e=>itemIdOf(e));
  const infos = await Promise.all(eq.map(e=>itemInfo(itemIdOf(e)).catch(()=>null)));
  const hunter = ch.class==="Hunter";
  let gs=0, ilSum=0, ilN=0, twoH=0;
  infos.forEach(i=>{ if(i && i.slot===17) twoH++; });
  eq.forEach(e=>{ e._tm = tmogOf(e); });
  if (ch.realm==="DEMO") { eq.forEach(e=>{ const d=DEMO_EXTRAS[itemIdOf(e)]; if(d){ e._ench=d.ench; e._gems=d.gems; e._seen=true; } }); ch._extras=true; }
  else if (eq.length) { try { await pageExtras(ch, eq); } catch(x){ S.tmDebug="Warmane stranica: "+x.message; } }
  const man = LS.get("tm_"+(ch.realm||"")+"/"+String(ch.name).toLowerCase(), {});
  eq.forEach(e=>{ const m=man[itemIdOf(e)]; if (m===-1) e._tm=0; else if (m) e._tm=m; e._manual=m!=null; });
  const tms = await Promise.all(eq.map(e=>e._tm?itemInfo(e._tm).catch(()=>null):null));
  eq.forEach((e,k)=>{ const i=infos[k]; e._i=i; e._t=tms[k]; if(!i) return;
    let g=itemGS(i,hunter); if (twoH>=2 && i.slot===17) g=Math.floor(g/2); // titan's grip
    e._gs=g; gs+=g; if(i.ilvl && ![4,19].includes(i.slot)){ilSum+=i.ilvl; ilN++;} });
  ch._eq = eq; ch._gs = gs; ch._ilvl = ilN?Math.round(ilSum/ilN):0;
  audit(ch);
  return ch;
}
