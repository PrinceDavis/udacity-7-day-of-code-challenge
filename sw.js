const cacheName = "tg-currency--convertr1";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        return cache.addAll([
          "/",
          "/index.html"
        ]);
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return keys.map(key => key !== cacheName && caches.delete(key))
    })
  );
});

self.addEventListener("fetch", event => {
  if(event.request.url.indexOf("currencies") === -1) {
    event.respondWith(
      caches.open(cacheName).then(cache => {
        return cache.match(event.request).then(res => 
          
          res || fetch(event.request).then(netRes => {
                    cache.put(event.request, netRes.clone());
                    return netRes;
                  })
        );
      })
    );
  }
  
});