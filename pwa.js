(() => {
  // Register Service Worker
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .catch(() => {});
    });
  }

  // Install Prompt Handling
  let deferredPrompt = null;
  const installBtn = document.getElementById('install-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.classList.remove('hidden');
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
        installBtn.classList.add('hidden');
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installBtn) {
      installBtn.classList.add('hidden');
    }
  });
})();

