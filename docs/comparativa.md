# Comparativa A4 (Claude) frente a B4 (ChatGPT), tras las dos cascadas

## Resultado final

- **Arnés oficial:** A4 18/18 y B4 18/18.
- **48 frases adicionales** (`pruebas/peloncho/todas-versiones.txt`): las dos versiones finales dan colaciones equivalentes. Las únicas diferencias son de estilo: B4 dice «Pista 05 en servicio», «entrar en cabecera pista 23» y «veinticinco millas».
- **Panel:** A4 extrae además el viento dicho en palabras, «viento calma» y «viento variable»; B4 no.
- **Comprobaciones de CSP, PWA bajo subruta, sin conexión, iPhone 390×844, 44 px, exportación y `localStorage` corrupto:** las dos pasan.
- **Voz:** las dos resisten el reenvío de resultados de Safari. A4 resiste además la revisión a la baja del texto.

**La más fiable es A4 (Claude),** por dos razones:

1. **Llegó mucho más limpia a la revisión final.** Antes de mi revisión, las sugerencias distintas de la referencia en las 48 frases fueron estas:

   | Etapa | Versión A (Claude) | Versión B (ChatGPT) |
   |---|---|---|
   | Desarrollo | A1: 4 | B1: 19 |
   | Tras Kimi | A2: 4 | B2: 19 |
   | Tras Gemini | A3: 4 | B3: 16 |

   B3 tenía además 3 fallos de seguridad operativa, frente a 1 en A3:
   - Colacionar el despegue de otra aeronave en una transmisión encadenada (A3 y B3).
   - Tomar «Tráfico EC-DOG…» como dirigido a nosotros (solo B3).
   - Leer «entre en circuito» como entrada en cabecera (solo B3).
2. **La arquitectura de A es más sólida.** Analiza cláusula a cláusula, con eco de cada instrucción en orden. B usa palabras clave y colaciona por «tipo principal», así que tiende a mezclar instrucciones. Por eso B4 necesitó 16 arreglos, frente a 6 en A4, y es más probable que queden casos raros sin cubrir.

## Problemas reales encontrados y corregidos por cada IA (las dos cascadas)

| IA | Papel | Versión A | Versión B | Total | Regresiones introducidas |
|---|---|---|---|---|---|
| Claude | desarrollo A | 18/18 a la primera, 138 comprobaciones propias; 4 fallos en las 48 frases | — | — | — |
| ChatGPT | desarrollo B | — | 18/18 a la primera; 19 diferencias en las 48 frases, unas 16 reales | — | — |
| Kimi | revisor 1 | 5 | 5 (ninguna en el analizador) | **10** | 0 |
| Gemini | revisor 2 | 6 | 7 bloques (3 mejoras en las 48 frases) | **13** | **2** (duplicado de voz en A; orden transpondedor/frecuencia en B) |
| Peloncho | revisor final | 6 (4 en las 48 frases) | 16 (3 de seguridad operativa) | **22** | 0 |

**Lectura para el ranking:**
- **Para desarrollar,** Claude va por delante de ChatGPT con datos: 4 fallos frente a unos 16 en las mismas 48 frases, y una base que aguantó la cascada casi sin cambios de lógica.
- **Gemini** es el revisor intermedio más productivo, pero el único que rompió cosas.
- **Kimi** aporta robustez de plataforma (Safari, PWA, almacenamiento), pero no detectó fallos de fraseología. Además, se cayó dos veces.
- **La revisión final con la app en marcha** fue la que encontró los fallos de seguridad operativa en las dos versiones. Ninguna de las IAs los detectó leyendo el código.
