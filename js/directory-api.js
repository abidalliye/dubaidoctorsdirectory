/* Public directory bridge: same-origin NestJS API, no database credentials. */
(function () {
  'use strict';
  const text = (tag, className, value) => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value || '';
    return element;
  };
  function webLink(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  window.loadDirectoryProviders = async function (container) {
    if (location.protocol === 'file:') return;
    try {
      const items = [];
      for (let page = 1; page <= 20; page++) {
        const response = await fetch(`/v1/providers?limit=50&page=${page}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error('Directory unavailable');
        const result = await response.json();
        if (!Array.isArray(result.items)) throw new Error('Invalid directory response');
        items.push(...result.items);
        if (items.length >= result.total || !result.items.length) break;
      }
      const existing = new Map([...container.querySelectorAll('.provider')]
        .map(card => [card.dataset.name.toLowerCase(), card]));
      for (const provider of items) {
        if (!provider.name || !['doctor', 'clinic', 'hospital', 'lab', 'surgeon', 'technician'].includes(provider.kind)) continue;
        let card = existing.get(provider.name.toLowerCase());
        if (card) {
          card.dataset.specialty += ' ' + (provider.specialty || '').toLowerCase();
          card.dataset.services += ' ' + (provider.services || []).join(' ').toLowerCase();
          card.dataset.area = provider.area || card.dataset.area;
          const badge = card.querySelector('.badge-mint');
          if (badge) badge.textContent = provider.verified ? 'Verified listing' : 'Verification pending';
          card.dataset.source = 'database';
          const profile=card.querySelector('.card-actions a');if(profile){profile.href='provider-profile.html?slug='+encodeURIComponent(provider.slug);profile.textContent='View profile';}
          continue;
        }
        card = text('article', 'provider-card provider', '');
        Object.assign(card.dataset, {
          name: provider.name, type: provider.kind,
          specialty: (provider.specialty || '').toLowerCase(),
          services: (provider.services || []).join(' ').toLowerCase(),
          area: provider.area || 'Dubai', source: 'database',
          distance: 'Infinity', rating: '0', reviews: '0', today: '0', online: '0', home: '0'
        });
        const top = text('div', 'card-top', '');
        const info = text('div', 'card-info', '');
        info.append(text('span', 'type-badge', provider.kind.charAt(0).toUpperCase() + provider.kind.slice(1)),
          text('span', 'badge badge-mint', provider.verified ? 'Verified listing' : 'Verification pending'),
          text('h3', '', provider.name), text('div', 'card-sub', provider.specialty),
          text('div', 'card-location', '📍 ' + (provider.address || provider.area || 'Dubai')));
        top.append(info);
        const body = text('div', 'card-body', '');
        const services = text('div', 'card-services', '');
        for (const service of provider.services || []) services.append(text('span', 'service-tag', service));
        const actions = text('div', 'card-actions', '');
        const profile = text('a', 'btn btn-primary', 'View profile');profile.href='provider-profile.html?slug='+encodeURIComponent(provider.slug);actions.append(profile);
        if (provider.phone) {
          const phone = text('a', 'btn btn-outline', 'Call ' + provider.phone);
          phone.href = 'tel:' + provider.phone.replace(/[^+0-9]/g, '');
          actions.append(phone);
        }
        const website = webLink(provider.website);
        if (website) {
          const link = text('a', 'btn btn-soft', 'Provider website →');
          link.href = website;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          actions.append(link);
        }
        body.append(services, actions);
        card.append(top, body);
        container.append(card);
      }
      container.dataset.connection = 'live';
    } catch {
      // Original listings and all existing filters remain available on outages.
      container.dataset.connection = 'offline';
    }
  };
})();
