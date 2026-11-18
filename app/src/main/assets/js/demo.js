/* #Bash Armory · DEMO podaci */
/* ---------- Demo data (offline preview) ---------- */
const DEMO_ITEMS = {
 900001:{id:900001,name:"Demo Helm of the Lich",ilvl:264,quality:4,slot:1,sockets:2},900002:{id:900002,name:"Demo Pendant",ilvl:264,quality:4,slot:2},
 900003:{id:900003,name:"Demo Pauldrons",ilvl:264,quality:4,slot:3,sockets:1},900004:{id:900004,name:"Demo Cloak",ilvl:251,quality:4,slot:16},
 900005:{id:900005,name:"Demo Battleplate",ilvl:264,quality:4,slot:5,sockets:2},900006:{id:900006,name:"Demo Bracers",ilvl:264,quality:4,slot:9},
 900007:{id:900007,name:"Demo Gauntlets",ilvl:264,quality:4,slot:10,sockets:1},900008:{id:900008,name:"Demo Girdle",ilvl:264,quality:4,slot:6},
 900009:{id:900009,name:"Demo Legplates",ilvl:264,quality:4,slot:7,sockets:2},900010:{id:900010,name:"Demo Sabatons",ilvl:264,quality:4,slot:8},
 900011:{id:900011,name:"Demo Ashen Band",ilvl:264,quality:4,slot:11},900012:{id:900012,name:"Demo Signet",ilvl:251,quality:4,slot:11},
 900013:{id:900013,name:"Demo Fang",ilvl:264,quality:4,slot:12},900014:{id:900014,name:"Demo Tiny Abomination",ilvl:264,quality:4,slot:12},
 900015:{id:900015,name:"Demo Shadowmourne",ilvl:284,quality:5,slot:17,sockets:3},900016:{id:900016,name:"Demo Sigil",ilvl:264,quality:4,slot:28},
 900017:{id:900017,name:"Demo Tabard",ilvl:1,quality:1,slot:19},
 900020:{id:900020,name:"Demo Crown of the Fire Festival",ilvl:1,quality:3,slot:1},900021:{id:900021,name:"Demo Tier 2 Pauldrons",ilvl:76,quality:4,slot:3}
};
const DEMO_CHAR = {name:"Bashdk",realm:"DEMO",online:true,level:"80",faction:"Horde",gender:"Male",race:"Blood Elf",class:"Death Knight",
 honorablekills:"12873",guild:"Bash Squad",achievementpoints:"9420",
 equipment:Object.keys(DEMO_ITEMS).filter(id=>num(id)<900020).map(id=>({name:DEMO_ITEMS[id].name,item:id,transmog:id==="900001"?"900020":id==="900003"?"900021":""})),
 talents:[{tree:"Unholy",points:[0,17,54]},{tree:"Frost",points:[3,57,11]}],
 professions:[{name:"Blacksmithing",skill:"450"},{name:"Mining",skill:"450"}],
 pvpteams:[{type:"2v2",name:"Bash Bros",rating:"2140",rank:"312"},{type:"3v3",name:"Monster Green",rating:"1890",rank:""}]};
const DEMO_RAID = (()=>{ const r={}; const have=["The Frozen Throne (10 player)","Storming the Citadel (10 player)","The Plagueworks (10 player)","The Crimson Hall (10 player)","The Frostwing Halls (10 player)","The Frozen Throne (25 player)","Storming the Citadel (25 player)","The Plagueworks (25 player)","The Crimson Hall (25 player)","The Frostwing Halls (25 player)","Bane of the Fallen King","Heroic: Storming the Citadel (10 player)","Heroic: The Plagueworks (10 player)","The Twilight Destroyer (25 player)","Call of the Crusade (25 player)","Call of the Grand Crusade (10 player)","The Fall of Naxxramas (25 player)","Onyxia's Lair (25 player)","The Descent into Madness (25 player)"];
  RAIDS.forEach(x=>x.a.forEach(a=>{ r[a.n]= have.includes(a.n)?{state:"yes",date:"12/03/2025"}:{state:"no"}; })); return r; })();
const DEMO_EXTRAS = {900001:{ench:3817,gems:[41398,40111]},900003:{ench:3808,gems:[40111]},900004:{ench:3831,gems:[]},900005:{ench:3832,gems:[40111,40111]},
 900006:{ench:0,gems:[]},900007:{ench:3604,gems:[40111]},900008:{ench:0,gems:[40111]},900009:{ench:3823,gems:[40111,40111]},900010:{ench:3232,gems:[]},900015:{ench:3368,gems:[40111,40111,40111]}};
const DEMO_SPECS = {Bashdk:"Unholy", Healbasa:"Holy", Frosty:"Frost"};
const DEMO_GUILD = {name:"Bash Squad",realm:"DEMO",roster:[
 {name:"Bashdk",online:true,level:"80",class:"Death Knight",race:"Blood Elf",achievementpoints:"9420"},
 {name:"Healbasa",online:true,level:"80",class:"Priest",race:"Undead",achievementpoints:"7120"},
 {name:"Totemka",online:false,level:"80",class:"Shaman",race:"Troll",achievementpoints:"5300"},
 {name:"Pewpew",online:false,level:"72",class:"Hunter",race:"Orc",achievementpoints:"2210"},
 {name:"Frosty",online:true,level:"80",class:"Mage",race:"Blood Elf",achievementpoints:"8050"}]};
