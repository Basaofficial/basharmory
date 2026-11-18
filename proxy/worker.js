// Cloudflare Worker – CORS proxy za web verziju #Bash Armory (APK ga ne treba).
// Upotreba: https://TVOJ-WORKER.workers.dev/?url=<encoded url>
const ALLOWED = ["armory.warmane.com", "www.wowhead.com", "nether.wowhead.com"];

export default {
  async fetch(req) {
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const target = new URL(req.url).searchParams.get("url");
    if (!target) return new Response("missing url", { status: 400, headers: cors });
    let u; try { u = new URL(target); } catch { return new Response("bad url", { status: 400, headers: cors }); }
    if (!ALLOWED.includes(u.hostname)) return new Response("host not allowed", { status: 403, headers: cors });
    const r = await fetch(u.toString(), { headers: { "User-Agent": "BashArmory/1.0" }, cf: { cacheTtl: 120 } });
    const h = new Headers(r.headers); Object.entries(cors).forEach(([k, v]) => h.set(k, v));
    return new Response(r.body, { status: r.status, headers: h });
  }
};
