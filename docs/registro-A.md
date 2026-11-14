# Registro de la cascada — Versión A (DESARROLLA-2026-11-14-ATC)

App: ayuda de colación ATC para iPhone (PWA de 3 ficheros: `index.html`, `manifest.webmanifest`, `sw.js`), indicativo EC-DOG, guion de León y guía de fraseología de AESA.
Especificación: `espec.md`. Arnés: `pruebas/run.sh` con los 18 casos de `pruebas/casos.json`.
Orden de la versión A: **Claude desarrolla, luego revisan Kimi, Gemini y Peloncho**. La versión de Kimi de la primera ronda (`versiones/v1-kimi`) sirvió solo de referencia.

| # | Etapa | Carpeta | Quién | Qué hizo | Arnés |
|---|---|---|---|---|---|
| A1 | Desarrollo | `versiones/A1-claude` | Claude | Construyó la app completa: analizador por reglas (indicativo en todas sus formas, números hablados, viento, QNH, frecuencias, ATIS, calles, puntos), colaciones AESA/SERA 8015 e con indicativo al final, «Repita, EC-DOG» ante dudas, panel de datos persistente, registro exportable (copiar, compartir, .txt), voz `es-ES` con rearranque, modo demostración, aviso de seguridad, CSP y PWA. Se montó su propio banco de 138 comprobaciones (18 casos, A1–A6, seguridad, 71 variantes de frase). | **18/18** |
| A2 | Revisión 1 | `versiones/A2-kimi` | Kimi | 5 mejoras: nota de HTTPS para instalar en iPhone; ATIS deletreado o suelto; validación estricta de `localStorage` dañado; control de generaciones de sesión de voz (sin duplicados ni eventos tardíos, liberación del bloqueo de pantalla); service worker red-primero `v2` con modo sin conexión. La web de Kimi falló antes del resumen final, pero los ficheros se guardaron completos. | **18/18** |
| A3 | Revisión 2 | `versiones/A3-gemini` | Gemini | 6 mejoras: volcado de voz por longitud consumida (Safari); indicativos con sufijos o deletreos más largos; «mil cero…» y dígitos tras «decimal/coma/punto»; más patrones de autorización (ascenso/descenso, backtrack con pista, circuito, cambio de frecuencia); menos falsos positivos de ATIS y puntos de una letra; SW con alternativa `./`↔`./index.html` e icono táctil de 180×180. | **18/18** |
| A4 | Revisión final | `versiones/A4-peloncho` | Peloncho | Revisión **ejecutada** en Chrome headless, bajo subruta tipo GitHub Pages y en iPhone 390×844. Se encontraron y corrigieron 6 problemas: (1) instrucciones para otra aeronave en una transmisión encadenada se colacionaban como propias; (2) QNH «mil cero uno tres» daba 1001; (3) alternativas «extienda o prolongue» o «notifique o llame» daban colaciones rotas; (4) la demo traía 10 de las 31 transmisiones del guion; (5) regresión de voz de Gemini con duplicados cuando Safari acorta el texto; (6) un indicativo guardado dañado se aceptaba. Verificado sin cambios: CSP efectiva, sin peticiones externas, sin `innerHTML`/`eval`, manifest instalable con rutas relativas, SW con ámbito de subruta y modo sin conexión, aviso visible, exportación, `localStorage` corrupto, sin desbordamiento y controles ≥ 44 px. | **18/18** |

## Resultados de pruebas por etapa

- A1 Claude: 18/18 (`versiones/A1-claude/pruebas.txt`).
- A2 Kimi: 18/18 (`versiones/A2-kimi/pruebas.txt`).
- A3 Gemini: 18/18 (`versiones/A3-gemini/pruebas.txt`).
- A4 Peloncho: **18/18**, código de salida 0 (`versiones/A4-peloncho/pruebas.txt`). Además, 48 frases adicionales comparadas entre A2, A3 y A4 (`pruebas/peloncho/frases-resultado.txt`), revisión de PWA, seguridad y diseño (`pruebas/peloncho/revisar-resultado.json`) y una prueba de voz simulada (`pruebas/peloncho/voz.mjs`).

## Versión candidata para publicar

`versiones/A4-peloncho/`, todavía **no publicada** en GitHub.
Detalle de la última revisión: `versiones/A4-peloncho/revision.md`.
