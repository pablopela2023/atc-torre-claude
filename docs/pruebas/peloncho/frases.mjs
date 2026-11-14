import path from "node:path"; import { pathToFileURL } from "node:url";
import puppeteer from "../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const frases = [
 "Buenos días, EC-DOG. Adelante.",
 "EC-DOG, autorizado a rodar punto de espera pista 23.",
 "EC-DOG, mantenga posición.",
 "EC-DOG, autorizado a entrar cabecera 23.",
 "EC-DOG, autorizado a entrar y backtrack pista 23.",
 "EC-DOG, autorizado a despegar pista 23, viento 24010KT.",
 "EC-DOG, autorizado a despegar pista 23, viento 24010KT, notifique punto S1.",
 "EC-DOG, autorizado a despegar pista 23, viento 24010KT, notifique punto S1. Me confirma intenciones.",
 "EC-DOG, recibido.",
 "EC-DOG, recibido. Sin tráfico notificado en la zona.",
 "EC-DOG, recibido, notifique 25 millas fuera.",
 "Buenas de nuevo. EC-DOG. Adelante.",
 "EC-DOG, recibido, mantenga posición, le aviso para regresar al campo.",
 "EC-DOG, proceda para el campo, notifique o llame con campo a la vista.",
 "EC-DOG, entre en circuito de tráfico, notifique en viento en cola izquierda pista 23.",
 "ECDOG, proceda para base izquierda pista 23.",
 "EC-DOG, recibido. Extienda o prolongue viento en cola izquierda pista 23. Le aviso para virar.",
 "EC-DOG, llame en base pista 23.",
 "EC-DOG, a la vista, autorizado a aterrizar pista 23, viento 25010KT.",
 "Recibido, continúe rodaje a plataforma militar. EC-DOG.",
 // variantes habladas
 "eco charlie delta oscar golf autorizado a despegar pista dos tres viento dos cuatro cero grados diez nudos",
 "echo charlie delta oscar golf puesta en marcha aprobada qnh uno cero dos cinco pista dos tres notifique listo rodar",
 "delta oscar golf pase a frecuencia uno uno ocho decimal cuatro cinco cinco",
 "EC-DOG transpondedor siete cero cero cero",
 "EC-DOG, squawk 4721, contacte con aproximación en 119.700",
 "EC-DOG continúe ascenso para cinco mil quinientos pies",
 "EC-DOG ascienda a tres mil pies",
 "EC-DOG QNH mil cero uno tres",
 "E C D O G autorizado a aterrizar pista 23",
 "DOG autorizado a aterrizar pista 23",
 "EC-DOG información ATIS whiskey, QNH 1019",
 "EC-DOG, frecuencia 118,455",
 "EC-DOG pase con torre en uno uno ocho coma cuatro cinco cinco",
 "EC-DOG, autorizado a rodar punto de espera pista 23 vía calle charlie calle alfa",
 "EC-DOG, viento 240 grados 10 nudos, autorizado a despegar pista 23",
 "EC-DOG autorizado a aterrizar pista",
 "EC-DOG QNH 10",
 "EC-DOH autorizado a despegar pista 23",
 "EC-DOGX autorizado a despegar pista 23",
 "Tráfico EC-DOG en final, IBERIA 3254 autorizado a despegar pista 23",
 "IBERIA 3254, autorizado a despegar pista 23, EC-DOG mantenga posición",
 "EC-DOG, mantenga posición, tráfico Cessna en final pista 23",
 "EC-DOG, autorizado a entrar y backtrack pista dos tres, notifique listo",
 "EC-DOG, pista en servicio cero cinco, QNH uno cero uno tres",
 "EC-DOG frecuencia uno dos uno decimal siete",
 "EC-DOG, recibido, notifique veinticinco millas fuera",
 "EC-DOG, autorizado a despegar pista 23, viento calma",
 "EC-DOG, autorizado a despegar pista 23, viento variable 3 nudos",
];
const dirs = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: "new", args: ["--no-sandbox"] });
const res = {};
for (const d of dirs) {
  const page = await browser.newPage();
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(pathToFileURL(path.resolve(d, "index.html")).href);
  res[d] = await page.evaluate(fs => fs.map(f => { window.atc.reset(); const r = window.atc.procesar(f); const dd = {}; for (const [k, v] of Object.entries(r.datos)) if (v !== null && !(Array.isArray(v) && !v.length)) dd[k] = v; return { f, a: r.dirigidoAMi, ok: r.reconocida, tipo: r.tipo, tipos: r.tipos.join(","), datos: JSON.stringify(dd), sug: r.sugerencia }; }), frases);
  res[d].errs = errs;
  await page.close();
}
await browser.close();
const ks = dirs;
for (let i = 0; i < frases.length; i++) {
  console.log("\n### " + frases[i]);
  let prev = null;
  for (const d of ks) { const r = res[d][i]; const s = `${r.a ? "DIR" : "no"} ${r.ok ? "ok" : "NOREC"} ${r.tipo} [${r.tipos}] ${r.datos} => ${r.sug}`; console.log((s === prev ? "  = " : "  ") + path.basename(d) + ": " + (s === prev ? "(igual)" : s)); prev = s; }
}
for (const d of ks) console.log(d, "errs", res[d].errs);
