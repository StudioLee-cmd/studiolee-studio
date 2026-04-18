(function () {
  'use strict';

  // ============================================
  // StudioLee Studio — Dashboard Application
  // ============================================

  let DATA = null;
  let lightboxItems = [];
  let lightboxIdx = 0;

  // --- SVG Icons ---
  const ICON = {
    home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    projects: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    personas: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    videos: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    images: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    film: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>',
    expand: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    spending: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>'
  };

  // --- Helpers ---
  function contentUrl(path) {
    return DATA.meta.contentRepo + '/' + path;
  }

  function studioUrl(path) {
    return DATA.meta.studioRepo + '/' + path;
  }

  function getPersona(id) {
    return DATA.personas.find(p => p.id === id);
  }

  // --- Spending helpers ---
  function usdToEur(usd) {
    return (usd * (DATA.meta.usdToEur || 0.88)).toFixed(2);
  }

  function creditsToUsd(credits) {
    return (credits * 5 / 1000).toFixed(2);
  }

  function getPersonaSpending(personaId) {
    if (!DATA.spending || !DATA.spending.perPersona) return null;
    return DATA.spending.perPersona[personaId] || null;
  }

  function getProjectSpending(projectId) {
    if (!DATA.spending || !DATA.spending.perProject) return null;
    return DATA.spending.perProject[projectId] || null;
  }

  function spendingBadge(credits, usd) {
    if (!credits) return '';
    const eur = usdToEur(usd);
    return `<span class="badge badge-spending" title="${credits} credits = $${usd} / €${eur}">${credits} cr &middot; €${eur}</span>`;
  }

  function spendingCard(label, credits, usd, attempts, failures) {
    const eur = usdToEur(usd);
    return `
      <div class="stat-card">
        <div class="stat-value" style="font-size:24px;">€${eur}</div>
        <div class="stat-label">${label}</div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">
          ${credits} credits &middot; $${usd.toFixed(2)} USD
          ${attempts ? `<br>${attempts} generations` : ''}
          ${failures ? ` &middot; <span style="color:var(--danger);">${failures} failed</span>` : ''}
        </div>
      </div>
    `;
  }

  function statusBadge(status) {
    const map = {
      'approved': { cls: 'badge-approved', label: 'Approved' },
      'review': { cls: 'badge-review', label: 'In Review' },
      'in-review': { cls: 'badge-review', label: 'In Review' },
      'draft': { cls: 'badge-draft', label: 'Draft' },
      'not-started': { cls: 'badge-draft', label: 'Not Started' },
      'phase-1-assets': { cls: 'badge-production', label: 'Phase 1 — Assets' },
      'in-production': { cls: 'badge-production', label: 'In Production' }
    };
    const s = map[status] || { cls: 'badge-draft', label: status };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  }

  async function downloadFile(url, filename) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || url.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  function downloadBtn(url, filename) {
    return `<button class="download-btn" onclick="event.stopPropagation(); window._download('${url}', '${filename || ''}')" title="Download">${ICON.download}</button>`;
  }

  // Global download function
  window._download = downloadFile;

  // --- Navigation ---
  function renderNav(active) {
    const links = [
      { href: '#/', label: 'Home', icon: ICON.home, key: '' },
      { href: '#/projects', label: 'Projects', icon: ICON.projects, key: 'projects' },
      { href: '#/personas', label: 'Personas', icon: ICON.personas, key: 'personas' },
      { href: '#/videos', label: 'Videos', icon: ICON.videos, key: 'videos' },
      { href: '#/images', label: 'Images', icon: ICON.images, key: 'images' },
      { href: '#/spending', label: 'Spending', icon: ICON.spending, key: 'spending' }
    ];

    document.getElementById('main-nav').innerHTML = `
      <div class="nav-logo" onclick="location.hash='#/'">
        <span>SL</span> Studio
      </div>
      <ul class="nav-links">
        ${links.map(l => `
          <li><a href="${l.href}" class="${active === l.key ? 'active' : ''}">
            ${l.icon}<span>${l.label}</span>
          </a></li>
        `).join('')}
      </ul>
    `;
  }

  // --- Breadcrumb ---
  function renderBreadcrumb(items) {
    if (!items || items.length === 0) {
      document.getElementById('breadcrumb-bar').innerHTML = '';
      return;
    }
    document.getElementById('breadcrumb-bar').innerHTML = `
      <ul class="breadcrumb">
        ${items.map((item, i) => `
          <li>${i < items.length - 1
            ? `<a href="${item.href}">${item.label}</a>`
            : `<span class="current">${item.label}</span>`
          }</li>
        `).join('')}
      </ul>
    `;
  }

  // --- Lightbox ---
  function openLightbox(items, index) {
    lightboxItems = items;
    lightboxIdx = index || 0;
    updateLightbox();
    document.getElementById('lightbox').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    const item = lightboxItems[lightboxIdx];
    const content = document.querySelector('.lightbox-content');
    const dl = document.getElementById('lightbox-download');

    if (item.type === 'video') {
      content.innerHTML = `<video src="${item.url}" controls autoplay playsinline style="max-height:80vh;max-width:90vw;"></video>`;
    } else {
      content.innerHTML = `<img src="${item.url}" alt="${item.title || ''}">`;
    }

    dl.onclick = function (e) {
      e.preventDefault();
      downloadFile(item.url, item.filename || item.url.split('/').pop());
    };

    document.querySelector('.lightbox-prev').style.display = lightboxItems.length > 1 ? '' : 'none';
    document.querySelector('.lightbox-next').style.display = lightboxItems.length > 1 ? '' : 'none';
  }

  window.closeLightbox = function () {
    document.getElementById('lightbox').classList.add('hidden');
    document.body.style.overflow = '';
    const content = document.querySelector('.lightbox-content');
    content.innerHTML = '';
  };

  window.lightboxNav = function (dir) {
    lightboxIdx = (lightboxIdx + dir + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  };

  // Keyboard nav
  document.addEventListener('keydown', function (e) {
    if (document.getElementById('lightbox').classList.contains('hidden')) return;
    if (e.key === 'Escape') window.closeLightbox();
    if (e.key === 'ArrowLeft') window.lightboxNav(-1);
    if (e.key === 'ArrowRight') window.lightboxNav(1);
  });

  // --- Card Components ---
  function mediaCard(opts) {
    const isVideo = opts.type === 'video';
    const aspectClass = opts.aspect || '';
    const url = opts.src;
    const fname = (opts.filename || url.split('/').pop());

    return `
      <div class="card" ${opts.href ? `onclick="location.hash='${opts.href}'"` : `onclick="window._openLB(${opts.lbGroup || 0}, ${opts.lbIndex || 0})"`}>
        <div class="card-media ${aspectClass}">
          ${isVideo
            ? `<video src="${url}" muted loop playsinline onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0"></video>`
            : `<img src="${url}" alt="${opts.title || ''}" loading="lazy">`
          }
          ${downloadBtn(url, fname)}
          ${isVideo ? `<span class="video-duration">${opts.duration || ''}</span>` : ''}
        </div>
        <div class="card-body">
          <div class="card-title">${opts.title || ''}</div>
          ${opts.subtitle ? `<div class="card-subtitle">${opts.subtitle}</div>` : ''}
          ${opts.tags ? `<div class="card-tags">${opts.tags.map(t => `<span class="badge badge-niche">${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    `;
  }

  // --- Register lightbox groups ---
  let lbGroups = [];

  function registerLB(items) {
    const idx = lbGroups.length;
    lbGroups.push(items);
    return idx;
  }

  window._openLB = function (group, index) {
    openLightbox(lbGroups[group], index);
  };

  // ===========================
  //        VIEWS
  // ===========================

  // --- HOME ---
  function renderHome(app) {
    renderNav('');
    renderBreadcrumb([{ label: 'Home', href: '#/' }]);
    lbGroups = [];

    const nicheCount = new Set(DATA.personas.map(p => p.niche)).size;
    const totalImages = DATA.personas.length + DATA.personas.reduce((a, p) => a + p.posts.length, 0) + (nicheCount * 10);
    const approvedScenes = DATA.projects.reduce((a, p) => a + p.scenes.filter(s => s.status === 'approved').length, 0);

    // Recent items for lightbox
    const recentItems = DATA.videos.map(v => ({
      url: contentUrl(v.file),
      type: 'video',
      title: v.title,
      filename: v.file.split('/').pop()
    }));
    const recentLB = registerLB(recentItems);

    app.innerHTML = `
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>StudioLee Studio — AI content production pipeline</p>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">${DATA.projects.length}</div>
          <div class="stat-label">Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${DATA.personas.length}</div>
          <div class="stat-label">Personas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${DATA.videos.length}</div>
          <div class="stat-label">Videos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalImages}</div>
          <div class="stat-label">Images</div>
        </div>
        ${DATA.spending ? `
        <div class="stat-card" style="cursor:pointer;" onclick="location.hash='#/spending'">
          <div class="stat-value" style="font-size:24px;">${DATA.spending.totalCredits.toLocaleString()}</div>
          <div class="stat-label">Credits Spent</div>
          <div style="margin-top:6px;font-size:12px;color:var(--text-secondary);">
            $${DATA.spending.totalUsd.toFixed(2)} &middot; €${usdToEur(DATA.spending.totalUsd)}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Active Projects</h2>
          <a href="#/projects" class="view-all">View all &rarr;</a>
        </div>
        <div class="grid grid-3">
          ${DATA.projects.map(p => {
            const thumb = p.thumbnailRepo === 'content' ? contentUrl(p.thumbnail) : studioUrl(p.thumbnail);
            return `
              <div class="card" onclick="location.hash='#/projects/${p.id}'">
                <div class="card-media">
                  <img src="${thumb}" alt="${p.title}" loading="lazy">
                </div>
                <div class="card-body">
                  <div class="card-title">${p.title}</div>
                  <div class="card-subtitle">${p.scenes.length} scenes &middot; ${p.duration} &middot; ${p.format}</div>
                  <div class="card-tags">${statusBadge(p.status)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Recent Videos</h2>
          <a href="#/videos" class="view-all">View all &rarr;</a>
        </div>
        <div class="grid grid-4">
          ${DATA.videos.map((v, i) => {
            const persona = getPersona(v.persona);
            return mediaCard({
              src: contentUrl(v.file),
              type: 'video',
              title: v.title,
              subtitle: persona ? persona.name : '',
              duration: v.duration,
              tags: [v.resolution, v.format],
              lbGroup: recentLB,
              lbIndex: i
            });
          }).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Personas</h2>
          <a href="#/personas" class="view-all">View all &rarr;</a>
        </div>
        <div class="grid grid-4">
          ${DATA.personas.slice(0, 8).map(p => `
            <div class="card" onclick="location.hash='#/personas/${p.id}'">
              <div class="card-media square">
                <img src="${contentUrl(p.avatar)}" alt="${p.name}" loading="lazy">
              </div>
              <div class="card-body">
                <div class="card-title">${p.name}</div>
                <div class="card-subtitle">${p.handle}</div>
                <div class="card-tags"><span class="badge badge-niche">${p.niche}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- PROJECTS ---
  function renderProjects(app) {
    renderNav('projects');
    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Projects', href: '#/projects' }
    ]);

    app.innerHTML = `
      <div class="page-header">
        <h1>Projects</h1>
        <p>Video production pipeline — all active and completed projects</p>
      </div>
      <div class="grid grid-3">
        ${DATA.projects.map(p => {
          const thumb = p.thumbnailRepo === 'content' ? contentUrl(p.thumbnail) : studioUrl(p.thumbnail);
          const done = p.scenes.filter(s => s.status === 'approved').length;
          return `
            <div class="card" onclick="location.hash='#/projects/${p.id}'">
              <div class="card-media">
                <img src="${thumb}" alt="${p.title}" loading="lazy">
              </div>
              <div class="card-body">
                <div class="card-title">${p.title}</div>
                <div class="card-subtitle">${p.scenes.length} scenes &middot; ${done} approved &middot; ${p.duration}</div>
                <div class="card-tags">
                  ${statusBadge(p.status)}
                  <span class="badge badge-niche">${p.format}</span>
                  <span class="badge badge-niche">${p.style.split(',')[0]}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- PROJECT DETAIL ---
  function renderProject(app, slug) {
    renderNav('projects');
    const project = DATA.projects.find(p => p.id === slug);
    if (!project) {
      app.innerHTML = '<div class="empty-state"><h3>Project not found</h3></div>';
      return;
    }

    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Projects', href: '#/projects' },
      { label: project.title, href: `#/projects/${slug}` }
    ]);

    lbGroups = [];

    // Assets lightbox
    const assetItems = project.assets.map(a => ({
      url: studioUrl(a.file),
      type: 'image',
      title: a.name,
      filename: a.file.split('/').pop()
    }));
    const assetLB = registerLB(assetItems);

    const thumb = project.thumbnailRepo === 'content' ? contentUrl(project.thumbnail) : studioUrl(project.thumbnail);
    const done = project.scenes.filter(s => s.status === 'approved').length;

    app.innerHTML = `
      <div class="project-hero">
        <div style="border-radius:var(--radius);overflow:hidden;">
          <img src="${thumb}" alt="${project.title}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div class="project-meta">
          <div>${statusBadge(project.status)}</div>
          <h1>${project.title}</h1>
          <p style="color:var(--text-secondary);font-size:14px;">${project.story}</p>
          <div class="project-meta-grid">
            <div class="project-meta-item">
              <span class="label">Duration</span>
              <span class="value">${project.duration}</span>
            </div>
            <div class="project-meta-item">
              <span class="label">Format</span>
              <span class="value">${project.format}</span>
            </div>
            <div class="project-meta-item">
              <span class="label">Scenes</span>
              <span class="value">${project.scenes.length} total &middot; ${done} approved</span>
            </div>
            <div class="project-meta-item">
              <span class="label">Style</span>
              <span class="value">${project.style}</span>
            </div>
            ${(() => {
              const ps = getProjectSpending(project.id);
              if (!ps) return `<div class="project-meta-item"><span class="label">Cost</span><span class="value" style="color:var(--text-muted);">No spend yet</span></div>`;
              return `<div class="project-meta-item">
                <span class="label">Cost</span>
                <span class="value">${ps.credits} cr &middot; $${ps.usd.toFixed(2)} &middot; €${usdToEur(ps.usd)}</span>
              </div>`;
            })()}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2>Characters</h2></div>
        <div class="grid grid-4">
          ${project.characters.map(c => {
            const persona = c.persona ? getPersona(c.persona) : null;
            const avatar = persona ? contentUrl(persona.avatar) : (c.avatar ? contentUrl(c.avatar) : '');
            return `
              <div class="card" ${persona ? `onclick="location.hash='#/personas/${persona.id}'"` : ''}>
                <div class="card-media square">
                  ${avatar ? `<img src="${avatar}" alt="${c.name}" loading="lazy">` : '<div style="width:100%;height:100%;background:var(--bg-elevated);"></div>'}
                </div>
                <div class="card-body">
                  <div class="card-title">${c.name}</div>
                  <div class="card-subtitle">${c.role}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2>Assets</h2></div>
        <div class="grid grid-4">
          ${project.assets.map((a, i) => `
            <div class="card" onclick="window._openLB(${assetLB}, ${i})">
              <div class="card-media">
                <img src="${studioUrl(a.file)}" alt="${a.name}" loading="lazy">
                ${downloadBtn(studioUrl(a.file), a.file.split('/').pop())}
              </div>
              <div class="card-body">
                <div class="card-title">${a.name}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      ${(() => {
        // Calculate project cost from all scenes
        const imgPrice = DATA.pricing ? DATA.pricing.image : 0.04;
        const vidPrice = DATA.pricing ? DATA.pricing.videoPerSecond : 0.10;
        let totalImgs = project.assets.length;
        let totalVids = 0;
        let totalVidSecs = 0;

        project.scenes.forEach(s => {
          if (s.images) totalImgs += s.images.length;
          if (s.videos) {
            totalVids += s.videos.length;
            s.videos.forEach(v => { totalVidSecs += (v.dur || 0); });
          }
          if (s.variants) {
            Object.values(s.variants).forEach(vr => {
              if (vr.images) totalImgs += vr.images.length;
              if (vr.videos) {
                totalVids += vr.videos.length;
                vr.videos.forEach(v => { totalVidSecs += (v.dur || 0); });
              }
            });
          }
          if (s.v2 && s.v2.images) totalImgs += s.v2.images.length;
        });

        if (project.chaosTests) {
          totalVids += project.chaosTests.length;
          project.chaosTests.forEach(v => { totalVidSecs += (v.dur || 0); });
        }

        const imgCost = totalImgs * imgPrice;
        const vidCost = totalVidSecs * vidPrice;
        const totalCost = imgCost + vidCost;

        return `
      <div class="section">
        <div class="section-header"><h2>Project Cost</h2></div>
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value" style="font-size:22px;">€${usdToEur(totalCost)}</div>
            <div class="stat-label">Total Cost</div>
            <div style="margin-top:6px;font-size:12px;color:var(--text-secondary);">$${totalCost.toFixed(2)} USD</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size:22px;">${totalImgs}</div>
            <div class="stat-label">Images ($${imgPrice}/ea)</div>
            <div style="margin-top:6px;font-size:12px;color:var(--text-secondary);">$${imgCost.toFixed(2)} &middot; €${usdToEur(imgCost)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size:22px;">${totalVids}</div>
            <div class="stat-label">Videos (${totalVidSecs}s)</div>
            <div style="margin-top:6px;font-size:12px;color:var(--text-secondary);">$${vidCost.toFixed(2)} &middot; €${usdToEur(vidCost)} &middot; $${vidPrice}/s</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size:22px;">${project.scenes.filter(s=>s.videos&&s.videos.some(v=>v.status==='rejected')).length + (project.chaosTests?project.chaosTests.filter(v=>v.status==='rejected').length:0)}</div>
            <div class="stat-label">Rejected Takes</div>
          </div>
        </div>
      </div>`;
      })()}

      <div class="section">
        <div class="section-header"><h2>Scenes (${project.scenes.length})</h2></div>
        ${project.scenes.map(s => {
          // Collect all images for this scene's lightbox
          const sceneImgs = (s.images || []).map(img => ({
            url: studioUrl(img.file), type: 'image', title: img.label, filename: img.file.split('/').pop()
          }));
          const sceneLB = sceneImgs.length > 0 ? registerLB(sceneImgs) : -1;

          // Scene cost
          const sImgCount = (s.images || []).length;
          const sVidSecs = (s.videos || []).reduce((a, v) => a + (v.dur || 0), 0);
          let variantImgs = 0, variantVidSecs = 0;
          if (s.variants) {
            Object.values(s.variants).forEach(vr => {
              variantImgs += (vr.images || []).length;
              variantVidSecs += (vr.videos || []).reduce((a, v) => a + (v.dur || 0), 0);
            });
          }
          if (s.v2 && s.v2.images) variantImgs += s.v2.images.length;
          const sCost = ((sImgCount + variantImgs) * 0.04) + ((sVidSecs + variantVidSecs) * 0.10);

          return `
          <div class="scene-card" style="margin-bottom:16px;">
            <div class="scene-card-header">
              <span class="scene-number">Scene ${s.id} — ${s.name}</span>
              <div style="display:flex;gap:6px;align-items:center;">
                ${sCost > 0 ? `<span class="badge badge-spending">€${usdToEur(sCost)}</span>` : ''}
                ${statusBadge(s.status)}
              </div>
            </div>
            ${(s.images && s.images.length > 0) ? `
            <div style="display:flex;gap:2px;overflow-x:auto;background:var(--bg-elevated);">
              ${s.images.map((img, i) => `
                <div style="position:relative;min-width:120px;height:160px;flex-shrink:0;cursor:pointer;" onclick="window._openLB(${sceneLB}, ${i})">
                  <img src="${studioUrl(img.file)}" alt="${img.label}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
                  ${downloadBtn(studioUrl(img.file), img.file.split('/').pop())}
                  <span class="scene-frame-label">${img.label}</span>
                </div>
              `).join('')}
            </div>` : ''}
            ${(s.videos && s.videos.length > 0) ? `
            <div style="padding:12px 16px 0;">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Videos</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${s.videos.map(v => `
                  <div class="card" style="width:200px;flex-shrink:0;" onclick="window._openLB(${registerLB([{url:studioUrl(v.file),type:'video',title:v.label,filename:v.file.split('/').pop()}])}, 0)">
                    <div class="card-media" style="aspect-ratio:9/16;height:180px;">
                      <video src="${studioUrl(v.file)}" muted playsinline onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0" style="width:100%;height:100%;object-fit:cover;"></video>
                      ${downloadBtn(studioUrl(v.file), v.file.split('/').pop())}
                      <span class="video-duration">${v.dur}s</span>
                    </div>
                    <div class="card-body" style="padding:8px 10px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:13px;font-weight:500;">${v.label}</span>
                        ${statusBadge(v.status)}
                      </div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">$${(v.dur * 0.10).toFixed(2)} &middot; €${usdToEur(v.dur * 0.10)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>` : ''}
            ${s.variants ? Object.entries(s.variants).map(([key, vr]) => {
              const vrImgs = (vr.images || []).map(img => ({
                url: studioUrl(img.file), type: 'image', title: img.label, filename: img.file.split('/').pop()
              }));
              const vrLB = vrImgs.length > 0 ? registerLB(vrImgs) : -1;
              return `
              <div style="padding:12px 16px 0;border-top:1px solid var(--border);">
                <div style="font-size:12px;color:var(--accent);margin-bottom:8px;font-weight:600;">Variant ${key.toUpperCase()} — ${vr.name || ''}</div>
                ${vrImgs.length > 0 ? `
                <div style="display:flex;gap:2px;overflow-x:auto;margin-bottom:8px;">
                  ${vr.images.map((img, i) => `
                    <div style="position:relative;min-width:100px;height:140px;flex-shrink:0;cursor:pointer;" onclick="window._openLB(${vrLB}, ${i})">
                      <img src="${studioUrl(img.file)}" alt="${img.label}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">
                      ${downloadBtn(studioUrl(img.file), img.file.split('/').pop())}
                      <span class="scene-frame-label">${img.label}</span>
                    </div>
                  `).join('')}
                </div>` : ''}
                ${(vr.videos && vr.videos.length > 0) ? `
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${vr.videos.map(v => `
                    <div class="card" style="width:160px;flex-shrink:0;" onclick="window._openLB(${registerLB([{url:studioUrl(v.file),type:'video',title:v.label,filename:v.file.split('/').pop()}])}, 0)">
                      <div class="card-media" style="aspect-ratio:9/16;height:150px;">
                        <video src="${studioUrl(v.file)}" muted playsinline onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0" style="width:100%;height:100%;object-fit:cover;"></video>
                        ${downloadBtn(studioUrl(v.file), v.file.split('/').pop())}
                      </div>
                      <div class="card-body" style="padding:6px 8px;">
                        <span style="font-size:12px;">${v.label}</span>
                        ${statusBadge(v.status)}
                      </div>
                    </div>
                  `).join('')}
                </div>` : ''}
              </div>`;
            }).join('') : ''}
            ${s.v2 ? `
            <div style="padding:12px 16px 0;border-top:1px solid var(--border);">
              <div style="font-size:12px;color:var(--accent);margin-bottom:8px;font-weight:600;">V2 Iteration</div>
              <div style="display:flex;gap:2px;overflow-x:auto;">
                ${s.v2.images.map((img, i) => {
                  const v2LB = registerLB(s.v2.images.map(im => ({url:studioUrl(im.file),type:'image',title:im.label,filename:im.file.split('/').pop()})));
                  return `
                  <div style="position:relative;min-width:100px;height:140px;flex-shrink:0;cursor:pointer;" onclick="window._openLB(${v2LB}, ${i})">
                    <img src="${studioUrl(img.file)}" alt="${img.label}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">
                    ${downloadBtn(studioUrl(img.file), img.file.split('/').pop())}
                    <span class="scene-frame-label">${img.label}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>` : ''}
            <div class="scene-card-body">
              <p class="scene-description">${s.desc}</p>
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                <span style="display:flex;align-items:center;gap:4px;color:var(--text-muted);font-size:12px;">${ICON.clock} ${s.dur}</span>
                ${s.images ? `<span style="font-size:12px;color:var(--text-muted);">${s.images.length} images</span>` : ''}
                ${s.videos ? `<span style="font-size:12px;color:var(--text-muted);">${s.videos.length} video takes</span>` : ''}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>

      ${project.chaosTests ? `
      <div class="section">
        <div class="section-header"><h2>Chaos Test Clips</h2></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${project.chaosTests.map(v => `
            <div class="card" style="width:200px;" onclick="window._openLB(${registerLB([{url:studioUrl(v.file),type:'video',title:v.label,filename:v.file.split('/').pop()}])}, 0)">
              <div class="card-media" style="aspect-ratio:9/16;height:200px;">
                <video src="${studioUrl(v.file)}" muted playsinline onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0" style="width:100%;height:100%;object-fit:cover;"></video>
                ${downloadBtn(studioUrl(v.file), v.file.split('/').pop())}
                <span class="video-duration">${v.dur}s</span>
              </div>
              <div class="card-body" style="padding:8px 10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:12px;font-weight:500;">${v.label}</span>
                  ${statusBadge(v.status)}
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">$${(v.dur * 0.10).toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    `;
  }

  // --- PERSONAS ---
  function renderPersonas(app) {
    renderNav('personas');
    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Personas', href: '#/personas' }
    ]);

    const niches = [...new Set(DATA.personas.map(p => p.niche))];
    let activeFilter = 'All';

    function render(filter) {
      activeFilter = filter;
      const filtered = filter === 'All' ? DATA.personas : DATA.personas.filter(p => p.niche === filter);

      app.innerHTML = `
        <div class="page-header">
          <h1>Personas</h1>
          <p>${DATA.personas.length} AI characters across ${niches.length} niches</p>
        </div>
        <div class="filter-bar">
          <button class="filter-btn ${activeFilter === 'All' ? 'active' : ''}" onclick="window._filterPersonas('All')">All</button>
          ${niches.map(n => `
            <button class="filter-btn ${activeFilter === n ? 'active' : ''}" onclick="window._filterPersonas('${n}')">${n}</button>
          `).join('')}
        </div>
        <div class="grid grid-4">
          ${filtered.map(p => `
            <div class="card" onclick="location.hash='#/personas/${p.id}'">
              <div class="card-media square">
                <img src="${contentUrl(p.avatar)}" alt="${p.name}" loading="lazy">
                ${downloadBtn(contentUrl(p.avatar), p.avatar.split('/').pop())}
              </div>
              <div class="card-body">
                <div class="card-title">${p.name}</div>
                <div class="card-subtitle">${p.handle}</div>
                <div class="card-tags"><span class="badge badge-niche">${p.niche}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    window._filterPersonas = function (filter) { render(filter); };
    render('All');
  }

  // --- PERSONA DETAIL ---
  function renderPersona(app, slug) {
    renderNav('personas');
    const persona = DATA.personas.find(p => p.id === slug);
    if (!persona) {
      app.innerHTML = '<div class="empty-state"><h3>Persona not found</h3></div>';
      return;
    }

    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Personas', href: '#/personas' },
      { label: persona.name, href: `#/personas/${slug}` }
    ]);

    lbGroups = [];

    // Posts lightbox
    const postItems = persona.posts.map(p => ({
      url: contentUrl(p),
      type: 'image',
      title: persona.name,
      filename: p.split('/').pop()
    }));
    const postLB = registerLB(postItems);

    // Niche images lightbox (10 images)
    const nicheImgs = [];
    for (let i = 1; i <= 10; i++) {
      nicheImgs.push({
        url: contentUrl(persona.nicheImages + '/' + String(i).padStart(2, '0') + '.jpg'),
        type: 'image',
        title: persona.niche + ' #' + i,
        filename: persona.niche.toLowerCase() + '_' + String(i).padStart(2, '0') + '.jpg'
      });
    }
    const nicheLB = registerLB(nicheImgs);

    // Videos for this persona
    const personaVideos = DATA.videos.filter(v => v.persona === persona.id);
    let videoLB = -1;
    if (personaVideos.length > 0) {
      videoLB = registerLB(personaVideos.map(v => ({
        url: contentUrl(v.file),
        type: 'video',
        title: v.title,
        filename: v.file.split('/').pop()
      })));
    }

    // Projects featuring this persona
    const inProjects = DATA.projects.filter(p =>
      p.characters.some(c => c.persona === persona.id)
    );

    let activeTab = 'posts';

    function renderTabs(tab) {
      activeTab = tab;
      const tabContent = document.getElementById('persona-tab-content');
      if (!tabContent) return;

      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');

      if (tab === 'posts') {
        tabContent.innerHTML = `
          <div class="grid grid-4">
            ${persona.posts.map((p, i) => `
              <div class="card" onclick="window._openLB(${postLB}, ${i})">
                <div class="card-media square">
                  <img src="${contentUrl(p)}" alt="${persona.name}" loading="lazy">
                  ${downloadBtn(contentUrl(p), p.split('/').pop())}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'niche') {
        tabContent.innerHTML = `
          <div class="grid grid-4">
            ${nicheImgs.map((img, i) => `
              <div class="card" onclick="window._openLB(${nicheLB}, ${i})">
                <div class="card-media">
                  <img src="${img.url}" alt="${img.title}" loading="lazy">
                  ${downloadBtn(img.url, img.filename)}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'videos') {
        if (personaVideos.length === 0) {
          tabContent.innerHTML = '<div class="empty-state"><h3>No videos yet</h3><p>Videos featuring this persona will appear here.</p></div>';
        } else {
          tabContent.innerHTML = `
            <div class="grid grid-3">
              ${personaVideos.map((v, i) => mediaCard({
                src: contentUrl(v.file),
                type: 'video',
                title: v.title,
                subtitle: v.duration + ' &middot; ' + v.resolution,
                duration: v.duration,
                tags: [v.style],
                lbGroup: videoLB,
                lbIndex: i
              })).join('')}
            </div>
          `;
        }
      }
    }

    window._switchTab = renderTabs;

    app.innerHTML = `
      <div class="persona-header">
        <img class="persona-avatar" src="${contentUrl(persona.avatar)}" alt="${persona.name}">
        <div class="persona-info">
          <h1>${persona.name}</h1>
          <div class="persona-handle">${persona.handle}</div>
          <p class="persona-bio">${persona.bio}</p>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
            <span class="badge badge-niche">${persona.niche}</span>
            ${inProjects.map(p => `<span class="badge badge-production" style="cursor:pointer;" onclick="location.hash='#/projects/${p.id}'">${p.title}</span>`).join('')}
            ${(() => {
              const ps = getPersonaSpending(persona.id);
              return ps ? spendingBadge(ps.credits, ps.usd) : '';
            })()}
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="btn btn-accent" onclick="window._download('${contentUrl(persona.avatar)}', '${persona.avatar.split('/').pop()}')">${ICON.download} Download Avatar</button>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="posts" onclick="window._switchTab('posts')">Posts (${persona.posts.length})</button>
        <button class="tab" data-tab="niche" onclick="window._switchTab('niche')">${persona.niche} Collection</button>
        <button class="tab" data-tab="videos" onclick="window._switchTab('videos')">Videos (${personaVideos.length})</button>
      </div>
      <div id="persona-tab-content"></div>
    `;

    renderTabs('posts');
  }

  // --- VIDEOS ---
  function renderVideos(app) {
    renderNav('videos');
    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Videos', href: '#/videos' }
    ]);

    lbGroups = [];
    const allItems = DATA.videos.map(v => ({
      url: contentUrl(v.file),
      type: 'video',
      title: v.title,
      filename: v.file.split('/').pop()
    }));
    const allLB = registerLB(allItems);

    app.innerHTML = `
      <div class="page-header">
        <h1>Videos</h1>
        <p>${DATA.videos.length} generated videos — Seedance 2.0 via Kie AI</p>
      </div>
      <div class="grid grid-3">
        ${DATA.videos.map((v, i) => {
          const persona = getPersona(v.persona);
          const ps = persona ? getPersonaSpending(persona.id) : null;
          const vidCost = ps ? ps.items.find(it => it.type === 'video') : null;
          const costTag = vidCost ? `€${usdToEur(vidCost.usd)}` : null;
          return mediaCard({
            src: contentUrl(v.file),
            type: 'video',
            title: v.title,
            subtitle: (persona ? persona.name + ' &middot; ' : '') + v.date,
            duration: v.duration,
            tags: [v.resolution, v.format, costTag].filter(Boolean),
            lbGroup: allLB,
            lbIndex: i
          });
        }).join('')}
      </div>
    `;
  }

  // --- IMAGES ---
  function renderImages(app) {
    renderNav('images');
    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Images', href: '#/images' }
    ]);

    lbGroups = [];
    let activeFilter = 'All';

    // Collect all images
    const allImages = [];

    // Persona avatars
    DATA.personas.forEach(p => {
      allImages.push({
        url: contentUrl(p.avatar),
        title: p.name,
        category: 'Avatars',
        niche: p.niche,
        filename: p.avatar.split('/').pop()
      });
    });

    // Persona posts
    DATA.personas.forEach(p => {
      p.posts.forEach((post, i) => {
        allImages.push({
          url: contentUrl(post),
          title: p.name + ' — Post ' + (i + 1),
          category: 'Posts',
          niche: p.niche,
          filename: post.split('/').pop()
        });
      });
    });

    // Niche background images (10 per niche, shared between both characters)
    const seenNiches = new Set();
    DATA.personas.forEach(p => {
      if (seenNiches.has(p.niche)) return;
      seenNiches.add(p.niche);
      for (let i = 1; i <= 10; i++) {
        const num = String(i).padStart(2, '0');
        allImages.push({
          url: contentUrl(p.nicheImages + '/' + num + '.jpg'),
          title: p.niche + ' Background #' + i,
          category: 'Backgrounds',
          niche: p.niche,
          filename: p.niche.toLowerCase() + '_' + num + '.jpg'
        });
      }
    });

    // Project assets
    DATA.projects.forEach(proj => {
      proj.assets.forEach(a => {
        allImages.push({
          url: studioUrl(a.file),
          title: a.name + ' (' + proj.title + ')',
          category: 'Assets',
          niche: 'Project',
          filename: a.file.split('/').pop()
        });
      });
    });

    // Tim Lee
    if (DATA.characters) {
      DATA.characters.forEach(c => {
        c.images.forEach(img => {
          allImages.push({
            url: contentUrl(img),
            title: c.name,
            category: 'Characters',
            niche: 'Character',
            filename: img.split('/').pop()
          });
        });
      });
    }

    const categories = ['All', ...new Set(allImages.map(i => i.category))];

    function render(filter) {
      activeFilter = filter;
      const filtered = filter === 'All' ? allImages : allImages.filter(i => i.category === filter);

      // Register lightbox for filtered items
      const lbItems = filtered.map(img => ({
        url: img.url,
        type: 'image',
        title: img.title,
        filename: img.filename
      }));
      lbGroups = [];
      const imgLB = registerLB(lbItems);

      app.innerHTML = `
        <div class="page-header">
          <h1>Images</h1>
          <p>${allImages.length} images across all projects and personas</p>
        </div>
        <div class="filter-bar">
          ${categories.map(c => `
            <button class="filter-btn ${activeFilter === c ? 'active' : ''}" onclick="window._filterImages('${c}')">${c}${c !== 'All' ? ` (${allImages.filter(i => i.category === c).length})` : ''}</button>
          `).join('')}
        </div>
        <div class="masonry">
          ${filtered.map((img, i) => `
            <div class="card" onclick="window._openLB(${imgLB}, ${i})">
              <div class="card-media">
                <img src="${img.url}" alt="${img.title}" loading="lazy">
                ${downloadBtn(img.url, img.filename)}
              </div>
              <div class="card-body">
                <div class="card-title">${img.title}</div>
                <div class="card-tags">
                  <span class="badge badge-niche">${img.category}</span>
                  ${img.niche !== img.category ? `<span class="badge badge-niche">${img.niche}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    window._filterImages = function (filter) { render(filter); };
    render('All');
  }

  // --- SPENDING ---
  function renderSpending(app) {
    renderNav('spending');
    renderBreadcrumb([
      { label: 'Home', href: '#/' },
      { label: 'Spending', href: '#/spending' }
    ]);

    const s = DATA.spending;
    if (!s) {
      app.innerHTML = '<div class="empty-state"><h3>No spending data</h3></div>';
      return;
    }

    const eur = usdToEur(s.totalUsd);

    // Per-persona table rows
    const personaRows = Object.entries(s.perPersona)
      .filter(([k]) => k !== '_niche_backgrounds')
      .sort((a, b) => b[1].credits - a[1].credits)
      .map(([id, ps]) => {
        const persona = getPersona(id);
        const name = persona ? persona.name : id;
        const handle = persona ? persona.handle : '';
        return `
          <tr onclick="${persona ? `location.hash='#/personas/${id}'` : ''}" style="cursor:${persona ? 'pointer' : 'default'};">
            <td style="display:flex;align-items:center;gap:10px;">
              ${persona ? `<img src="${contentUrl(persona.avatar)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : ''}
              <div>
                <div style="font-weight:500;">${name}</div>
                <div style="font-size:12px;color:var(--text-muted);">${handle}</div>
              </div>
            </td>
            <td>${ps.credits.toLocaleString()}</td>
            <td>$${ps.usd.toFixed(2)}</td>
            <td>€${usdToEur(ps.usd)}</td>
            <td>${ps.attempts}</td>
            <td>${ps.failures > 0 ? `<span style="color:var(--danger);">${ps.failures}</span>` : '0'}</td>
          </tr>
        `;
      });

    // Per-project table rows
    const projectRows = Object.entries(s.perProject).map(([id, ps]) => {
      const project = DATA.projects.find(p => p.id === id);
      const name = project ? project.title : id;
      return `
        <tr onclick="${project ? `location.hash='#/projects/${id}'` : ''}" style="cursor:${project ? 'pointer' : 'default'};">
          <td style="font-weight:500;">${name}</td>
          <td>${ps.credits.toLocaleString()}</td>
          <td>$${ps.usd.toFixed(2)}</td>
          <td>€${usdToEur(ps.usd)}</td>
          <td>${ps.attempts}</td>
          <td>${ps.failures > 0 ? `<span style="color:var(--danger);">${ps.failures}</span>` : '0'}</td>
        </tr>
      `;
    });

    // Niche backgrounds
    const bgSpend = s.perPersona['_niche_backgrounds'];

    app.innerHTML = `
      <div class="page-header">
        <h1>Spending</h1>
        <p>Kie AI credit usage across all content &middot; Rate: ${s.rate}</p>
      </div>

      <div class="stats-row">
        ${spendingCard('Total Spent', s.totalCredits, s.totalUsd)}
        <div class="stat-card">
          <div class="stat-value" style="font-size:24px;">$${s.totalUsd.toFixed(2)}</div>
          <div class="stat-label">USD</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="font-size:24px;">€${eur}</div>
          <div class="stat-label">EUR</div>
          <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Rate: 1 USD = ${DATA.meta.usdToEur} EUR</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="font-size:24px;">${s.totalCredits.toLocaleString()}</div>
          <div class="stat-label">Credits Used</div>
          <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">1,000 credits = $5 USD</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2>Per Persona</h2></div>
        <div style="overflow-x:auto;">
          <table class="spending-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Credits</th>
                <th>USD</th>
                <th>EUR</th>
                <th>Generations</th>
                <th>Failures</th>
              </tr>
            </thead>
            <tbody>
              ${personaRows.join('')}
              ${bgSpend ? `
              <tr style="border-top:2px solid var(--border);">
                <td style="font-weight:500;">Niche Backgrounds (shared)</td>
                <td>${bgSpend.credits.toLocaleString()}</td>
                <td>$${bgSpend.usd.toFixed(2)}</td>
                <td>€${usdToEur(bgSpend.usd)}</td>
                <td>${bgSpend.attempts}</td>
                <td>0</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h2>Per Project</h2></div>
        ${projectRows.length > 0 ? `
        <div style="overflow-x:auto;">
          <table class="spending-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Credits</th>
                <th>USD</th>
                <th>EUR</th>
                <th>Generations</th>
                <th>Failures</th>
              </tr>
            </thead>
            <tbody>${projectRows.join('')}</tbody>
          </table>
        </div>
        ` : '<p style="color:var(--text-muted);">No project spending yet — costs will appear as scenes are generated.</p>'}
      </div>
    `;
  }

  // ===========================
  //        ROUTER
  // ===========================
  function route() {
    if (!DATA) return;

    const hash = (location.hash || '#/').slice(2); // remove '#/'
    const parts = hash.split('/').filter(Boolean);
    const app = document.getElementById('app');

    // Reset lightbox groups on each navigation
    lbGroups = [];

    // Scroll to top
    window.scrollTo(0, 0);

    if (parts.length === 0) {
      renderHome(app);
    } else if (parts[0] === 'projects' && parts.length === 1) {
      renderProjects(app);
    } else if (parts[0] === 'projects' && parts.length === 2) {
      renderProject(app, parts[1]);
    } else if (parts[0] === 'personas' && parts.length === 1) {
      renderPersonas(app);
    } else if (parts[0] === 'personas' && parts.length === 2) {
      renderPersona(app, parts[1]);
    } else if (parts[0] === 'videos') {
      renderVideos(app);
    } else if (parts[0] === 'images') {
      renderImages(app);
    } else if (parts[0] === 'spending') {
      renderSpending(app);
    } else {
      renderNav('');
      renderBreadcrumb([]);
      app.innerHTML = '<div class="empty-state"><h3>Page not found</h3><p><a href="#/">Go back to dashboard</a></p></div>';
    }
  }

  // ===========================
  //        INIT
  // ===========================
  async function init() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading"><div class="spinner"></div>Loading dashboard...</div>';

    try {
      const res = await fetch('data/registry.json');
      DATA = await res.json();
      window.addEventListener('hashchange', route);
      route();
    } catch (e) {
      app.innerHTML = `
        <div class="empty-state">
          <h3>Failed to load data</h3>
          <p>Could not fetch registry.json. Make sure you're running a local server.</p>
          <p style="margin-top:8px;font-size:12px;color:var(--text-muted);">Try: npx serve</p>
        </div>
      `;
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
