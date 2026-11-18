/* #Bash Armory – automatski testovi za parsere (vrti se u GitHub Actions prije svakog builda).
   Ako ijedan test padne, APK se ne objavi. Pokretanje lokalno: node tests/run.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const A = path.join(__dirname, "../app/src/main/assets");
const store = {};
const ctx = {
  console, setTimeout, clearTimeout, JSON, Math, Date, Promise, encodeURIComponent, decodeURIComponent, escape, unescape, btoa:s=>Buffer.from(s,"binary").toString("base64"), atob:s=>Buffer.from(s,"base64").toString("binary"),
  localStorage: { getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]} },
  document: { querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, createElement:()=>({}) },
  addEventListener(){}, requestAnimationFrame(){}, innerWidth:400, innerHeight:800,
};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["data/talents-data.js","js/core.js","js/raid.js","js/talent-trees.js","js/dkp.js","js/guild.js","js/demo.js"])
  vm.runInContext(fs.readFileSync(path.join(A,f),"utf8"), ctx, {filename:f});
const R = c => vm.runInContext(c, ctx);

let pass=0, fail=0;
function t(name, fn){ try { fn(); pass++; console.log("  ✓ "+name); } catch(e){ fail++; console.log("  ✗ "+name+"\n      "+e.message); } }
function eq(a,b){ const A=JSON.stringify(a), B=JSON.stringify(b); if (A!==B) throw new Error(`očekivano ${B}, dobijeno ${A}`); }

console.log("GearScore");
t("epic 264 kaciga", ()=>eq(R(`itemGS({ilvl:264,quality:4,slot:1})`), 494));
t("legendary 284 dvoručno", ()=>eq(R(`itemGS({ilvl:284,quality:5,slot:17})`), 1433));
t("tabard ne broji", ()=>eq(R(`itemGS({ilvl:1,quality:1,slot:19})`), 0));

console.log("Transmog i gemovi sa Warmane stranice");
t("ench, gemovi i transmog", ()=>eq(R(`JSON.stringify(parseItemLinks('<a rel="item=51290&amp;ench=3820&amp;gems=3621:40113:0&amp;transmog=34322">'))`),
  JSON.stringify({"51290":{ench:3820,gems:[3621,40113],tm:34322,seen:true}})));
t("bez enchanta i gemova", ()=>eq(R(`JSON.stringify(parseItemLinks('<a href="?item=50000&ench=0&gems=0:0">'))`), JSON.stringify({"50000":{gems:[],seen:true}})));
t("transmog iz API polja", ()=>{ eq(R(`tmogOf({item:5,transmog:"777"})`),777); eq(R(`tmogOf({item:5,transmog:{entry:9}})`),9); eq(R(`tmogOf({item:5,transmog:""})`),0); });
t("socketi iz tooltipa", ()=>eq(R(`socketsOf({tooltip:'<a class="socket-red q0">x</a><a class="socket-meta">y</a>'})`), 2));

console.log("Talenti");
t("DK ima 88 talenata", ()=>eq(R(`TALENTS["Death Knight"].reduce((a,t)=>a+t.t.length,0)`), 88));
t("svaka klasa ima 3 stabla", ()=>eq(R(`Object.values(TALENTS).every(x=>x.length===3)`), true));
t("string sa crticama → rankovi", ()=>{ const ok=R(`(()=>{const tr=TALENTS["Death Knight"]; const a=DEMO_TAL(tr,[0,17,54]);
  const parts=[0,1,2].map(i=>{let o=0;for(let k=0;k<i;k++)o+=tr[k].t.length;return a.slice(o,o+tr[i].t.length).join('').replace(/0+$/,'')});
  const s=fromDashed(parts.join('-'),tr); return s && s.join('')===a.join('');})()`); eq(ok,true); });
t("previše bodova se odbija", ()=>eq(R(`validSpec("9".repeat(88), TALENTS["Death Knight"])`), null));

console.log("Uloge u guildu");
t("Holy paladin = heal", ()=>eq(R(`roleOf("Paladin","Holy")`),"heal"));
t("Prot warrior = tank", ()=>eq(R(`roleOf("Warrior","Protection")`),"tank"));
t("Feral = tank ili DPS", ()=>eq(R(`roleOf("Druid","Feral Combat")`),"flex"));
t("Mage = DPS", ()=>eq(R(`roleOf("Mage","Frost")`),"dps"));

console.log("DKP");
t("bodovi, loot i decay", ()=>eq(R(`JSON.stringify(dkpPoints({members:{A:{},B:{}}, log:[
  {type:"award",who:["A","B"],amt:20},{type:"loot",who:["A"],amt:-15},{type:"decay",pct:10}]}))`), JSON.stringify({A:4.5,B:18})));

console.log(`\n${pass} prošlo, ${fail} palo`);
process.exit(fail ? 1 : 0);
