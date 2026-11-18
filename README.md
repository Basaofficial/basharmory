# #Bash Armory

Warmane (WotLK 3.3.5) armory za telefon, u AMOLED i Monster-green stilu.

**Funkcije:** pretraga lika i guilda, gear s Wowhead tooltipima, GearScore (GearScoreLite formula), prosječni ilvl, Raid check (ICC 10/25 normal i HC, RS, ToC/ToGC, Ulduar, Naxx, Onyxia, OS), 3D model lika s gearom i transmogom (Bash 3D + Warmane 3D), transmog prikaz (kako izgleda u igri), talent stabla kao u igri s ikonicama i rankovima, paper doll, oba speca, profesije, PvP i arena timovi, guild roster s filterima, favoriti s online statusom, DKP sistem (bodovi, loot, decay, uvoz iz guilda, dijeljenje koda), poređenje dva lika, DEMO mod.

## APK
Svaki push na `main` pokreće GitHub Actions, koji napravi APK i objavi novi release (`BashArmory.apk`). Aplikacija sama provjerava nove verzije i ažurira se (Postavke → Ažuriranja: automatski / pitaj / isključeno).

Direktan download: https://github.com/Basaofficial/basharmory/releases/latest/download/BashArmory.apk

## Web verzija
Web verzija je na https://basaofficial.github.io/armory/ (DEMO radi odmah), ali browser blokira direktne zahtjeve prema Warmaneu (CORS). Zato postavi `proxy/worker.js` kao Cloudflare Worker i upiši njegov URL u **Postavke** (npr. `https://ime.workers.dev/?url=`). 3D model i Raid check rade samo u APK-u.

## Struktura koda
- `app/src/main/assets/index.html` – samo kostur stranice
- `css/app.css` – izgled (AMOLED + Monster green)
- `js/core.js` – Warmane/Wowhead podaci, GearScore, transmog, gemovi i enchanti
- `js/views.js` – početna, profil lika, gear · `js/gear3d.js` – paper doll, 3D panel
- `js/raid.js` – Raid check · `js/talent-trees.js` – talent stabla · `js/guild.js` – guild, online po ulogama, praćenje
- `js/dkp.js` – DKP · `js/update.js` – auto update · `js/compare.js`, `js/demo.js`, `js/fx.js`
- `model.html` – 3D lik (Wowhead viewer)
- `tests/run.js` – testovi; GitHub Actions ih vrti prije svakog builda

---
by [@basa.gtm](https://instagram.com/basa.gtm) · [☕ Buy me a coffee](https://paypal.me/basagtm) · Neslužbena fan aplikacija, nije povezana s Warmaneom ni Blizzardom.
