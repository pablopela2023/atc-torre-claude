import path from "node:path"; import { pathToFileURL } from "node:url";
import puppeteer from "../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const url = pathToFileURL(path.resolve(process.argv[2], "index.html")).href;
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: "new", args: ["--no-sandbox"] });
let p = await b.newPage();
await p.evaluateOnNewDocument(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; window.webkitSpeechRecognition = undefined; });
await p.goto(url);
console.log("sin voz:", await p.evaluate(() => [document.getElementById("btn-escuchar").disabled, document.body.innerText.includes("Reconocimiento de voz no disponible")]));
await p.close();
p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.evaluateOnNewDocument(() => {
  class F { constructor() { window.__m = this; } start() { setTimeout(() => this.onstart && this.onstart(), 10); } stop() { setTimeout(() => this.onend && this.onend(), 10); } abort() { this.stop(); } }
  window.SpeechRecognition = F; window.webkitSpeechRecognition = F;
  window.__res = (lista, idx) => { const results = lista.map(([t, fin]) => { const r = [{ transcript: t, confidence: 0.9 }]; r.isFinal = fin; return r; }); window.__m.onresult({ resultIndex: idx || 0, results }); };
});
await p.goto(url);
await p.evaluate(() => { window.atc.reset(); document.getElementById("btn-escuchar").click(); });
await new Promise(r => setTimeout(r, 300));
// parcial que Safari no finaliza, luego silencio → volcado; después final revisado más corto
await p.evaluate(() => window.__res([["EC-DOG mantenga posición", false]]));
await new Promise(r => setTimeout(r, 4000));
const n1 = await p.evaluate(() => window.atc.obtenerRegistro().length);
await p.evaluate(() => window.__res([["ECDOG mantenga posición", true]]));
await new Promise(r => setTimeout(r, 4000));
const n2 = await p.evaluate(() => window.atc.obtenerRegistro().map(e => e.texto));
console.log("tras volcado:", n1, "tras final revisado:", JSON.stringify(n2), errs);
await b.close();
