import http from "node:http"; import fs from "node:fs"; import path from "node:path";
import puppeteer from "../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const DIR = path.resolve(process.argv[2]); const SUB = "/colacion-atc/";
const MIME = {".html":"text/html; charset=utf-8",".js":"text/javascript",".webmanifest":"application/manifest+json"};
const reqs = [];
const srv = http.createServer((q, r) => {
  reqs.push(q.url);
  if (!q.url.startsWith(SUB)) { r.writeHead(404); return r.end("fuera"); }
  let p = q.url.slice(SUB.length).split("?")[0] || "index.html";
  const f = path.join(DIR, p);
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {"Content-Type": MIME[path.extname(f)] || "text/plain"}); r.end(fs.readFileSync(f));
}).listen(0);
const port = srv.address().port; const base = `http://127.0.0.1:${port}${SUB}`;
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const consola = [], externas = [];
page.on("console", m => { if (["error","warning"].includes(m.type())) consola.push(m.type()+": "+m.text()); });
page.on("pageerror", e => consola.push("pageerror: " + e.message));
page.on("request", q => { if (!q.url().startsWith(`http://127.0.0.1:${port}`) && !q.url().startsWith("data:") && !q.url().startsWith("blob:")) externas.push(q.url()); });
const out = {};
await page.goto(base, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1500));
out.sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? { scope: r.scope, active: !!r.active, ctrl: !!navigator.serviceWorker.controller } : null; });
out.manifest = await page.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); return l.href; });
out.cspFetch = await page.evaluate(async () => { try { await fetch("https://example.com/"); return "PERMITIDO"; } catch (e) { return "bloqueado: " + e.message; } });
out.cspImg = await page.evaluate(() => new Promise(res => { const i = new Image(); i.onload = () => res("PERMITIDO"); i.onerror = () => res("bloqueado"); i.src = "https://example.com/x.png"; setTimeout(()=>res("timeout"),3000); }));
out.aviso = await page.evaluate(() => { const e = document.getElementById("aviso"); const r = e.getBoundingClientRect(); return { visible: r.height > 0 && r.top < innerHeight, texto: e.innerText.slice(0, 80) }; });
out.overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
out.pequenos = await page.evaluate(() => [...document.querySelectorAll("button, input, textarea, select, summary, a")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44); }).map(e => `${e.tagName}#${e.id||""} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} "${(e.innerText||e.value||"").slice(0,25)}"`));
out.anchos = await page.evaluate(() => [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.tagName + "#" + e.id + "." + e.className).slice(0, 10));
{ const c0 = await page.target().createCDPSession(); const am = await c0.send("Page.getAppManifest"); out.manifestErrores = am.errors; const pm = JSON.parse(am.data || "{}"); out.manifestCampos = { name: pm.name, display: pm.display, start_url: pm.start_url, scope: pm.scope, icons: (pm.icons||[]).map(i => i.sizes) };
  try { out.instalable = (await c0.send("Page.getInstallabilityErrors")).installabilityErrors; } catch (e) { out.instalable = "n/d " + e.message; } }
out.voz = await page.evaluate(() => ({ boton: document.getElementById("btn-escuchar").disabled, estado: document.getElementById("estado-audio").textContent }));
out.tipografia = await page.evaluate(() => ({ mensaje: getComputedStyle(document.getElementById("mensaje-texto")).fontSize, sugerencia: getComputedStyle(document.getElementById("sugerencia-texto")).fontSize, fondo: getComputedStyle(document.body).backgroundColor }));
// demo
await page.evaluate(() => window.atc.reset());
const demo = [];
for (let i = 0; i < 33; i++) { await page.evaluate(() => document.getElementById("btn-demo-siguiente").click()); demo.push(await page.evaluate(() => [document.getElementById("mensaje-texto").textContent, document.getElementById("sugerencia-texto").textContent, document.getElementById("estado-demo").textContent])); }
out.demo = demo;
await page.click("#btn-demo-reiniciar");
// manual con XSS
await page.evaluate(() => window.atc.reset());
await page.type("#entrada-manual", 'EC-DOG, <img src=x onerror="window.__xss=1"> QNH 1013, pista 05.');
await page.click("#btn-procesar");
out.manual = await page.evaluate(() => ({ xss: window.__xss || 0, imgs: document.querySelectorAll("#lista-registro img, #mensaje-texto img").length, qnh: document.getElementById("dato-qnh").textContent, sug: document.getElementById("sugerencia-texto").textContent, reg: window.atc.obtenerRegistro().length }));
// export
const cdp = await page.target().createCDPSession();
const dl = "/tmp/atc-dl"; fs.rmSync(dl, { recursive: true, force: true }); fs.mkdirSync(dl);
await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dl });
await page.click("#btn-descargar"); await new Promise(r => setTimeout(r, 1500));
const files = fs.readdirSync(dl); out.export = files.map(f => f + ": " + fs.readFileSync(path.join(dl, f), "utf8").slice(0, 300));
await page.click("#btn-copiar"); await new Promise(r => setTimeout(r, 500));
out.copiar = await page.evaluate(() => document.getElementById("estado-exportar").textContent);
// corrupción
for (const v of ['{roto', '"x"', '[1,2,{"tipo":"<b>","texto":5}]', 'null', '{"qnh":"9999","viento":{"velocidad":"x"}}']) {
  await page.evaluate(v => { localStorage.setItem("colacionATC.datos", v); localStorage.setItem("colacionATC.registro", v); localStorage.setItem("colacionATC.indicativo", v); }, v);
  const errs0 = consola.length;
  await page.reload({ waitUntil: "load" });
  const ok = await page.evaluate(() => !!(window.atc && window.atc.procesar("EC-DOG, QNH 1020.").datos.qnh === 1020) && window.atc.obtenerIndicativo());
  (out.corrupcion ||= []).push(v + " → " + ok + (consola.length > errs0 ? " ERR " + consola.slice(errs0).join("|") : ""));
}
await page.evaluate(() => localStorage.clear());
// offline
await page.reload({ waitUntil: "networkidle0" });
await page.setOfflineMode(true);
try { await page.reload({ waitUntil: "load" }); out.offline = await page.evaluate(() => !!window.atc); } catch (e) { out.offline = "fallo " + e.message; }
await page.setOfflineMode(false);
out.consola = consola; out.externas = externas; out.reqsFueraSub = reqs.filter(u => !u.startsWith(SUB));
console.log(JSON.stringify(out, null, 1));
await browser.close(); srv.close();
