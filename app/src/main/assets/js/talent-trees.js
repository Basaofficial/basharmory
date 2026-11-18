/* #Bash Armory · Talent stabla kao u igri */
/* ---------- Talent trees (like in game) ---------- */
function classTrees(ch){ return (window.TALENTS||{})[ch.class]||null; }
function validSpec(str, trees){
  const total=trees.reduce((a,t)=>a+t.t.length,0);
  const d=str.replace(/[^0-9]/g,""); if (d.length<total) return null;
  const arr=d.slice(0,total).split("").map(Number);
  let k=0, sum=0; for (const t of trees) for (const x of t.t){ if (arr[k]>x[2]) return null; sum+=arr[k]; k++; }
  if (sum<1 || sum>71) return null;
  return arr;
}
function fromDashed(str, trees){ // "0550-23-005" style (wowhead / armory)
  const parts=str.split("-"); if (parts.length!==3) return null;
  const arr=[]; for (let i=0;i<3;i++){ const p=parts[i].padEnd(trees[i].t.length,"0").slice(0,trees[i].t.length); arr.push(...p.split("").map(Number)); }
  return validSpec(arr.join(""), trees);
}
function extractSpecs(raw, trees){
  const specs=[]; const total=trees.reduce((a,t)=>a+t.t.length,0);
  const add=a=>{ if(a && !specs.some(s=>s.join("")===a.join(""))) specs.push(a); };
  (raw.match(/[0-5]*-[0-5]*-[0-5]*/g)||[]).filter(m=>m.replace(/-/g,"").length>=3).forEach(m=>add(fromDashed(m,trees)));
  (raw.match(new RegExp("[0-5]{"+total+"}(?![0-9])","g"))||[]).forEach(m=>add(validSpec(m,trees)));
  if (!specs.length){ // rank texts "2/5" in page order
    const doc=new DOMParser().parseFromString(raw,"text/html");
    const ranks=[...doc.querySelectorAll("body *")].filter(e=>!e.children.length && /^\s*\d\s*\/\s*\d\s*$/.test(e.textContent)).map(e=>num(e.textContent.split("/")[0]));
    for (let o=0; o+total<=ranks.length && specs.length<2; o+=total) add(validSpec(ranks.slice(o,o+total).join(""),trees));
  }
  return specs.slice(0,2);
}
async function loadTalents(ch, realm){
  const trees=classTrees(ch); if(!trees) return {trees:null,specs:[]};
  if (realm==="DEMO") return {trees, specs:[DEMO_TAL(trees,[0,17,54]), DEMO_TAL(trees,[3,57,11])]};
  const k="tal_"+realm+"/"+ch.name.toLowerCase(); if (S.cache[k]) return S.cache[k];
  let specs=[];
  for (const s of (ch.talents||[])){ // API may already carry per-talent ranks
    const p=s.points||s.talents||s.string; if (!p) continue;
    if (typeof p==="string") { const a=fromDashed(p,trees)||validSpec(p,trees); if(a) specs.push(a); }
    else if (Array.isArray(p) && p.flat(3).length>=trees.reduce((a,t)=>a+t.t.length,0)) { const a=validSpec(p.flat(3).join(""),trees); if(a) specs.push(a); }
  }
  if (!specs.length){ try { specs=extractSpecs(await getText(warmaneUrl(ch,"talents")), trees); } catch(e){} }
  const out={trees,specs}; if (specs.length) S.cache[k]=out; return out;
}
function DEMO_TAL(trees, split){ const arr=[]; trees.forEach((t,ti)=>{ let left=split[ti];
  t.t.forEach(x=>{ const v=Math.min(x[2], left); arr.push(v); left-=v; }); }); return arr; }
async function spellInfo(id){
  const ck=LS.get("sp_"+id,null); if (ck) return ck;
  try { const j=JSON.parse(await getText(`https://nether.wowhead.com/wotlk/tooltip/spell/${id}`));
    const v={name:j.name||"", icon:j.icon||"", tooltip:j.tooltip||""}; LS.set("sp_"+id,v); return v; } catch(e){ return null; }
}
function treeSums(trees, arr){ let k=0; return trees.map(t=>{ let s=0; t.t.forEach(()=>{ s+=arr[k++]; }); return s; }); }
async function tabTalentTrees(ch, el){
  el.innerHTML=`<div class="spin"></div><div class="empty sm">Učitavam talente…</div>`;
  const d=await loadTalents(ch, S.params.realm);
  if (S.view!=="char" || S.params.tab!=="talents") return;
  if (!d.trees){ el.innerHTML=tabTalents(ch); return; }
  if (!d.specs.length){
    el.innerHTML = tabTalents(ch) + `<div class="card err"><b>Ne mogu pročitati raspored talenata.</b><div class="sm" style="margin-top:6px">Otvori ih direktno na Warmaneu.</div>
      <button class="btn" style="width:100%;margin-top:10px" onclick="openWarmane('talents','${esc(ch.name)} · Talenti')">Otvori talente</button></div>`; return; }
  const si=Math.min(S.params.spec||0, d.specs.length-1); const arr=d.specs[si]; const sums=treeSums(d.trees,arr);
  const main=sums.indexOf(Math.max(...sums)); const ti=S.params.tree!=null?S.params.tree:main;
  const names=(ch.talents||[]).map(t=>t.tree);
  let html = d.specs.length>1 ? `<div class="chips" style="margin-bottom:10px">${d.specs.map((sp,i)=>{const sm=treeSums(d.trees,sp);const mi=sm.indexOf(Math.max(...sm));
      return `<button class="chip ${i===si?"on":""}" onclick="S.params.spec=${i};S.params.tree=null;viewChar(S.params)">${i?"Drugi":"Glavni"} · ${esc(d.trees[mi].n)} ${sm.join("/")}</button>`}).join("")}</div>` : "";
  html += `<div class="ttabs">${d.trees.map((t,i)=>`<button class="${i===ti?"on":""}" onclick="S.params.tree=${i};viewChar(S.params)">${esc(t.n)} <b>${sums[i]}</b></button>`).join("")}</div>`;
  let off=0; for (let i=0;i<ti;i++) off+=d.trees[i].t.length;
  const tree=d.trees[ti]; const rows=Math.max(...tree.t.map(x=>x[0]))+1;
  const pos={}; tree.t.forEach((x,j)=>pos[x[0]+"_"+x[1]]=j);
  let arrows="";
  tree.t.forEach((x,j)=>{ if (x.length>5){ const from=pos[x[5]+"_"+x[6]]; if(from==null) return;
    const top=x[5]*58+51, h=(x[0]-x[5])*58-44; if (x[1]===x[6] && h>0)
      arrows+=`<div class="arrow ${arr[off+j]>0?"on":""}" style="left:calc(${x[1]*25+12.5}% - 2px);top:${top}px;height:${h}px"></div>`; } });
  html += `<div class="tree" style="background-image:url('${tree.bg}')"><div class="thead"><b style="font-size:17px">${esc(tree.n)}</b><span class="badge">${sums[ti]} bodova</span></div>
    <div class="tgrid" style="grid-template-rows:repeat(${rows},58px)">${arrows}${tree.t.map((x,j)=>{const r=arr[off+j];
      return `<div class="tal ${r>=x[2]?"m":r>0?"p":""}" id="tal${j}" style="grid-row:${x[0]+1};grid-column:${x[1]+1}" onclick="talTip(${ti},${j},${r})"><span class="rk">${r}/${x[2]}</span></div>`}).join("")}</div></div>
    <div class="sm mut" style="text-align:center;margin:8px 0 12px">Klikni talent za opis · žuto = maksimum · zeleno = djelimično</div>`;
  el.innerHTML=html;
  tree.t.forEach(async (x,j)=>{ const sp=await spellInfo(x[3][0]); const n=document.getElementById("tal"+j); if(n&&sp&&sp.icon) n.style.backgroundImage=`url('${iconUrl(sp.icon,"medium")}')`; });
}
async function talTip(ti,j,r){
  const ch=S.cur; const x=classTrees(ch)[ti].t[j]; closeTip();
  const d=document.createElement("div"); d.className="tip";
  d.innerHTML=`<div class="row" style="justify-content:space-between"><b>${esc(x[4])}</b><button class="btn sm" onclick="closeTip()">✕</button></div><div class="sm mut">Rank ${r}/${x[2]}</div><div class="spin" style="margin:14px auto"></div>`;
  document.body.appendChild(d);
  const sp=await spellInfo(x[3][Math.max(0,r-1)]);
  if (d.isConnected) d.innerHTML=`<div class="row" style="justify-content:space-between"><b style="color:${r?"#ffd100":"#ccc"}">${esc((sp&&sp.name)||x[4])}</b><button class="btn sm" onclick="closeTip()">✕</button></div>
    <div class="sm mut" style="margin-bottom:6px">Rank ${r}/${x[2]}</div>${sp&&sp.tooltip?sanitizeTip(sp.tooltip):`<div class="mut">Opis nije dostupan.</div>`}`;
}
