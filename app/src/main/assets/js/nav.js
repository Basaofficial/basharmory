/* #Bash Armory · Navigacija i render */
/* ---------- Navigation ---------- */
function go(view, params={}, push=true){
  if (push && S.view) S.stack.push({view:S.view, params:S.params});
  S.view=view; S.params=params;
  if (view!=="char") hideCharPanel();
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on", b.dataset.go===view));
  closeTip(); closeSheet(); render(); window.scrollTo(0,0);
}
window.bashBack = function(){ if ($(".tip")) { closeTip(); return true; }
  const p=S.stack.pop(); if(!p) return false; go(p.view,p.params,false); return true; };
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{ S.stack=[]; go(b.dataset.go,{},false); });
function head(title, sub, back){
  return `<header>${back?`<button class="back" onclick="bashBack()">‹</button>`:""}
  <div><h1 class="hand">${title}</h1>${sub?`<div class="sub">${sub}</div>`:""}</div></header>`;
}
function render(){
  const v=S.view, app=$("#app");
  if (v==="home") app.innerHTML = viewHome();
  else if (v==="favs") app.innerHTML = viewFavs();
  else if (v==="settings") app.innerHTML = viewSettings();
  else if (v==="compare") viewCompare();
  else if (v==="dkp") app.innerHTML = viewDkp();
  else if (v==="char") viewChar(S.params);
  else if (v==="guild") viewGuild(S.params);
  bind();
}
function bind(){
  const f=$("#sform"); if(f) f.onsubmit=e=>{e.preventDefault(); const n=$("#sname").value.trim(); if(!n) return;
    const r=$("#srealm").value; S.realm=r; LS.set("realm",r);
    if ($("#stype").value==="guild") go("guild",{name:n,realm:r}); else go("char",{name:n,realm:r}); };
}
