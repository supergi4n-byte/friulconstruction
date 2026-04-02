(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const logo = document.getElementById('brand-logo');
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');
  const cookieReject = document.getElementById('cookie-reject');
  const prevButton = document.getElementById('gallery-prev');
  const nextButton = document.getElementById('gallery-next');
  const prevImage = document.getElementById('gallery-prev-image');
  const currentImage = document.getElementById('gallery-current-image');
  const nextImage = document.getElementById('gallery-next-image');
  let galleryItems = [];
  let currentGalleryIndex = 0;

  if (!toggle || !logo) return;

  const setTheme = (theme) => {
    const isDark = theme === 'dark';
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Attiva tema chiaro' : 'Attiva tema scuro');
    toggle.textContent = isDark ? 'Tema Light' : 'Tema Dark';
    logo.src = isDark ? logo.dataset.logoDark : logo.dataset.logoLight;
  };

  const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  const stored = localStorage.getItem('theme');
  setTheme(stored || (prefersDark ? 'dark' : 'light'));

  toggle.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  const setCookieConsent = (value) => {
    localStorage.setItem('cookie-consent', value);
    if (cookieBanner) cookieBanner.hidden = true;
  };

  if (cookieBanner) {
    const consent = localStorage.getItem('cookie-consent');
    cookieBanner.hidden = Boolean(consent);
  }

  cookieAccept?.addEventListener('click', () => setCookieConsent('accepted'));
  cookieReject?.addEventListener('click', () => setCookieConsent('rejected'));

  const normalizeIndex = (index) => {
    const total = galleryItems.length;
    return ((index % total) + total) % total;
  };

  const updateGallery = () => {
    if (!prevImage || !currentImage || !nextImage || galleryItems.length < 3) return;

    const prev = galleryItems[normalizeIndex(currentGalleryIndex - 1)];
    const curr = galleryItems[normalizeIndex(currentGalleryIndex)];
    const next = galleryItems[normalizeIndex(currentGalleryIndex + 1)];

    prevImage.src = prev.src;
    prevImage.alt = 'Immagine gallery lavori';
    currentImage.src = curr.src;
    currentImage.alt = 'Immagine gallery lavori';
    nextImage.src = next.src;
    nextImage.alt = 'Immagine gallery lavori';

    document.querySelectorAll('[data-share-current="true"]').forEach((button) => {
      button.dataset.sharePath = curr.src;
    });
  };

  const slideGallery = (direction) => {
    if (galleryItems.length < 3) return;
    currentGalleryIndex = normalizeIndex(currentGalleryIndex + direction);
    updateGallery();
  };

  prevButton?.addEventListener('click', () => slideGallery(-1));
  nextButton?.addEventListener('click', () => slideGallery(1));

  const initGallery = async () => {
    try {
      const response = await fetch('assets/gallery/images.json', { cache: 'no-store' });
      if (!response.ok) return;
      const sources = await response.json();
      if (!Array.isArray(sources)) return;

      galleryItems = sources
        .filter((src) => typeof src === 'string' && src.trim().length > 0)
        .map((src) => ({ src }));

      if (galleryItems.length >= 3) {
        updateGallery();
      }
    } catch {
      // If the manifest cannot be loaded (e.g. file://), keep current placeholders.
    }
  };

  initGallery();

  const openShareWindow = (url) => {
    globalThis.open(url, '_blank', 'noopener,noreferrer');
  };

  const getShareUrlFromButton = (button) => {
    const path = button.dataset.sharePath;
    return path ? new URL(path, globalThis.location.href).toString() : globalThis.location.href;
  };

  const shareOnInstagram = async (targetUrl) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      }
    } catch {
      // Clipboard can fail in non-secure contexts; fallback is still opening Instagram.
    }
    openShareWindow('https://www.instagram.com/');
    alert('Link copiato negli appunti. Incollalo su Instagram (bio, DM o storia).');
  };

  document.querySelectorAll('.share-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetUrl = getShareUrlFromButton(button);
      const network = button.dataset.network;
      if (network === 'facebook') {
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`);
        return;
      }
      if (network === 'instagram') {
        await shareOnInstagram(targetUrl);
      }
    });
  });
})();
