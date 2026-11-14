# Especificación cerrada — Ayuda de colación ATC (Cessna / iPhone)

**Identificador:** DESARROLLA-2026-11-14-ATC  
**Encargo:** «Desarrolla Kimi» — mini aplicación o web app para iPhone que ayuda a recoger lo que dice la torre y a colacionar según fraseología.  
**Fuentes normativas de este documento:**

- `fuente-aesa.txt` — AESA, *Guía de Buenas Prácticas en Fraseología y Comunicaciones* (A-ASA-FRAS-01).
- `fuente-fraseologia.txt` — guion de fraseología de entrenamiento, indicativo EC-DOG, aeródromo de León.
- Los casos de `pruebas/casos.json` son parte normativa de esta especificación.

Esta especificación está **cerrada**: no hay requisitos abiertos. Lo que no aparece aquí queda fuera de alcance. El desarrollador (Kimi) y cada revisor posterior deben juzgar el resultado contra estos criterios, no contra interpretaciones nuevas.

---

## 1. Propósito y alcance

Aplicación de **apoyo y entrenamiento** para un piloto privado de Cessna (indicativo por defecto **EC-DOG**) que vuela con un **iPhone**. Debe:

1. Recoger el texto de las transmisiones de torre (dictado por reconocimiento de voz del navegador, entrada manual o modo demostración).
2. Decidir si el mensaje va dirigido al indicativo configurado.
3. Si va dirigido: identificar el tipo de instrucción, **extraer los datos operativos** y mostrarlos en un panel persistente.
4. Mostrar con tipografía grande **qué ha dicho la torre** y, si procede, una **sugerencia de colación** según AESA/SERA y el guion de entrenamiento.
5. Registrar un historial con hora, exportable.

**No es** un receptor VHF, no intercepta la radio por sí misma, no está certificada y **nunca sustituye** la escucha directa ni la decisión del piloto al mando.

### 1.1 Fuera de alcance

- Backend, cuentas, nube, APIs de pago o con clave, modelos de lenguaje remotos.
- Recepción VHF nativa, ADS-B, GPS de vuelo, cartas, o cálculo de performance.
- Multi-tripulación, varios indicativos a la vez, o control de más de un vuelo.
- Proyecto con empaquetado, npm, bundler o tienda de aplicaciones (no hay App Store).
- Base de datos, autenticación, analítica, anuncios o peticiones de red a terceros.

---

## 2. Aviso de seguridad (obligatorio y prominente)

Texto que debe verse al abrir la app (cabecera o banda permanente, no solo en un enlace de ayuda) y de nuevo en la pantalla de ayuda:

> **AYUDA DE ENTRENAMIENTO Y APOYO. NO CERTIFICADA.** Esta aplicación no es un equipo aeronáutico ni un sistema de comunicaciones. El piloto al mando y la escucha directa de la radio prevalecen siempre sobre cualquier texto, dato o sugerencia mostrados aquí. No sustituye la colación ni la disciplina radio. Si hay duda, pida repetición a la torre y ignore la sugerencia. Los datos se quedan en este dispositivo.

---

## 3. Plataforma y arquitectura

| Requisito | Valor |
|---|---|
| Entrega | Carpeta `app/` con `index.html` (CSS y JS **inline**), `manifest.webmanifest` y `sw.js` mínimo (caché de esos tres ficheros). Sin más ficheros obligatorios. |
| Empaquetado | Ninguno. Se abre el HTML en Safari o en Chrome. Sin paso de build. |
| Backend | Ninguno. Sin `fetch` a orígenes externos. Sin claves. |
| Persistencia | Solo `localStorage` (indicativo, datos recogidos, registro). |
| iPhone | Safari iOS: `viewport`, `apple-mobile-web-app-capable`, icono/manifest para «Añadir a pantalla de inicio». Uso a una mano, tipografía grande, modo oscuro de alto contraste. |
| Prueba en laboratorio | Debe funcionar también en Chrome headless de Linux sirviendo `app/` por HTTP local. |

El service worker es opcional para la lógica, pero si existe no debe romper `file://` ni el servidor de pruebas. El gancho JS de la §11 debe estar disponible en cuanto cargue `index.html`, sin esperar al SW.

---

## 4. Audio en el iPhone (documentar en la ayuda)

El iPhone **no tiene receptor VHF**. La app no «intercepta» la torre: solo oye el audio que llega al **micrófono**.

En la ayuda debe explicarse, en español y con claridad:

- Para usarla en vuelo hay que llevar el audio del intercomunicador o del auricular al iPhone (adaptador cableado Lightning/USB-C, o el micrófono lo bastante cerca del altavoz de cabina).
- El permiso de micrófono se pide solo tras un gesto del usuario (botón «Escuchar»).
- El reconocimiento de voz del navegador (`webkitSpeechRecognition`, `es-ES`, continuo con rearranque automático si el sistema lo corta) **puede fallar** con ruido de cabina, acento o fraseología densa.
- Por eso son obligatorios: **entrada manual de texto** y **modo demostración** con transmisiones de muestra del guion, para probar la app sin audio y en un ordenador sin radio.

Si `webkitSpeechRecognition` / `SpeechRecognition` no existe, el botón de escuchar queda desactivado con el mensaje «Reconocimiento de voz no disponible en este navegador; use la entrada manual o el modo demostración», y el resto de la app sigue funcionando.

---

## 5. Interfaz (cabina, un vistazo)

Fondo oscuro, texto claro, contraste alto, áreas de toque ≥ 44 px. Sin dependencia del color solo para el significado.

Zonas, de arriba abajo (en iPhone se puede desplazar; lo crítico no debe quedar solo al final):

1. **Aviso de seguridad** compacto y visible (el texto de la §2, o un resumen en negrita que abra el texto completo).
2. **Indicativo** editable (por defecto `EC-DOG`) y botón de guardar.
3. **Último mensaje de torre**: tipografía grande. Si **no** va dirigido al indicativo, el bloque se muestra **atenuado** (opacidad baja) y no se ofrece sugerencia.
4. **Sugerencia de colación** (o el recuadro «no reconocido, pide repetir») en un bloque claramente distinto, también en tipografía grande. Si el mensaje es solo un «Adelante» / contacto inicial, se indica «Sin colación: puede transmitir su solicitud» y `sugerencia` es `null`.
5. **Panel «Datos recogidos» siempre visible**: últimos valores conocidos (QNH, pista, viento, visibilidad, nubes, temperatura/rocío, ATIS, transpondedor, frecuencia, puntos de notificación, altitud, calles de rodaje). Los campos vacíos se muestran como «—». Un valor nuevo **sustituye** al anterior del mismo campo; no se inventan huecos.
6. **Controles** (parte inferior, uso a una mano): Escuchar / Detener, campo de entrada manual + botón «Procesar», botones del modo demostración (Siguiente muestra / Reiniciar demo), Vaciar datos, Exportar registro.
7. **Registro** con marca de tiempo local (hora del dispositivo), texto oído, si iba dirigido, tipo, datos extraídos y sugerencia. Exportable: copiar, compartir (`navigator.share` si existe) y descargar como `.txt`.

---

## 6. Indicativo y a quién va el mensaje

- Valor por defecto: `EC-DOG`. Configurable por el usuario; se guarda en `localStorage`.
- Un mensaje **va dirigido a nosotros** si menciona el indicativo configurado, con estas formas toleradas (mayúsculas/minúsculas, guiones, espacios y puntos irrelevantes):
  - `EC-DOG`, `ECDOG`, `EC DOG`, `EC–DOG`.
  - Deletreo OACI completo: `Echo Charlie Delta Oscar Golf` (también `Eco` por `Echo`).
  - Abreviatura habitual tras identificarse: `Delta Oscar Golf`, o las tres últimas letras (`DOG`) como token aislado **solo** si coinciden con las del indicativo configurado.
  - Deletreo letra a letra: `E C D O G`.
- Si el indicativo cambia a otro (p. ej. `EC-XYZ`), las mismas reglas se aplican a ese indicativo (E-C-X-Y-Z, Echo Charlie X-ray Yankee Zulu, etc.). Incluir el alfabeto fonético OACI completo en el código (Alfa, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliett, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu).
- Mensajes de otras aeronaves o para otro indicativo: `dirigidoAMi = false`, se listan atenuados, **no** se sugiere colación, **no** se actualiza el panel de datos propios.
- Si no se puede decidir con seguridad si va dirigido a nosotros, tratarlo como no dirigido y no inventar.

---

## 7. Analizador (sin API, sin clave)

Analizador **basado en reglas** (expresiones regulares / patrones en español), sobre el texto ya transcrito o tecleado. Debe normalizar antes de analizar:

- minúsculas, espacios múltiples, «º»/«°», «kt»/«nudos»/«KT»;
- `24010KT` / `25010KT` → viento 240°/10 KT y 250°/10 KT (tres dígitos de dirección + dos de velocidad + KT);
- `QNH 1025`, `QNH1025`, `Q 1024`, `Q1024`;
- números hablados OACI/AESA: cero uno dos tres cuatro cinco seis siete ocho nueve; «decimal» para frecuencias; «mil» / «cientos» según la guía (p. ej. QNH «uno cero dos cinco» = 1025; pista «dos tres» = 23; «cinco mil quinientos» = 5500).

### 7.1 Tipos de instrucción (lista cerrada)

El campo `tipo` es el principal. `tipos` enumera todos los reconocidos en el mismo mensaje.

| `tipo` | Patrones típicos (guion y AESA) |
|---|---|
| `contacto` | «buenos días … adelante», «buenas de nuevo … adelante», solo «adelante» |
| `puesta_en_marcha` | «puesta en marcha aprobada» |
| `rodaje` | «autorizado a rodar», «ruede», «continúe rodaje» |
| `mantenga_posicion` | «mantenga posición» |
| `entrar_cabecera` | «autorizado a entrar cabecera» / entrar a cabecera **sin** backtrack |
| `entrar_backtrack` | «autorizado a entrar y backtrack» (o «entrar y retroceder») |
| `despegue` | «autorizado a despegar» |
| `informacion` | solo «recibido» / «copiado» / tráfico no notificado, sin más instrucciones |
| `ascenso` | «continúe ascenso», «ascenso para» |
| `notifique` | «notifique» / «llame» (si no forma parte de otra autorización ya tipificada; si va con despegue, el principal es `despegue` y `notifique` entra en `tipos`) |
| `pista_en_servicio` | «pista en servicio», «espere la pista en servicio» |
| `circuito` | «entre en circuito», «viento en cola», «base izquierda/derecha», «extienda/prolongue», «llame en base», «proceda para base» |
| `aterrizaje` | «autorizado a aterrizar» |
| `transpondedor` | «transpondedor», «responda», «squawk», «código SSR» |
| `cambio_frecuencia` | «pase a frecuencia», «frecuencia», «contacto en» |
| `otro` | dirigido a nosotros y se reconoce que hay instrucción, pero no encaja en las anteriores: **no inventar**; ver §7.3 |

### 7.2 Datos a extraer (cuando aparezcan)

| Campo | Ejemplos en las fuentes |
|---|---|
| `qnh` (entero hPa) | 1025, 1024, «Q1024», «QNH uno cero dos cinco» |
| `pista` (cadena, p. ej. `"23"`) | «pista 23», «pista en servicio 23», «cabecera 23» |
| `viento` `{direccion, velocidad, unidad}` | «viento 250º 15 KT», «viento 24010KT» → 240 y 10, unidad `"KT"` |
| `visibilidad` | «+ 10 Km», «+10 km» |
| `nubes` | «SCT030 BKN050», «BKN035» |
| `temperatura`, `rocio` | «17/09», «19/09» |
| `atis` | letra («W», «Whiskey») si aparece |
| `squawk` | cuatro dígitos |
| `frecuencia` | p. ej. `"118.455"` |
| `punto` | «S1», «A», «punto de espera A», «punto SE» |
| `altitud` | `"5500 ft"` (conservar unidad) |
| `calles` | array, p. ej. `["C","A"]`, `["B"]` |
| `viraje` | `"izquierda"` / `"derecha"` si se aprueba viraje |

Campos no presentes: `null` (o `[]` en `calles`). **Nunca inventar un valor que no esté en el texto.**

### 7.3 No reconocido o ambiguo

Si el mensaje **va dirigido a nosotros** pero no se puede clasificar con seguridad **o** un dato obligatorio de una autorización reconocida no se puede leer (pista ilegible, QNH a medias, etc.):

- `reconocida = false` (o dato concreto omitido, sin rellenar).
- Mostrar explícitamente: `no reconocido, pide repetir: "Repita, EC-DOG"` (usar el indicativo configurado).
- `sugerencia = "Repita, EC-DOG"` (o el indicativo vigente).
- No proponer una colación con valores adivinados.

---

## 8. Reglas de colación (AESA / SERA 8015 e + guion)

La sugerencia es una **ayuda**. Debe seguir estas reglas:

1. **Elementos que se colacionan siempre** (AESA, igual que SERA 8015 e):
   - autorizaciones de ruta ATC;
   - autorizaciones e instrucciones para entrar, aterrizar, despegar, mantenerse en espera a distancia, cruzar, rodar y retroceder (backtrack) en cualquier pista;
   - pista en uso, reglaje de altímetro (QNH), códigos SSR, canales de comunicación recién asignados, instrucciones de nivel, rumbo y velocidad;
   - niveles de transición.
2. Otras instrucciones (rodaje, condicionales, «notifique…») se colacionan o se acusa recibo de forma que quede claro que se han comprendido y se obedecerán. En esta app: **colacionarlas**, no reducirlas a «Recibido».
3. La colación es **clara, completa y en el mismo orden** que la instrucción. Termina siempre con el **indicativo** (como en el guion: «… EC-DOG.»).
4. **No** sustituir una colación completa por solo «Recibido», «Copiado» o «WILCO» cuando haya elementos del punto 1 o 2. AESA indica además que «copiado» no es fraseología estándar: preferir «Recibido» solo cuando no haya nada que colacionar (`informacion` o `contacto`).
5. **No colacionar lo que no se ha entendido.** En duda, sugerir «Repita, [INDICATIVO]».
6. El **viento, la visibilidad, las nubes y la temperatura** del parte de campo **no** son de colación obligatoria. El guion no los colaciona. Extraerlos al panel, pero **no** incluirlos en la sugerencia salvo que el usuario no tenga otro dato. Sí se colacionan QNH, pista, transpondedor, frecuencia, autorizaciones y rumbos/altitudes.
7. Estilo de las sugerencias: alineado con el guion de EC-DOG (véanse ejemplos de la §12). Primera letra mayúscula, indicativo al final. Se admite «notificaré» (con tilde).

Ejemplos de referencia (indicativo `EC-DOG`):

- Puesta en marcha con datos de campo → `Puesta en marcha aprobada, QNH 1025, pista 23, notificaré listo rodar. EC-DOG.`
- Rodaje vía calles → `Autorizado a rodar punto de espera pista 23, vía calle C, calle A. EC-DOG.`
- Mantenga posición con tráfico → `Mantengo posición, información de tráfico copiada. EC-DOG.` (también vale `Mantengo posición. EC-DOG.`)
- Enter + backtrack + notifique listo → `Autorizado a entrar y backtrack pista 23, notificaré lista salida. EC-DOG.`
- Despegue + viraje + S1 (viento al panel, no a la colación) → `Autorizado a despegar pista 23, aprobado viraje izquierda, notificaré alcanzando punto S1. EC-DOG.`
- Ascenso → `En ascenso para 5500 ft. EC-DOG.`
- Regreso con QNH nuevo → `Pista en servicio 23, QNH 1024, notificaré alcanzando punto S1. EC-DOG.`
- Aterrizaje + abandone calle B → `Autorizado a aterrizar pista 23, abandonaré por calle B. EC-DOG.`
- Transpondedor + frecuencia → `Transpondedor 7000, frecuencia 118.455. EC-DOG.`

---

## 9. Modo demostración

Debe incluir, en orden, las **transmisiones de torre** del guion de León (las líneas que en la fuente empiezan por `-`). Un botón «Siguiente muestra» inyecta la siguiente en el mismo flujo que la entrada manual (análisis, panel, registro, sugerencia). «Reiniciar demo» vuelve a la primera. Esto permite probar la app en un iPhone sin radio y en el arnés de laboratorio.

---

## 10. Seguridad

Lista de comprobación (el arnés también la aplica sobre el código fuente):

1. Sin `eval`, sin `new Function`, sin `document.write`.
2. Sin asignar `innerHTML` / `outerHTML` / `insertAdjacentHTML` con texto de la transcripción, del usuario o del registro. Usar `textContent` o `createTextNode`.
3. Sin scripts ni estilos externos (sin CDN, sin Google Fonts, sin analítica). Un único origen: los ficheros de `app/`.
4. Cabecera CSP en un `<meta>`: al menos `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`. (`unsafe-inline` se admite porque CSS/JS van en el HTML.)
5. Sin cookies, sin `postMessage` a otros orígenes, sin registrar el SW en un ámbito más amplio de lo necesario.
6. El permiso de micrófono solo se solicita por gesto del usuario.
7. La exportación genera un fichero de texto plano local; no se envía a ningún servidor.

---

## 11. Gancho de prueba (obligatorio)

Exponer en `window.atc` (disponible al terminar de cargar `index.html`):

```js
window.atc.procesar(texto)
// → {
//   dirigidoAMi: boolean,
//   reconocida: boolean,
//   tipo: string | null,      // de la lista §7.1
//   tipos: string[],
//   datos: {
//     qnh, pista, viento, visibilidad, nubes,
//     temperatura, rocio, atis, squawk, frecuencia,
//     punto, altitud, calles, viraje
//   },
//   sugerencia: string | null,
//   motivo: string | null
// }

window.atc.configurar({ indicativo: "EC-DOG" })  // normaliza y guarda
window.atc.obtenerIndicativo()                 // string
window.atc.obtenerDatos()                      // panel acumulado
window.atc.obtenerRegistro()                   // array de entradas
window.atc.reset()                             // limpia panel y registro; no cambia el indicativo
```

`procesar` no requiere micrófono ni UI. Debe actualizar panel y registro igual que el botón «Procesar». `reset()` deja datos vacíos y registro a cero. Este gancho es la interfaz del arnés de `pruebas/`.

---

## 12. Criterios de aceptación (normativos)

La app cumple si, en Chrome headless sirviendo `app/` y también en la lógica de `window.atc`, se verifican todos los casos de `pruebas/casos.json` y los puntos siguientes.

**A1.** Al cargar, el aviso de la §2 es visible en el DOM (el texto incluye «NO CERTIFICADA» y «escucha directa»).  
**A2.** El indicativo por defecto es `EC-DOG` y se puede cambiar con `configurar`.  
**A3.** Existen entrada manual, modo demostración y el gancho `window.atc`.  
**A4.** `manifest.webmanifest` declara `display: standalone` y un nombre. `index.html` incluye `apple-mobile-web-app-capable` y el viewport.  
**A5.** Cumple la lista de seguridad de la §10.  
**A6.** Tras `reset()`, `obtenerDatos()` no conserva QNH/pista anteriores. Tras procesar un QNH y luego otro, el panel conserva el **último**.  
**A7.** Casos funcionales (resumen; la verdad operativa está en `casos.json`):

| ID | Texto de torre (o variación) | Esperado (extracto) |
|---|---|---|
| C01 | `EC-DOG puesta en marcha aprobada, datos del campo: viento 250º 15 KT visibilidad + 10 Km., nubes SCT030 BKN050 17/09 QNH 1025. Pista en servicio 23. Notifique listo rodar.` | dirigido, `puesta_en_marcha`; viento 250/15 KT; vis +10; nubes SCT030 BKN050; temp 17; rocío 9; QNH 1025; pista 23. Colación contiene: puesta en marcha aprobada, QNH 1025, pista 23, notificaré listo rodar, y termina en EC-DOG. No obliga a colacionar viento ni nubes. |
| C02 | `EC-DOG, autorizado a rodar punto de espera pista 23, via calle C, calle A.` | `rodaje`; pista 23; calles C y A. Colación con autorizado a rodar, punto de espera, pista 23, calles C y A, EC-DOG. |
| C03 | `EC-DOG, ruede punto de espera A.` | `rodaje`; punto A. Colación tipo «Rodaré punto de espera A. EC-DOG.» |
| C04 | `EC-DOG, mantenga posición, tráfico en final.` | `mantenga_posicion`. Colación contiene «Mantengo posición» y EC-DOG. |
| C05 | `EC-DOG, autorizado a entrar y backtrack pista 23, notifique listo.` | `entrar_backtrack`; pista 23. Colación: autorizado a entrar y backtrack, pista 23, notificaré, EC-DOG. |
| C06 | `EC-DOG, autorizado a despegar pista 23, viento 24010KT, aprobado viraje izquierda, notifique alcanzando punto S1.` | `despegue`; pista 23; viento 240/10; viraje izquierda; punto S1. Colación: autorizado a despegar, pista 23, viraje izquierda, punto S1, EC-DOG. El viento puede no estar en la colación. |
| C07 | `EC-DOG, recibido, continúe ascenso para 5500 ft.` | `ascenso`; altitud 5500 ft. Colación contiene «5500» y EC-DOG. |
| C08 | `EC-DOG, copiado, notifique abandonando zona o CTA.` | en `tipos` hay `notifique`. Colación: notificaré abandonando zona o CTA, EC-DOG. |
| C09 | `EC-DOG, recibido, espere la pista en servicio 23, viento 24010KT BKN035 19/09 Q1024. Notifique alcanzando o próximo o sobre punto S1.` | `pista_en_servicio`; pista 23; QNH 1024; viento 240/10; nubes BKN035; temp 19; rocío 9; punto S1. Colación: pista 23, QNH 1024, punto S1, EC-DOG. |
| C10 | `EC-DOG, a la vista, autorizado a aterrizar pista 23, viento 25010KT. Abandone por calle B.` | `aterrizaje`; pista 23; viento 250/10; calle B. Colación: autorizado a aterrizar, pista 23, calle B, EC-DOG. |
| C11 | `IBERIA 3254, autorizado a despegar pista 23.` | `dirigidoAMi=false`; `sugerencia=null`; no cambia el QNH/pista del panel. |
| C12 | `EC-DOG, realice procedimiento invertido delta.` | dirigido; `reconocida=false`; sugerencia exactamente o conteniendo `Repita, EC-DOG`. Sin datos inventados. |
| C13 | `Echo Charlie Delta Oscar Golf, mantenga posición.` | dirigido; `mantenga_posicion`. |
| C14 | `Delta Oscar Golf, autorizado a despegar pista 23, viento 24010KT.` | dirigido; `despegue`; pista 23; viento 240/10. |
| C15 | `EC-DOG, transpondedor 7000, pase a frecuencia 118.455.` | extrae squawk 7000 y frecuencia 118.455; colación incluye ambos y EC-DOG. `tipo` o `tipos` incluye `transpondedor` y/o `cambio_frecuencia`. |
| C16 | `Buenos días, EC-DOG. Adelante.` | dirigido; `contacto`; `sugerencia=null`; `reconocida=true`. |
| C17 | `EC-DOG puesta en marcha aprobada, QNH uno cero dos cinco, pista dos tres.` | QNH 1025, pista 23, `puesta_en_marcha`. |
| C18 | Tras C01, procesar C09. | `obtenerDatos().qnh === 1024` y pista sigue 23 (el último QNH gana). |

Comparación de colaciones: se normaliza a minúsculas, se ignoran tildes, signos y espacios repetidos. Deben aparecer **todas** las subcadenas de `colacion_contiene` y el indicativo al final. No debe aparecer ningún valor de `colacion_no_contiene` (p. ej. un QNH inventado).

---

## 13. Criterios para los revisores en cascada

Cada revisor (Claude, ChatGPT, Gemini, Peloncho, en ese orden) recibe esta especificación, el código vigente y los fallos del arnés. Debe:

1. Ejecutar o razonar contra los criterios de la §12.
2. Buscar errores, lagunas de funcionalidad y agujeros de la §10.
3. Corregir el código si hace falta, sin ampliar el alcance.
4. No relajar un criterio para hacer pasar un test; si una colación del guion y AESA entra en conflicto menor de estilo, prima AESA en los elementos obligatorios y el guion en el fraseo.

---

## 14. Entregable de Kimi

Responder con el código **completo** de cada fichero en un bloque de código separado, identificado por nombre (`index.html`, `manifest.webmanifest`, `sw.js`). Sin placeholders, sin «resto del código», sin dependencias externas.

---

## 15. Cómo ejecutar el arnés de pruebas

Desde la carpeta de trabajo:

```bash
/workspace/desarrolla/2026-11-14-atc/pruebas/run.sh
# o, con la ruta de la app:
/workspace/desarrolla/2026-11-14-atc/pruebas/run.sh /workspace/desarrolla/2026-11-14-atc/app/index.html
```

`run.sh` instala `puppeteer-core` si hace falta y usa el Google Chrome del sistema (o `CHROME_PATH`). Los casos están en `pruebas/casos.json`.

Códigos de salida:

- `0` — todos los criterios comprobados pasan.
- `1` — la app existe, pero falla algún criterio.
- `2` — aún no hay `index.html`, o falta Chrome / la dependencia. En el paso de especificación, el código 2 es el resultado esperado.
