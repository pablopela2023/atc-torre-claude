import path from "node:path"; import { pathToFileURL } from "node:url";
import puppeteer from "../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const frases = process.argv.slice(3);
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage(); const errs=[]; p.on("pageerror", e => errs.push(e.message));
await p.goto(pathToFileURL(path.resolve(process.argv[2], "index.html")).href);
const r = await p.evaluate(fs => fs.map(f => { window.atc.reset(); const r = window.atc.procesar(f); return f + "\n   " + JSON.stringify([r.dirigidoAMi, r.reconocida, r.tipo, r.tipos, Object.fromEntries(Object.entries(r.datos).filter(([k,v]) => v !== null && !(Array.isArray(v)&&!v.length))), r.sugerencia, r.motivo]); }), frases);
console.log(r.join("\n"), errs); await b.close();
