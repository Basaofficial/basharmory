/* #Bash Armory · gear oko 3D lika (ime, online, GS, ikonice).
   Isti kod se ubacuje u Bash 3D (model.html) i u Warmaneovu stranicu kad se koristi njihov 3D. */
(function(){
  if (window.__bashPanelUi) return; window.__bashPanelUi = true;
  var CSS = ""
  + "#bpu{position:fixed;inset:0;z-index:2147483646;pointer-events:none;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}"
  + "#bpu *{box-sizing:border-box}"
  + "#bpu .col{position:absolute;top:10px;bottom:62px;display:flex;flex-direction:column;justify-content:space-between}"
  + "#bpu .col.l{left:8px}#bpu .col.r{right:8px}"
  + "#bpu .bot{position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:10px}"
  + "#bpu .s{pointer-events:auto;position:relative;width:40px;height:40px;border-radius:8px;border:1.5px solid #2a2a2a;background:#0a0a0a center/cover;box-shadow:0 3px 10px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.06)}"
  + "#bpu .s.e{background:linear-gradient(160deg,#111,#060606);opacity:.55}"
  + "#bpu .q1{border-color:#9d9d9d}#bpu .q2{border-color:#1eff00}#bpu .q3{border-color:#0070dd}#bpu .q4{border-color:#a335ee;box-shadow:0 0 10px rgba(163,53,238,.35),0 3px 10px rgba(0,0,0,.8)}#bpu .q5{border-color:#ff8000;box-shadow:0 0 12px rgba(255,128,0,.45),0 3px 10px rgba(0,0,0,.8)}#bpu .q6,#bpu .q7{border-color:#e6cc80}"
  + "#bpu .tm{position:absolute;right:-6px;bottom:-6px;width:20px;height:20px;border-radius:5px;border:1.5px solid #c070ff;background:#111 center/cover;box-shadow:0 0 8px rgba(192,112,255,.6)}"
  + "#bpu .s.miss::after{content:'';position:absolute;left:-3px;top:-3px;width:9px;height:9px;border-radius:50%;background:#ff4d4d;box-shadow:0 0 6px #ff4d4d}"
  + "#bpu .info{position:absolute;top:10px;left:58px;right:58px;text-align:center;text-shadow:0 2px 8px #000,0 0 2px #000;color:#e8ffe0}"
  + "#bpu .n{font-family:Cinzel,Georgia,serif;font-size:22px;font-weight:900;letter-spacing:.5px;line-height:1.1}"
  + "#bpu .d{font-size:11px;color:#c9dcbf;margin-top:2px}#bpu .g{font-size:11px;color:#8cff2e;margin-top:1px}"
  + "#bpu .on{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;margin-top:5px;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.55);border:1px solid #333;letter-spacing:.5px;text-transform:uppercase}"
  + "#bpu .on.y{border-color:rgba(140,255,46,.5);color:#8cff2e}#bpu .dot{width:7px;height:7px;border-radius:50%;background:#666}#bpu .on.y .dot{background:#8cff2e;box-shadow:0 0 8px #8cff2e}"
  + "#bpu .gs{position:absolute;left:0;right:0;bottom:60px;text-align:center;text-shadow:0 2px 8px #000}"
  + "#bpu .gs b{font-family:Cinzel,Georgia,serif;font-size:17px;font-weight:900}#bpu .gs span{font-size:11px;font-weight:700;margin-left:6px}"
  + "#bpu .tools{position:absolute;right:56px;top:10px;display:flex;flex-direction:column;gap:6px}"
  + "#bpu .tb{pointer-events:auto;width:30px;height:30px;border-radius:9px;background:rgba(10,20,10,.75);color:#8cff2e;border:1px solid rgba(140,255,46,.35);font-size:14px;font-weight:800;display:grid;place-items:center;padding:0}";
  var ICON = function(n){ return n ? "https://wow.zamimg.com/images/wow/icons/large/" + String(n).toLowerCase() + ".jpg" : ""; };
  var esc = function(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); };
  function slot(x){
    if (!x) return '<div class="s e"></div>';
    return '<div class="s q' + x.q + (x.miss ? ' miss' : '') + '" style="background-image:url(\'' + ICON(x.icon) + '\')" onclick="window.BashPanel&&BashPanel.tip(' + x.k + ')">'
      + (x.tmIcon ? '<span class="tm" style="background-image:url(\'' + ICON(x.tmIcon) + '\')"></span>' : '') + '</div>';
  }
  window.buildPanelUi = function(d){
    if (!document.getElementById("bpu-css")) { var st = document.createElement("style"); st.id = "bpu-css"; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
    var old = document.getElementById("bpu"); if (old) old.remove();
    var ui = document.createElement("div"); ui.id = "bpu";
    ui.innerHTML = '<div class="col l">' + (d.left || []).map(slot).join("") + '</div>'
      + '<div class="col r">' + (d.right || []).map(slot).join("") + '</div>'
      + '<div class="bot">' + (d.bottom || []).map(slot).join("") + '</div>'
      + '<div class="info"><div class="n" style="color:' + (d.color || "#8cff2e") + '">' + esc(d.name) + '</div>'
      + '<div class="d">' + esc(d.level) + ' ' + esc(d.raceName) + ' ' + esc(d.className) + '</div>'
      + (d.guild ? '<div class="g">&lt;' + esc(d.guild) + '&gt;</div>' : '')
      + '<div class="on ' + (d.online ? 'y' : '') + '"><span class="dot"></span>' + (d.online ? 'Online' : 'Offline') + '</div></div>'
      + '<div class="gs">' + (d.gs ? '<b style="color:' + d.gsColor + '">' + d.gs + '</b>' : '') + (d.audit ? '<span style="color:' + (d.auditOk ? '#8cff2e' : '#ff6b6b') + '">' + esc(d.audit) + '</span>' : '') + '</div>'
      + '<div class="tools"><button class="tb" onclick="BashPanel.full()">⤢</button><button class="tb" onclick="BashPanel.collapse()">▴</button></div>';
    document.body.appendChild(ui);
  };
})();
