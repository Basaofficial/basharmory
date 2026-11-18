/* #Bash Armory · Poređenje dva lika */
/* ---------- Compare ---------- */
function addCmp(){ const ch=S.cur; const e={name:ch.name,realm:S.params.realm};
  if (!S.cmp[0]||(S.cmp[0].name===e.name&&S.cmp[0].realm===e.realm)) S.cmp[0]=e; else S.cmp[1]=e;
  LS.set("cmp",S.cmp); toast(S.cmp[1]?"Spremno za poređenje ⚔":"Dodaj još jedan lik"); if(S.cmp[0]&&S.cmp[1]) go("compare"); }
async function viewCompare(){
  const app=$("#app"); const [a,b]=S.cmp;
  if (!a||!b){ app.innerHTML = head("Poredi","Dva lika jedan pored drugog") + `<div class="card empty">Otvori lik i klikni <b>⚔ Dodaj u poređenje</b>, pa isto za drugi lik.<br><br>${a?`Prvi: <b>${esc(a.name)}</b>`:""}</div>`; return; }
  app.innerHTML = head("Poredi","",false)+`<div class="spin"></div>`;
  let A,B; try{ [A,B]=await Promise.all([loadChar(a.name,a.realm),loadChar(b.name,b.realm)]); }catch(e){ app.innerHTML=head("Poredi","")+`<div class="card err">${esc(e.message)}</div>`; return; }
  if (S.view!=="compare") return;
  const rows=[["GearScore",A._gs,B._gs],["Prosj. ilvl",A._ilvl,B._ilvl],["Achievementi",num(A.achievementpoints),num(B.achievementpoints)],["Honor killovi",num(A.honorablekills),num(B.honorablekills)],
    ["Najbolja arena",Math.max(0,...(A.pvpteams||[]).map(x=>num(x.rating))),Math.max(0,...(B.pvpteams||[]).map(x=>num(x.rating)))]];
  const nm=(c)=>`<div style="text-align:center;cursor:pointer" onclick="go('char',${J({name:c.name,realm:c.realm})})"><div class="crest" style="margin:0 auto 6px;width:52px;height:52px;background:${CLASS[c.class]||"#8cff2e"}">${esc((c.class||"?")[0])}</div><b style="color:${CLASS[c.class]||"#fff"}">${esc(c.name)}</b><div class="sm mut">${esc(c.class)}</div></div>`;
  app.innerHTML = head("Poredi","") + `<div class="card"><div class="cmp">${nm(A)}${nm(B)}</div>
   <div style="margin-top:12px">${rows.map(([l,x,y])=>`<div class="vs"><div class="l ${x>y?"win":""}">${fmt(x)}</div><div class="m">${l}</div><div class="${y>x?"win":""}">${fmt(y)}</div></div>`).join("")}</div>
   <button class="btn ghost sm" style="margin-top:12px;width:100%" onclick="S.cmp=[null,null];LS.set('cmp',S.cmp);render()">Očisti</button></div>`;
}
