/* Service worker mínimo: copia local de los tres ficheros y funcionamiento sin conexión.
   La red tiene prioridad para no dejar una versión antigua de la app tras actualizarla. */
"use strict";

var CACHE = "colacion-atc-v3";
var RECURSOS = ["./", "./index.html", "./manifest.webmanifest", "./sw.js"];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return Promise.all(RECURSOS.map(function (url) {
          /* Un recurso que falte no impide instalar ni usar el resto de la app. */
          return cache.add(url).catch(function () {});
        }));
      })
      .catch(function () { /* sin caché disponible: la app funciona igual */ })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (claves) {
        return Promise.all(claves.map(function (clave) {
          return clave !== CACHE && clave.indexOf("colacion-atc-") === 0 ? caches.delete(clave) : null;
        }));
      })
      .catch(function () { /* nada que limpiar */ })
      .then(function () { return self.clients.claim(); })
  );
});

function recursoDeApp(url, navegacion) {
  if (navegacion) return "./index.html";
  for (var i = 0; i < RECURSOS.length; i++) {
    var conocida = new URL(RECURSOS[i], self.location.href);
    if (url.pathname === conocida.pathname) return RECURSOS[i];
  }
  return null;
}

function sinConexion() {
  return new Response("Sin conexión", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

/* Solo GET del mismo origen y de los recursos de esta app. Primero red; si falla,
   se usa la copia local. cache.put se espera sin bloquear la respuesta si falla. */
self.addEventListener("fetch", function (evento) {
  var peticion = evento.request;
  if (peticion.method !== "GET") return;
  var url;
  try { url = new URL(peticion.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  var recurso = recursoDeApp(url, peticion.mode === "navigate");
  if (!recurso) return;

  evento.respondWith(
    caches.open(CACHE).then(function (cache) {
      return fetch(peticion).then(function (respuesta) {
        if (respuesta && respuesta.ok && respuesta.type === "basic") {
          return cache.put(recurso, respuesta.clone()).catch(function () {}).then(function () {
            return respuesta;
          });
        }
        return respuesta;
      }).catch(function () {
        return cache.match(recurso).then(function (guardada) {
          if (guardada) return guardada;
          if (recurso === "./index.html" || recurso === "./") {
            var alternativo = recurso === "./index.html" ? "./" : "./index.html";
            return cache.match(alternativo).then(function (alt) {
              return alt || sinConexion();
            });
          }
          return sinConexion();
        });
      });
    }).catch(function () {
      return fetch(peticion).catch(sinConexion);
    })
  );
});