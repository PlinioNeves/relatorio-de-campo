// Relatório de Campo — service worker (funcionamento offline e atualização automática)
// Ao publicar uma versão nova, mude o número abaixo.
const VERSAO = 'v23';
const CACHE = 'relatorio-de-campo-' + VERSAO;
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
                  './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nomes => Promise.all(nomes.filter(n => n.startsWith('relatorio-de-campo-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Página do app: tenta a versão mais nova na internet; sem sinal, usa a guardada no aparelho
  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // Ícones e demais arquivos: usa o guardado e atualiza em segundo plano
  e.respondWith(
    caches.match(req).then(guardado => {
      const rede = fetch(req).then(r => { if (r.ok){ const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => guardado);
      return guardado || rede;
    })
  );
});
