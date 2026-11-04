const state = {
  catalog: null,
  user: {
    progress: {},
    notes: [],
    bookmarks: [],
    lastVisited: null,
    preferences: {
      playerMode: 'html5',
      playbackRate: 1,
      subtitleLang: 'en',
      autoAdvance: false
    }
  },
  // Views: 'course-home' | 'lecture'
  currentView: 'course-home',
  homeSubTab: 'module', // 'module' | 'grades' | 'notes' | 'info' | 'specialization'
  activeCourseId: null,
  activeModuleId: null,
  activeLessonId: null,
  activeVideoTab: 'transcript', // 'transcript' | 'notes' | 'downloads'
  collapsedSections: new Set(),
  currentLessonData: null,
  transcriptFilterText: '',
  pdfPreviewMode: 'proxy'
};

// Clean Monochrome Coursera SVG Icons (Zero Emojis)
const SVG = {
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>`,
  reading: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  videoOutline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`,
  bookOutline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  chevronDown: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  chevronRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  external: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  note: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`
};

// ── Helpers ──────────────────────────────────────────────────
function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatCourseraMin(sec) {
  if (!sec || sec <= 0) return '2 min';
  const mins = Math.max(1, Math.round(sec / 60));
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAllLessonsFlat(course) {
  const list = [];
  if (!course) return list;
  for (const mod of course.modules) {
    for (const sec of mod.sections) {
      for (const les of sec.lessons) {
        list.push({ course, module: mod, section: sec, lesson: les });
      }
    }
  }
  return list;
}

function getCourseStats(course) {
  const flat = getAllLessonsFlat(course);
  const total = flat.length;
  let completed = 0;
  for (const { lesson } of flat) {
    if (state.user.progress[lesson.id]?.status === 'completed') completed++;
  }
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct };
}

function findLessonContext(lessonId) {
  if (!state.catalog?.courses) return null;
  for (const course of state.catalog.courses) {
    const flat = getAllLessonsFlat(course);
    for (let i = 0; i < flat.length; i++) {
      if (flat[i].lesson.id === lessonId) {
        return {
          ...flat[i],
          prevLesson: i > 0 ? flat[i - 1].lesson : null,
          nextLesson: i < flat.length - 1 ? flat[i + 1].lesson : null
        };
      }
    }
  }
  return null;
}

async function apiGet(url) {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`GET ${url} failed`);
  return res.json();
}

async function apiPost(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`POST ${url} failed`);
  return res.json();
}

async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE' });
  if (res.status === 401) {
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`DELETE ${url} failed`);
  return res.json();
}

// ── Top Header Sync ──────────────────────────────────────────
function renderHeader() {
  if (!state.catalog) return;

  const selectEl = document.getElementById('headerCourseSelect');
  if (selectEl) {
    selectEl.innerHTML = state.catalog.courses.map(c => {
      const st = getCourseStats(c);
      return `<option value="${c.id}" ${c.id === state.activeCourseId ? 'selected' : ''}>${escapeHtml(c.shortTitle)} (${st.pct}%)</option>`;
    }).join('');
  }

  document.getElementById('totalNotesBadge').textContent = state.user.notes.length;

  const rootDriveEl = document.getElementById('rootDriveLink');
  if (rootDriveEl && state.catalog.specialization?.folderUrl) {
    rootDriveEl.href = state.catalog.specialization.folderUrl;
  }

  const searchCourseEl = document.getElementById('searchCourseFilter');
  if (searchCourseEl && searchCourseEl.options.length <= 1) {
    for (const c of state.catalog.courses) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.shortTitle;
      searchCourseEl.appendChild(opt);
    }
  }
}

function pauseActiveVideo() {
  const v = document.getElementById('activeVideoPlayer');
  if (v && !v.paused) v.pause();
}

function openCourseHome(courseId = null, moduleId = null, subTab = 'module') {
  pauseActiveVideo();
  const course = state.catalog.courses.find(c => c.id === (courseId || state.activeCourseId)) || state.catalog.courses[0];
  if (!course) return;

  state.currentView = 'course-home';
  state.activeCourseId = course.id;
  state.homeSubTab = subTab;
  state.activeModuleId = moduleId || state.activeModuleId || course.modules[0]?.id;

  // Ensure activeModuleId belongs to this course
  if (!course.modules.some(m => m.id === state.activeModuleId)) {
    state.activeModuleId = course.modules[0]?.id;
  }

  document.getElementById('dashboardView').classList.remove('hidden');
  document.getElementById('workspaceView').classList.add('hidden');
  renderHeader();
  renderCourseHome();
}

function openLecture(courseId, lessonId, seekTime = null) {
  const course = state.catalog.courses.find(c => c.id === courseId) || state.catalog.courses[0];
  if (!course) return;

  state.currentView = 'lecture';
  state.activeCourseId = course.id;

  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('workspaceView').classList.remove('hidden');
  renderHeader();
  selectLesson(lessonId, seekTime);
}

// ── VIEW 1: COURSERA COURSE HOME (Left Sidebar + Module Content) ──
function renderCourseHome() {
  const dashEl = document.getElementById('dashboardView');
  const course = state.catalog.courses.find(c => c.id === state.activeCourseId) || state.catalog.courses[0];
  if (!course) return;

  const st = getCourseStats(course);
  const courseNotes = state.user.notes.filter(n => n.courseId === course.id);

  // Left Sidebar (Authentic Coursera Course Home Left Navigation)
  const sidebarHtml = `
    <aside class="cds-home-sidebar">
      <div class="cds-home-brand-block">
        <span class="cds-home-partner-logo">IIBA · CBAP</span>
        <div class="cds-home-course-name">${escapeHtml(course.title)}</div>
        <div class="cds-home-partner-sub">Course ${course.order} of 4 · ${st.completed}/${st.total} completed</div>
      </div>

      <nav class="cds-home-nav-list">
        <button class="cds-home-nav-btn ${state.homeSubTab === 'module' ? 'active' : ''}" data-nav-tab="module">
          <span>Course Material</span>
          ${SVG.chevronDown}
        </button>
        <div class="cds-home-module-links">
          ${course.modules.map(mod => {
            let mTotal = 0, mDone = 0;
            for (const sec of mod.sections) {
              for (const les of sec.lessons) {
                mTotal++;
                if (state.user.progress[les.id]?.status === 'completed') mDone++;
              }
            }
            const dotClass = mDone === mTotal && mTotal > 0 ? 'done' : (mDone > 0 ? 'in-progress' : '');
            const isActive = state.homeSubTab === 'module' && state.activeModuleId === mod.id;
            return `
              <button class="cds-home-mod-link ${isActive ? 'active' : ''}" data-select-mod="${mod.id}">
                <span class="cds-mod-dot ${dotClass}">${mDone === mTotal && mTotal > 0 ? SVG.check : ''}</span>
                <span>Module ${mod.index}</span>
              </button>
            `;
          }).join('')}
        </div>

        <button class="cds-home-nav-btn ${state.homeSubTab === 'grades' ? 'active' : ''}" data-nav-tab="grades">
          <span>Grades</span>
        </button>

        <button class="cds-home-nav-btn ${state.homeSubTab === 'notes' ? 'active' : ''}" data-nav-tab="notes">
          <span>Notes (${courseNotes.length})</span>
        </button>

        <button class="cds-home-nav-btn ${state.homeSubTab === 'info' ? 'active' : ''}" data-nav-tab="info">
          <span>Course Info</span>
        </button>

        <button class="cds-home-nav-btn ${state.homeSubTab === 'specialization' ? 'active' : ''}" data-nav-tab="specialization">
          <span>Specialization (4 Courses)</span>
        </button>
      </nav>
    </aside>
  `;

  let stageInner = '';

  if (state.homeSubTab === 'module') {
    const activeMod = course.modules.find(m => m.id === state.activeModuleId) || course.modules[0];
    let vCount = 0, vSec = 0, rCount = 0, rSec = 0, mDone = 0, mTotal = 0;
    let firstIncompleteId = null;

    for (const sec of activeMod.sections) {
      for (const les of sec.lessons) {
        mTotal++;
        const isDone = state.user.progress[les.id]?.status === 'completed';
        if (isDone) mDone++;
        else if (!firstIncompleteId) firstIncompleteId = les.id;

        if (les.type === 'video') {
          vCount++;
          vSec += les.durationSec || 0;
        } else {
          rCount++;
          rSec += les.durationSec || 0;
        }
      }
    }

    const sectionsHtml = activeMod.sections.map(sec => {
      const isCollapsed = state.collapsedSections.has(sec.id);

      const itemsHtml = sec.lessons.map(les => {
        const prog = state.user.progress[les.id];
        const isDone = prog?.status === 'completed';
        const isNextUp = les.id === firstIncompleteId;
        const hasPdf = Boolean(les.pdfs && les.pdfs.length > 0);
        const hasVi = Boolean(les.subtitles?.vi);

        const iconSvg = isDone ? SVG.check : (les.type === 'video' ? SVG.play : SVG.reading);
        const typeLabel = les.type === 'video' ? 'Video' : 'Reading';

        return `
          <div class="cds-syllabus-item" data-open-lesson="${les.id}">
            <div class="cds-syllabus-item-left">
              <button class="cds-check-circle ${isDone ? 'completed' : ''}" data-toggle-lesson="${les.id}" title="Mark as completed / uncompleted">
                ${iconSvg}
              </button>
              <div>
                <div class="cds-syllabus-item-title">${escapeHtml(les.title)}</div>
                <div class="cds-syllabus-item-meta">
                  ${typeLabel} • ${formatCourseraMin(les.durationSec)}
                  ${hasPdf ? ' • PDF Attachment' : ''}
                  ${hasVi ? ' • Subtitles: EN, VI' : ''}
                  ${prog?.currentTime > 5 && !isDone ? ` • Resumes at ${formatClock(prog.currentTime)}` : ''}
                </div>
              </div>
            </div>
            ${isNextUp ? `
              <button class="cds-btn-primary" data-open-lesson="${les.id}">
                ${prog?.currentTime > 5 ? 'Resume' : 'Start'}
              </button>
            ` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="cds-section-accordion">
          <div class="cds-section-header" data-toggle-sec="${sec.id}">
            <div class="cds-section-header-left">
              ${isCollapsed ? SVG.chevronRight : SVG.chevronDown}
              <span class="cds-section-title">${escapeHtml(sec.title)}</span>
            </div>
            <a href="${sec.folderUrl}" target="_blank" rel="noopener" style="font-size:13px; font-weight:600;" onclick="event.stopPropagation()">
              Drive Folder ↗
            </a>
          </div>
          ${!isCollapsed ? `<div class="cds-section-items">${itemsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    stageInner = `
      <div class="cds-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
          <h1 class="cds-module-card-title">Module ${activeMod.index}: ${escapeHtml(activeMod.title)}</h1>
          <span style="font-size:13.5px; font-weight:600; color:${mDone === mTotal ? 'var(--cds-green)' : 'var(--cds-text-secondary)'};">
            ${mDone}/${mTotal} completed
          </span>
        </div>

        <div class="cds-module-stats-bar">
          ${vCount > 0 ? `<span class="cds-stat-inline">${SVG.videoOutline} <span>${vCount} videos • Total ${formatCourseraMin(vSec)}</span></span>` : ''}
          ${rCount > 0 ? `<span class="cds-stat-inline">${SVG.bookOutline} <span>${rCount} readings • Total ${formatCourseraMin(rSec)}</span></span>` : ''}
        </div>

        <div>
          ${sectionsHtml}
        </div>
      </div>
    `;
  } else if (state.homeSubTab === 'grades') {
    stageInner = `
      <div class="cds-card">
        <h1 class="cds-module-card-title">Grades & Course Progress (${st.pct}%)</h1>
        <p style="color:var(--cds-text-secondary); margin-bottom:20px;">
          You have completed <strong>${st.completed}</strong> of <strong>${st.total}</strong> learning items in this course.
        </p>
        <div class="cds-downloads-list">
          ${course.modules.map(mod => {
            let mTotal = 0, mDone = 0;
            for (const sec of mod.sections) {
              for (const les of sec.lessons) {
                mTotal++;
                if (state.user.progress[les.id]?.status === 'completed') mDone++;
              }
            }
            const pct = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;
            return `
              <div class="cds-download-row" style="cursor:pointer;" data-select-mod="${mod.id}">
                <div>
                  <div style="font-weight:700; font-size:15.5px;">Module ${mod.index}: ${escapeHtml(mod.title)}</div>
                  <div style="font-size:13px; color:var(--cds-text-muted);">${mDone} of ${mTotal} items completed</div>
                </div>
                <strong style="color:${pct === 100 ? 'var(--cds-green)' : 'var(--cds-blue)'}; font-size:15px;">${pct}%</strong>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (state.homeSubTab === 'notes') {
    stageInner = `
      <div class="cds-card">
        <h1 class="cds-module-card-title">Course Notes (${courseNotes.length})</h1>
        ${courseNotes.length === 0
          ? `<div class="cds-empty-state">You haven't saved any notes in this course yet. Click "Save note" below any video or reading to add one.</div>`
          : `<div class="cds-downloads-list">
              ${courseNotes.map(n => {
                const ctx = findLessonContext(n.lessonId);
                return `
                  <div class="cds-download-row" style="cursor:pointer;" data-open-lesson="${n.lessonId}" data-seek="${n.timestampSec ?? ''}">
                    <div>
                      <div style="font-weight:700; color:var(--cds-blue); font-size:14px;">
                        ${ctx ? `${escapeHtml(ctx.lesson.title)}` : ''}
                        ${typeof n.timestampSec === 'number' ? ` (${formatClock(n.timestampSec)})` : ''}
                      </div>
                      <div style="margin-top:4px; white-space:pre-wrap;">${escapeHtml(n.content)}</div>
                    </div>
                    <span style="font-size:12.5px; color:var(--cds-text-muted);">${new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                `;
              }).join('')}
            </div>`
        }
      </div>
    `;
  } else if (state.homeSubTab === 'info') {
    stageInner = `
      <div class="cds-card">
        <h1 class="cds-module-card-title">${escapeHtml(course.title)}</h1>
        <p style="color:var(--cds-text-secondary); margin-bottom:20px;">${escapeHtml(course.description)}</p>
        <div class="cds-downloads-list">
          <div class="cds-download-row">
            <div>
              <strong>Google Drive Course Folder</strong>
              <div style="font-size:13px; color:var(--cds-text-muted);">Folder ID: <code>${course.id}</code></div>
            </div>
            <a class="cds-btn-outline" href="${course.folderUrl}" target="_blank" rel="noopener">Open in Google Drive ↗</a>
          </div>
        </div>
      </div>
    `;
  } else if (state.homeSubTab === 'specialization') {
    stageInner = `
      <div class="cds-card">
        <h1 class="cds-module-card-title">Certified Business Analysis Professional (CBAP) Specialization</h1>
        <p style="color:var(--cds-text-secondary); margin-bottom:20px;">Select any of the 4 courses in this Specialization:</p>
        <div class="cds-downloads-list">
          ${state.catalog.courses.map(c => {
            const cSt = getCourseStats(c);
            return `
              <div class="cds-download-row">
                <div style="max-width:600px;">
                  <div style="font-size:12px; font-weight:700; color:var(--cds-blue); text-transform:uppercase;">Course ${c.order} of 4 · ${escapeHtml(c.code)}</div>
                  <div style="font-size:17px; font-weight:700; margin:2px 0 4px;">${escapeHtml(c.title)}</div>
                  <div style="font-size:13.5px; color:var(--cds-text-secondary);">${escapeHtml(c.description)}</div>
                  <div style="font-size:13px; color:var(--cds-text-muted); margin-top:6px;">
                    ${c.modules.length} Modules • ${c.totalVideos} Videos • ${c.totalReadings} Readings • <strong>${cSt.completed}/${cSt.total} completed (${cSt.pct}%)</strong>
                  </div>
                </div>
                <div style="display:flex; gap:8px;">
                  <a class="cds-btn-outline" href="${c.folderUrl}" target="_blank" rel="noopener">Drive ↗</a>
                  <button class="cds-btn-primary" data-switch-course="${c.id}">Open Course</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  dashEl.innerHTML = `
    ${sidebarHtml}
    <main class="cds-home-stage">
      <div class="cds-home-container">
        ${stageInner}
      </div>
    </main>
  `;

  // Bind navigation events
  dashEl.querySelectorAll('[data-nav-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.homeSubTab = btn.getAttribute('data-nav-tab');
      renderCourseHome();
    });
  });

  dashEl.querySelectorAll('[data-select-mod]').forEach(el => {
    el.addEventListener('click', () => {
      state.activeModuleId = el.getAttribute('data-select-mod');
      state.homeSubTab = 'module';
      renderCourseHome();
    });
  });

  dashEl.querySelectorAll('[data-switch-course]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cId = btn.getAttribute('data-switch-course');
      openCourseHome(cId, null, 'module');
    });
  });

  dashEl.querySelectorAll('[data-toggle-sec]').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const sId = hdr.getAttribute('data-toggle-sec');
      if (state.collapsedSections.has(sId)) state.collapsedSections.delete(sId);
      else state.collapsedSections.add(sId);
      renderCourseHome();
    });
  });

  dashEl.querySelectorAll('[data-toggle-lesson]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const lId = btn.getAttribute('data-toggle-lesson');
      await toggleLessonCompleted(lId);
      renderCourseHome();
    });
  });

  dashEl.querySelectorAll('[data-open-lesson]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const lId = el.getAttribute('data-open-lesson');
      const seekStr = el.getAttribute('data-seek');
      const seek = seekStr ? parseFloat(seekStr) : null;
      openLecture(course.id, lId, seek);
    });
  });
}

// ── VIEW 2: COURSERA LECTURE / READING VIEW ──────────────────
function renderLectureSidebar(ctx) {
  const { course, module: currentMod } = ctx;
  const scrollEl = document.getElementById('sidebarCurriculum');

  // Show all modules in the course, with sections & items formatted like Coursera's drawer
  let html = '';
  for (const mod of course.modules) {
    for (const sec of mod.sections) {
      const headerTitle = mod.sections.length > 1
        ? `Module ${mod.index}: ${sec.title}`
        : `Module ${mod.index}: ${mod.title}`;

      const itemsHtml = sec.lessons.map(les => {
        const isDone = state.user.progress[les.id]?.status === 'completed';
        const isActive = state.activeLessonId === les.id;
        const typePrefix = les.type === 'video' ? 'Video:' : 'Reading:';
        const iconSvg = isDone ? SVG.check : (les.type === 'video' ? SVG.play : SVG.reading);

        return `
          <div class="cds-drawer-item ${isActive ? 'active' : ''}" data-drawer-lesson="${les.id}">
            <button class="cds-check-circle ${isDone ? 'completed' : ''}" data-drawer-toggle="${les.id}" title="Mark as completed">
              ${iconSvg}
            </button>
            <div class="cds-drawer-item-text">
              <div class="cds-drawer-item-line1">
                <strong>${typePrefix}</strong> ${escapeHtml(les.title)}
              </div>
              <div class="cds-drawer-item-line2">
                ${formatCourseraMin(les.durationSec)}
                ${les.pdfs?.length ? ' • PDF' : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      html += `
        <div class="cds-drawer-section-header">${escapeHtml(headerTitle)}</div>
        ${itemsHtml}
      `;
    }
  }

  scrollEl.innerHTML = html;

  scrollEl.querySelectorAll('[data-drawer-toggle]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const lId = btn.getAttribute('data-drawer-toggle');
      await toggleLessonCompleted(lId);
    });
  });

  scrollEl.querySelectorAll('[data-drawer-lesson]').forEach(row => {
    row.addEventListener('click', () => {
      selectLesson(row.getAttribute('data-drawer-lesson'));
    });
  });
}

async function toggleLessonCompleted(lessonId, forceCompleted = null) {
  const ctx = findLessonContext(lessonId);
  if (!ctx) return;

  const prev = state.user.progress[lessonId];
  const nextStatus = forceCompleted !== null
    ? (forceCompleted ? 'completed' : 'not_started')
    : (prev?.status === 'completed' ? 'not_started' : 'completed');

  const res = await apiPost('/api/progress', {
    lessonId,
    courseId: ctx.course.id,
    status: nextStatus,
    currentTime: prev?.currentTime || 0,
    duration: ctx.lesson.durationSec || 0
  });

  state.user.progress[lessonId] = res.progress;
  renderHeader();

  if (state.currentView === 'lecture') {
    const activeCtx = findLessonContext(state.activeLessonId);
    if (activeCtx) renderLectureSidebar(activeCtx);
    updateCompleteButtonsUI();
  }
}

function updateCompleteButtonsUI() {
  if (!state.activeLessonId) return;
  const isDone = state.user.progress[state.activeLessonId]?.status === 'completed';
  document.querySelectorAll('[data-action="toggle-complete"]').forEach(btn => {
    btn.className = isDone ? 'cds-btn-completed' : 'cds-btn-outline';
    btn.innerHTML = isDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark as completed</span>`;
  });
}

async function selectLesson(lessonId, seekTime = null) {
  const ctx = findLessonContext(lessonId);
  if (!ctx) return;

  state.activeCourseId = ctx.course.id;
  state.activeModuleId = ctx.module.id;
  state.activeLessonId = lessonId;

  apiPost('/api/last-visited', { courseId: ctx.course.id, lessonId }).catch(() => {});
  state.user.lastVisited = { courseId: ctx.course.id, lessonId };

  renderLectureSidebar(ctx);
  renderLectureBreadcrumbBar(ctx);

  // Scroll sidebar item into view ONLY within the sidebar scroll container
  const sbScroll = document.getElementById('sidebarCurriculum');
  const activeDrawerItem = sbScroll?.querySelector(`.cds-drawer-item[data-drawer-lesson="${lessonId}"]`);
  if (sbScroll && activeDrawerItem) {
    const targetTop = activeDrawerItem.offsetTop - sbScroll.clientHeight / 2 + 24;
    sbScroll.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }

  // Always scroll the main lecture stage back to the very top when opening a lesson
  const mainStage = document.getElementById('lessonStage');
  if (mainStage) mainStage.scrollTop = 0;

  const container = document.getElementById('lessonContainer');
  container.innerHTML = `<div class="cds-empty-state">Loading lesson from Google Drive...</div>`;

  try {
    const contentData = await apiGet(`/api/lesson/${encodeURIComponent(lessonId)}/content`);
    state.currentLessonData = contentData;
    renderLectureContent(ctx, contentData, seekTime);
  } catch (err) {
    container.innerHTML = `<div class="cds-empty-state">Error loading lesson: ${escapeHtml(err.message)}</div>`;
  }
}

function renderLectureBreadcrumbBar(ctx) {
  const { course, module: mod, lesson, prevLesson, nextLesson } = ctx;

  const bcEl = document.getElementById('classroomBreadcrumb');
  bcEl.innerHTML = `
    <span class="cds-bc-link" id="bcCourse">${escapeHtml(course.shortTitle)}</span>
    <span>›</span>
    <span class="cds-bc-link" id="bcModule">Module ${mod.index}</span>
    <span>›</span>
    <span style="color:var(--cds-text-primary); font-weight:600;">${escapeHtml(lesson.title)}</span>
  `;

  document.getElementById('bcCourse')?.addEventListener('click', () => openCourseHome(course.id, mod.id, 'module'));
  document.getElementById('bcModule')?.addEventListener('click', () => openCourseHome(course.id, mod.id, 'module'));

  const navEl = document.getElementById('classroomPrevNext');
  navEl.innerHTML = `
    <button class="cds-prev-next-link" id="btnPrevItem" ${!prevLesson ? 'disabled' : ''}>
      ‹ Previous
    </button>
    <button class="cds-prev-next-link" id="btnNextItem" ${!nextLesson ? 'disabled' : ''}>
      Next ›
    </button>
  `;

  document.getElementById('btnPrevItem')?.addEventListener('click', () => {
    if (prevLesson) selectLesson(prevLesson.id);
  });
  document.getElementById('btnNextItem')?.addEventListener('click', () => {
    if (nextLesson) selectLesson(nextLesson.id);
  });
}

function renderLectureContent(ctx, contentData, seekTime = null) {
  const { lesson } = ctx;
  const container = document.getElementById('lessonContainer');

  if (lesson.type === 'video' && lesson.video) {
    container.innerHTML = buildVideoLectureHtml(ctx, contentData);
    setupVideoLectureEvents(ctx, contentData, seekTime);
  } else {
    container.innerHTML = buildReadingLectureHtml(ctx, contentData);
    setupReadingLectureEvents(ctx, contentData);
  }

  container.querySelectorAll('[data-action="toggle-complete"]').forEach(btn => {
    btn.addEventListener('click', () => toggleLessonCompleted(lesson.id));
  });
}

// ── Video Lecture View (Player at Top -> Title Below -> Paragraph Transcript) ──
function buildVideoLectureHtml(ctx, contentData) {
  const { lesson } = ctx;
  const prefs = state.user.preferences;
  const isDone = state.user.progress[lesson.id]?.status === 'completed';
  const hasVi = Boolean(lesson.subtitles?.vi && contentData.cuesVi?.length > 0);
  const subLang = (!hasVi && (prefs.subtitleLang === 'vi' || prefs.subtitleLang === 'dual')) ? 'en' : prefs.subtitleLang;
  const notesCount = state.user.notes.filter(n => n.lessonId === lesson.id).length;

  const playerInner = prefs.playerMode === 'iframe'
    ? `<iframe src="${lesson.video.previewUrl}" allow="autoplay; fullscreen"></iframe>`
    : `
      <div id="videoLoadingOverlay" class="cds-video-loading ${contentData.videoCached ? 'hidden' : ''}">
        <div class="cds-spinner"></div>
        <div style="font-weight:600;">Streaming video from Google Drive (${formatBytes(lesson.video.size)})...</div>
      </div>
      <video id="activeVideoPlayer" controls preload="auto" src="/api/drive/media/${lesson.video.id}">
        ${lesson.subtitles?.en ? `<track label="English" kind="subtitles" srclang="en" src="/api/drive/vtt/${lesson.subtitles.en.id}">` : ''}
        ${lesson.subtitles?.vi ? `<track label="Tiếng Việt" kind="subtitles" srclang="vi" src="/api/drive/vtt/${lesson.subtitles.vi.id}">` : ''}
      </video>
      <div id="customSubtitleOverlay" class="cds-subtitle-overlay"></div>
    `;

  return `
    <!-- 1. Video Player at the Top -->
    <div class="cds-player-box">
      ${playerInner}
    </div>

    <!-- 2. Video Title & Coursera Action Buttons Below Player -->
    <div class="cds-video-below-header">
      <h1 class="cds-lecture-h1">${escapeHtml(lesson.title)}</h1>
      <div class="cds-lecture-actions">
        <button class="cds-btn-outline" id="btnSaveVideoNote">
          ${SVG.note}
          <span>Save note</span>
        </button>
        <button class="${isDone ? 'cds-btn-completed' : 'cds-btn-outline'}" data-action="toggle-complete">
          ${isDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark as completed</span>`}
        </button>
      </div>
    </div>

    <!-- 3. Coursera Underline Tabs + Compact Controls -->
    <div class="cds-underline-tabs-bar">
      <div class="cds-tabs-left">
        <button class="cds-u-tab ${state.activeVideoTab === 'transcript' ? 'active' : ''}" data-vtab="transcript">
          Transcript
        </button>
        <button class="cds-u-tab ${state.activeVideoTab === 'notes' ? 'active' : ''}" data-vtab="notes">
          Notes (${notesCount})
        </button>
        <button class="cds-u-tab ${state.activeVideoTab === 'downloads' ? 'active' : ''}" data-vtab="downloads">
          Downloads & Drive
        </button>
      </div>

      <div class="cds-tabs-right-controls">
        <select id="selectSubtitleLang" class="cds-select-sm" title="Transcript & Subtitle language">
          <option value="en" ${subLang === 'en' ? 'selected' : ''}>English</option>
          ${hasVi ? `<option value="vi" ${subLang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>` : ''}
          ${hasVi ? `<option value="dual" ${subLang === 'dual' ? 'selected' : ''}>Bilingual (EN + VI)</option>` : ''}
          <option value="off" ${subLang === 'off' ? 'selected' : ''}>Subtitles Off</option>
        </select>

        <select id="selectPlaybackRate" class="cds-select-sm" title="Playback Speed">
          ${[0.75, 1, 1.25, 1.5, 1.75, 2].map(r => `<option value="${r}" ${Number(prefs.playbackRate) === r ? 'selected' : ''}>${r}x</option>`).join('')}
        </select>

        <select id="selectPlayerMode" class="cds-select-sm" title="Video Stream Source">
          <option value="html5" ${prefs.playerMode === 'html5' ? 'selected' : ''}>HTML5 Stream (.mp4)</option>
          <option value="iframe" ${prefs.playerMode === 'iframe' ? 'selected' : ''}>Google Drive Embed</option>
        </select>
      </div>
    </div>

    <!-- Tab 1: Paragraph-Grouped Interactive Transcript -->
    <div id="tabBodyTranscript" class="${state.activeVideoTab === 'transcript' ? '' : 'hidden'}">
      <div class="cds-transcript-controls">
        <input type="text" id="inputTranscriptFilter" class="cds-transcript-search-input" placeholder="Search in transcript..." value="${escapeHtml(state.transcriptFilterText)}" />
        <a href="${lesson.folderUrl}" target="_blank" rel="noopener" style="font-size:13px; font-weight:600;">
          Google Drive Folder ↗
        </a>
      </div>
      <div id="transcriptParagraphs" class="cds-transcript-paragraphs"></div>
    </div>

    <!-- Tab 2: Notes -->
    <div id="tabBodyNotes" class="${state.activeVideoTab === 'notes' ? '' : 'hidden'}">
      ${buildNotesPanelHtml(ctx)}
    </div>

    <!-- Tab 3: Downloads & Drive Links -->
    <div id="tabBodyDownloads" class="${state.activeVideoTab === 'downloads' ? '' : 'hidden'}">
      ${buildDownloadsTableHtml(ctx)}
    </div>
  `;
}

// Group individual SRT cues into natural Coursera-style paragraphs (~4 sentences per block)
function renderCourseraParagraphTranscript(ctx, contentData) {
  const wrapEl = document.getElementById('transcriptParagraphs');
  if (!wrapEl) return;

  const cuesEn = contentData.cuesEn || [];
  const cuesVi = contentData.cuesVi || [];
  const baseCues = cuesEn.length > 0 ? cuesEn : cuesVi;
  const filter = (state.transcriptFilterText || '').trim().toLowerCase();
  const subLang = state.user.preferences.subtitleLang;

  if (baseCues.length === 0) {
    wrapEl.innerHTML = `<div class="cds-empty-state">No transcript available for this video.</div>`;
    return;
  }

  // Group every 4 cues (or on sentence end after ~18 seconds) into a paragraph block
  const paragraphs = [];
  let currentPara = null;

  for (let i = 0; i < baseCues.length; i++) {
    const cEn = cuesEn[i];
    let cVi = cuesVi[i];
    if (cEn && cuesVi.length > 0 && (!cVi || Math.abs(cVi.start - cEn.start) > 2.5)) {
      cVi = cuesVi.find(v => Math.abs(v.start - cEn.start) <= 2.0) || null;
    }

    const enText = cEn ? cEn.text : '';
    const viText = cVi ? cVi.text : '';
    if (filter && !enText.toLowerCase().includes(filter) && !viText.toLowerCase().includes(filter)) {
      continue;
    }

    const cueItem = {
      start: (cEn || cVi).start,
      end: (cEn || cVi).end,
      timeStr: formatClock((cEn || cVi).start),
      enText,
      viText
    };

    if (!currentPara) {
      currentPara = { start: cueItem.start, timeStr: cueItem.timeStr, phrases: [cueItem] };
      paragraphs.push(currentPara);
    } else {
      currentPara.phrases.push(cueItem);
      const endsSentence = /[.?!]$/.test(enText || viText);
      if (currentPara.phrases.length >= 5 || (currentPara.phrases.length >= 3 && endsSentence)) {
        currentPara = null;
      }
    }
  }

  if (paragraphs.length === 0) {
    wrapEl.innerHTML = `<div class="cds-empty-state">No matching transcript lines found.</div>`;
    return;
  }

  wrapEl.innerHTML = paragraphs.map(p => {
    const phrasesHtml = p.phrases.map(ph => {
      const displayMain = (subLang === 'vi' && ph.viText) ? ph.viText : (ph.enText || ph.viText);
      const displaySub = (subLang === 'dual' && ph.viText) ? `<span class="cds-phrase-vi">${escapeHtml(ph.viText)}</span>` : '';
      return `<span class="cds-phrase" data-start="${ph.start}" data-end="${ph.end}">${escapeHtml(displayMain)} ${displaySub}</span>`;
    }).join(' ');

    return `
      <div class="cds-para-block">
        <span class="cds-para-time" data-seek-time="${p.start}">${p.timeStr}</span>
        <div class="cds-para-text">${phrasesHtml}</div>
      </div>
    `;
  }).join('');

  wrapEl.querySelectorAll('.cds-phrase').forEach(span => {
    span.addEventListener('click', () => {
      const s = parseFloat(span.getAttribute('data-start'));
      const v = document.getElementById('activeVideoPlayer');
      if (v) {
        v.currentTime = s;
        v.play().catch(() => {});
      }
    });
  });

  wrapEl.querySelectorAll('[data-seek-time]').forEach(t => {
    t.addEventListener('click', () => {
      const s = parseFloat(t.getAttribute('data-seek-time'));
      const v = document.getElementById('activeVideoPlayer');
      if (v) {
        v.currentTime = s;
        v.play().catch(() => {});
      }
    });
  });
}

function setupVideoLectureEvents(ctx, contentData, seekTime = null) {
  const { course, lesson, nextLesson } = ctx;

  renderCourseraParagraphTranscript(ctx, contentData);
  setupNotesEvents(ctx);

  // Switch tabs
  document.querySelectorAll('[data-vtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeVideoTab = btn.getAttribute('data-vtab');
      document.querySelectorAll('[data-vtab]').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('tabBodyTranscript')?.classList.toggle('hidden', state.activeVideoTab !== 'transcript');
      document.getElementById('tabBodyNotes')?.classList.toggle('hidden', state.activeVideoTab !== 'notes');
      document.getElementById('tabBodyDownloads')?.classList.toggle('hidden', state.activeVideoTab !== 'downloads');
    });
  });

  // Save note button opens Notes tab & focuses textarea
  document.getElementById('btnSaveVideoNote')?.addEventListener('click', () => {
    const notesTab = document.querySelector('[data-vtab="notes"]');
    if (notesTab) notesTab.click();
    const input = document.getElementById('noteInput');
    if (input) input.focus();
  });

  // Dropdowns
  const subSelect = document.getElementById('selectSubtitleLang');
  if (subSelect) {
    subSelect.addEventListener('change', async () => {
      state.user.preferences.subtitleLang = subSelect.value;
      await apiPost('/api/preferences', { subtitleLang: subSelect.value });
      renderCourseraParagraphTranscript(ctx, contentData);
    });
  }

  const rateSelect = document.getElementById('selectPlaybackRate');
  const videoEl = document.getElementById('activeVideoPlayer');
  if (rateSelect) {
    rateSelect.addEventListener('change', async () => {
      const rate = parseFloat(rateSelect.value);
      state.user.preferences.playbackRate = rate;
      if (videoEl) videoEl.playbackRate = rate;
      await apiPost('/api/preferences', { playbackRate: rate });
    });
  }

  const modeSelect = document.getElementById('selectPlayerMode');
  if (modeSelect) {
    modeSelect.addEventListener('change', async () => {
      state.user.preferences.playerMode = modeSelect.value;
      await apiPost('/api/preferences', { playerMode: modeSelect.value });
      renderLectureContent(ctx, contentData);
    });
  }

  const filterInput = document.getElementById('inputTranscriptFilter');
  if (filterInput) {
    filterInput.addEventListener('input', () => {
      state.transcriptFilterText = filterInput.value;
      renderCourseraParagraphTranscript(ctx, contentData);
    });
  }

  if (!videoEl) return;

  const overlayEl = document.getElementById('videoLoadingOverlay');
  const subOverlayEl = document.getElementById('customSubtitleOverlay');
  const hideLoading = () => overlayEl?.classList.add('hidden');

  videoEl.addEventListener('loadedmetadata', () => {
    hideLoading();
    videoEl.playbackRate = Number(state.user.preferences.playbackRate) || 1;

    const savedProg = state.user.progress[lesson.id];
    if (typeof seekTime === 'number' && seekTime > 0) {
      videoEl.currentTime = seekTime;
      videoEl.play().catch(() => {});
    } else if (savedProg?.currentTime > 3 && savedProg?.status !== 'completed' && savedProg.currentTime < videoEl.duration - 5) {
      videoEl.currentTime = savedProg.currentTime;
    }

    if (nextLesson?.video?.id) {
      apiPost(`/api/drive/prefetch/${nextLesson.video.id}`).catch(() => {});
    }
  });

  videoEl.addEventListener('canplay', hideLoading);

  let lastSavedSec = -1;

  videoEl.addEventListener('timeupdate', () => {
    const cur = videoEl.currentTime;
    const hasVi = Boolean(lesson.subtitles?.vi && contentData.cuesVi?.length > 0);
    const subLang = (!hasVi && (state.user.preferences.subtitleLang === 'vi' || state.user.preferences.subtitleLang === 'dual'))
      ? 'en'
      : state.user.preferences.subtitleLang;

    const cueEn = (contentData.cuesEn || []).find(c => cur >= c.start && cur <= c.end);
    const cueVi = (contentData.cuesVi || []).find(c => cur >= c.start && cur <= c.end);

    if (subOverlayEl) {
      if (subLang === 'off') {
        subOverlayEl.innerHTML = '';
      } else if (subLang === 'en' && cueEn) {
        subOverlayEl.innerHTML = `<div class="cds-sub-en">${escapeHtml(cueEn.text)}</div>`;
      } else if (subLang === 'vi' && cueVi) {
        subOverlayEl.innerHTML = `<div class="cds-sub-vi">${escapeHtml(cueVi.text)}</div>`;
      } else if (subLang === 'dual' && (cueEn || cueVi)) {
        subOverlayEl.innerHTML = `
          ${cueEn ? `<div class="cds-sub-en">${escapeHtml(cueEn.text)}</div>` : ''}
          ${cueVi ? `<div class="cds-sub-vi">${escapeHtml(cueVi.text)}</div>` : ''}
        `;
      } else {
        subOverlayEl.innerHTML = '';
      }
    }

    // Highlight active phrase in transcript WITHOUT scrolling the page away from the video!
    document.querySelectorAll('#transcriptParagraphs .cds-phrase').forEach(ph => {
      const s = parseFloat(ph.getAttribute('data-start'));
      const e = parseFloat(ph.getAttribute('data-end'));
      if (cur >= s && cur <= e) {
        ph.classList.add('active');
      } else {
        ph.classList.remove('active');
      }
    });

    const roundedSec = Math.floor(cur);
    if (roundedSec > 0 && Math.abs(roundedSec - lastSavedSec) >= 5) {
      lastSavedSec = roundedSec;
      const existing = state.user.progress[lesson.id];
      const isAlmostDone = videoEl.duration > 0 && cur / videoEl.duration >= 0.92;
      const nextStatus = (existing?.status === 'completed' || isAlmostDone) ? 'completed' : 'in_progress';

      apiPost('/api/progress', {
        lessonId: lesson.id,
        courseId: course.id,
        status: nextStatus,
        currentTime: roundedSec,
        duration: Math.round(videoEl.duration || lesson.durationSec || 0)
      }).then(res => {
        const prevStatus = state.user.progress[lesson.id]?.status;
        state.user.progress[lesson.id] = res.progress;
        if (prevStatus !== res.progress.status) {
          renderHeader();
          renderLectureSidebar(ctx);
          updateCompleteButtonsUI();
        }
      }).catch(() => {});
    }
  });

  videoEl.addEventListener('ended', async () => {
    await toggleLessonCompleted(lesson.id, true);
  });
}

// ── Reading / Supplement View ────────────────────────────────
function buildReadingLectureHtml(ctx, contentData) {
  const { lesson, nextLesson } = ctx;
  const isDone = state.user.progress[lesson.id]?.status === 'completed';

  const pdfBlocks = (lesson.pdfs || []).map(pdf => {
    const src = state.pdfPreviewMode === 'gdrive' ? pdf.previewUrl : `/api/drive/media/${pdf.id}`;
    return `
      <div class="cds-pdf-embed-card">
        <div class="cds-pdf-embed-bar">
          <div>
            <strong>${escapeHtml(pdf.name)}</strong>
            <span style="font-size:12.5px; color:var(--cds-text-muted); margin-left:8px;">(${formatBytes(pdf.size)})</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <select id="selectPdfMode" class="cds-select-sm">
              <option value="proxy" ${state.pdfPreviewMode === 'proxy' ? 'selected' : ''}>Direct PDF Viewer</option>
              <option value="gdrive" ${state.pdfPreviewMode === 'gdrive' ? 'selected' : ''}>Google Drive Preview</option>
            </select>
            <a class="cds-btn-outline" href="/api/drive/media/${pdf.id}" download="${escapeHtml(pdf.name)}">Download</a>
            <a class="cds-btn-outline" href="${pdf.viewUrl}" target="_blank" rel="noopener">Google Drive ↗</a>
          </div>
        </div>
        <iframe class="cds-pdf-iframe" src="${src}"></iframe>
      </div>
    `;
  }).join('');

  return `
    <div class="cds-reading-container">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
        <h1 class="cds-lecture-h1">${escapeHtml(lesson.title)}</h1>
        <a class="cds-btn-outline" href="${lesson.instructions?.viewUrl || lesson.folderUrl}" target="_blank" rel="noopener">
          Google Drive Source ↗
        </a>
      </div>

      ${contentData.htmlContent ? `
        <div class="cds-reading-body">
          ${contentData.htmlContent}
        </div>
      ` : ''}

      ${pdfBlocks}

      <div class="cds-reading-bottom-bar">
        <button class="${isDone ? 'cds-btn-completed' : 'cds-btn-primary'}" data-action="toggle-complete">
          ${isDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark as completed</span>`}
        </button>
        ${nextLesson ? `
          <button class="cds-btn-outline" id="btnReadingNext">
            Go to next item ›
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function setupReadingLectureEvents(ctx, contentData) {
  const { nextLesson } = ctx;
  document.getElementById('selectPdfMode')?.addEventListener('change', (e) => {
    state.pdfPreviewMode = e.target.value;
    renderLectureContent(ctx, contentData);
  });
  document.getElementById('btnReadingNext')?.addEventListener('click', () => {
    if (nextLesson) selectLesson(nextLesson.id);
  });
}

// ── Notes & Downloads Builders ───────────────────────────────
function buildNotesPanelHtml(ctx) {
  const { lesson } = ctx;
  const notes = state.user.notes.filter(n => n.lessonId === lesson.id);

  return `
    <div style="max-width:720px;">
      <div style="margin-bottom:16px;">
        <textarea id="noteInput" placeholder="Add a note at the current video timestamp..." style="width:100%; min-height:80px; border:1px solid var(--cds-border); border-radius:4px; padding:10px; font-family:inherit; font-size:14.5px; margin-bottom:8px;"></textarea>
        <button class="cds-btn-primary" id="btnSaveNote">Save note</button>
      </div>
      <div id="lessonNotesList" class="cds-downloads-list">
        ${renderNotesRowsHtml(notes)}
      </div>
    </div>
  `;
}

function renderNotesRowsHtml(notes) {
  if (!notes || notes.length === 0) {
    return `<div class="cds-empty-state">No notes saved for this lesson yet.</div>`;
  }
  return notes.map(n => `
    <div class="cds-download-row">
      <div>
        ${typeof n.timestampSec === 'number' ? `<button class="cds-btn-outline" data-seek="${n.timestampSec}" style="padding:2px 8px; font-size:12px; margin-bottom:4px;">▶ ${formatClock(n.timestampSec)}</button>` : ''}
        <div style="white-space:pre-wrap;">${escapeHtml(n.content)}</div>
      </div>
      <button class="cds-icon-close" data-delete-note="${n.id}" title="Delete note">✕</button>
    </div>
  `).join('');
}

function setupNotesEvents(ctx) {
  const { course, lesson } = ctx;
  const btnSave = document.getElementById('btnSaveNote');
  const noteInput = document.getElementById('noteInput');

  if (btnSave && noteInput) {
    btnSave.addEventListener('click', async () => {
      const content = noteInput.value.trim();
      if (!content) return;
      const v = document.getElementById('activeVideoPlayer');
      const timestampSec = (lesson.type === 'video' && v) ? Math.round(v.currentTime) : null;

      const res = await apiPost('/api/notes', {
        lessonId: lesson.id,
        courseId: course.id,
        timestampSec,
        content
      });
      state.user.notes = res.notes;
      noteInput.value = '';
      renderHeader();

      const listEl = document.getElementById('lessonNotesList');
      if (listEl) {
        listEl.innerHTML = renderNotesRowsHtml(state.user.notes.filter(n => n.lessonId === lesson.id));
        bindNoteActions();
      }
    });
  }
  bindNoteActions();
}

function bindNoteActions() {
  document.querySelectorAll('[data-seek]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseFloat(btn.getAttribute('data-seek'));
      const v = document.getElementById('activeVideoPlayer');
      if (v) {
        v.currentTime = sec;
        v.play().catch(() => {});
      }
    });
  });

  document.querySelectorAll('[data-delete-note]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-note');
      const res = await apiDelete(`/api/notes/${id}`);
      state.user.notes = res.notes;
      renderHeader();
      const listEl = document.getElementById('lessonNotesList');
      if (listEl && state.activeLessonId) {
        listEl.innerHTML = renderNotesRowsHtml(state.user.notes.filter(n => n.lessonId === state.activeLessonId));
        bindNoteActions();
      }
    });
  });
}

function buildDownloadsTableHtml(ctx) {
  const { lesson } = ctx;
  const rows = [];

  if (lesson.video) {
    rows.push(`
      <div class="cds-download-row">
        <div>
          <strong>Lecture Video (MP4)</strong>
          <div style="font-size:13px; color:var(--cds-text-muted);">${escapeHtml(lesson.video.name)} • ${formatBytes(lesson.video.size)} • Drive ID: <code>${lesson.video.id}</code></div>
        </div>
        <div style="display:flex; gap:8px;">
          <a class="cds-btn-outline" href="/api/drive/media/${lesson.video.id}" download="${escapeHtml(lesson.video.name)}">Download MP4</a>
          <a class="cds-btn-outline" href="${lesson.video.viewUrl}" target="_blank" rel="noopener">Open in Drive ↗</a>
        </div>
      </div>
    `);
  }

  if (lesson.subtitles?.en) {
    rows.push(`
      <div class="cds-download-row">
        <div>
          <strong>English Subtitles (.en.srt)</strong>
          <div style="font-size:13px; color:var(--cds-text-muted);">Drive ID: <code>${lesson.subtitles.en.id}</code></div>
        </div>
        <a class="cds-btn-outline" href="${lesson.subtitles.en.viewUrl}" target="_blank" rel="noopener">Open in Drive ↗</a>
      </div>
    `);
  }

  if (lesson.subtitles?.vi) {
    rows.push(`
      <div class="cds-download-row">
        <div>
          <strong>Vietnamese Subtitles (.vi.srt)</strong>
          <div style="font-size:13px; color:var(--cds-text-muted);">Drive ID: <code>${lesson.subtitles.vi.id}</code></div>
        </div>
        <a class="cds-btn-outline" href="${lesson.subtitles.vi.viewUrl}" target="_blank" rel="noopener">Open in Drive ↗</a>
      </div>
    `);
  }

  rows.push(`
    <div class="cds-download-row">
      <div>
        <strong>Google Drive Lesson Folder</strong>
        <div style="font-size:13px; color:var(--cds-text-muted);">Folder ID: <code>${lesson.folderId}</code></div>
      </div>
      <a class="cds-btn-outline" href="${lesson.folderUrl}" target="_blank" rel="noopener">Open Folder in Drive ↗</a>
    </div>
  `);

  return `<div class="cds-downloads-list">${rows.join('')}</div>`;
}

// ── Modals (Search & All Notes) ──────────────────────────────
function setupModals() {
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');
  const courseSelect = document.getElementById('searchCourseFilter');
  const resultsEl = document.getElementById('searchResultsContainer');

  const openSearch = () => {
    searchModal.classList.remove('hidden');
    searchInput.focus();
    searchInput.select();
  };
  const closeSearch = () => searchModal.classList.add('hidden');

  document.getElementById('btnOpenSearch')?.addEventListener('click', openSearch);
  document.getElementById('btnCloseSearch')?.addEventListener('click', closeSearch);
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
      document.getElementById('notesModal')?.classList.add('hidden');
    }
  });

  let timer = null;
  const runSearch = () => {
    clearTimeout(timer);
    const q = searchInput.value.trim();
    const cId = courseSelect.value;
    if (q.length < 2) {
      resultsEl.innerHTML = `<div class="cds-empty-state">Type at least 2 characters to search across lesson titles, reading materials (.html), and video subtitles (.srt).</div>`;
      return;
    }
    timer = setTimeout(async () => {
      resultsEl.innerHTML = `<div class="cds-empty-state">Searching...</div>`;
      const data = await apiGet(`/api/search?q=${encodeURIComponent(q)}&courseId=${encodeURIComponent(cId)}`);
      if (!data.results || data.results.length === 0) {
        resultsEl.innerHTML = `<div class="cds-empty-state">No results found for "${escapeHtml(q)}".</div>`;
        return;
      }
      const safeQ = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hl = (t) => escapeHtml(t).replace(new RegExp(`(${safeQ})`, 'gi'), '<mark>$1</mark>');

      resultsEl.innerHTML = data.results.map(r => `
        <div class="cds-search-result-item" data-res-course="${r.courseId}" data-res-lesson="${r.lessonId}">
          <div style="font-size:12px; font-weight:700; color:var(--cds-blue);">${escapeHtml(r.courseShortTitle)} › ${escapeHtml(r.moduleTitle)}</div>
          <div style="font-size:15.5px; font-weight:700; margin-top:2px;">${hl(r.lessonTitle)}</div>
          ${(r.matches || []).map(m => `
            <div class="cds-search-snippet" data-seek-sec="${m.timestampSec !== null ? m.timestampSec : ''}">
              <strong>${m.timeStr ? `${m.timeStr}:` : 'Reading:'}</strong> ${hl(m.snippet)}
            </div>
          `).join('')}
        </div>
      `).join('');

      resultsEl.querySelectorAll('.cds-search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const cId = item.getAttribute('data-res-course');
          const lId = item.getAttribute('data-res-lesson');
          const snip = e.target.closest('[data-seek-sec]');
          const seekStr = snip ? snip.getAttribute('data-seek-sec') : '';
          closeSearch();
          openLecture(cId, lId, seekStr ? parseFloat(seekStr) : null);
        });
      });
    }, 180);
  };

  searchInput.addEventListener('input', runSearch);
  courseSelect.addEventListener('change', runSearch);

  // Notes Modal
  const notesModal = document.getElementById('notesModal');
  const notesBody = document.getElementById('allNotesContainer');
  document.getElementById('btnOpenAllNotes')?.addEventListener('click', () => {
    notesModal.classList.remove('hidden');
    if (state.user.notes.length === 0) {
      notesBody.innerHTML = `<div class="cds-empty-state">No notes saved yet.</div>`;
      return;
    }
    notesBody.innerHTML = state.user.notes.map(n => {
      const ctx = findLessonContext(n.lessonId);
      return `
        <div class="cds-search-result-item" data-note-course="${n.courseId}" data-note-lesson="${n.lessonId}" data-note-sec="${n.timestampSec ?? ''}">
          <div style="font-size:13px; font-weight:700; color:var(--cds-blue);">
            ${ctx ? `${escapeHtml(ctx.course.code)} · ${escapeHtml(ctx.lesson.title)}` : ''}
            ${typeof n.timestampSec === 'number' ? ` (${formatClock(n.timestampSec)})` : ''}
          </div>
          <div style="margin-top:4px; white-space:pre-wrap;">${escapeHtml(n.content)}</div>
        </div>
      `;
    }).join('');

    notesBody.querySelectorAll('[data-note-lesson]').forEach(el => {
      el.addEventListener('click', () => {
        const cId = el.getAttribute('data-note-course');
        const lId = el.getAttribute('data-note-lesson');
        const sec = el.getAttribute('data-note-sec');
        notesModal.classList.add('hidden');
        openLecture(cId, lId, sec ? parseFloat(sec) : null);
      });
    });
  });

  document.getElementById('btnCloseNotes')?.addEventListener('click', () => notesModal.classList.add('hidden'));
  notesModal.addEventListener('click', (e) => {
    if (e.target === notesModal) notesModal.classList.add('hidden');
  });

  // ── Profile Modal: Gợi ý lộ trình học & Get khóa học ─────────
  const profileModal = document.getElementById('profileModal');
  const profileBody = document.getElementById('profileModalBody');
  let activeProfileTab = 'roadmap'; // 'roadmap' | 'crawler'
  let roadmapDataCache = null;
  let lastCheckResult = null;
  let pendingCheckUrl = '';
  let crawlPollTimer = null;

  function isCourseInCatalog(urlOrSlug) {
    if (!state.catalog?.courses || !urlOrSlug) return null;
    const str = String(urlOrSlug).toLowerCase();
    if (str.includes('certified-business-analysis-professional-cbap')) {
      return state.catalog.courses[0] || null;
    }
    const slugMatch = str.match(/\/learn\/([a-z0-9_-]+)/);
    const slug = slugMatch ? slugMatch[1] : str.replace(/^coursera-learn-/, '');
    return state.catalog.courses.find(
      c => c.slug === slug || c.slug === `coursera-learn-${slug}` || c.slug.endsWith(slug)
    ) || null;
  }

  async function loadProfileData() {
    const data = await apiGet('/api/roadmap');
    roadmapDataCache = data;
    const accEl = document.getElementById('profileDriveAccountText');
    if (accEl && data.storage?.account) {
      accEl.innerHTML = `Drive lưu trữ: <strong>${escapeHtml(data.storage.account)}</strong> · <a href="${escapeHtml(data.storage.storageRootFolderUrl || '#')}" target="_blank" rel="noopener" style="color:var(--cds-blue); text-decoration:none; font-weight:600;">Mở thư mục gốc ↗</a>`;
    }
    return data;
  }

  function startCrawlPolling() {
    if (crawlPollTimer) clearInterval(crawlPollTimer);
    crawlPollTimer = setInterval(async () => {
      try {
        const st = await apiGet('/api/coursera/status');
        if (roadmapDataCache) {
          roadmapDataCache.crawlJob = st.job;
          roadmapDataCache.uncrawlableCourses = st.uncrawlableCourses;
        }
        if (!profileModal.classList.contains('hidden') && activeProfileTab === 'crawler') {
          renderCrawlJobBox(st.job);
        }
        if (!st.job?.running) {
          clearInterval(crawlPollTimer);
          crawlPollTimer = null;
          // Reload catalog so newly imported course shows up immediately
          const catRes = await apiGet('/api/catalog');
          if (catRes.catalog) {
            state.catalog = catRes.catalog;
            renderHeader();
          }
          if (!profileModal.classList.contains('hidden')) {
            renderProfileBody();
          }
        }
      } catch (e) {
        clearInterval(crawlPollTimer);
        crawlPollTimer = null;
      }
    }, 2500);
  }

  function renderCrawlJobBox(job) {
    const box = document.getElementById('crawlJobStatusContainer');
    if (!box) return;
    if (!job || (!job.running && !job.finishedAt)) {
      box.innerHTML = '';
      return;
    }
    const pct = job.totalItems > 0 ? Math.min(100, Math.round((job.completedItems / job.totalItems) * 100)) : (job.running ? 10 : 100);
    const isErr = !!job.error;
    box.innerHTML = `
      <div class="cds-check-card ${isErr ? 'cds-check-card--fail' : 'cds-check-card--ok'}" style="margin-top:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div style="font-weight:700; font-size:14.5px;">
            ${job.running ? '⏳ Đang triển khai lấy khóa học về Drive...' : (isErr ? '⚠️ Tiến trình dừng do lỗi' : '✅ Đã lấy khóa học về Drive và đồng bộ hoàn tất!')}
          </div>
          <span style="font-size:13px; font-weight:700; color:var(--cds-blue);">${job.completedItems}/${job.totalItems || '?'} mục (${pct}%)</span>
        </div>
        <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:4px;">${escapeHtml(job.statusText || '')}</div>
        <div style="height:7px; background:#E5E7EB; border-radius:99px; overflow:hidden; margin-top:8px;">
          <div style="height:100%; width:${pct}%; background:${isErr ? '#D92D20' : 'var(--cds-blue)'}; transition:width 0.3s;"></div>
        </div>
        ${(job.logs && job.logs.length > 0) ? `
          <div style="margin-top:10px; max-height:110px; overflow-y:auto; background:#F8FAFC; border:1px solid var(--cds-border-light); border-radius:4px; padding:8px 10px; font-family:'JetBrains Mono', monospace; font-size:11.5px; color:#334155;">
            ${job.logs.slice(0, 12).map(l => `<div>${escapeHtml(l)}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderProfileBody() {
    if (!roadmapDataCache) {
      profileBody.innerHTML = `<div class="cds-empty-state">Đang tải dữ liệu hồ sơ...</div>`;
      return;
    }

    document.querySelectorAll('[data-profile-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-profile-tab') === activeProfileTab);
    });

    if (activeProfileTab === 'roadmap') {
      const stages = roadmapDataCache.stages || [];
      profileBody.innerHTML = `
        <div style="font-size:14px; color:var(--cds-text-secondary); line-height:1.55;">
          Lộ trình học tập cá nhân được gợi ý theo 3 giai đoạn từ <strong>Business Analyst (BA)</strong> → <strong>Project Manager (PM)</strong> → <strong>Digital Product Management (Product)</strong>. Bạn có thể bấm <em>"Kiểm tra / Lấy khóa này"</em> ở bất kỳ mục nào để chuyển sang trình lấy khóa học tự động.
        </div>
        ${stages.map(st => `
          <div class="cds-roadmap-stage">
            <div class="cds-roadmap-stage-head">
              <div class="cds-roadmap-stage-title">${escapeHtml(st.title)}</div>
              <span class="cds-roadmap-stage-badge">${escapeHtml(st.duration)}</span>
            </div>
            <div style="font-size:13.5px; color:var(--cds-text-secondary); margin-bottom:6px;">${escapeHtml(st.description)}</div>
            <div>
              ${(st.items || []).map(item => {
                const existingCourse = isCourseInCatalog(item.url);
                return `
                  <div class="cds-roadmap-item">
                    <div style="flex:1; min-width:0;">
                      <div style="font-weight:700; font-size:14.5px; color:var(--cds-text-primary);">
                        ${escapeHtml(item.title)}
                      </div>
                      <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:2px;">
                        <strong>${escapeHtml(item.provider)}</strong> · ${escapeHtml(item.duration)} · Mức: ${escapeHtml(item.level)}
                        · <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" style="color:var(--cds-blue); text-decoration:none;">Link Coursera ↗</a>
                      </div>
                      ${item.note ? `<div style="font-size:12.5px; color:#475467; margin-top:3px;">${escapeHtml(item.note)}</div>` : ''}
                    </div>
                    <div style="flex-shrink:0; display:flex; align-items:center; gap:8px;">
                      ${existingCourse ? `
                        <button class="cds-btn-outline-sm" type="button" data-open-existing-course="${existingCourse.id}" style="border-color:var(--cds-green); color:var(--cds-green);">
                          ✓ Đã có (Mở học)
                        </button>
                      ` : `
                        <button class="cds-btn-primary" type="button" data-quick-check-url="${escapeHtml(item.url)}" style="padding:6px 12px; font-size:12.5px;">
                          Kiểm tra / Lấy khóa này
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      `;

      profileBody.querySelectorAll('[data-open-existing-course]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cId = btn.getAttribute('data-open-existing-course');
          profileModal.classList.add('hidden');
          openCourseHome(cId, null, 'module');
        });
      });

      profileBody.querySelectorAll('[data-quick-check-url]').forEach(btn => {
        btn.addEventListener('click', () => {
          pendingCheckUrl = btn.getAttribute('data-quick-check-url') || '';
          activeProfileTab = 'crawler';
          renderProfileBody();
          triggerCheckCourseraUrl(pendingCheckUrl);
        });
      });
      return;
    }

    // Tab 2: Get khóa học (Coursera)
    const uncrawlable = roadmapDataCache.uncrawlableCourses || [];
    profileBody.innerHTML = `
      <div class="cds-crawler-box">
        <div style="font-weight:700; font-size:15px; color:var(--cds-text-primary);">
          Lấy khóa học từ Coursera về Google Drive (${escapeHtml(roadmapDataCache.storage?.account || 'duc.to.dev@gmail.com')})
        </div>
        <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:3px;">
          Quy trình: Dán link khóa học (<code>/learn/...</code>) hoặc chuyên ngành (<code>/specializations/...</code>, <code>/professional-certificates/...</code>) → Hệ thống kiểm tra khả năng crawl → Nếu lấy được sẽ cho phép triển khai đẩy thẳng về Drive; nếu bị khóa sẽ lưu vào bảng thông tin bên dưới.
        </div>
        <div class="cds-crawler-input-row">
          <input type="text" id="courseraUrlInput" class="cds-crawler-input" value="${escapeHtml(pendingCheckUrl)}" placeholder="Paste link khóa học Coursera (VD: https://www.coursera.org/learn/project-management-foundations)..." />
          <button class="cds-btn-primary" id="btnCheckCourseraUrl" type="button" style="padding:9px 18px;">Kiểm tra (Check)</button>
        </div>
        <div id="courseraCheckResultBox"></div>
        <div id="crawlJobStatusContainer"></div>
      </div>

      <div style="margin-top:6px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h4 style="margin:0; font-size:15px; font-weight:700;">Bảng thông tin các khóa học không thể lấy (${uncrawlable.length})</h4>
        </div>
        ${uncrawlable.length === 0 ? `
          <div style="border:1px solid var(--cds-border-light); border-radius:6px; padding:18px; text-align:center; font-size:13.5px; color:var(--cds-text-muted); background:#FFFFFF;">
            Chưa có khóa học nào bị lỗi hoặc từ chối quyền truy cập.
          </div>
        ` : `
          <div style="border:1px solid var(--cds-border-light); border-radius:6px; overflow:hidden; background:#FFFFFF;">
            <table class="cds-uncrawlable-table">
              <thead>
                <tr>
                  <th style="width:28%;">Khóa học / Slug</th>
                  <th style="width:45%;">Lý do không thể lấy</th>
                  <th style="width:17%;">Thời gian check</th>
                  <th style="width:10%;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${uncrawlable.map(u => `
                  <tr>
                    <td>
                      <div style="font-weight:700; color:var(--cds-text-primary);">${escapeHtml(u.title || u.slug)}</div>
                      <a href="${escapeHtml(u.url)}" target="_blank" rel="noopener" style="font-size:12px; color:var(--cds-blue); word-break:break-all;">${escapeHtml(u.url)}</a>
                    </td>
                    <td style="color:#B42318; font-weight:500;">${escapeHtml(u.reason)}</td>
                    <td style="font-size:12px; color:var(--cds-text-secondary);">${u.checkedAt ? new Date(u.checkedAt).toLocaleString('vi-VN') : ''}</td>
                    <td>
                      <button class="cds-btn-outline-sm" type="button" data-delete-uncrawl="${escapeHtml(u.id)}" style="padding:3px 8px; font-size:12px;">Xóa</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    renderCheckResultBox();
    renderCrawlJobBox(roadmapDataCache.crawlJob);
    if (roadmapDataCache.crawlJob?.running && !crawlPollTimer) {
      startCrawlPolling();
    }

    const inputEl = document.getElementById('courseraUrlInput');
    const btnCheck = document.getElementById('btnCheckCourseraUrl');
    btnCheck?.addEventListener('click', () => {
      pendingCheckUrl = inputEl?.value?.trim() || '';
      triggerCheckCourseraUrl(pendingCheckUrl);
    });
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        pendingCheckUrl = inputEl.value.trim();
        triggerCheckCourseraUrl(pendingCheckUrl);
      }
    });

    profileBody.querySelectorAll('[data-delete-uncrawl]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-delete-uncrawl');
        const res = await apiDelete(`/api/coursera/uncrawlable/${id}`);
        roadmapDataCache.uncrawlableCourses = res.uncrawlableCourses || [];
        renderProfileBody();
      });
    });
  }

  function renderCheckResultBox() {
    const box = document.getElementById('courseraCheckResultBox');
    if (!box) return;
    if (!lastCheckResult) {
      box.innerHTML = '';
      return;
    }

    if (lastCheckResult.loading) {
      box.innerHTML = `
        <div class="cds-check-card" style="color:var(--cds-text-secondary); font-size:14px;">
          🔍 Đang kết nối tới Coursera API để kiểm tra khả năng lấy video 720p, phụ đề và bài đọc cho <strong>${escapeHtml(lastCheckResult.url)}</strong>...
        </div>
      `;
      return;
    }

    const res = lastCheckResult.data;
    if (!res) return;

    if (!res.crawlable) {
      box.innerHTML = `
        <div class="cds-check-card cds-check-card--fail">
          <div style="font-weight:700; font-size:15px; color:#B42318;">✕ Không thể lấy tự động khóa học này</div>
          <div style="font-size:13.5px; color:var(--cds-text-primary); margin-top:4px;"><strong>${escapeHtml(res.title || res.inputUrl)}</strong>: ${escapeHtml(res.reason)}</div>
          <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:6px;">Hệ thống đã tự động ghi nhận khóa học này vào <em>"Bảng thông tin các khóa học không thể lấy"</em> bên dưới.</div>
        </div>
      `;
      return;
    }

    const courses = res.courses || [];
    const crawlableSlugs = courses.filter(c => c.crawlable).map(c => c.slug);

    box.innerHTML = `
      <div class="cds-check-card cds-check-card--ok">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-weight:700; font-size:15.5px; color:var(--cds-green);">✓ Có thể lấy khóa học này về Google Drive!</div>
            <div style="font-size:13.5px; color:var(--cds-text-secondary); margin-top:2px;">${escapeHtml(res.title)} — ${escapeHtml(res.reason)}</div>
          </div>
          ${crawlableSlugs.length > 1 ? `
            <button class="cds-btn-primary" type="button" data-deploy-slugs="${escapeHtml(crawlableSlugs.join(','))}">
              Triển khai lấy toàn bộ (${crawlableSlugs.length} khóa)
            </button>
          ` : ''}
        </div>

        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          ${courses.map(c => {
            const alreadyIn = isCourseInCatalog(c.slug);
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border:1px solid var(--cds-border-light); border-radius:6px; background:#FAFBFC;">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:700; font-size:14px; color:var(--cds-text-primary);">${escapeHtml(c.title)} <code style="font-size:12px; color:#475467;">(${escapeHtml(c.slug)})</code></div>
                  <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:2px;">
                    ${c.crawlable
                      ? `${c.modulesCount} modules · <strong>${c.unlockedLectures}/${c.totalLectures}</strong> video 720p · <strong>${c.readingsCount}</strong> bài đọc · Phụ đề: ${c.hasEnSub ? 'EN' : ''}${c.hasViSub ? ' + VI' : ''}`
                      : `<span style="color:#B42318;">Không lấy được: ${escapeHtml(c.reason)}</span>`
                    }
                  </div>
                </div>
                <div style="flex-shrink:0;">
                  ${c.crawlable ? `
                    <button class="cds-btn-primary" type="button" data-deploy-slugs="${escapeHtml(c.slug)}" style="padding:6px 14px; font-size:13px;">
                      ${alreadyIn ? 'Cập nhật / Lấy lại khóa này' : 'Triển khai lấy khóa học'}
                    </button>
                  ` : `
                    <span style="font-size:12px; font-weight:700; color:#B42318;">Đã lưu bảng lỗi</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    box.querySelectorAll('[data-deploy-slugs]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rawSlugs = btn.getAttribute('data-deploy-slugs') || '';
        const slugs = rawSlugs.split(',').map(s => s.trim()).filter(Boolean);
        if (slugs.length === 0) return;
        try {
          btn.disabled = true;
          btn.textContent = 'Đang khởi chạy...';
          const resp = await apiPost('/api/coursera/import', { slugs });
          roadmapDataCache.crawlJob = resp.job;
          renderCrawlJobBox(resp.job);
          startCrawlPolling();
        } catch (err) {
          alert('Không thể khởi chạy: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Triển khai lấy khóa học';
        }
      });
    });
  }

  async function triggerCheckCourseraUrl(url) {
    if (!url) return;
    lastCheckResult = { loading: true, url };
    renderCheckResultBox();
    try {
      const resp = await apiPost('/api/coursera/check', { url });
      lastCheckResult = { loading: false, url, data: resp.result };
      if (roadmapDataCache && resp.uncrawlableCourses) {
        roadmapDataCache.uncrawlableCourses = resp.uncrawlableCourses;
      }
      renderProfileBody();
    } catch (err) {
      lastCheckResult = {
        loading: false,
        url,
        data: {
          crawlable: false,
          title: url,
          reason: err.message
        }
      };
      renderCheckResultBox();
    }
  }

  document.getElementById('btnOpenProfile')?.addEventListener('click', async () => {
    profileModal.classList.remove('hidden');
    await loadProfileData();
    renderProfileBody();
  });

  document.querySelectorAll('[data-profile-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeProfileTab = btn.getAttribute('data-profile-tab') || 'roadmap';
      renderProfileBody();
    });
  });

  document.getElementById('btnCloseProfile')?.addEventListener('click', () => profileModal.classList.add('hidden'));
  profileModal?.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.classList.add('hidden');
  });

  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await apiPost('/api/auth/logout', {});
    window.location.reload();
  });

  document.getElementById('btnChangePassword')?.addEventListener('click', async () => {
    const newPass = window.prompt('Nhập mật khẩu truy cập mới (ít nhất 4 ký tự):');
    if (!newPass) return;
    if (newPass.length < 4) {
      alert('Mật khẩu mới cần ít nhất 4 ký tự.');
      return;
    }
    try {
      await apiPost('/api/auth/password', { newPassword: newPass });
      alert('Đã cập nhật mật khẩu thành công!');
    } catch (err) {
      alert('Lỗi đổi mật khẩu: ' + err.message);
    }
  });
}

// ── Init ─────────────────────────────────────────────────────
async function init() {
  const sb = document.getElementById('courseSidebar');
  const btnHide = document.getElementById('btnToggleSidebar');
  const btnShow = document.getElementById('btnShowSidebar');

  btnHide?.addEventListener('click', () => {
    sb?.classList.add('collapsed');
    btnShow?.classList.remove('hidden');
  });

  btnShow?.addEventListener('click', () => {
    sb?.classList.remove('collapsed');
    btnShow?.classList.add('hidden');
  });

  document.getElementById('btnSidebarCourseHome')?.addEventListener('click', (e) => {
    e.preventDefault();
    openCourseHome(state.activeCourseId, state.activeModuleId, 'module');
  });

  document.getElementById('btnHomeLogo')?.addEventListener('click', (e) => {
    e.preventDefault();
    openCourseHome(state.activeCourseId, state.activeModuleId, 'module');
  });

  document.getElementById('btnSpecOverview')?.addEventListener('click', () => {
    openCourseHome(state.activeCourseId, state.activeModuleId, 'specialization');
  });

  document.getElementById('headerCourseSelect')?.addEventListener('change', (e) => {
    openCourseHome(e.target.value, null, 'module');
  });

  setupModals();

  const [catRes, userRes] = await Promise.all([
    apiGet('/api/catalog'),
    apiGet('/api/state')
  ]);

  state.catalog = catRes.catalog;
  state.user = userRes;

  const initialCourseId = state.user.lastVisited?.courseId || state.catalog.courses[0]?.id;
  openCourseHome(initialCourseId, null, 'module');
}

init().catch(err => console.error('Failed to init app:', err));
