#!/usr/bin/env node
/**
 * Arnés de aceptación DESARROLLA-2026-11-14-ATC.
 * Uso:
 *   ./run.sh
 *   ./run.sh /ruta/a/app/index.html
 *   ATC_APP=/ruta/a/app npm test
 *
 * Si no hay app, termina con código 2 (esperado en el paso de especificación).
 * Si hay app y algún caso falla, código 1. Todo correcto: código 0.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

function norm(s) {
  if (s == null) return "";
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[º°]/g, " ")
    .replace(/[^a-z0-9.+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function endsWithIndicativo(sugerencia, indicativo = "EC-DOG") {
  const n = norm(sugerencia).replace(/[.\s]+$/, "");
  const ind = norm(indicativo);
  const compact = ind.replace(/\s+/g, "");
  return n.endsWith(ind) || n.endsWith(compact) || n.endsWith(ind.replace(" ", ""));
}

function resolveApp(argvPath) {
  const cands = [];
  if (argvPath) cands.push(path.resolve(argvPath));
  if (process.env.ATC_APP) cands.push(path.resolve(process.env.ATC_APP));
  cands.push(
    path.join(ROOT, "app", "index.html"),
    path.join(ROOT, "index.html"),
    path.join(__dirname, "index.html"),
  );
  for (const c of cands) {
    const html = c.endsWith(".html") ? c : path.join(c, "index.html");
    if (fs.existsSync(html) && fs.statSync(html).isFile()) {
      return { html: path.resolve(html), dir: path.dirname(path.resolve(html)) };
    }
  }
  return null;
}

function startServer(dir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/index.html";
      const file = path.normalize(path.join(dir, rel));
      if (!file.startsWith(dir)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404).end("not found");
          return;
        }
        res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/index.html` });
    });
    server.on("error", reject);
  });
}

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function campo(datos, key) {
  if (!datos) return undefined;
  return datos[key] ?? datos[key.toLowerCase()];
}

function visOk(got, expected) {
  const n = norm(got);
  const e = norm(expected);
  if (n === e) return true;
  // "+ 10 Km" → debe incluir 10 y km
  if (/\d/.test(e) && /km/.test(e)) {
    const num = e.match(/\d+/)?.[0];
    return n.includes(num) && n.includes("km");
  }
  return n.includes(e) || e.includes(n);
}

function nubesOk(got, expected) {
  const n = norm(got).replace(/\s+/g, "");
  const parts = norm(expected).split(" ").filter(Boolean);
  return parts.every((p) => n.includes(p.replace(/\s+/g, "")));
}

function callesOk(got, expected) {
  const g = (got || []).map((x) => norm(x));
  const e = expected.map((x) => norm(x));
  if (g.length !== e.length) return false;
  return e.every((x) => g.includes(x));
}

function altitudOk(got, expected) {
  const n = norm(got);
  const e = norm(expected); // "5500 ft"
  const num = e.match(/\d+/)?.[0];
  return n.includes(num) && (n.includes("ft") || n.includes("pies") || n.includes("feet"));
}

function compareDatos(got, expected, fallos, id) {
  if (!expected) return;
  const d = got || {};
  for (const [k, v] of Object.entries(expected)) {
    if (k === "viento") {
      const gv = campo(d, "viento") || {};
      if (Number(gv.direccion) !== Number(v.direccion) || Number(gv.velocidad) !== Number(v.velocidad)) {
        fallos.push(`${id}: viento esperado ${v.direccion}/${v.velocidad}, obtenido ${JSON.stringify(gv)}`);
      } else if (v.unidad && norm(gv.unidad || "kt") !== norm(v.unidad)) {
        fallos.push(`${id}: unidad de viento esperada ${v.unidad}, obtenida ${gv.unidad}`);
      }
    } else if (k === "calles") {
      if (!callesOk(campo(d, "calles"), v)) {
        fallos.push(`${id}: calles esperadas ${JSON.stringify(v)}, obtenidas ${JSON.stringify(campo(d, "calles"))}`);
      }
    } else if (k === "visibilidad") {
      if (!visOk(campo(d, "visibilidad"), v)) {
        fallos.push(`${id}: visibilidad esperada ${v}, obtenida ${campo(d, "visibilidad")}`);
      }
    } else if (k === "nubes") {
      if (!nubesOk(campo(d, "nubes"), v)) {
        fallos.push(`${id}: nubes esperadas ${v}, obtenidas ${campo(d, "nubes")}`);
      }
    } else if (k === "altitud") {
      if (!altitudOk(campo(d, "altitud"), v)) {
        fallos.push(`${id}: altitud esperada ${v}, obtenida ${campo(d, "altitud")}`);
      }
    } else if (k === "pista" || k === "punto" || k === "viraje" || k === "atis" || k === "squawk" || k === "frecuencia") {
      if (norm(campo(d, k)) !== norm(v)) {
        fallos.push(`${id}: ${k} esperado ${v}, obtenido ${campo(d, k)}`);
      }
    } else if (typeof v === "number") {
      if (Number(campo(d, k)) !== Number(v)) {
        fallos.push(`${id}: ${k} esperado ${v}, obtenido ${campo(d, k)}`);
      }
    } else if (norm(campo(d, k)) !== norm(v)) {
      fallos.push(`${id}: ${k} esperado ${v}, obtenido ${campo(d, k)}`);
    }
  }
}

function tipoOk(res, caso) {
  const tipos = Array.isArray(res.tipos) ? res.tipos : [];
  const tipo = res.tipo ?? null;
  if (caso.tipo) return tipo === caso.tipo || tipos.includes(caso.tipo);
  if (caso.tipo_en_tipos) return tipo === caso.tipo_en_tipos || tipos.includes(caso.tipo_en_tipos);
  if (caso.tipo_en_tipos_alguno) {
    return caso.tipo_en_tipos_alguno.some((t) => t === tipo || tipos.includes(t));
  }
  return true;
}

function datosVacios(datos) {
  if (!datos) return true;
  for (const [k, v] of Object.entries(datos)) {
    if (v == null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.values(v).every((x) => x == null || x === "")) continue;
    return false;
  }
  return true;
}

function securityScan(dir) {
  const fallos = [];
  const avisos = [];
  const files = fs.readdirSync(dir).filter((f) => /\.(html|js|webmanifest|css)$/i.test(f));
  const joined = files.map((f) => `/* ${f} */\n` + fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  if (/\beval\s*\(/.test(joined) || /\bnew\s+Function\s*\(/.test(joined) || /\bdocument\.write\s*\(/.test(joined)) {
    fallos.push("seguridad: aparece eval, new Function o document.write");
  }
  if (/\.(innerHTML|outerHTML)\s*=/.test(joined) || /\binsertAdjacentHTML\s*\(/.test(joined)) {
    fallos.push("seguridad: se asigna innerHTML/outerHTML o se usa insertAdjacentHTML (usar textContent)");
  }
  const html = fs.existsSync(path.join(dir, "index.html"))
    ? fs.readFileSync(path.join(dir, "index.html"), "utf8")
    : "";
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(html) && !/http-equiv=["']content-security-policy["']/.test(html)) {
    fallos.push("seguridad: falta meta Content-Security-Policy");
  }
  if (/<script[^>]+src=["']https?:/i.test(html) || /<link[^>]+href=["']https?:/i.test(html)) {
    fallos.push("seguridad: hay script o estilo de un origen externo");
  }
  if (!/apple-mobile-web-app-capable/i.test(html)) {
    fallos.push("A4: falta apple-mobile-web-app-capable");
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    fallos.push("A4: falta meta viewport");
  }
  const manifestPath = files.find((f) => f.endsWith(".webmanifest") || f === "manifest.json");
  if (!manifestPath) {
    fallos.push("A4: falta manifest.webmanifest");
  } else {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(dir, manifestPath), "utf8"));
      if (m.display !== "standalone") fallos.push("A4: manifest.display no es standalone");
      if (!m.name && !m.short_name) fallos.push("A4: manifest sin name/short_name");
    } catch (e) {
      fallos.push(`A4: manifest no es JSON válido (${e.message})`);
    }
  }
  if (html && !/NO CERTIFICADA/i.test(html)) {
    avisos.push("A1: el HTML no contiene el literal «NO CERTIFICADA» (puede inyectarse por JS; se comprobará en el DOM)");
  }
  return { fallos, avisos, files };
}

async function main() {
  const casosPath = path.join(__dirname, "casos.json");
  const pack = JSON.parse(fs.readFileSync(casosPath, "utf8"));
  const casos = pack.casos;
  const appArg = process.argv[2];
  const app = resolveApp(appArg);

  console.log("Arnés ATC — DESARROLLA-2026-11-14-ATC");
  console.log("Casos normativos:", casos.map((c) => c.id).join(", "));

  if (!app) {
    console.log("");
    console.log("No se encontró index.html (se buscó en app/index.html, ../index.html y ATC_APP).");
    console.log("La aplicación aún no está construida. El arnés está listo y fallar aquí es lo esperado.");
    console.log("Cuando exista la app, ejecute:  ./run.sh /ruta/a/app/index.html");
    process.exit(2);
  }

  console.log("App:", app.html);

  const sec = securityScan(app.dir);
  const fallos = [...sec.fallos];
  const avisos = [...sec.avisos];

  const chrome = findChrome();
  if (!chrome) {
    console.error("No se encontró Chrome/Chromium. Instálelo o defina CHROME_PATH.");
    process.exit(2);
  }

  let puppeteer;
  try {
    puppeteer = (await import("puppeteer-core")).default;
  } catch (e) {
    console.error("Falta puppeteer-core. En esta carpeta ejecute: npm install");
    console.error(e.message);
    process.exit(2);
  }

  const { server, url } = await startServer(app.dir);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const hook = await page.evaluate(() => {
      const a = window.atc;
      return {
        exists: Boolean(a && typeof a.procesar === "function"),
        keys: a ? Object.keys(a) : [],
      };
    });
    if (!hook.exists) {
      fallos.push("A3: no existe window.atc.procesar al cargar index.html");
      printReport(fallos, avisos, errors);
      process.exitCode = 1;
      return;
    }

    const metodos = await page.evaluate(() => ({
      reset: typeof window.atc.reset === "function",
      configurar: typeof window.atc.configurar === "function",
      obtenerIndicativo: typeof window.atc.obtenerIndicativo === "function",
      obtenerDatos: typeof window.atc.obtenerDatos === "function",
      obtenerRegistro: typeof window.atc.obtenerRegistro === "function",
    }));
    for (const [m, ok] of Object.entries(metodos)) {
      if (!ok) fallos.push(`A3: falta window.atc.${m}`);
    }
    await page.evaluate(() => {
      const a = window.atc;
      if (typeof a.reset !== "function") a.reset = () => {};
      if (typeof a.obtenerIndicativo !== "function") a.obtenerIndicativo = () => null;
      if (typeof a.obtenerDatos !== "function") a.obtenerDatos = () => ({});
      if (typeof a.obtenerRegistro !== "function") a.obtenerRegistro = () => [];
    });

    const avisoDom = await page.evaluate(() => document.body ? document.body.innerText : "");
    if (!/NO CERTIFICADA/i.test(avisoDom) || !/escucha directa/i.test(avisoDom)) {
      fallos.push("A1: el aviso de seguridad no es visible en el DOM (debe incluir «NO CERTIFICADA» y «escucha directa»)");
    }

    const indicativo = await page.evaluate(async () => {
      if (typeof window.atc.reset === "function") window.atc.reset();
      return typeof window.atc.obtenerIndicativo === "function"
        ? window.atc.obtenerIndicativo()
        : null;
    });
    if (indicativo && norm(indicativo) !== norm(pack.indicativo_defecto)) {
      fallos.push(`A2: indicativo por defecto ${indicativo}, se esperaba ${pack.indicativo_defecto}`);
    }

    const porId = Object.fromEntries(casos.filter((c) => c.texto).map((c) => [c.id, c]));

    for (const caso of casos) {
      if (caso.secuencia) {
        await page.evaluate(() => window.atc.reset());
        for (const id of caso.secuencia) {
          const t = porId[id]?.texto;
          if (!t) {
            fallos.push(`${caso.id}: no se encuentra el texto de ${id}`);
            continue;
          }
          await page.evaluate((texto) => window.atc.procesar(texto), t);
        }
        const datos = await page.evaluate(() => window.atc.obtenerDatos());
        compareDatos(datos, caso.obtenerDatos, fallos, caso.id + " (obtenerDatos)");
        continue;
      }

      await page.evaluate(() => window.atc.reset());

      let snapshot = null;
      if (caso.no_actualiza_panel) {
        snapshot = await page.evaluate(() => window.atc.obtenerDatos());
      }

      const res = await page.evaluate((texto) => window.atc.procesar(texto), caso.texto);
      if (!res || typeof res !== "object") {
        fallos.push(`${caso.id}: procesar() no devolvió un objeto`);
        continue;
      }

      if (Boolean(res.dirigidoAMi) !== Boolean(caso.dirigidoAMi)) {
        fallos.push(`${caso.id}: dirigidoAMi esperado ${caso.dirigidoAMi}, obtenido ${res.dirigidoAMi}`);
      }
      if (caso.reconocida !== undefined && Boolean(res.reconocida) !== Boolean(caso.reconocida)) {
        fallos.push(`${caso.id}: reconocida esperado ${caso.reconocida}, obtenido ${res.reconocida}`);
      }
      if (!tipoOk(res, caso)) {
        fallos.push(`${caso.id}: tipo esperado ${caso.tipo || caso.tipo_en_tipos || caso.tipo_en_tipos_alguno}, obtenido tipo=${res.tipo} tipos=${JSON.stringify(res.tipos)}`);
      }

      if (caso.sugerencia_null) {
        if (res.sugerencia != null && String(res.sugerencia).trim() !== "") {
          fallos.push(`${caso.id}: sugerencia debía ser null, obtenida ${JSON.stringify(res.sugerencia)}`);
        }
      } else if (caso.colacion_contiene?.length) {
        const sug = res.sugerencia;
        if (sug == null || String(sug).trim() === "") {
          fallos.push(`${caso.id}: faltaba sugerencia`);
        } else {
          const n = norm(sug);
          for (const frag of caso.colacion_contiene) {
            if (!n.includes(norm(frag))) {
              fallos.push(`${caso.id}: la colación no contiene «${frag}». Obtenida: ${sug}`);
            }
          }
          for (const frag of caso.colacion_no_contiene || []) {
            if (n.includes(norm(frag))) {
              fallos.push(`${caso.id}: la colación no debía contener «${frag}». Obtenida: ${sug}`);
            }
          }
          if (caso.indicativo_al_final && !endsWithIndicativo(sug, pack.indicativo_defecto)) {
            fallos.push(`${caso.id}: la colación no termina con ${pack.indicativo_defecto}. Obtenida: ${sug}`);
          }
        }
      }

      compareDatos(res.datos, caso.datos, fallos, caso.id);

      if (caso.sin_datos_inventados && !datosVacios(res.datos)) {
        fallos.push(`${caso.id}: no debía extraer datos, obtuvo ${JSON.stringify(res.datos)}`);
      }

      if (caso.no_actualiza_panel) {
        const after = await page.evaluate(() => window.atc.obtenerDatos());
        if (JSON.stringify(after) !== JSON.stringify(snapshot)) {
          fallos.push(`${caso.id}: no debía actualizar el panel. Antes=${JSON.stringify(snapshot)} Después=${JSON.stringify(after)}`);
        }
      }
    }

    // A6: reset limpia QNH
    await page.evaluate(() => {
      window.atc.reset();
      window.atc.procesar(
        "EC-DOG puesta en marcha aprobada, QNH 1025, pista 23. Notifique listo rodar.",
      );
    });
    await page.evaluate(() => window.atc.reset());
    const afterReset = await page.evaluate(() => window.atc.obtenerDatos());
    if (afterReset && (afterReset.qnh != null || afterReset.pista != null)) {
      fallos.push(`A6: tras reset() el panel aún tiene datos ${JSON.stringify(afterReset)}`);
    }

    printReport(fallos, avisos, errors);
    process.exitCode = fallos.length ? 1 : 0;
  } finally {
    await browser.close();
    server.close();
  }
}

function printReport(fallos, avisos, errors) {
  console.log("");
  if (avisos.length) {
    console.log("Avisos:");
    for (const a of avisos) console.log("  -", a);
  }
  if (errors.length) {
    console.log("Errores de página:");
    for (const e of errors) console.log("  -", e);
  }
  if (fallos.length) {
    console.log(`FALLO (${fallos.length}):`);
    for (const f of fallos) console.log("  -", f);
  } else {
    console.log("OK: todos los criterios comprobados han pasado.");
  }
}

main().catch((err) => {
  console.error("Error del arnés:", err);
  process.exit(2);
});
