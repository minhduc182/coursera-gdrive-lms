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
  note: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
};

function getCourseBrandTag(course) {
  const code = String(course?.code || '').toUpperCase();
  if (code.startsWith('BA-')) return 'IBM · STAGE 1 BA';
  if (code.startsWith('CBAP-')) return 'IIBA · CBAP STAGE 1';
  if (code.startsWith('GPM-')) return 'GOOGLE · STAGE 2 PM';
  if (code.startsWith('JIRA')) return 'ATLASSIAN · STAGE 2';
  if (code.startsWith('REQ-')) return 'UNIV. OF ALBERTA · STAGE 2';
  if (code.startsWith('PROD-')) return 'UVA DARDEN · STAGE 3 PRODUCT';
  return code || 'COURSERA COURSE';
}

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
  const totalCoursesCount = state.catalog.courses.length;
  const courseIdx = Math.max(0, state.catalog.courses.findIndex(c => c.id === course.id));

  // Left Sidebar (Authentic Coursera Course Home Left Navigation)
  const sidebarHtml = `
    <aside class="cds-home-sidebar">
      <div class="cds-home-brand-block">
        <span class="cds-home-partner-logo">${escapeHtml(getCourseBrandTag(course))}</span>
        <div class="cds-home-course-name">${escapeHtml(course.title)}</div>
        <div class="cds-home-partner-sub">Course ${courseIdx + 1} of ${totalCoursesCount} · ${st.completed}/${st.total} completed (${st.pct}%)</div>
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
          <span>All Courses (${totalCoursesCount})</span>
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

    const isModDone = mTotal > 0 && mDone === mTotal;
    stageInner = `
      <div class="cds-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
          <h1 class="cds-module-card-title">Module ${activeMod.index}: ${escapeHtml(activeMod.title)}</h1>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:13.5px; font-weight:600; color:${isModDone ? 'var(--cds-green)' : 'var(--cds-text-secondary)'};">
              ${mDone}/${mTotal} completed
            </span>
            <button class="${isModDone ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" type="button" data-toggle-mod-complete="${activeMod.id}">
              ${isModDone ? `${SVG.check} <span>Module Completed</span>` : `<span>Mark module completed</span>`}
            </button>
          </div>
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
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:16px;">
          <div>
            <h1 class="cds-module-card-title" style="margin-bottom:4px;">Learning Roadmap Catalog (${totalCoursesCount} Courses)</h1>
            <p style="color:var(--cds-text-secondary); font-size:14px;">
              All ${totalCoursesCount} courses across BA (Stage 1), Project Management (Stage 2), and Digital Product Management (Stage 3) synced on Google Drive.
            </p>
          </div>
          <span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>${totalCoursesCount} Courses Synced</span></span>
        </div>
        <div class="cds-downloads-list">
          ${state.catalog.courses.map((c, idx) => {
            const cSt = getCourseStats(c);
            const isCurrent = c.id === course.id;
            const isCourseDone = cSt.total > 0 && cSt.completed === cSt.total;
            return `
              <div class="cds-download-row">
                <div class="cds-roadmap-item-left" style="max-width:600px;">
                  <button class="cds-check-circle ${isCourseDone ? 'completed' : ''}" type="button" data-toggle-course-complete="${c.id}" title="Đánh dấu hoàn thành / chưa hoàn thành toàn bộ khóa học">
                    ${isCourseDone ? SVG.check : `<span style="font-size:11px; font-weight:700;">${idx + 1}</span>`}
                  </button>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                      <span style="font-size:11.5px; font-weight:700; color:var(--cds-blue); text-transform:uppercase;">${escapeHtml(getCourseBrandTag(c))} · ${escapeHtml(c.code)}</span>
                      <span class="cds-status-pill ${isCourseDone ? 'cds-status-pill--synced' : (cSt.completed > 0 ? 'cds-status-pill--running' : 'cds-status-pill--neutral')}">
                        ${isCourseDone ? `${SVG.check} <span>Completed (100%)</span>` : (cSt.completed > 0 ? `<span>In Progress (${cSt.pct}%)</span>` : `<span>Not Started</span>`)}
                      </span>
                    </div>
                    <div style="font-size:16.5px; font-weight:700; margin:2px 0 4px; color:var(--cds-text-primary);">${escapeHtml(c.title)}</div>
                    <div style="font-size:13.5px; color:var(--cds-text-secondary);">${escapeHtml(c.description)}</div>
                    <div style="font-size:12.5px; color:var(--cds-text-muted); margin-top:6px;">
                      ${c.modules.length} Modules • ${c.totalVideos} Videos • ${c.totalReadings} Readings • <strong>${cSt.completed}/${cSt.total} completed (${cSt.pct}%)</strong>
                    </div>
                  </div>
                </div>
                <div class="cds-roadmap-item-actions">
                  <button class="${isCourseDone ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" type="button" data-toggle-course-complete="${c.id}">
                    ${isCourseDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark Completed</span>`}
                  </button>
                  <a class="cds-btn-outline cds-btn-sm" href="${c.folderUrl}" target="_blank" rel="noopener">
                    ${SVG.folder}
                    <span>Drive</span>
                  </a>
                  <button class="${isCurrent ? 'cds-btn-completed' : 'cds-btn-primary'} cds-btn-sm" data-switch-course="${c.id}">
                    ${isCurrent ? `${SVG.check} <span>Active Course</span>` : `<span>Open Course</span>`}
                  </button>
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

  dashEl.querySelectorAll('[data-toggle-mod-complete]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const mId = btn.getAttribute('data-toggle-mod-complete');
      await toggleBatchCompleted(course.id, mId);
      renderCourseHome();
    });
  });

  dashEl.querySelectorAll('[data-toggle-course-complete]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const cId = btn.getAttribute('data-toggle-course-complete');
      await toggleBatchCompleted(cId, null);
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

let activeAutoCompleteTimer = null;

function clearAutoCompleteTimer() {
  if (activeAutoCompleteTimer) {
    clearTimeout(activeAutoCompleteTimer);
    activeAutoCompleteTimer = null;
  }
}

async function toggleBatchCompleted(courseId, moduleId = null) {
  const course = state.catalog?.courses?.find(c => c.id === courseId);
  if (!course) return;

  let total = 0;
  let completed = 0;
  for (const mod of course.modules || []) {
    if (moduleId && mod.id !== moduleId) continue;
    for (const sec of mod.sections || []) {
      for (const les of sec.lessons || []) {
        total++;
        if (state.user.progress[les.id]?.status === 'completed') completed++;
      }
    }
  }

  const nextStatus = (total > 0 && completed === total) ? 'not_started' : 'completed';
  const res = await apiPost('/api/progress/batch', {
    courseId,
    moduleId,
    status: nextStatus
  });
  if (res.progress) {
    state.user.progress = res.progress;
    renderHeader();
  }
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
  clearAutoCompleteTimer();
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
  document.getElementById('btnNextItem')?.addEventListener('click', async () => {
    if (state.user.progress[lesson.id]?.status !== 'completed') {
      await toggleLessonCompleted(lesson.id, true);
    }
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

  if (!videoEl) {
    // Google Drive Embed (iframe) mode: track progress & auto-complete after 15s of active viewing
    const existingProg = state.user.progress[lesson.id];
    if (!existingProg || existingProg.status === 'not_started') {
      apiPost('/api/progress', {
        lessonId: lesson.id,
        courseId: course.id,
        status: 'in_progress',
        currentTime: 0,
        duration: lesson.durationSec || 0
      }).then(res => {
        state.user.progress[lesson.id] = res.progress;
      }).catch(() => {});
    }
    clearAutoCompleteTimer();
    activeAutoCompleteTimer = setTimeout(() => {
      if (state.activeLessonId === lesson.id && state.user.progress[lesson.id]?.status !== 'completed') {
        toggleLessonCompleted(lesson.id, true);
      }
    }, 15000);
    return;
  }

  const overlayEl = document.getElementById('videoLoadingOverlay');
  const subOverlayEl = document.getElementById('customSubtitleOverlay');
  const hideLoading = () => overlayEl?.classList.add('hidden');

  videoEl.addEventListener('play', () => {
    const existingProg = state.user.progress[lesson.id];
    if (!existingProg || existingProg.status === 'not_started') {
      apiPost('/api/progress', {
        lessonId: lesson.id,
        courseId: course.id,
        status: 'in_progress',
        currentTime: Math.floor(videoEl.currentTime || 0),
        duration: Math.round(videoEl.duration || lesson.durationSec || 0)
      }).then(res => {
        state.user.progress[lesson.id] = res.progress;
      }).catch(() => {});
    }
  });

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
  const { course, lesson, nextLesson } = ctx;
  document.getElementById('selectPdfMode')?.addEventListener('change', (e) => {
    state.pdfPreviewMode = e.target.value;
    renderLectureContent(ctx, contentData);
  });

  // Mark reading as in_progress on open and auto-complete after 6s of reading
  const existingProg = state.user.progress[lesson.id];
  if (!existingProg || existingProg.status === 'not_started') {
    apiPost('/api/progress', {
      lessonId: lesson.id,
      courseId: course.id,
      status: 'in_progress',
      currentTime: 0,
      duration: lesson.durationSec || 120
    }).then(res => {
      state.user.progress[lesson.id] = res.progress;
    }).catch(() => {});
  }

  clearAutoCompleteTimer();
  activeAutoCompleteTimer = setTimeout(() => {
    if (state.activeLessonId === lesson.id && state.user.progress[lesson.id]?.status !== 'completed') {
      toggleLessonCompleted(lesson.id, true);
    }
  }, 6000);

  document.getElementById('btnReadingNext')?.addEventListener('click', async () => {
    if (state.user.progress[lesson.id]?.status !== 'completed') {
      await toggleLessonCompleted(lesson.id, true);
    }
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

  // ── Profile Modal: Gợi ý lộ trình học, Shopping & Get khóa học ─────────
  const profileModal = document.getElementById('profileModal');
  const profileBody = document.getElementById('profileModalBody');
  let activeProfileTab = 'roadmap'; // 'roadmap' | 'discover' | 'crawler'
  let roadmapDataCache = null;
  let lastCheckResult = null;
  let pendingCheckUrl = '';
  let crawlPollTimer = null;

  // Coursera Discovery / Shopping state
  let discoverQuery = 'business analysis';
  let discoverTypeFilter = 'ALL';
  let discoverViOnly = false;
  let discoverItems = [];
  let discoverLoading = false;
  let discoverError = '';
  const inlineCheckMap = {}; // url -> { loading, data }

  const QUICK_TOPICS = [
    { q: 'business analysis', label: 'Business Analysis' },
    { q: 'product management', label: 'Product Management' },
    { q: 'project management', label: 'Project Management' },
    { q: 'agile scrum jira', label: 'Agile, Scrum & Jira' },
    { q: 'sql data analytics', label: 'SQL & Data Analytics' },
    { q: 'power bi tableau', label: 'Power BI & Tableau' },
    { q: 'ux product design', label: 'UX & Product Design' },
    { q: 'generative ai product', label: 'Generative AI' }
  ];

  async function runCourseraDiscoverSearch(queryStr) {
    const q = String(queryStr ?? discoverQuery).trim() || 'business analysis';
    discoverQuery = q;
    discoverLoading = true;
    discoverError = '';
    if (!profileModal.classList.contains('hidden') && activeProfileTab === 'discover') {
      renderProfileBody();
    }
    try {
      const res = await apiGet(`/api/coursera/discover?q=${encodeURIComponent(q)}`);
      discoverItems = res.items || [];
      discoverLoading = false;
    } catch (err) {
      discoverError = err.message || 'Không thể kết nối danh mục Coursera.';
      discoverLoading = false;
    }
    if (!profileModal.classList.contains('hidden') && activeProfileTab === 'discover') {
      renderProfileBody();
    }
  }

  function isCourseInCatalog(urlOrSlug) {
    if (!state.catalog?.courses || !urlOrSlug) return null;
    const str = String(urlOrSlug).toLowerCase();
    if (str.includes('certified-business-analysis-professional-cbap')) {
      return state.catalog.courses.find(c => String(c.code || '').startsWith('CBAP-')) || state.catalog.courses[0] || null;
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
      accEl.innerHTML = `Drive lưu trữ: <strong>${escapeHtml(data.storage.account)}</strong> · <a href="${escapeHtml(data.storage.storageRootFolderUrl || '#')}" target="_blank" rel="noopener" style="color:var(--cds-blue); font-weight:600;">Mở thư mục Google Drive</a>`;
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
        if (!profileModal.classList.contains('hidden') && (activeProfileTab === 'crawler' || activeProfileTab === 'discover')) {
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
    const pct = job.totalItems > 0 ? Math.min(100, Math.round((job.completedItems / job.totalItems) * 100)) : (job.running ? 15 : 100);
    const isErr = !!job.error;
    const cardMod = job.running ? 'cds-check-card--running' : (isErr ? 'cds-check-card--fail' : 'cds-check-card--ok');
    const pillClass = job.running ? 'cds-status-pill--running' : (isErr ? 'cds-status-pill--error' : 'cds-status-pill--synced');
    const pillIcon = job.running ? `<span class="cds-spinner--sm"></span>` : (isErr ? SVG.alert : SVG.check);
    const pillText = job.running ? 'Downloading to Google Drive' : (isErr ? 'Sync Interrupted' : 'Completed & Indexed');

    box.innerHTML = `
      <div class="cds-check-card ${cardMod}">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span class="cds-status-pill ${pillClass}">${pillIcon} <span>${pillText}</span></span>
            <span style="font-weight:700; font-size:14.5px; color:var(--cds-text-primary);">
              ${job.running ? 'Tiến trình tải khóa học đang chạy trên máy chủ' : (isErr ? 'Tiến trình tải khóa học gặp lỗi' : 'Đã tải khóa học về Google Drive và đồng bộ danh mục')}
            </span>
          </div>
          <span style="font-size:13px; font-weight:700; color:var(--cds-blue);">
            ${job.completedItems}/${job.totalItems || '?'} items (${pct}%)
          </span>
        </div>

        <div style="font-size:13px; color:var(--cds-text-secondary); margin-bottom:10px;">
          ${escapeHtml(job.statusText || '')}
        </div>

        <div class="cds-progress-track">
          <div class="cds-progress-fill ${!job.running && !isErr ? 'done' : ''} ${isErr ? 'error' : ''}" style="width:${pct}%;"></div>
        </div>

        ${(job.logs && job.logs.length > 0) ? `
          <div style="margin-top:12px; max-height:120px; overflow-y:auto; background:#F8FAFC; border:1px solid var(--cds-border-light); border-radius:4px; padding:8px 12px; font-family:'JetBrains Mono', monospace; font-size:11.5px; color:#334155;">
            ${job.logs.slice(0, 14).map(l => `<div>${escapeHtml(l)}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function bindOpenCourseButtons(containerEl) {
    containerEl.querySelectorAll('[data-open-existing-course]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-open-existing-course');
        const subTab = btn.getAttribute('data-open-subtab') || 'module';
        profileModal.classList.add('hidden');
        openCourseHome(cId, null, subTab);
      });
    });

    containerEl.querySelectorAll('[data-profile-toggle-course]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-profile-toggle-course');
        await toggleBatchCompleted(cId, null);
        renderProfileBody();
        if (state.currentView === 'course-home') {
          renderCourseHome();
        }
      });
    });
  }

  function renderProfileBody() {
    if (!roadmapDataCache) {
      profileBody.innerHTML = `<div class="cds-empty-state">Loading learning roadmap and storage status...</div>`;
      return;
    }

    document.querySelectorAll('[data-profile-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-profile-tab') === activeProfileTab);
    });

    const allCourses = state.catalog?.courses || [];
    const totalVideos = state.catalog?.specialization?.totalVideos || allCourses.reduce((s, c) => s + (c.totalVideos || 0), 0);
    const totalReadings = state.catalog?.specialization?.totalReadings || allCourses.reduce((s, c) => s + (c.totalReadings || 0), 0);
    const totalLessons = totalVideos + totalReadings;

    if (activeProfileTab === 'roadmap') {
      const stages = roadmapDataCache.stages || [];
      profileBody.innerHTML = `
        <div class="cds-summary-banner">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>${allCourses.length} Courses Synced on Drive</span></span>
              <span style="font-size:13px; font-weight:600; color:var(--cds-text-secondary);">
                ${totalLessons} Lessons (${totalVideos} Videos 720p · ${totalReadings} Readings)
              </span>
            </div>
            <div style="font-size:14px; color:var(--cds-text-secondary);">
              Lộ trình 3 giai đoạn từ <strong>Business Analyst (BA)</strong> → <strong>Project Manager (PM)</strong> → <strong>Digital Product Management (Product)</strong>.
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button class="cds-btn-outline cds-btn-sm" type="button" id="btnSwitchToAllCourses">
              <span>View All ${allCourses.length} Courses</span>
            </button>
            <button class="cds-btn-outline cds-btn-sm" type="button" id="btnSwitchToDiscoverTab">
              ${SVG.compass}
              <span>Shopping Coursera</span>
            </button>
            <button class="cds-btn-primary cds-btn-sm" type="button" id="btnSwitchToCrawlerTab">
              ${SVG.download}
              <span>Import Course</span>
            </button>
          </div>
        </div>

        ${stages.map(st => `
          <div class="cds-roadmap-stage">
            <div class="cds-roadmap-stage-head">
              <div class="cds-roadmap-stage-title">${escapeHtml(st.title)}</div>
              <span class="cds-roadmap-stage-badge">${escapeHtml(st.duration)}</span>
            </div>
            <div style="font-size:13.5px; color:var(--cds-text-secondary);">${escapeHtml(st.description)}</div>

            <div class="cds-roadmap-list">
              ${(st.items || []).map(item => {
                const existingCourse = isCourseInCatalog(item.url);
                const cSt = existingCourse ? getCourseStats(existingCourse) : null;
                const isCourseDone = Boolean(cSt && cSt.total > 0 && cSt.completed === cSt.total);
                const isCourseStarted = Boolean(cSt && cSt.completed > 0 && !isCourseDone);

                return `
                  <div class="cds-roadmap-item">
                    <div class="cds-roadmap-item-left">
                      ${existingCourse ? `
                        <button class="cds-check-circle ${isCourseDone ? 'completed' : ''}" type="button" data-profile-toggle-course="${existingCourse.id}" title="Đánh dấu hoàn thành / chưa hoàn thành toàn bộ khóa học">
                          ${isCourseDone ? SVG.check : SVG.bookOutline}
                        </button>
                      ` : `
                        <span class="cds-check-circle" style="cursor:default;">${SVG.bookOutline}</span>
                      `}
                      <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                          <span style="font-weight:700; font-size:15px; color:var(--cds-text-primary);">
                            ${escapeHtml(item.title)}
                          </span>
                          ${existingCourse ? `
                            <span class="cds-status-pill cds-status-pill--synced">
                              ${SVG.check}
                              <span>${escapeHtml(existingCourse.code)} · Synced</span>
                            </span>
                            <span class="cds-status-pill ${isCourseDone ? 'cds-status-pill--synced' : (isCourseStarted ? 'cds-status-pill--running' : 'cds-status-pill--neutral')}">
                              ${isCourseDone ? `${SVG.check} <span>Completed (100%)</span>` : (isCourseStarted ? `<span>In Progress (${cSt.completed}/${cSt.total} · ${cSt.pct}%)</span>` : `<span>0/${cSt.total} completed</span>`)}
                            </span>
                          ` : `
                            <span class="cds-status-pill cds-status-pill--neutral">Not Downloaded</span>
                          `}
                        </div>

                        <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:3px;">
                          <strong>${escapeHtml(item.provider)}</strong> • ${escapeHtml(item.duration)} • ${escapeHtml(item.level)}
                          ${existingCourse ? ` • ${existingCourse.modules.length} Modules • ${existingCourse.totalVideos} Videos • ${existingCourse.totalReadings} Readings • <strong>${cSt.completed}/${cSt.total} completed (${cSt.pct}%)</strong>` : ''}
                        </div>

                        ${item.note ? `<div style="font-size:12.5px; color:var(--cds-text-muted); margin-top:3px;">${escapeHtml(item.note)}</div>` : ''}
                      </div>
                    </div>

                    <div class="cds-roadmap-item-actions">
                      ${existingCourse ? `
                        <button class="${isCourseDone ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" type="button" data-profile-toggle-course="${existingCourse.id}">
                          ${isCourseDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark Completed</span>`}
                        </button>
                      ` : ''}
                      <a class="cds-btn-outline cds-btn-sm" href="${escapeHtml(existingCourse ? existingCourse.folderUrl : item.url)}" target="_blank" rel="noopener" title="${existingCourse ? 'Mở thư mục Google Drive' : 'Xem trang gốc trên Coursera'}">
                        ${existingCourse ? SVG.folder : SVG.external}
                        <span>${existingCourse ? 'Drive' : 'Coursera'}</span>
                      </a>
                      ${existingCourse ? `
                        <button class="cds-btn-primary cds-btn-sm" type="button" data-open-existing-course="${existingCourse.id}">
                          <span>Open Course</span>
                        </button>
                      ` : `
                        <button class="cds-btn-primary cds-btn-sm" type="button" data-quick-check-url="${escapeHtml(item.url)}">
                          ${SVG.download}
                          <span>Check &amp; Import</span>
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

      document.getElementById('btnSwitchToAllCourses')?.addEventListener('click', () => {
        profileModal.classList.add('hidden');
        openCourseHome(state.activeCourseId, state.activeModuleId, 'specialization');
      });

      document.getElementById('btnSwitchToDiscoverTab')?.addEventListener('click', () => {
        activeProfileTab = 'discover';
        renderProfileBody();
        if (discoverItems.length === 0 && !discoverLoading) {
          runCourseraDiscoverSearch(discoverQuery);
        }
      });

      document.getElementById('btnSwitchToCrawlerTab')?.addEventListener('click', () => {
        activeProfileTab = 'crawler';
        renderProfileBody();
      });

      bindOpenCourseButtons(profileBody);

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

    // Tab 2: Khám phá & Shopping Coursera trực tiếp
    if (activeProfileTab === 'discover') {
      const filteredItems = discoverItems.filter(it => {
        if (discoverTypeFilter !== 'ALL' && it.productType !== discoverTypeFilter) return false;
        if (discoverViOnly && !it.hasViSub) return false;
        return true;
      });

      profileBody.innerHTML = `
        <div class="cds-crawler-box">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div>
              <div style="font-weight:700; font-size:16.5px; color:var(--cds-text-primary);">
                Coursera Catalog Explorer &amp; Course Shopping
              </div>
              <div style="font-size:13.5px; color:var(--cds-text-secondary); margin-top:2px;">
                Tìm kiếm trực tiếp trên kho khóa học Coursera gốc — kiểm tra khả năng lấy video 720p + phụ đề (.srt) + bài đọc (.html) và tải thẳng về Google Drive (<strong>${escapeHtml(roadmapDataCache.storage?.account || 'duc.to.dev@gmail.com')}</strong>).
              </div>
            </div>
            <span class="cds-status-pill cds-status-pill--synced">${SVG.compass} <span>Live Coursera Search</span></span>
          </div>

          <div class="cds-shop-filter-bar">
            <input type="text" id="discoverSearchInput" class="cds-crawler-input" value="${escapeHtml(discoverQuery)}" placeholder="Tìm khóa học trên Coursera (VD: business analysis, product management, sql, jira, generative ai...)" />
            <select id="discoverTypeSelect" class="cds-shop-select" aria-label="Loại học phần">
              <option value="ALL" ${discoverTypeFilter === 'ALL' ? 'selected' : ''}>Tất cả loại (${discoverItems.length})</option>
              <option value="COURSE" ${discoverTypeFilter === 'COURSE' ? 'selected' : ''}>Course (Khóa học đơn)</option>
              <option value="SPECIALIZATION" ${discoverTypeFilter === 'SPECIALIZATION' ? 'selected' : ''}>Specialization (Chuyên ngành)</option>
              <option value="PROFESSIONAL_CERTIFICATE" ${discoverTypeFilter === 'PROFESSIONAL_CERTIFICATE' ? 'selected' : ''}>Professional Certificate</option>
            </select>
            <label class="cds-shop-vi-label">
              <input type="checkbox" id="discoverViCheck" ${discoverViOnly ? 'checked' : ''} />
              <span>Có phụ đề Tiếng Việt</span>
            </label>
            <button class="cds-btn-primary" id="btnDiscoverSearch" type="button">
              <span>Search Coursera</span>
            </button>
          </div>

          <div class="cds-topic-chips">
            <span style="font-size:12px; font-weight:700; color:var(--cds-text-secondary);">Chủ đề gợi ý:</span>
            ${QUICK_TOPICS.map(t => `
              <button type="button" class="cds-topic-chip ${discoverQuery.toLowerCase() === t.q.toLowerCase() ? 'active' : ''}" data-discover-topic="${escapeHtml(t.q)}">
                ${escapeHtml(t.label)}
              </button>
            `).join('')}
          </div>

          <div id="crawlJobStatusContainer"></div>
        </div>

        <div class="cds-roadmap-stage">
          <div class="cds-roadmap-stage-head" style="margin-bottom:4px;">
            <div>
              <div class="cds-roadmap-stage-title">
                Kết quả từ Coursera cho "${escapeHtml(discoverQuery)}" (${filteredItems.length} học phần)
              </div>
              <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:2px;">
                Bấm <strong>Check &amp; Get Course</strong> trên bất kỳ thẻ nào để kiểm tra quyền truy cập video 720p và tải về Google Drive ngay tại chỗ.
              </div>
            </div>
          </div>

          ${discoverLoading ? `
            <div class="cds-check-card cds-check-card--running" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:36px; font-size:14.5px; color:var(--cds-text-secondary);">
              <span class="cds-spinner--sm"></span>
              <span>Đang tìm kiếm trực tiếp trên danh mục Coursera cho từ khóa <strong>"${escapeHtml(discoverQuery)}"</strong>...</span>
            </div>
          ` : discoverError ? `
            <div class="cds-check-card cds-check-card--fail">
              <div style="font-weight:700; color:#B42318;">Lỗi tìm kiếm Coursera: ${escapeHtml(discoverError)}</div>
            </div>
          ` : filteredItems.length === 0 ? `
            <div class="cds-empty-state" style="border:1px solid var(--cds-border-light); border-radius:8px; background:#FAFBFC; margin-top:12px;">
              Không tìm thấy khóa học phù hợp với bộ lọc hiện tại. Hãy thử từ khóa khác hoặc bỏ bộ lọc loại khóa học.
            </div>
          ` : `
            <div class="cds-shop-grid">
              ${filteredItems.map(item => {
                const existingCourse = isCourseInCatalog(item.url);
                const chk = inlineCheckMap[item.url];
                const chkRes = chk?.data;
                const crawlableSubCourses = chkRes?.courses ? chkRes.courses.filter(c => c.crawlable) : [];
                const crawlableSlugs = crawlableSubCourses.map(c => c.slug);
                const totalVids = crawlableSubCourses.reduce((s, c) => s + (c.unlockedLectures || 0), 0);
                const totalReads = crawlableSubCourses.reduce((s, c) => s + (c.readingsCount || 0), 0);

                return `
                  <div class="cds-shop-card">
                    <div>
                      <div class="cds-shop-card-top">
                        ${item.imageUrl ? `<img class="cds-shop-thumb" src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" />` : ''}
                        <div style="min-width:0; flex:1;">
                          <div class="cds-shop-partner">${escapeHtml((item.partners || []).join(', ') || 'Coursera Partner')}</div>
                          <div class="cds-shop-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
                          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:6px;">
                            <span class="cds-status-pill cds-status-pill--neutral">${escapeHtml(item.productTypeLabel)}</span>
                            ${item.hasViSub ? `<span class="cds-status-pill cds-status-pill--running">VI Subtitles</span>` : ''}
                            ${existingCourse ? `<span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>Synced (${escapeHtml(existingCourse.code)})</span></span>` : ''}
                          </div>
                        </div>
                      </div>

                      ${(item.skills && item.skills.length > 0) ? `
                        <div class="cds-shop-skills" style="margin-top:10px;">
                          <strong>Skills:</strong> ${escapeHtml(item.skills.slice(0, 6).join(', '))}
                        </div>
                      ` : ''}
                    </div>

                    <div class="cds-shop-footer">
                      <div class="cds-shop-meta">
                        ${item.rating ? `
                          <span class="cds-shop-rating">
                            <span class="cds-shop-star">★</span>
                            <span>${Number(item.rating).toFixed(1)}</span>
                          </span>
                          <span>(${Number(item.reviewsCount || 0).toLocaleString()} reviews)</span>
                          <span>•</span>
                        ` : ''}
                        <span>${escapeHtml([item.difficulty, item.duration].filter(Boolean).join(' • ') || 'Flexible schedule')}</span>
                      </div>

                      ${chk?.loading ? `
                        <div style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--cds-blue); background:var(--cds-blue-light); padding:8px 10px; border-radius:6px;">
                          <span class="cds-spinner--sm"></span>
                          <span>Đang kiểm tra video 720p, phụ đề (.srt) và bài đọc trên Coursera...</span>
                        </div>
                      ` : chkRes ? (
                        chkRes.crawlable ? `
                          <div style="font-size:12.5px; color:var(--cds-green); background:var(--cds-green-bg); padding:8px 10px; border-radius:6px; font-weight:600;">
                            <div style="display:flex; align-items:center; gap:6px;">
                              ${SVG.check}
                              <span>Sẵn sàng tải ${crawlableSlugs.length}/${chkRes.courses.length} khóa (${totalVids} Videos 720p · ${totalReads} Readings)</span>
                            </div>
                          </div>
                        ` : `
                          <div style="font-size:12.5px; color:#B42318; background:#FEF3F2; padding:8px 10px; border-radius:6px; font-weight:600;">
                            Không thể tải tự động: ${escapeHtml(chkRes.reason)}
                          </div>
                        `
                      ) : ''}

                      <div class="cds-shop-actions">
                        <a class="cds-btn-outline cds-btn-sm" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
                          ${SVG.external}
                          <span>Coursera</span>
                        </a>

                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                          ${existingCourse ? `
                            <button class="cds-btn-primary cds-btn-sm" type="button" data-open-existing-course="${existingCourse.id}">
                              <span>Open Course</span>
                            </button>
                          ` : ''}

                          ${chkRes?.crawlable ? `
                            <button class="cds-btn-primary cds-btn-sm" type="button" data-shop-import="${escapeHtml(crawlableSlugs.join(','))}">
                              ${SVG.download}
                              <span>Download to Drive (${crawlableSlugs.length})</span>
                            </button>
                            ${chkRes.courses.length > 1 ? `
                              <button class="cds-btn-outline cds-btn-sm" type="button" data-shop-detail="${escapeHtml(item.url)}">
                                <span>Chi tiết (${chkRes.courses.length})</span>
                              </button>
                            ` : ''}
                          ` : (!chk?.loading && !chkRes ? `
                            <button class="${existingCourse ? 'cds-btn-outline' : 'cds-btn-primary'} cds-btn-sm" type="button" data-shop-check="${escapeHtml(item.url)}">
                              ${SVG.download}
                              <span>${existingCourse ? 'Check Update' : 'Check & Get Course'}</span>
                            </button>
                          ` : '')}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      renderCrawlJobBox(roadmapDataCache.crawlJob);
      if (roadmapDataCache.crawlJob?.running && !crawlPollTimer) {
        startCrawlPolling();
      }

      bindOpenCourseButtons(profileBody);

      const discInput = document.getElementById('discoverSearchInput');
      const discBtn = document.getElementById('btnDiscoverSearch');
      const discType = document.getElementById('discoverTypeSelect');
      const discVi = document.getElementById('discoverViCheck');

      discBtn?.addEventListener('click', () => {
        runCourseraDiscoverSearch(discInput?.value || '');
      });
      discInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          runCourseraDiscoverSearch(discInput.value || '');
        }
      });
      discType?.addEventListener('change', () => {
        discoverTypeFilter = discType.value;
        renderProfileBody();
      });
      discVi?.addEventListener('change', () => {
        discoverViOnly = Boolean(discVi.checked);
        renderProfileBody();
      });

      profileBody.querySelectorAll('[data-discover-topic]').forEach(chip => {
        chip.addEventListener('click', () => {
          const topic = chip.getAttribute('data-discover-topic') || '';
          runCourseraDiscoverSearch(topic);
        });
      });

      profileBody.querySelectorAll('[data-shop-check]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const targetUrl = btn.getAttribute('data-shop-check');
          if (!targetUrl) return;
          inlineCheckMap[targetUrl] = { loading: true };
          renderProfileBody();
          try {
            const resp = await apiPost('/api/coursera/check', { url: targetUrl });
            inlineCheckMap[targetUrl] = { loading: false, data: resp.result };
            if (roadmapDataCache && resp.uncrawlableCourses) {
              roadmapDataCache.uncrawlableCourses = resp.uncrawlableCourses;
            }
          } catch (err) {
            inlineCheckMap[targetUrl] = {
              loading: false,
              data: { crawlable: false, reason: err.message }
            };
          }
          renderProfileBody();
        });
      });

      profileBody.querySelectorAll('[data-shop-import]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rawSlugs = btn.getAttribute('data-shop-import') || '';
          const slugs = rawSlugs.split(',').map(s => s.trim()).filter(Boolean);
          if (slugs.length === 0) return;
          try {
            btn.disabled = true;
            btn.innerHTML = `<span class="cds-spinner--sm"></span> <span>Starting...</span>`;
            const resp = await apiPost('/api/coursera/import', { slugs });
            roadmapDataCache.crawlJob = resp.job;
            renderCrawlJobBox(resp.job);
            startCrawlPolling();
            profileBody.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (err) {
            alert('Không thể khởi chạy: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = `${SVG.download} <span>Download to Drive</span>`;
          }
        });
      });

      profileBody.querySelectorAll('[data-shop-detail]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetUrl = btn.getAttribute('data-shop-detail') || '';
          if (!targetUrl) return;
          pendingCheckUrl = targetUrl;
          if (inlineCheckMap[targetUrl]?.data) {
            lastCheckResult = { loading: false, url: targetUrl, data: inlineCheckMap[targetUrl].data };
          }
          activeProfileTab = 'crawler';
          renderProfileBody();
        });
      });

      return;
    }

    // Tab 2: Tải khóa học & Trạng thái kho lưu trữ
    const uncrawlable = roadmapDataCache.uncrawlableCourses || [];
    profileBody.innerHTML = `
      <!-- 1. Coursera URL Check & Import Box -->
      <div class="cds-crawler-box">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-weight:700; font-size:16.5px; color:var(--cds-text-primary);">
              Import Course from Coursera to Google Drive
            </div>
            <div style="font-size:13.5px; color:var(--cds-text-secondary); margin-top:2px;">
              Paste a Coursera course (<code>/learn/...</code>) or specialization URL to verify open access and sync 720p videos, subtitles (.srt), and readings (.html) directly to <strong>${escapeHtml(roadmapDataCache.storage?.account || 'duc.to.dev@gmail.com')}</strong>.
            </div>
          </div>
          <span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>Drive Connected</span></span>
        </div>

        <div class="cds-crawler-input-row">
          <input type="text" id="courseraUrlInput" class="cds-crawler-input" value="${escapeHtml(pendingCheckUrl)}" placeholder="https://www.coursera.org/learn/project-management-foundations" />
          <button class="cds-btn-primary" id="btnCheckCourseraUrl" type="button">
            <span>Check Course</span>
          </button>
        </div>

        <div id="courseraCheckResultBox"></div>
        <div id="crawlJobStatusContainer"></div>
      </div>

      <!-- 2. Synced Courses Inventory & Status on Google Drive -->
      <div class="cds-roadmap-stage">
        <div class="cds-roadmap-stage-head" style="margin-bottom:10px;">
          <div>
            <div class="cds-roadmap-stage-title">Kho khóa học đã đồng bộ trên Google Drive (${allCourses.length} khóa)</div>
            <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:2px;">
              Trạng thái toàn bộ khóa học đã tải về thư mục gốc trên Drive — bấm <strong>Open Course</strong> để vào học ngay.
            </div>
          </div>
          <span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>${allCourses.length}/19 Ready</span></span>
        </div>

        <div class="cds-downloads-list" style="max-height:320px; overflow-y:auto;">
          ${allCourses.map(c => {
            const cSt = getCourseStats(c);
            const isCourseDone = cSt.total > 0 && cSt.completed === cSt.total;
            const isCourseStarted = cSt.completed > 0 && !isCourseDone;
            return `
              <div class="cds-download-row">
                <div class="cds-roadmap-item-left">
                  <button class="cds-check-circle ${isCourseDone ? 'completed' : ''}" type="button" data-profile-toggle-course="${c.id}" title="Đánh dấu hoàn thành / chưa hoàn thành toàn bộ khóa học">
                    ${isCourseDone ? SVG.check : SVG.bookOutline}
                  </button>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                      <span style="font-size:11.5px; font-weight:700; color:var(--cds-blue);">${escapeHtml(c.code)}</span>
                      <span style="font-weight:700; font-size:14.5px; color:var(--cds-text-primary);">${escapeHtml(c.title)}</span>
                      <span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>Synced</span></span>
                      <span class="cds-status-pill ${isCourseDone ? 'cds-status-pill--synced' : (isCourseStarted ? 'cds-status-pill--running' : 'cds-status-pill--neutral')}">
                        ${isCourseDone ? `${SVG.check} <span>Completed (100%)</span>` : (isCourseStarted ? `<span>In Progress (${cSt.pct}%)</span>` : `<span>0/${cSt.total} completed</span>`)}
                      </span>
                    </div>
                    <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:2px;">
                      ${c.modules.length} Modules • ${c.totalVideos} Videos 720p • ${c.totalReadings} Readings • Tiến độ: <strong>${cSt.completed}/${cSt.total} (${cSt.pct}%)</strong>
                    </div>
                  </div>
                </div>
                <div class="cds-roadmap-item-actions">
                  <button class="${isCourseDone ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" type="button" data-profile-toggle-course="${c.id}">
                    ${isCourseDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark Completed</span>`}
                  </button>
                  <a class="cds-btn-outline cds-btn-sm" href="${c.folderUrl}" target="_blank" rel="noopener">
                    ${SVG.folder}
                    <span>Drive</span>
                  </a>
                  <button class="cds-btn-primary cds-btn-sm" type="button" data-open-existing-course="${c.id}">
                    <span>Open Course</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. Uncrawlable Courses Table -->
      <div class="cds-roadmap-stage">
        <div class="cds-roadmap-stage-head" style="margin-bottom:10px;">
          <div>
            <div class="cds-roadmap-stage-title">Danh sách khóa học không thể tải tự động (${uncrawlable.length})</div>
            <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:2px;">
              Các khóa học yêu cầu thanh toán trước hoặc khóa quyền xem trước video trên Coursera sẽ tự động lưu tại đây.
            </div>
          </div>
        </div>

        ${uncrawlable.length === 0 ? `
          <div style="border:1px solid var(--cds-border-light); border-radius:6px; padding:18px; text-align:center; font-size:13.5px; color:var(--cds-text-muted); background:#FAFBFC;">
            Tất cả khóa học đã kiểm tra đều tải thành công (0 khóa bị chặn).
          </div>
        ` : `
          <div style="border:1px solid var(--cds-border-light); border-radius:6px; overflow:hidden; background:#FFFFFF;">
            <table class="cds-uncrawlable-table">
              <thead>
                <tr>
                  <th style="width:30%;">Course / URL</th>
                  <th style="width:42%;">Reason</th>
                  <th style="width:16%;">Checked At</th>
                  <th style="width:12%;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${uncrawlable.map(u => `
                  <tr>
                    <td>
                      <div style="font-weight:700; color:var(--cds-text-primary);">${escapeHtml(u.title || u.slug)}</div>
                      <a href="${escapeHtml(u.url)}" target="_blank" rel="noopener" style="font-size:12px; color:var(--cds-blue); word-break:break-all;">${escapeHtml(u.url)}</a>
                    </td>
                    <td style="color:#B42318; font-weight:600;">${escapeHtml(u.reason)}</td>
                    <td style="font-size:12px; color:var(--cds-text-secondary);">${u.checkedAt ? new Date(u.checkedAt).toLocaleString('vi-VN') : ''}</td>
                    <td>
                      <button class="cds-btn-outline cds-btn-sm" type="button" data-delete-uncrawl="${escapeHtml(u.id)}">Remove</button>
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

    bindOpenCourseButtons(profileBody);

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
        <div class="cds-check-card cds-check-card--running" style="display:flex; align-items:center; gap:12px; color:var(--cds-text-secondary); font-size:14px;">
          <span class="cds-spinner--sm"></span>
          <span>Đang kiểm tra cấu trúc khóa học, luồng video 720p, phụ đề (.srt) và bài đọc cho <strong>${escapeHtml(lastCheckResult.url)}</strong>...</span>
        </div>
      `;
      return;
    }

    const res = lastCheckResult.data;
    if (!res) return;

    if (!res.crawlable) {
      box.innerHTML = `
        <div class="cds-check-card cds-check-card--fail">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="cds-status-pill cds-status-pill--error">${SVG.alert} <span>Cannot Import</span></span>
            <span style="font-weight:700; font-size:15px; color:#B42318;">Không thể tải tự động khóa học này</span>
          </div>
          <div style="font-size:13.5px; color:var(--cds-text-primary); margin-top:6px;">
            <strong>${escapeHtml(res.title || res.inputUrl)}</strong>: ${escapeHtml(res.reason)}
          </div>
          <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:4px;">
            Đã tự động lưu vào danh sách khóa học bị giới hạn quyền truy cập bên dưới.
          </div>
        </div>
      `;
      return;
    }

    const courses = res.courses || [];
    const crawlableSlugs = courses.filter(c => c.crawlable).map(c => c.slug);

    box.innerHTML = `
      <div class="cds-check-card cds-check-card--ok">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>Ready to Import</span></span>
              <span style="font-weight:700; font-size:15.5px; color:var(--cds-text-primary);">${escapeHtml(res.title)}</span>
            </div>
            <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:3px;">${escapeHtml(res.reason)}</div>
          </div>
          ${crawlableSlugs.length > 1 ? `
            <button class="cds-btn-primary cds-btn-sm" type="button" data-deploy-slugs="${escapeHtml(crawlableSlugs.join(','))}">
              ${SVG.download}
              <span>Import All (${crawlableSlugs.length} Courses)</span>
            </button>
          ` : ''}
        </div>

        <div class="cds-downloads-list">
          ${courses.map(c => {
            const alreadyIn = isCourseInCatalog(c.slug);
            return `
              <div class="cds-download-row">
                <div class="cds-roadmap-item-left">
                  <span class="cds-check-circle ${c.crawlable ? 'completed' : ''}" style="cursor:default;">
                    ${c.crawlable ? SVG.check : SVG.alert}
                  </span>
                  <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                      <span style="font-weight:700; font-size:14.5px; color:var(--cds-text-primary);">${escapeHtml(c.title)}</span>
                      <code style="font-size:12px; color:var(--cds-text-secondary); background:#F2F4F7; padding:1px 6px; border-radius:4px;">${escapeHtml(c.slug)}</code>
                      ${alreadyIn ? `<span class="cds-status-pill cds-status-pill--synced">${SVG.check} <span>Already on Drive</span></span>` : ''}
                    </div>
                    <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:3px;">
                      ${c.crawlable
                        ? `${c.modulesCount} Modules • <strong>${c.unlockedLectures}/${c.totalLectures}</strong> Videos 720p • <strong>${c.readingsCount}</strong> Readings • Subtitles: ${c.hasEnSub ? 'EN' : ''}${c.hasViSub ? ' + VI' : ''}`
                        : `<span style="color:#B42318; font-weight:600;">Blocked: ${escapeHtml(c.reason)}</span>`
                      }
                    </div>
                  </div>
                </div>
                <div class="cds-roadmap-item-actions">
                  ${alreadyIn ? `
                    <button class="cds-btn-primary cds-btn-sm" type="button" data-open-existing-course="${alreadyIn.id}">
                      <span>Open Course</span>
                    </button>
                  ` : ''}
                  ${c.crawlable ? `
                    <button class="${alreadyIn ? 'cds-btn-outline' : 'cds-btn-primary'} cds-btn-sm" type="button" data-deploy-slugs="${escapeHtml(c.slug)}">
                      ${SVG.download}
                      <span>${alreadyIn ? 'Re-sync' : 'Download to Drive'}</span>
                    </button>
                  ` : `
                    <span class="cds-status-pill cds-status-pill--error">Logged</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    bindOpenCourseButtons(box);

    box.querySelectorAll('[data-deploy-slugs]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rawSlugs = btn.getAttribute('data-deploy-slugs') || '';
        const slugs = rawSlugs.split(',').map(s => s.trim()).filter(Boolean);
        if (slugs.length === 0) return;
        try {
          btn.disabled = true;
          btn.innerHTML = `<span class="cds-spinner--sm"></span> <span>Starting...</span>`;
          const resp = await apiPost('/api/coursera/import', { slugs });
          roadmapDataCache.crawlJob = resp.job;
          renderCrawlJobBox(resp.job);
          startCrawlPolling();
        } catch (err) {
          alert('Không thể khởi chạy: ' + err.message);
          btn.disabled = false;
          btn.innerHTML = `${SVG.download} <span>Download to Drive</span>`;
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
    if (activeProfileTab === 'discover' && discoverItems.length === 0 && !discoverLoading) {
      runCourseraDiscoverSearch(discoverQuery);
    }
  });

  document.getElementById('btnOpenExplore')?.addEventListener('click', async () => {
    activeProfileTab = 'discover';
    profileModal.classList.remove('hidden');
    await loadProfileData();
    renderProfileBody();
    if (discoverItems.length === 0 && !discoverLoading) {
      runCourseraDiscoverSearch(discoverQuery);
    }
  });

  document.querySelectorAll('[data-profile-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeProfileTab = btn.getAttribute('data-profile-tab') || 'roadmap';
      renderProfileBody();
      if (activeProfileTab === 'discover' && discoverItems.length === 0 && !discoverLoading) {
        runCourseraDiscoverSearch(discoverQuery);
      }
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
