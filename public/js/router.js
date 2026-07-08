const routes = new Map();
let currentRoute = null;
let currentCleanup = null;

export function registerRoute(path, { render, destroy, title, breadcrumb }) {
  routes.set(path, { render, destroy, title, breadcrumb });
}

function resolveHash(path) {
  const raw = window.location.hash.slice(1);
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  const rawPath = raw.split('?')[0];
  const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (normalized === path && query) return `${path}${query}`;
  return path;
}

export function navigate(path) {
  if (!routes.has(path)) path = '/pomodoro';

  const targetHash = resolveHash(path);
  const pathOnly = targetHash.split('?')[0];

  if (currentRoute === pathOnly && window.location.hash.slice(1) === targetHash) {
    return;
  }

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  currentRoute = pathOnly;
  if (window.location.hash.slice(1) !== targetHash) {
    window.location.hash = targetHash;
  }

  const route = routes.get(pathOnly);
  document.title = route.title;

  const outlet = document.getElementById('pageOutlet');
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb && route.breadcrumb) {
    breadcrumb.innerHTML = route.breadcrumb;
  }

  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === pathOnly);
  });

  outlet.innerHTML = '';
  currentCleanup = route.destroy || null;
  route.render(outlet);
}

export function initRouter(defaultPath = '/pomodoro', parsePath) {
  const handleHash = () => {
    const path = parsePath
      ? parsePath(window.location.hash)
      : (() => {
          const raw = window.location.hash.slice(1) || defaultPath;
          const p = raw.split('?')[0];
          return p.startsWith('/') ? p : `/${p}`;
        })();
    navigate(path);
  };

  window.addEventListener('hashchange', handleHash);
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.route);
    });
  });

  handleHash();
}

export function getCurrentRoute() {
  return currentRoute;
}