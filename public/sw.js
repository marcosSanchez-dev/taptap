self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("pwa-cache").then((cache) => {
      return cache.addAll(["/index.html", "/styles.css", "/app.js", "/sw.js"]);
    })
  );
});
