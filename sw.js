line number 52
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-HTTP requests
    if (!request.url.startsWith('http')) {
        return;
    }

    // API write requests must always reach the network.
    // Caching POST/PUT/PATCH/DELETE can hide or cancel the real request.
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }
