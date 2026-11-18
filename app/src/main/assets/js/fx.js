/* #Bash Armory · Pozadinski efekt */
/* ---------- Hacker particle background ---------- */
(function fx(){
  const c=$("#fx"), x=c.getContext("2d"); let W,H,P=[];
  function rs(){ W=c.width=innerWidth; H=c.height=innerHeight; P=Array.from({length:Math.min(60,Math.floor(W*H/14000))},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3})); }
  rs(); addEventListener("resize",rs);
  (function loop(){ x.clearRect(0,0,W,H);
    for(const p of P){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W) p.vx*=-1; if(p.y<0||p.y>H) p.vy*=-1;
      x.fillStyle="#8cff2e"; x.fillRect(p.x,p.y,1.6,1.6); }
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){ const a=P[i],b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<110){ x.strokeStyle=`rgba(140,255,46,${(1-d/110)*.18})`; x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke(); } }
    requestAnimationFrame(loop); })();
})();
