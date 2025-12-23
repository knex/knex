export function syncDialectErrors(activeDialect) {
  if (typeof document === 'undefined') {
    return;
  }

  const dialect = String(activeDialect || '');
  if (!dialect) {
    return;
  }

  const errorHeadings = new Set();
  document
    .querySelectorAll(`.sql-output[data-dialect="${dialect}"]`)
    .forEach((el) => {
      if (!el.dataset.heading) {
        return;
      }
      if (el.querySelector('.sql-output-error-line')) {
        errorHeadings.add(el.dataset.heading);
      }
    });

  const currentPath = window.location.pathname;
  document.querySelectorAll('.VPSidebar a.link[href*="#"]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const hashIndex = href.indexOf('#');
    if (hashIndex === -1) {
      return;
    }
    const textEl = link.querySelector('.text') || link;
    const existing = textEl.querySelector('.dialect-error-badge');
    const url = new URL(href, window.location.origin);
    if (url.pathname !== currentPath) {
      if (existing) {
        existing.remove();
      }
      return;
    }
    const headingId = decodeURIComponent(href.slice(hashIndex + 1));
    const hasError = errorHeadings.has(headingId);

    if (!hasError) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    if (existing) {
      return;
    }

    const badge = document.createElement('span');
    badge.className = 'dialect-error-badge';
    badge.textContent = '!';
    badge.title = 'Unsupported for this dialect';
    textEl.appendChild(badge);
  });
}
