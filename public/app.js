const state = {
  catalog: null,
  user: {
    progress: {},
    studyLog: {},
    notes: [],
    bookmarks: [],
    highlights: {},
    lastVisited: null,
    preferences: {
      playerMode: 'html5',
      playbackRate: 1,
      subtitleLang: 'en',
      autoAdvance: true,
      dailyGoalMinutes: 30
    }
  },
  // Views: 'course-home' | 'lecture'
  currentView: 'course-home',
  homeSubTab: 'module', // 'module' | 'grades' | 'notes' | 'info' | 'specialization'
  activeCourseId: null,
  activeModuleId: null,
  activeLessonId: null,
  activeVideoTab: 'transcript', // 'transcript' | 'coach' | 'notes' | 'downloads'
  collapsedSections: new Set(),
  currentLessonData: null,
  transcriptFilterText: '',
  pdfPreviewMode: 'proxy',
  quizUserAnswers: {} // { [questionId]: selectedOptionIndex }
};

// Clean Monochrome Coursera SVG Icons (Zero Emojis)
const SVG = {
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>`,
  reading: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  videoOutline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`,
  bookOutline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  chevronDown: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  chevronRight: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  chevronLeft: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  external: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  note: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  upload: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  compass: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
  camera: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
  theater: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="8" y1="4" x2="8" y2="20"></line></svg>`,
  translate: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  restart: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
  eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  zoomIn: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
  flame: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  chart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  award: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
  star: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  coach: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  bookmark: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
  bookmarkFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
  pip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><rect x="11" y="11" width="9" height="7" rx="1" fill="currentColor"></rect></svg>`,
  autoNext: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>`,
  volume: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
  stop: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>`,
  highlight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h9l3-3"></path><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path></svg>`,
  quiz: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`
};

let hudToastTimer = null;
function showHudToast(message, iconSvg = SVG.check) {
  let el = document.getElementById('cdsHudToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cdsHudToast';
    el.className = 'cds-hud-toast hidden';
    document.body.appendChild(el);
  }
  el.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('visible'));
  clearTimeout(hudToastTimer);
  hudToastTimer = setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('hidden'), 180);
  }, 2500);
}

function isLessonBookmarked(lessonId) {
  return Array.isArray(state.user.bookmarks) && state.user.bookmarks.includes(lessonId);
}

async function toggleLessonBookmark(lessonId) {
  if (!lessonId) return;
  const res = await apiPost('/api/bookmarks/toggle', { lessonId });
  state.user.bookmarks = res.bookmarks || [];
  const pinned = isLessonBookmarked(lessonId);
  renderHeader();

  // Update lecture topbar button if visible
  const bcBtn = document.getElementById('btnBookmarkCurrentLesson');
  if (bcBtn && state.activeLessonId === lessonId) {
    bcBtn.className = `${pinned ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm`;
    bcBtn.innerHTML = `${pinned ? SVG.bookmarkFilled : SVG.bookmark} <span>${pinned ? 'Đã ghim (B)' : 'Ghim bài (B)'}</span>`;
  }

  // Update any syllabus/sidebar bookmark buttons
  document.querySelectorAll(`[data-bookmark-lesson="${lessonId}"]`).forEach(btn => {
    btn.classList.toggle('active', pinned);
    btn.innerHTML = pinned ? SVG.bookmarkFilled : SVG.bookmark;
  });

  showHudToast(
    pinned ? 'Đã ghim bài học vào Kho lưu trữ (Saved)!' : 'Đã bỏ ghim bài học.',
    pinned ? SVG.bookmarkFilled : SVG.bookmark
  );
}

function stopReadingTts() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  const btn = document.getElementById('btnReadingTtsToggle');
  if (btn) {
    btn.classList.remove('cds-btn-completed');
    btn.innerHTML = `${SVG.volume} <span>Đọc bài (TTS)</span>`;
  }
}

function toggleTheaterMode(forceState = null) {
  const sb = document.getElementById('courseSidebar');
  const btnShow = document.getElementById('btnShowSidebar');
  if (!sb) return;
  const willCollapse = forceState !== null ? forceState : !sb.classList.contains('collapsed');
  sb.classList.toggle('collapsed', willCollapse);
  btnShow?.classList.toggle('hidden', !willCollapse);
  document.body.classList.toggle('cds-theater-active', willCollapse);
  document.querySelectorAll('#btnTheaterMode').forEach(btn => {
    btn.classList.toggle('cds-btn-completed', willCollapse);
    btn.innerHTML = `${SVG.theater} <span>${willCollapse ? 'Thoát Tập trung (T)' : 'Chế độ Tập trung (T)'}</span>`;
  });
}

function openSlideLightbox(imgUrl, titleText = 'Slide bài giảng') {
  const modal = document.getElementById('slideLightboxModal');
  const img = document.getElementById('slideLightboxImg');
  const title = document.getElementById('slideLightboxTitle');
  const dl = document.getElementById('slideLightboxDownload');
  if (!modal || !img) return;
  img.src = imgUrl;
  if (title) title.textContent = titleText;
  if (dl) {
    dl.href = imgUrl;
    dl.download = `${titleText.replace(/[^a-zA-Z0-9_-]+/g, '_')}.jpg`;
  }
  modal.classList.remove('hidden');
}

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

  const notesBadge = document.getElementById('totalNotesBadge');
  if (notesBadge) notesBadge.textContent = (state.user.notes || []).length;

  const bmBadge = document.getElementById('totalBookmarksBadge');
  if (bmBadge) bmBadge.textContent = (state.user.bookmarks || []).length;

  // Sync Daily Study Goal pill on Header
  const goalBtn = document.getElementById('btnHeaderDailyGoal');
  const goalText = document.getElementById('headerDailyGoalText');
  if (goalBtn && goalText) {
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaySec = Number(state.user.studyLog?.[todayKey]?.secondsWatched || 0);
    const todayMin = Math.round(todaySec / 60);
    const goalMin = Number(state.user.preferences?.dailyGoalMinutes || 30);
    goalText.textContent = `${todayMin}/${goalMin}p`;
    goalBtn.classList.toggle('goal-reached', todayMin >= goalMin);
    goalBtn.title = `Mục tiêu học hôm nay: ${todayMin}/${goalMin} phút (${Math.min(100, Math.round((todayMin / goalMin) * 100))}%) — Bấm để mở Thống kê & Biểu đồ nhiệt`;
  }

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
  stopReadingTts();
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
        const resumeSec = (prog?.currentTime > 3 && !isDone) ? prog.currentTime : 0;
        const durSec = prog?.duration || les.durationSec || 0;
        const resumePct = (resumeSec > 0 && durSec > 0) ? Math.min(96, Math.max(4, Math.round((resumeSec / durSec) * 100))) : 0;
        const isPinned = isLessonBookmarked(les.id);

        return `
          <div class="cds-syllabus-item" data-open-lesson="${les.id}">
            <div class="cds-syllabus-item-left">
              <button class="cds-check-circle ${isDone ? 'completed' : ''}" data-toggle-lesson="${les.id}" title="Mark as completed / uncompleted">
                ${iconSvg}
              </button>
              <div style="min-width:0; flex:1;">
                <div class="cds-syllabus-item-title">${escapeHtml(les.title)}</div>
                <div class="cds-syllabus-item-meta">
                  ${typeLabel} • ${formatCourseraMin(les.durationSec)}
                  ${hasPdf ? ' • PDF Attachment' : ''}
                  ${hasVi ? ' • Subtitles: EN, VI' : ''}
                  ${resumeSec > 0 ? ` • <strong style="color:var(--cds-blue);">Đang xem tại ${formatClock(resumeSec)}${durSec > 0 ? ` / ${formatClock(durSec)}` : ''}</strong>` : ''}
                </div>
                ${resumePct > 0 ? `
                  <div class="cds-mini-progress-track">
                    <div class="cds-mini-progress-fill" style="width:${resumePct}%;"></div>
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
              <button class="cds-bookmark-icon-btn ${isPinned ? 'active' : ''}" type="button" data-bookmark-lesson="${les.id}" title="${isPinned ? 'Bỏ ghim bài học' : 'Ghim bài học trọng tâm'}">
                ${isPinned ? SVG.bookmarkFilled : SVG.bookmark}
              </button>
              ${(isNextUp || resumeSec > 0) ? `
                <button class="cds-btn-primary cds-btn-sm" data-open-lesson="${les.id}">
                  ${SVG.play}
                  <span>${resumeSec > 0 ? `Học tiếp (${formatClock(resumeSec)})` : 'Start'}</span>
                </button>
              ` : ''}
            </div>
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
            <a class="cds-btn-outline cds-btn-sm" href="${sec.folderUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
              ${SVG.external}
              <span>Drive Folder</span>
            </a>
          </div>
          ${!isCollapsed ? `<div class="cds-section-items">${itemsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    // Find best lesson in this course to resume right away (1-click Continue Learning Card)
    const courseFlat = getAllLessonsFlat(course);
    let resumeCandidate = null;
    for (const item of courseFlat) {
      const p = state.user.progress[item.lesson.id];
      if (p && p.status !== 'completed' && p.currentTime > 3) {
        if (!resumeCandidate || (p.updatedAt || '') > (state.user.progress[resumeCandidate.lesson.id]?.updatedAt || '')) {
          resumeCandidate = item;
        }
      }
    }
    if (!resumeCandidate && state.user.lastVisited?.courseId === course.id && state.user.lastVisited?.lessonId) {
      const lv = courseFlat.find(x => x.lesson.id === state.user.lastVisited.lessonId);
      if (lv && state.user.progress[lv.lesson.id]?.status !== 'completed') {
        resumeCandidate = lv;
      }
    }
    if (!resumeCandidate) {
      resumeCandidate = courseFlat.find(x => state.user.progress[x.lesson.id]?.status !== 'completed') || null;
    }

    let resumeBannerHtml = '';
    if (resumeCandidate) {
      const rProg = state.user.progress[resumeCandidate.lesson.id];
      const rSec = (rProg?.currentTime > 3 && rProg?.status !== 'completed') ? rProg.currentTime : 0;
      const rDur = rProg?.duration || resumeCandidate.lesson.durationSec || 0;
      const rPct = (rSec > 0 && rDur > 0) ? Math.min(96, Math.max(5, Math.round((rSec / rDur) * 100))) : 0;
      resumeBannerHtml = `
        <div class="cds-continue-banner">
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <span class="cds-status-pill cds-status-pill--running">${SVG.clock} <span>${rSec > 0 ? `Đang học dở tại ${formatClock(rSec)}` : 'Bài học tiếp theo'}</span></span>
              <span style="font-size:12.5px; font-weight:600; color:var(--cds-text-secondary);">Module ${resumeCandidate.module.index}: ${escapeHtml(resumeCandidate.module.title)}</span>
            </div>
            <div style="font-size:16px; font-weight:700; color:var(--cds-text-primary);">${escapeHtml(resumeCandidate.lesson.title)}</div>
            ${rPct > 0 ? `
              <div class="cds-mini-progress-track" style="max-width:340px; margin-top:8px;">
                <div class="cds-mini-progress-fill" style="width:${rPct}%;"></div>
              </div>
            ` : ''}
          </div>
          <button class="cds-btn-primary" type="button" data-open-lesson="${resumeCandidate.lesson.id}" data-seek="${rSec > 0 ? rSec : ''}">
            ${SVG.play}
            <span>${rSec > 0 ? `Học tiếp tại ${formatClock(rSec)}` : 'Vào học ngay'}</span>
          </button>
        </div>
      `;
    }

    const isModDone = mTotal > 0 && mDone === mTotal;
    stageInner = `
      ${resumeBannerHtml}
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
        <h1 class="cds-module-card-title">Course Notes &amp; Captured Slides (${courseNotes.length})</h1>
        ${courseNotes.length === 0
          ? `<div class="cds-empty-state">You haven't saved any notes in this course yet. Click "Save note" or "Chụp Slide" below any video to add one.</div>`
          : `<div class="cds-downloads-list">
              ${courseNotes.map(n => {
                const ctx = findLessonContext(n.lessonId);
                return `
                  <div class="cds-download-row" style="cursor:pointer;" data-open-lesson="${n.lessonId}" data-seek="${n.timestampSec ?? ''}">
                    <div style="min-width:0; flex:1;">
                      <div style="font-weight:700; color:var(--cds-blue); font-size:14px; display:flex; align-items:center; gap:6px;">
                        ${SVG.play}
                        <span>${ctx ? `${escapeHtml(ctx.lesson.title)}` : ''}</span>
                        ${typeof n.timestampSec === 'number' ? `<span class="cds-status-pill cds-status-pill--running">${formatClock(n.timestampSec)}</span>` : ''}
                      </div>
                      <div style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(n.content)}</div>
                      ${n.imageDataUrl ? `
                        <div class="cds-note-slide-wrap" data-lightbox-src="${escapeHtml(n.imageDataUrl)}" data-lightbox-title="${escapeHtml(ctx ? ctx.lesson.title : 'Slide')}">
                          <img src="${escapeHtml(n.imageDataUrl)}" alt="Slide" class="cds-note-slide-img" />
                          <span class="cds-note-slide-badge">${SVG.zoomIn} <span>Xem phóng to Slide</span></span>
                        </div>
                      ` : ''}
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
            <a class="cds-btn-outline" href="${course.folderUrl}" target="_blank" rel="noopener">
              ${SVG.external}
              <span>Open in Google Drive</span>
            </a>
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

  dashEl.querySelectorAll('[data-bookmark-lesson]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const lId = btn.getAttribute('data-bookmark-lesson');
      await toggleLessonBookmark(lId);
    });
  });

  dashEl.querySelectorAll('[data-open-lesson]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-lightbox-src]') || e.target.closest('[data-bookmark-lesson]')) return;
      e.stopPropagation();
      const lId = el.getAttribute('data-open-lesson');
      const seekStr = el.getAttribute('data-seek');
      const seek = seekStr ? parseFloat(seekStr) : null;
      openLecture(course.id, lId, seek);
    });
  });

  dashEl.querySelectorAll('[data-lightbox-src]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openSlideLightbox(el.getAttribute('data-lightbox-src'), el.getAttribute('data-lightbox-title') || 'Slide');
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
        const prog = state.user.progress[les.id];
        const isDone = prog?.status === 'completed';
        const isActive = state.activeLessonId === les.id;
        const typePrefix = les.type === 'video' ? 'Video:' : 'Reading:';
        const iconSvg = isDone ? SVG.check : (les.type === 'video' ? SVG.play : SVG.reading);
        const resumeSec = (prog?.currentTime > 3 && !isDone) ? prog.currentTime : 0;
        const durSec = prog?.duration || les.durationSec || 0;
        const resumePct = (resumeSec > 0 && durSec > 0) ? Math.min(96, Math.max(4, Math.round((resumeSec / durSec) * 100))) : 0;

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
                ${resumeSec > 0 ? ` • <span style="color:var(--cds-blue); font-weight:600;">${formatClock(resumeSec)}</span>` : ''}
              </div>
              ${resumePct > 0 ? `
                <div class="cds-mini-progress-track" style="margin-top:4px;">
                  <div class="cds-mini-progress-fill" style="width:${resumePct}%;"></div>
                </div>
              ` : ''}
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
  if (res.studyLog) state.user.studyLog = res.studyLog;
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
  stopReadingTts();
  state.quizUserAnswers = {};
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
  const isTheater = document.getElementById('courseSidebar')?.classList.contains('collapsed');
  const isPinned = isLessonBookmarked(lesson.id);
  navEl.innerHTML = `
    <button class="${isPinned ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" id="btnBookmarkCurrentLesson" type="button" title="Ghim bài học trọng tâm (Phím tắt: B)">
      ${isPinned ? SVG.bookmarkFilled : SVG.bookmark}
      <span>${isPinned ? 'Đã ghim (B)' : 'Ghim bài (B)'}</span>
    </button>
    <button class="${isTheater ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" id="btnTheaterMode" type="button" title="Phím tắt: T">
      ${SVG.theater}
      <span>${isTheater ? 'Thoát Tập trung (T)' : 'Chế độ Tập trung (T)'}</span>
    </button>
    <button class="cds-prev-next-link" id="btnPrevItem" ${!prevLesson ? 'disabled' : ''}>
      ${SVG.chevronLeft}
      <span>Previous</span>
    </button>
    <button class="cds-prev-next-link" id="btnNextItem" ${!nextLesson ? 'disabled' : ''}>
      <span>Next</span>
      ${SVG.chevronRight}
    </button>
  `;

  document.getElementById('btnBookmarkCurrentLesson')?.addEventListener('click', () => {
    toggleLessonBookmark(lesson.id);
  });

  document.getElementById('btnTheaterMode')?.addEventListener('click', () => {
    toggleTheaterMode();
  });

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

// ── Video Lecture View (Player at Top -> Title Below -> Paragraph Transcript & Coach) ──
function buildVideoLectureHtml(ctx, contentData) {
  const { lesson } = ctx;
  const prefs = state.user.preferences;
  const isDone = state.user.progress[lesson.id]?.status === 'completed';
  const hasAnySub = Boolean(lesson.subtitles?.en || lesson.subtitles?.vi || contentData.cuesEn?.length || contentData.cuesVi?.length);
  const hasViReady = Boolean(contentData.cuesVi?.length > 0);
  const subLang = prefs.subtitleLang || 'en';
  const notesCount = state.user.notes.filter(n => n.lessonId === lesson.id).length;

  const playerInner = prefs.playerMode === 'iframe'
    ? `<iframe src="${lesson.video.previewUrl}" allow="autoplay; fullscreen"></iframe>`
    : `
      <div id="videoLoadingOverlay" class="cds-video-loading ${contentData.videoCached ? 'hidden' : ''}">
        <div class="cds-spinner"></div>
        <div style="font-weight:600;">Streaming video from Google Drive (${formatBytes(lesson.video.size)})...</div>
      </div>
      <div id="resumePlaybackBanner" class="cds-resume-toast hidden"></div>
      <div id="autoNextOverlayBanner" class="cds-resume-toast hidden"></div>
      <video id="activeVideoPlayer" controls preload="auto" crossorigin="anonymous" src="/api/drive/media/${lesson.video.id}"></video>
      <div id="customSubtitleOverlay" class="cds-subtitle-overlay"></div>
    `;

  const autoAdvOn = prefs.autoAdvance !== false;
  const curRate = Number(prefs.playbackRate) || 1;

  return `
    <!-- 1. Video Player at the Top -->
    <div class="cds-player-box">
      ${playerInner}
    </div>

    <!-- 2. Video Title & Coursera Action Buttons Below Player -->
    <div class="cds-video-below-header">
      <h1 class="cds-lecture-h1">${escapeHtml(lesson.title)}</h1>
      <div class="cds-lecture-actions">
        ${prefs.playerMode !== 'iframe' ? `
          <button class="cds-btn-outline" id="btnSnapSlideQuick" type="button" title="Chụp nhanh khung hình Slide hiện tại vào Ghi chú (Phím tắt: S)">
            ${SVG.camera}
            <span>Chụp Slide (S)</span>
          </button>
          <button class="cds-btn-outline" id="btnTogglePip" type="button" title="Thu nhỏ video thành Cửa sổ nổi góc màn hình (Phím tắt: P)">
            ${SVG.pip}
            <span>Cửa sổ nổi (P)</span>
          </button>
          <button class="${autoAdvOn ? 'cds-btn-completed' : 'cds-btn-outline'}" id="btnToggleAutoAdvance" type="button" title="Tự động chuyển sang bài học tiếp theo khi hết video">
            ${SVG.autoNext}
            <span>Tự qua bài: ${autoAdvOn ? 'Bật' : 'Tắt'}</span>
          </button>
        ` : ''}
        <button class="cds-btn-outline" id="btnSaveVideoNote" type="button" title="Mở ô nhập ghi chú tại mốc thời gian hiện tại (Phím tắt: N)">
          ${SVG.note}
          <span>Save note (N)</span>
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
        <button class="cds-u-tab ${state.activeVideoTab === 'coach' ? 'active' : ''}" data-vtab="coach">
          Coursera Coach &amp; Quiz (${(contentData.studyGuide?.quiz || []).length})
        </button>
        <button class="cds-u-tab ${state.activeVideoTab === 'notes' ? 'active' : ''}" data-vtab="notes" id="videoNotesTabBtn">
          Notes (${notesCount})
        </button>
        <button class="cds-u-tab ${state.activeVideoTab === 'downloads' ? 'active' : ''}" data-vtab="downloads">
          Downloads &amp; Drive
        </button>
      </div>

      <div class="cds-tabs-right-controls">
        <div class="cds-speed-pills" title="Tốc độ phát video (tự động ghi nhớ cho mọi bài học — Phím tắt: < / >)">
          ${[1, 1.25, 1.5, 1.75, 2].map(r => `
            <button type="button" class="cds-speed-pill ${curRate === r ? 'active' : ''}" data-quick-speed="${r}">${r}x</button>
          `).join('')}
        </div>

        <select id="selectSubtitleLang" class="cds-select-sm" title="Transcript & Subtitle language">
          <option value="en" ${subLang === 'en' ? 'selected' : ''}>English</option>
          ${hasAnySub ? `<option value="vi" ${subLang === 'vi' ? 'selected' : ''}>Tiếng Việt ${hasViReady ? '' : '(Auto)'}</option>` : ''}
          ${hasAnySub ? `<option value="dual" ${subLang === 'dual' ? 'selected' : ''}>Song ngữ (EN + VI)</option>` : ''}
          <option value="off" ${subLang === 'off' ? 'selected' : ''}>Subtitles Off</option>
        </select>

        <select id="selectPlaybackRate" class="cds-select-sm" title="Playback Speed">
          ${[0.75, 1, 1.25, 1.5, 1.75, 2].map(r => `<option value="${r}" ${curRate === r ? 'selected' : ''}>${r}x</option>`).join('')}
        </select>

        <select id="selectPlayerMode" class="cds-select-sm" title="Video Stream Source">
          <option value="html5" ${prefs.playerMode === 'html5' ? 'selected' : ''}>HTML5 Stream (.mp4)</option>
          <option value="iframe" ${prefs.playerMode === 'iframe' ? 'selected' : ''}>Google Drive Embed</option>
        </select>
      </div>
    </div>

    <!-- Tab 1: Paragraph-Grouped Interactive Transcript -->
    <div id="tabBodyTranscript" class="${state.activeVideoTab === 'transcript' ? '' : 'hidden'}">
      <div class="cds-transcript-controls" style="flex-wrap:wrap; gap:10px;">
        <input type="text" id="inputTranscriptFilter" class="cds-transcript-search-input" placeholder="Search in transcript (English or Tiếng Việt)..." value="${escapeHtml(state.transcriptFilterText)}" />
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${contentData.nextVideoPreloading ? `
            <span class="cds-status-pill cds-status-pill--synced" title="Máy chủ đang nạp sẵn video bài tiếp theo vào bộ nhớ đệm SSD">
              ${SVG.check} <span>Smart Preload Ready</span>
            </span>
          ` : ''}
          ${hasViReady ? `
            <span class="cds-status-pill cds-status-pill--running" id="viSubStatusBadge">
              ${SVG.check} <span>Phụ đề Song ngữ EN + VI sẵn sàng</span>
            </span>
          ` : (contentData.cuesEn?.length > 0 ? `
            <button class="cds-btn-outline cds-btn-sm" type="button" id="btnAutoTranslateVi">
              ${SVG.translate}
              <span>Dịch phụ đề Song ngữ (EN + VI)</span>
            </button>
          ` : '')}
          <a class="cds-btn-outline cds-btn-sm" href="${lesson.folderUrl}" target="_blank" rel="noopener">
            ${SVG.external}
            <span>Google Drive Folder</span>
          </a>
        </div>
      </div>
      <div id="transcriptParagraphs" class="cds-transcript-paragraphs"></div>
    </div>

    <!-- Tab 2: Coursera Coach (Key Takeaways, Domain Glossary & Flashcards) -->
    <div id="tabBodyCoach" class="${state.activeVideoTab === 'coach' ? '' : 'hidden'}">
      ${buildCoachPanelHtml(ctx, contentData)}
    </div>

    <!-- Tab 3: Notes -->
    <div id="tabBodyNotes" class="${state.activeVideoTab === 'notes' ? '' : 'hidden'}">
      ${buildNotesPanelHtml(ctx, contentData)}
    </div>

    <!-- Tab 4: Downloads & Drive Links -->
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
  const subLang = state.user.preferences.subtitleLang || 'en';

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
    const phrasesMainHtml = p.phrases.map(ph => {
      const displayMain = (subLang === 'vi' && ph.viText) ? ph.viText : (ph.enText || ph.viText);
      return `<span class="cds-phrase" data-start="${ph.start}" data-end="${ph.end}">${escapeHtml(displayMain)}</span>`;
    }).join(' ');

    const hasParaVi = subLang === 'dual' && p.phrases.some(ph => ph.viText);
    const phrasesViHtml = hasParaVi
      ? `<div class="cds-para-vi-line">${p.phrases.map(ph => ph.viText ? `<span class="cds-phrase" data-start="${ph.start}" data-end="${ph.end}">${escapeHtml(ph.viText)}</span>` : '').filter(Boolean).join(' ')}</div>`
      : '';

    return `
      <div class="cds-para-block">
        <span class="cds-para-time" data-seek-time="${p.start}">${p.timeStr}</span>
        <div class="cds-para-text">
          <div>${phrasesMainHtml}</div>
          ${phrasesViHtml}
        </div>
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

async function ensureLessonVietnameseTranslated(ctx, contentData) {
  if (contentData.cuesVi && contentData.cuesVi.length > 0) return true;
  if (!contentData.cuesEn || contentData.cuesEn.length === 0) return false;
  const btn = document.getElementById('btnAutoTranslateVi');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="cds-spinner--sm"></span> <span>Đang dịch phụ đề Tiếng Việt...</span>`;
  }
  try {
    const res = await apiPost(`/api/lesson/${encodeURIComponent(ctx.lesson.id)}/translate-vi`, {});
    if (res.cuesVi && res.cuesVi.length > 0) {
      contentData.cuesVi = res.cuesVi;
      contentData.viAutoTranslated = true;
      if (res.studyGuide) contentData.studyGuide = res.studyGuide;
      if (btn) {
        btn.outerHTML = `<span class="cds-status-pill cds-status-pill--running" id="viSubStatusBadge">${SVG.check} <span>Phụ đề Song ngữ EN + VI sẵn sàng</span></span>`;
      }
      const coachEl = document.getElementById('tabBodyCoach');
      if (coachEl) {
        coachEl.innerHTML = buildCoachPanelHtml(ctx, contentData);
        setupCoachEvents(ctx, contentData);
      }
      return true;
    }
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Dịch phụ đề Song ngữ (EN + VI)</span>`;
    }
  }
  return false;
}

function captureVideoSlideDataUrl() {
  const v = document.getElementById('activeVideoPlayer');
  if (!v || !v.videoWidth || !v.videoHeight) return null;
  try {
    const maxW = 960;
    const scale = v.videoWidth > maxW ? (maxW / v.videoWidth) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx2d = canvas.getContext('2d');
    ctx2d.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (e) {
    return null;
  }
}

async function quickSnapVideoSlide(ctx) {
  const v = document.getElementById('activeVideoPlayer');
  if (!v) return;
  const imgDataUrl = captureVideoSlideDataUrl();
  if (!imgDataUrl) {
    showHudToast('Video đang tải khung hình, hãy thử lại sau 1 giây.', SVG.alert);
    return;
  }
  const timestampSec = Math.round(v.currentTime || 0);
  const noteInput = document.getElementById('noteInput');
  const typedText = noteInput ? noteInput.value.trim() : '';

  // Also grab current subtitle cue if available to enrich the default slide caption
  let defaultCaption = `Slide bài giảng tại [${formatClock(timestampSec)}]`;
  if (state.currentLessonData?.cuesEn?.length) {
    const cue = state.currentLessonData.cuesEn.find(c => v.currentTime >= c.start && v.currentTime <= c.end);
    if (cue?.text) defaultCaption = `${cue.text}`;
  }

  const content = typedText || defaultCaption;
  const res = await apiPost('/api/notes', {
    lessonId: ctx.lesson.id,
    courseId: ctx.course.id,
    timestampSec,
    content,
    imageDataUrl: imgDataUrl
  });
  state.user.notes = res.notes;
  if (noteInput && typedText) noteInput.value = '';
  pendingNoteSlideDataUrl = null;
  renderPendingSlidePreview();
  renderHeader();

  const notesCount = state.user.notes.filter(n => n.lessonId === ctx.lesson.id).length;
  const tabBtn = document.getElementById('videoNotesTabBtn');
  if (tabBtn) tabBtn.textContent = `Notes (${notesCount})`;

  const listEl = document.getElementById('lessonNotesList');
  if (listEl) {
    listEl.innerHTML = renderNotesRowsHtml(state.user.notes.filter(n => n.lessonId === ctx.lesson.id));
    bindNoteActions();
  }
  showHudToast(`Đã chụp Slide tại ${formatClock(timestampSec)} vào Ghi chú!`, SVG.camera);
}

const SPEED_STEPS = [0.75, 1, 1.25, 1.5, 1.75, 2];

async function applyVideoPlaybackSpeed(nextRate) {
  const rate = Number(nextRate) || 1;
  state.user.preferences.playbackRate = rate;
  const videoEl = document.getElementById('activeVideoPlayer');
  if (videoEl) videoEl.playbackRate = rate;
  const sel = document.getElementById('selectPlaybackRate');
  if (sel) sel.value = String(rate);
  document.querySelectorAll('[data-quick-speed]').forEach(btn => {
    btn.classList.toggle('active', Number(btn.getAttribute('data-quick-speed')) === rate);
  });
  showHudToast(`Tốc độ phát: ${rate}x (Đã ghi nhớ)`, SVG.clock);
  await apiPost('/api/preferences', { playbackRate: rate }).catch(() => {});
}

function stepVideoPlaybackSpeed(direction) {
  const cur = Number(state.user.preferences.playbackRate) || 1;
  const idx = SPEED_STEPS.indexOf(cur);
  const nextIdx = idx >= 0
    ? Math.max(0, Math.min(SPEED_STEPS.length - 1, idx + direction))
    : 1;
  applyVideoPlaybackSpeed(SPEED_STEPS[nextIdx]);
}

let autoNextInterval = null;
function clearAutoNextCountdown() {
  if (autoNextInterval) {
    clearInterval(autoNextInterval);
    autoNextInterval = null;
  }
  const banner = document.getElementById('autoNextOverlayBanner');
  if (banner) banner.classList.add('hidden');
}

function setupVideoLectureEvents(ctx, contentData, seekTime = null) {
  const { course, lesson, nextLesson } = ctx;
  clearAutoNextCountdown();

  renderCourseraParagraphTranscript(ctx, contentData);
  setupNotesEvents(ctx, contentData);
  setupCoachEvents(ctx, contentData);

  // Switch tabs
  document.querySelectorAll('[data-vtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeVideoTab = btn.getAttribute('data-vtab');
      document.querySelectorAll('[data-vtab]').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('tabBodyTranscript')?.classList.toggle('hidden', state.activeVideoTab !== 'transcript');
      document.getElementById('tabBodyCoach')?.classList.toggle('hidden', state.activeVideoTab !== 'coach');
      document.getElementById('tabBodyNotes')?.classList.toggle('hidden', state.activeVideoTab !== 'notes');
      document.getElementById('tabBodyDownloads')?.classList.toggle('hidden', state.activeVideoTab !== 'downloads');
    });
  });

  // 1-click Snap Slide button
  document.getElementById('btnSnapSlideQuick')?.addEventListener('click', () => {
    quickSnapVideoSlide(ctx);
  });

  // Picture-in-Picture (PiP) button
  document.getElementById('btnTogglePip')?.addEventListener('click', async () => {
    const v = document.getElementById('activeVideoPlayer');
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showHudToast('Đã đóng Cửa sổ nổi (PiP)', SVG.pip);
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
        showHudToast('Đã bật Cửa sổ nổi (Picture-in-Picture)', SVG.pip);
      }
    } catch (err) {
      showHudToast('Hãy phát video trước khi bật Cửa sổ nổi.', SVG.alert);
    }
  });

  // Auto-Advance toggle button
  document.getElementById('btnToggleAutoAdvance')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const nextVal = state.user.preferences.autoAdvance === false;
    state.user.preferences.autoAdvance = nextVal;
    btn.className = nextVal ? 'cds-btn-completed' : 'cds-btn-outline';
    btn.innerHTML = `${SVG.autoNext} <span>Tự qua bài: ${nextVal ? 'Bật' : 'Tắt'}</span>`;
    if (!nextVal) clearAutoNextCountdown();
    showHudToast(`Tự động chuyển bài: ${nextVal ? 'Đã BẬT' : 'Đã TẮT'}`, SVG.autoNext);
    await apiPost('/api/preferences', { autoAdvance: nextVal }).catch(() => {});
  });

  // Quick Speed Pill Buttons
  document.querySelectorAll('[data-quick-speed]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyVideoPlaybackSpeed(parseFloat(btn.getAttribute('data-quick-speed')));
    });
  });

  // Save note button opens Notes tab & focuses textarea
  document.getElementById('btnSaveVideoNote')?.addEventListener('click', () => {
    const notesTab = document.querySelector('[data-vtab="notes"]');
    if (notesTab) notesTab.click();
    const input = document.getElementById('noteInput');
    if (input) input.focus();
  });

  document.getElementById('btnAutoTranslateVi')?.addEventListener('click', async () => {
    const ok = await ensureLessonVietnameseTranslated(ctx, contentData);
    if (ok) {
      state.user.preferences.subtitleLang = 'dual';
      const subSelect = document.getElementById('selectSubtitleLang');
      if (subSelect) subSelect.value = 'dual';
      await apiPost('/api/preferences', { subtitleLang: 'dual' });
      renderCourseraParagraphTranscript(ctx, contentData);
    }
  });

  // Dropdowns
  const subSelect = document.getElementById('selectSubtitleLang');
  if (subSelect) {
    subSelect.addEventListener('change', async () => {
      const nextLang = subSelect.value;
      state.user.preferences.subtitleLang = nextLang;
      await apiPost('/api/preferences', { subtitleLang: nextLang });
      if ((nextLang === 'vi' || nextLang === 'dual') && (!contentData.cuesVi || contentData.cuesVi.length === 0)) {
        await ensureLessonVietnameseTranslated(ctx, contentData);
      }
      renderCourseraParagraphTranscript(ctx, contentData);
    });
  }

  // If user already had 'vi' or 'dual' preference selected and cuesVi is empty, auto-translate in background
  if ((state.user.preferences.subtitleLang === 'vi' || state.user.preferences.subtitleLang === 'dual') && (!contentData.cuesVi || contentData.cuesVi.length === 0) && contentData.cuesEn?.length > 0) {
    ensureLessonVietnameseTranslated(ctx, contentData).then(() => {
      renderCourseraParagraphTranscript(ctx, contentData);
    });
  }

  const rateSelect = document.getElementById('selectPlaybackRate');
  const videoEl = document.getElementById('activeVideoPlayer');
  if (rateSelect) {
    rateSelect.addEventListener('change', async () => {
      await applyVideoPlaybackSpeed(parseFloat(rateSelect.value));
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
    const resumeBanner = document.getElementById('resumePlaybackBanner');
    if (typeof seekTime === 'number' && seekTime > 0) {
      videoEl.currentTime = seekTime;
      videoEl.play().catch(() => {});
    } else if (savedProg?.currentTime > 3 && savedProg.currentTime < (videoEl.duration || 999999) - 5) {
      videoEl.currentTime = savedProg.currentTime;
      if (resumeBanner) {
        resumeBanner.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            ${SVG.clock}
            <span>Đã khôi phục tại <strong>${formatClock(savedProg.currentTime)}</strong></span>
          </div>
          <button type="button" class="cds-resume-toast-btn" id="btnRestartFromZero">
            ${SVG.restart}
            <span>Xem từ đầu</span>
          </button>
        `;
        resumeBanner.classList.remove('hidden');
        document.getElementById('btnRestartFromZero')?.addEventListener('click', () => {
          videoEl.currentTime = 0;
          resumeBanner.classList.add('hidden');
          videoEl.play().catch(() => {});
        });
        setTimeout(() => {
          resumeBanner.classList.add('hidden');
        }, 7500);
      }
    }

    if (nextLesson?.video?.id) {
      apiPost(`/api/drive/prefetch/${nextLesson.video.id}`).catch(() => {});
    }
  });

  videoEl.addEventListener('canplay', hideLoading);

  let lastSavedSec = -1;
  let lastWallClockMs = Date.now();

  const saveVideoProgressNow = (curSec, deltaWatchedSec = 0) => {
    const roundedSec = Math.max(0, Math.floor(curSec || 0));
    if (roundedSec <= 0) return;
    lastSavedSec = roundedSec;
    const existing = state.user.progress[lesson.id];
    const isAlmostDone = videoEl.duration > 0 && curSec / videoEl.duration >= 0.92;
    const nextStatus = (existing?.status === 'completed' || isAlmostDone) ? 'completed' : 'in_progress';

    apiPost('/api/progress', {
      lessonId: lesson.id,
      courseId: course.id,
      status: nextStatus,
      currentTime: roundedSec,
      duration: Math.round(videoEl.duration || lesson.durationSec || 0),
      deltaSec: deltaWatchedSec
    }).then(res => {
      const prevStatus = state.user.progress[lesson.id]?.status;
      state.user.progress[lesson.id] = res.progress;
      if (res.studyLog) state.user.studyLog = res.studyLog;
      renderLectureSidebar(ctx);
      if (prevStatus !== res.progress.status) {
        renderHeader();
        updateCompleteButtonsUI();
      }
    }).catch(() => {});
  };

  videoEl.addEventListener('pause', () => {
    saveVideoProgressNow(videoEl.currentTime, 0);
  });

  videoEl.addEventListener('timeupdate', () => {
    const cur = videoEl.currentTime;
    const hasVi = Boolean(contentData.cuesVi && contentData.cuesVi.length > 0);
    const subLang = (!hasVi && (state.user.preferences.subtitleLang === 'vi' || state.user.preferences.subtitleLang === 'dual'))
      ? 'en'
      : (state.user.preferences.subtitleLang || 'en');

    const cueEn = (contentData.cuesEn || []).find(c => cur >= c.start && cur <= c.end);
    let cueVi = (contentData.cuesVi || []).find(c => cur >= c.start && cur <= c.end);
    if (!cueVi && cueEn && hasVi) {
      cueVi = contentData.cuesVi.find(v => Math.abs(v.start - cueEn.start) <= 1.8);
    }

    if (subOverlayEl) {
      if (subLang === 'off') {
        subOverlayEl.innerHTML = '';
      } else if (subLang === 'en' && cueEn) {
        subOverlayEl.innerHTML = `<div class="cds-sub-en">${escapeHtml(cueEn.text)}</div>`;
      } else if (subLang === 'vi' && (cueVi || cueEn)) {
        subOverlayEl.innerHTML = `<div class="cds-sub-vi">${escapeHtml((cueVi || cueEn).text)}</div>`;
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
      const nowMs = Date.now();
      const elapsedWallSec = Math.min(15, Math.max(1, Math.round((nowMs - lastWallClockMs) / 1000)));
      lastWallClockMs = nowMs;
      saveVideoProgressNow(cur, elapsedWallSec);
    }
  });

  videoEl.addEventListener('ended', async () => {
    await toggleLessonCompleted(lesson.id, true);

    if (state.user.preferences.autoAdvance !== false && nextLesson) {
      const banner = document.getElementById('autoNextOverlayBanner');
      if (banner) {
        let remain = 5;
        const renderCountdown = () => {
          banner.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              ${SVG.autoNext}
              <span>Đã hoàn thành! Tự chuyển sang <strong>${escapeHtml(nextLesson.title)}</strong> sau <strong>${remain}s</strong>...</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="cds-btn-primary cds-btn-sm" id="btnAutoNextNow">
                ${SVG.play}
                <span>Qua bài ngay</span>
              </button>
              <button type="button" class="cds-btn-outline cds-btn-sm" id="btnCancelAutoNext">
                ${SVG.close}
                <span>Ở lại bài này</span>
              </button>
            </div>
          `;
          document.getElementById('btnAutoNextNow')?.addEventListener('click', () => {
            clearAutoNextCountdown();
            selectLesson(nextLesson.id);
          });
          document.getElementById('btnCancelAutoNext')?.addEventListener('click', () => {
            clearAutoNextCountdown();
          });
        };
        banner.classList.remove('hidden');
        renderCountdown();
        clearInterval(autoNextInterval);
        autoNextInterval = setInterval(() => {
          remain -= 1;
          if (remain <= 0) {
            clearAutoNextCountdown();
            selectLesson(nextLesson.id);
          } else {
            renderCountdown();
          }
        }, 1000);
      } else {
        selectLesson(nextLesson.id);
      }
    }
  });
}

// ── Coursera Coach Study Guide & Study Guide Markdown Exporter ──
function buildCoachPanelHtml(ctx, contentData) {
  const { course, module, lesson } = ctx;
  const guide = contentData.studyGuide || { takeaways: [], glossary: [], flashcards: [], quiz: [] };
  const quizList = guide.quiz || [];
  const hasViReady = Boolean(contentData.cuesVi && contentData.cuesVi.length > 0);

  let answeredCount = 0;
  let correctCount = 0;
  for (const q of quizList) {
    if (typeof state.quizUserAnswers[q.id] === 'number') {
      answeredCount++;
      if (state.quizUserAnswers[q.id] === q.correctIndex) correctCount++;
    }
  }
  const scorePct = answeredCount > 0 ? Math.round((correctCount / quizList.length) * 100) : 0;

  return `
    <div class="cds-coach-panel">
      <div class="cds-coach-banner">
        <div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
            <span class="cds-status-pill cds-status-pill--running">${SVG.coach} <span>Coursera Coach &amp; Practice Quiz</span></span>
            <span style="font-size:15px; font-weight:700; color:var(--cds-text-primary);">
              Tóm tắt Trọng tâm, Thuật ngữ Chuyên ngành &amp; Trắc nghiệm Chấm điểm
            </span>
          </div>
          <div style="font-size:13px; color:var(--cds-text-secondary);">
            Tổng hợp tự động từ nội dung bài học <strong>${escapeHtml(lesson.title)}</strong> (${escapeHtml(module?.title || course?.shortTitle)}).
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${(!hasViReady && contentData.cuesEn?.length > 0) ? `
            <button class="cds-btn-outline cds-btn-sm" type="button" id="btnCoachTranslateVi">
              ${SVG.translate}
              <span>Dịch Song ngữ (EN + VI)</span>
            </button>
          ` : ''}
          <button class="cds-btn-primary cds-btn-sm" type="button" id="btnCoachExportMd">
            ${SVG.download}
            <span>Export Study Guide (.md)</span>
          </button>
        </div>
      </div>

      <!-- 1. Interactive 4-Choice Practice Quiz -->
      ${quizList.length > 0 ? `
        <div class="cds-coach-section">
          <div class="cds-coach-section-title">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              ${SVG.quiz}
              <span>1. Bài Kiểm tra Trắc nghiệm 4 Đáp án (Practice Quiz &amp; Mock Exam)</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="cds-status-pill ${answeredCount === quizList.length && quizList.length > 0 ? 'cds-status-pill--synced' : 'cds-status-pill--running'}" id="quizScoreBadge">
                ${SVG.award}
                <span>Điểm: ${correctCount}/${quizList.length} (${scorePct}%)</span>
              </span>
              <button class="cds-btn-outline cds-btn-sm" type="button" id="btnResetQuiz">
                ${SVG.restart}
                <span>Làm lại đề</span>
              </button>
            </div>
          </div>

          <div class="cds-quiz-list">
            ${quizList.map((q, qIdx) => {
              const userChoice = state.quizUserAnswers[q.id];
              const isAnswered = typeof userChoice === 'number';
              const isRight = isAnswered && userChoice === q.correctIndex;
              return `
                <div class="cds-quiz-card" id="quiz_card_${escapeHtml(q.id)}">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                    <span class="cds-status-pill cds-status-pill--neutral">Câu ${qIdx + 1}/${quizList.length} · ${escapeHtml(q.category || 'Kiến thức')}</span>
                    ${typeof q.timeSec === 'number' ? `
                      <button class="cds-btn-outline cds-btn-sm" type="button" data-coach-seek="${q.timeSec}">
                        ${SVG.play}
                        <span>Xem đoạn video giải thích (${escapeHtml(q.timeStr || formatClock(q.timeSec))})</span>
                      </button>
                    ` : ''}
                  </div>
                  <div class="cds-quiz-question">${escapeHtml(q.question)}</div>
                  <div class="cds-quiz-options">
                    ${(q.options || []).map((opt, optIdx) => {
                      let optClass = '';
                      let statusSvg = '';
                      if (isAnswered) {
                        if (optIdx === q.correctIndex) {
                          optClass = 'correct';
                          statusSvg = SVG.check;
                        } else if (optIdx === userChoice) {
                          optClass = 'wrong';
                          statusSvg = SVG.close;
                        }
                      }
                      return `
                        <button type="button" class="cds-quiz-option ${optClass}" data-quiz-q="${escapeHtml(q.id)}" data-quiz-opt="${optIdx}">
                          <span class="cds-quiz-opt-letter">${escapeHtml(opt.label)}</span>
                          <span style="flex:1; text-align:left;">${escapeHtml(opt.text)}</span>
                          ${statusSvg ? `<span style="flex-shrink:0;">${statusSvg}</span>` : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>
                  <div class="cds-quiz-explanation ${isAnswered ? '' : 'hidden'} ${isRight ? 'correct' : 'wrong'}" id="quiz_exp_${escapeHtml(q.id)}">
                    <div style="font-weight:700; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
                      ${isRight ? `${SVG.check} <span>Chính xác!</span>` : `${SVG.alert} <span>Chưa chính xác — Đáp án đúng là ${escapeHtml(q.options?.[q.correctIndex]?.label || '')}</span>`}
                    </div>
                    <div>${escapeHtml(q.explanation || '')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 2. Key Takeaways -->
      <div class="cds-coach-section">
        <div class="cds-coach-section-title">
          <span>2. Tóm tắt ý chính theo mạch bài giảng (Key Takeaways)</span>
          <span class="cds-status-pill cds-status-pill--neutral">${guide.takeaways.length} phần</span>
        </div>
        ${guide.takeaways.length === 0 ? `
          <div style="font-size:13.5px; color:var(--cds-text-muted);">Chưa có dữ liệu tóm tắt cho bài học này.</div>
        ` : `
          <div>
            ${guide.takeaways.map(t => `
              <div class="cds-takeaway-item">
                ${typeof t.timeSec === 'number' ? `
                  <button class="cds-btn-outline cds-btn-sm" type="button" data-coach-seek="${t.timeSec}" style="flex-shrink:0;">
                    ${SVG.play}
                    <span>${escapeHtml(t.timeStr)}</span>
                  </button>
                ` : `
                  <span class="cds-status-pill cds-status-pill--neutral" style="flex-shrink:0;">${escapeHtml(t.timeStr)}</span>
                `}
                <div style="min-width:0; flex:1;">
                  <div style="font-size:14px; color:var(--cds-text-primary); line-height:1.5;">${escapeHtml(t.en)}</div>
                  ${t.vi ? `<div style="font-size:13.5px; color:#1E3A8A; background:#F5F8FF; padding:6px 10px; border-left:3px solid var(--cds-blue); border-radius:0 4px 4px 0; margin-top:6px;">${escapeHtml(t.vi)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- 3. Domain Glossary -->
      <div class="cds-coach-section">
        <div class="cds-coach-section-title">
          <span>3. Thuật ngữ Chuyên ngành BA · PM · Product liên quan</span>
          <span class="cds-status-pill cds-status-pill--synced">${guide.glossary.length} thuật ngữ</span>
        </div>
        <div class="cds-glossary-grid">
          ${guide.glossary.map(g => `
            <div class="cds-glossary-card">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                <span style="font-weight:700; font-size:14px; color:var(--cds-blue);">${escapeHtml(g.term)}</span>
                <span class="cds-status-pill cds-status-pill--neutral">${escapeHtml(g.category)}</span>
              </div>
              <div style="font-size:13px; color:var(--cds-text-primary); line-height:1.45;">
                ${escapeHtml(g.definitionVi)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 4. Self-Check Flashcards -->
      <div class="cds-coach-section">
        <div class="cds-coach-section-title">
          <span>4. Câu hỏi Tự kiểm tra &amp; Ôn tập nhanh (Flashcards)</span>
          <span style="font-size:12px; font-weight:600; color:var(--cds-text-secondary);">Bấm để lật xem giải thích</span>
        </div>
        <div>
          ${guide.flashcards.map(fc => `
            <div class="cds-flashcard-item">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div style="font-weight:700; font-size:14px; color:var(--cds-text-primary);">${escapeHtml(fc.question)}</div>
                <button class="cds-btn-outline cds-btn-sm" type="button" data-toggle-fc="${escapeHtml(fc.id)}" style="flex-shrink:0;">
                  ${SVG.eye}
                  <span>Xem đáp án</span>
                </button>
              </div>
              <div id="fc_ans_${escapeHtml(fc.id)}" class="cds-flashcard-answer hidden">${escapeHtml(fc.answer)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function setupCoachEvents(ctx, contentData) {
  const refreshCoachHtml = () => {
    const coachContainer = document.getElementById('tabBodyCoach') || document.getElementById('readingCoachContainer');
    if (coachContainer) {
      coachContainer.innerHTML = buildCoachPanelHtml(ctx, contentData);
      setupCoachEvents(ctx, contentData);
    }
  };

  document.querySelectorAll('[data-quiz-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-quiz-q');
      const optIdx = parseInt(btn.getAttribute('data-quiz-opt'), 10);
      if (!qId || Number.isNaN(optIdx)) return;
      state.quizUserAnswers[qId] = optIdx;
      refreshCoachHtml();

      const quizList = contentData.studyGuide?.quiz || [];
      const answered = quizList.filter(q => typeof state.quizUserAnswers[q.id] === 'number').length;
      if (answered === quizList.length && quizList.length > 0) {
        const right = quizList.filter(q => state.quizUserAnswers[q.id] === q.correctIndex).length;
        showHudToast(`Hoàn thành Quiz: Đúng ${right}/${quizList.length} câu (${Math.round((right / quizList.length) * 100)}%)!`, SVG.award);
      }
    });
  });

  document.getElementById('btnResetQuiz')?.addEventListener('click', () => {
    state.quizUserAnswers = {};
    refreshCoachHtml();
    showHudToast('Đã tạo lại bài kiểm tra trắc nghiệm.', SVG.restart);
  });

  document.querySelectorAll('[data-coach-seek]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseFloat(btn.getAttribute('data-coach-seek'));
      const v = document.getElementById('activeVideoPlayer');
      if (v && !Number.isNaN(sec)) {
        v.currentTime = sec;
        v.play().catch(() => {});
        const mainStage = document.getElementById('lessonStage');
        if (mainStage) mainStage.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('[data-toggle-fc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fcId = btn.getAttribute('data-toggle-fc');
      const ansEl = document.getElementById(`fc_ans_${fcId}`);
      if (ansEl) {
        const isHidden = ansEl.classList.toggle('hidden');
        btn.innerHTML = `${SVG.eye} <span>${isHidden ? 'Xem đáp án' : 'Ẩn đáp án'}</span>`;
      }
    });
  });

  document.getElementById('btnCoachTranslateVi')?.addEventListener('click', async () => {
    await ensureLessonVietnameseTranslated(ctx, contentData);
    renderCourseraParagraphTranscript(ctx, contentData);
  });

  document.getElementById('btnCoachExportMd')?.addEventListener('click', () => {
    exportStudyGuideMarkdown(ctx.course, ctx, contentData);
  });
}

function exportStudyGuideMarkdown(courseObj, activeCtx = null, activeContentData = null) {
  const course = courseObj || state.catalog?.courses?.find(c => c.id === state.activeCourseId) || state.catalog?.courses?.[0];
  if (!course) return;
  const st = getCourseStats(course);
  const lines = [];
  lines.push(`# Sổ tay Học tập & Tổng hợp Kiến thức: ${course.title}`);
  lines.push(`- **Mã khóa học**: \`${course.code}\``);
  lines.push(`- **Tiến độ hoàn thành**: **${st.completed}/${st.total} bài học (${st.pct}%)**`);
  lines.push(`- **Ngày xuất tài liệu**: ${new Date().toLocaleString('vi-VN')}`);
  lines.push(`- **Thư mục Google Drive**: ${course.folderUrl}`);
  lines.push('');

  if (activeCtx && activeContentData?.studyGuide) {
    const g = activeContentData.studyGuide;
    lines.push(`## Bài học đang xem: ${activeCtx.lesson.title}`);
    lines.push(`### 1. Tóm tắt trọng tâm (Key Takeaways)`);
    for (const t of g.takeaways || []) {
      lines.push(`- **[${t.timeStr}]** ${t.en}`);
      if (t.vi) lines.push(`  - *Tiếng Việt*: ${t.vi}`);
    }
    lines.push('');
    lines.push(`### 2. Thuật ngữ Chuyên ngành (BA / PM / Product Glossary)`);
    for (const term of g.glossary || []) {
      lines.push(`- **${term.term}** (*${term.category}*): ${term.definitionVi}`);
    }
    lines.push('');
  }

  const courseNotes = state.user.notes.filter(n => n.courseId === course.id);
  lines.push(`## Ghi chú cá nhân trong khóa học (${courseNotes.length} ghi chú)`);
  if (courseNotes.length === 0) {
    lines.push(`*(Chưa có ghi chú cá nhân nào cho khóa học này)*`);
  } else {
    for (const n of courseNotes) {
      const lCtx = findLessonContext(n.lessonId);
      const timeTag = typeof n.timestampSec === 'number' ? ` [${formatClock(n.timestampSec)}]` : '';
      lines.push(`- **${lCtx ? lCtx.lesson.title : n.lessonId}**${timeTag}: ${n.content}`);
      if (n.imageDataUrl) {
        lines.push(`  ![Slide ${formatClock(n.timestampSec || 0)}](${n.imageDataUrl})`);
      }
    }
  }
  lines.push('');

  lines.push(`## Đề cương & Trạng thái các Bài học (${course.modules.length} Modules)`);
  for (const mod of course.modules) {
    lines.push(`### ${mod.title}`);
    for (const sec of mod.sections) {
      for (const les of sec.lessons) {
        const done = state.user.progress[les.id]?.status === 'completed';
        lines.push(`- [${done ? 'x' : ' '}] **${les.title}** (${les.type === 'video' ? 'Video 720p' : 'Reading'})`);
      }
    }
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${course.code || 'Course'}-Study-Guide.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Reading / Supplement View (Highlight + Bilingual EN-VI + Audio TTS) ───────────────────────
const readingBilingualState = {}; // lessonId -> { active: boolean, blocksVi: string[] }

function renderReadingHighlightsSummaryHtml(lessonId) {
  const list = state.user.highlights?.[lessonId] || [];
  if (list.length === 0) return '';
  const colorLabel = {
    yellow: { bg: '#FEF08A', border: '#FACC15', name: 'Quan trọng' },
    green: { bg: '#BBF7D0', border: '#4ADE80', name: 'Định nghĩa' },
    blue: { bg: '#BAE6FD', border: '#38BDF8', name: 'Ví dụ / Công thức' }
  };
  return `
    <div class="cds-coach-section" style="margin-bottom:18px; background:#FFFEF5; border-color:#FDE047;">
      <div class="cds-coach-sec-title" style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <span style="display:inline-flex; align-items:center; gap:6px;">
          ${SVG.highlight}
          <span>Đoạn văn đã tô sáng trong bài đọc này (${list.length})</span>
        </span>
        <span style="font-size:12px; font-weight:500; color:var(--cds-text-secondary);">Bôi đen bất kỳ câu nào bên dưới rồi bấm nút Tô sáng trên thanh công cụ</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        ${list.map(hl => {
          const c = colorLabel[hl.color] || colorLabel.yellow;
          return `
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:8px 12px; background:#FFFFFF; border-left:4px solid ${c.border}; border-radius:6px; border:1px solid var(--cds-border-light); border-left-width:4px; border-left-color:${c.border};">
              <div style="font-size:13.5px; color:var(--cds-text-primary); line-height:1.5;">
                <span style="background:${c.bg}; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; margin-right:6px;">${c.name}</span>
                "${escapeHtml(hl.text)}"
              </div>
              <button type="button" class="cds-icon-close" data-delete-hl="${escapeHtml(hl.id)}" title="Xóa tô sáng" aria-label="Xóa tô sáng">
                ${SVG.trash}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function applySavedHighlightsToReadingDom(lessonId) {
  const articleEl = document.getElementById('readingArticleBody');
  if (!articleEl) return;
  const list = state.user.highlights?.[lessonId] || [];
  if (list.length === 0) return;

  // Walk text nodes and wrap matching highlight snippets
  const walker = document.createTreeWalker(articleEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && !node.parentElement.closest('mark, .cds-reading-bi-vi, script, style')) {
      textNodes.push(node);
    }
  }

  for (const hl of list) {
    const snippet = String(hl.text || '').trim();
    if (snippet.length < 4) continue;
    const targetSnippet = snippet.slice(0, 140);
    for (const tNode of textNodes) {
      if (!tNode.parentNode) continue;
      const val = tNode.nodeValue || '';
      const idx = val.toLowerCase().indexOf(targetSnippet.toLowerCase());
      if (idx !== -1) {
        const before = val.slice(0, idx);
        const match = val.slice(idx, idx + targetSnippet.length);
        const after = val.slice(idx + targetSnippet.length);
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        const mark = document.createElement('mark');
        mark.className = `cds-reading-hl cds-reading-hl--${hl.color || 'yellow'}`;
        mark.textContent = match;
        frag.appendChild(mark);
        if (after) frag.appendChild(document.createTextNode(after));
        tNode.parentNode.replaceChild(frag, tNode);
        break;
      }
    }
  }
}

function injectBilingualParagraphsIntoReadingDom(lessonId) {
  const articleEl = document.getElementById('readingArticleBody');
  if (!articleEl) return;
  articleEl.querySelectorAll('.cds-reading-bi-vi').forEach(el => el.remove());

  const bi = readingBilingualState[lessonId];
  if (!bi || !bi.active || !Array.isArray(bi.blocksVi) || bi.blocksVi.length === 0) return;

  const blockEls = Array.from(articleEl.querySelectorAll('p, li, h2, h3, blockquote'))
    .filter(el => (el.textContent || '').trim().length >= 15);

  let viIdx = 0;
  for (const el of blockEls) {
    if (viIdx >= bi.blocksVi.length) break;
    const viText = bi.blocksVi[viIdx++];
    if (!viText) continue;
    const viDiv = document.createElement('div');
    viDiv.className = 'cds-reading-bi-vi';
    viDiv.textContent = viText;
    el.insertAdjacentElement('afterend', viDiv);
  }
}

function buildReadingLectureHtml(ctx, contentData) {
  const { lesson, nextLesson } = ctx;
  const isDone = state.user.progress[lesson.id]?.status === 'completed';
  const biActive = Boolean(readingBilingualState[lesson.id]?.active);

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
            <a class="cds-btn-outline" href="/api/drive/media/${pdf.id}" download="${escapeHtml(pdf.name)}">${SVG.download} <span>Download</span></a>
            <a class="cds-btn-outline" href="${pdf.viewUrl}" target="_blank" rel="noopener">${SVG.external} <span>Google Drive</span></a>
          </div>
        </div>
        <iframe class="cds-pdf-iframe" src="${src}"></iframe>
      </div>
    `;
  }).join('');

  return `
    <div class="cds-reading-container">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
        <h1 class="cds-lecture-h1">${escapeHtml(lesson.title)}</h1>
        <a class="cds-btn-outline" href="${lesson.instructions?.viewUrl || lesson.folderUrl}" target="_blank" rel="noopener">
          ${SVG.external}
          <span>Google Drive Source</span>
        </a>
      </div>

      ${contentData.htmlContent ? `
        <div class="cds-reading-toolbar">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button type="button" class="${biActive ? 'cds-btn-completed' : 'cds-btn-outline'} cds-btn-sm" id="btnTranslateReadingVi">
              ${SVG.translate}
              <span>${biActive ? 'Song ngữ Anh – Việt: Bật' : 'Dịch Song ngữ Anh – Việt'}</span>
            </button>
            <button type="button" class="cds-btn-outline cds-btn-sm" id="btnReadingTtsToggle">
              ${SVG.volume}
              <span>Đọc bài (Audio TTS)</span>
            </button>
          </div>

          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:12px; font-weight:700; color:var(--cds-text-secondary);">Bôi đen chữ để tô sáng:</span>
            <button type="button" class="cds-btn-outline cds-btn-sm" id="btnHlYellow" style="border-color:#EAB308; background:#FEF9C3; color:#854D0E;" title="Bôi đen đoạn văn rồi bấm để tô vàng">
              ${SVG.highlight}
              <span>Tô vàng</span>
            </button>
            <button type="button" class="cds-btn-outline cds-btn-sm" id="btnHlGreen" style="border-color:#22C55E; background:#DCFCE7; color:#166534;" title="Bôi đen đoạn văn rồi bấm để tô xanh lá">
              ${SVG.highlight}
              <span>Tô xanh lá</span>
            </button>
            <button type="button" class="cds-btn-outline cds-btn-sm" id="btnHlBlue" style="border-color:#0EA5E9; background:#E0F2FE; color:#075985;" title="Bôi đen đoạn văn rồi bấm để tô xanh dương">
              ${SVG.highlight}
              <span>Tô xanh dương</span>
            </button>
            <button type="button" class="cds-btn-outline cds-btn-sm" id="btnHlToNote" title="Lưu đoạn văn đang bôi đen vào sổ tay Ghi chú">
              ${SVG.note}
              <span>Lưu vào Ghi chú</span>
            </button>
          </div>
        </div>

        <div id="readingHighlightsBox">
          ${renderReadingHighlightsSummaryHtml(lesson.id)}
        </div>

        <div class="cds-reading-body" id="readingArticleBody">
          ${contentData.htmlContent}
        </div>
      ` : ''}

      ${pdfBlocks}

      <div id="readingCoachContainer" style="margin-top:28px;">
        ${buildCoachPanelHtml(ctx, contentData)}
      </div>

      <div class="cds-reading-bottom-bar">
        <button class="${isDone ? 'cds-btn-completed' : 'cds-btn-primary'}" data-action="toggle-complete">
          ${isDone ? `${SVG.check} <span>Completed</span>` : `<span>Mark as completed</span>`}
        </button>
        ${nextLesson ? `
          <button class="cds-btn-outline" id="btnReadingNext">
            <span>Go to next item</span>
            ${SVG.chevronRight}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function setupReadingLectureEvents(ctx, contentData) {
  const { course, lesson, nextLesson } = ctx;
  setupCoachEvents(ctx, contentData);

  applySavedHighlightsToReadingDom(lesson.id);
  injectBilingualParagraphsIntoReadingDom(lesson.id);

  function bindHighlightDeleteButtons() {
    document.querySelectorAll('#readingHighlightsBox [data-delete-hl]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const hlId = btn.getAttribute('data-delete-hl');
        if (!hlId) return;
        const res = await apiDelete(`/api/highlights/${encodeURIComponent(lesson.id)}/${encodeURIComponent(hlId)}`);
        if (!state.user.highlights) state.user.highlights = {};
        state.user.highlights[lesson.id] = res.highlights || [];
        renderLectureContent(ctx, contentData);
        showHudToast('Đã xóa đoạn tô sáng', SVG.trash);
      });
    });
  }
  bindHighlightDeleteButtons();

  async function saveSelectedReadingHighlight(color) {
    const sel = window.getSelection();
    const text = (sel ? sel.toString() : '').trim();
    if (!text || text.length < 3) {
      showHudToast('Hãy dùng chuột bôi đen một câu trong bài đọc trước khi bấm Tô sáng!', SVG.alert);
      return;
    }
    const res = await apiPost('/api/highlights', {
      lessonId: lesson.id,
      courseId: course.id,
      text,
      color
    });
    if (!state.user.highlights) state.user.highlights = {};
    state.user.highlights[lesson.id] = res.highlights || [];
    sel.removeAllRanges();
    renderLectureContent(ctx, contentData);
    showHudToast('Đã tô sáng và lưu đoạn văn trọng tâm!', SVG.highlight);
  }

  document.getElementById('btnHlYellow')?.addEventListener('click', () => saveSelectedReadingHighlight('yellow'));
  document.getElementById('btnHlGreen')?.addEventListener('click', () => saveSelectedReadingHighlight('green'));
  document.getElementById('btnHlBlue')?.addEventListener('click', () => saveSelectedReadingHighlight('blue'));

  document.getElementById('btnHlToNote')?.addEventListener('click', async () => {
    const sel = window.getSelection();
    const text = (sel ? sel.toString() : '').trim();
    if (!text || text.length < 3) {
      showHudToast('Hãy bôi đen đoạn văn muốn trích dẫn vào sổ tay Ghi chú!', SVG.alert);
      return;
    }
    const res = await apiPost('/api/notes', {
      lessonId: lesson.id,
      courseId: course.id,
      timestampSec: null,
      content: `Trích dẫn bài đọc "${lesson.title}":\n"${text}"`
    });
    state.user.notes = res.notes;
    sel.removeAllRanges();
    renderHeader();
    showHudToast('Đã lưu trích dẫn bài đọc vào sổ tay Ghi chú!', SVG.note);
  });

  // Bilingual EN-VI Reading toggle
  const btnTransVi = document.getElementById('btnTranslateReadingVi');
  btnTransVi?.addEventListener('click', async () => {
    const existing = readingBilingualState[lesson.id];
    if (existing && existing.blocksVi && existing.blocksVi.length > 0) {
      existing.active = !existing.active;
      renderLectureContent(ctx, contentData);
      showHudToast(existing.active ? 'Đã bật chế độ Đọc Song Ngữ Anh – Việt' : 'Đã tắt dịch song ngữ', SVG.translate);
      return;
    }
    try {
      btnTransVi.disabled = true;
      btnTransVi.innerHTML = `<span class="cds-spinner--sm"></span> <span>Đang dịch bài đọc sang Tiếng Việt...</span>`;
      const res = await apiPost(`/api/lesson/${encodeURIComponent(lesson.id)}/translate-reading`, {});
      readingBilingualState[lesson.id] = {
        active: true,
        blocksVi: res.blocksVi || []
      };
      renderLectureContent(ctx, contentData);
      showHudToast('Đã dịch song ngữ Anh – Việt toàn bộ bài đọc!', SVG.translate);
    } catch (err) {
      btnTransVi.disabled = false;
      btnTransVi.innerHTML = `${SVG.translate} <span>Dịch Song ngữ Anh – Việt</span>`;
      showHudToast('Không thể dịch bài đọc lúc này: ' + err.message, SVG.alert);
    }
  });

  // Audio Text-to-Speech (TTS) for Reading
  const btnTts = document.getElementById('btnReadingTtsToggle');
  btnTts?.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      showHudToast('Trình duyệt của bạn không hỗ trợ đọc giọng nói (Web Speech API).', SVG.alert);
      return;
    }
    if (readingTtsActive) {
      stopReadingTts();
      showHudToast('Đã dừng đọc bài (Audio TTS)', SVG.stop);
      return;
    }
    const articleEl = document.getElementById('readingArticleBody');
    if (!articleEl) return;
    const clone = articleEl.cloneNode(true);
    clone.querySelectorAll('.cds-reading-bi-vi').forEach(el => el.remove());
    const rawText = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    if (!rawText) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(rawText.slice(0, 12000));
    utter.lang = 'en-US';
    utter.rate = Number(state.user.preferences?.playbackRate) || 1;
    utter.onend = () => {
      readingTtsActive = false;
      const b = document.getElementById('btnReadingTtsToggle');
      if (b) {
        b.classList.remove('cds-btn-completed');
        b.classList.add('cds-btn-outline');
        b.innerHTML = `${SVG.volume} <span>Đọc bài (Audio TTS)</span>`;
      }
    };
    readingTtsActive = true;
    btnTts.classList.remove('cds-btn-outline');
    btnTts.classList.add('cds-btn-completed');
    btnTts.innerHTML = `${SVG.stop} <span>Dừng đọc (Audio TTS)</span>`;
    window.speechSynthesis.speak(utter);
    showHudToast('Đang đọc thành tiếng bài Reading (Audio TTS)...', SVG.volume);
  });

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
let pendingNoteSlideDataUrl = null;

function renderPendingSlidePreview() {
  const wrap = document.getElementById('pendingSlidePreviewBox');
  if (!wrap) return;
  if (!pendingNoteSlideDataUrl) {
    wrap.innerHTML = '';
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');
  wrap.innerHTML = `
    <div class="cds-pending-slide-box">
      <img src="${pendingNoteSlideDataUrl}" alt="Slide Preview" class="cds-note-slide-img" />
      <div style="display:flex; flex-direction:column; gap:6px;">
        <span style="font-size:12.5px; font-weight:700; color:var(--cds-blue);">Đã đính kèm khung hình Slide hiện tại</span>
        <button type="button" class="cds-btn-outline cds-btn-sm" id="btnRemovePendingSlide">
          ${SVG.trash}
          <span>Bỏ ảnh đính kèm</span>
        </button>
      </div>
    </div>
  `;
  document.getElementById('btnRemovePendingSlide')?.addEventListener('click', () => {
    pendingNoteSlideDataUrl = null;
    renderPendingSlidePreview();
  });
}

function buildNotesPanelHtml(ctx) {
  const { lesson } = ctx;
  const notes = state.user.notes.filter(n => n.lessonId === lesson.id);

  return `
    <div style="max-width:760px;">
      <div style="margin-bottom:16px;">
        <textarea id="noteInput" placeholder="Ghi chú kiến thức hoặc bấm 'Chụp Slide' để lưu ngay sơ đồ trên màn hình video..." style="width:100%; min-height:80px; border:1px solid var(--cds-border); border-radius:4px; padding:10px; font-family:inherit; font-size:14.5px; margin-bottom:8px;"></textarea>
        <div id="pendingSlidePreviewBox" class="hidden" style="margin-bottom:10px;"></div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <button class="cds-btn-primary" id="btnSaveNote" type="button">
            ${SVG.note}
            <span>Save note</span>
          </button>
          ${lesson.type === 'video' ? `
            <button class="cds-btn-outline" type="button" id="btnAttachSlideToNote">
              ${SVG.camera}
              <span>Đính kèm khung hình Slide</span>
            </button>
          ` : ''}
          <button class="cds-btn-outline" type="button" id="btnExportNotesMd">
            ${SVG.download}
            <span>Export Study Guide (.md)</span>
          </button>
        </div>
      </div>
      <div id="lessonNotesList" class="cds-downloads-list">
        ${renderNotesRowsHtml(notes)}
      </div>
    </div>
  `;
}

function renderNotesRowsHtml(notes) {
  if (!notes || notes.length === 0) {
    return `<div class="cds-empty-state">No notes or captured slides saved for this lesson yet.</div>`;
  }
  return notes.map(n => `
    <div class="cds-download-row" style="align-items:flex-start;">
      <div style="min-width:0; flex:1;">
        ${typeof n.timestampSec === 'number' ? `
          <button class="cds-btn-outline cds-btn-sm" data-seek="${n.timestampSec}" style="margin-bottom:6px;">
            ${SVG.play}
            <span>${formatClock(n.timestampSec)}</span>
          </button>
        ` : ''}
        <div style="white-space:pre-wrap; font-size:14.5px;">${escapeHtml(n.content)}</div>
        ${n.imageDataUrl ? `
          <div class="cds-note-slide-wrap" data-lightbox-src="${escapeHtml(n.imageDataUrl)}" data-lightbox-title="${escapeHtml(n.content.slice(0, 50) || 'Slide')}">
            <img src="${escapeHtml(n.imageDataUrl)}" alt="Captured Slide" class="cds-note-slide-img" />
            <span class="cds-note-slide-badge">${SVG.zoomIn} <span>Phóng to Slide</span></span>
          </div>
        ` : ''}
      </div>
      <button class="cds-icon-close" data-delete-note="${n.id}" title="Delete note" aria-label="Delete note">
        ${SVG.trash}
      </button>
    </div>
  `).join('');
}

function setupNotesEvents(ctx, contentData = null) {
  const { course, lesson } = ctx;
  const btnSave = document.getElementById('btnSaveNote');
  const noteInput = document.getElementById('noteInput');
  pendingNoteSlideDataUrl = null;

  document.getElementById('btnExportNotesMd')?.addEventListener('click', () => {
    exportStudyGuideMarkdown(course, ctx, contentData);
  });

  document.getElementById('btnAttachSlideToNote')?.addEventListener('click', () => {
    const imgUrl = captureVideoSlideDataUrl();
    if (!imgUrl) {
      showHudToast('Hãy phát video để chụp khung hình Slide.', SVG.alert);
      return;
    }
    pendingNoteSlideDataUrl = imgUrl;
    renderPendingSlidePreview();
  });

  if (btnSave && noteInput) {
    btnSave.addEventListener('click', async () => {
      const content = noteInput.value.trim();
      if (!content && !pendingNoteSlideDataUrl) return;
      const v = document.getElementById('activeVideoPlayer');
      const timestampSec = (lesson.type === 'video' && v) ? Math.round(v.currentTime) : null;

      const res = await apiPost('/api/notes', {
        lessonId: lesson.id,
        courseId: course.id,
        timestampSec,
        content,
        imageDataUrl: pendingNoteSlideDataUrl
      });
      state.user.notes = res.notes;
      noteInput.value = '';
      pendingNoteSlideDataUrl = null;
      renderPendingSlidePreview();
      renderHeader();

      const notesCount = state.user.notes.filter(n => n.lessonId === lesson.id).length;
      const tabBtn = document.getElementById('videoNotesTabBtn');
      if (tabBtn) tabBtn.textContent = `Notes (${notesCount})`;

      const listEl = document.getElementById('lessonNotesList');
      if (listEl) {
        listEl.innerHTML = renderNotesRowsHtml(state.user.notes.filter(n => n.lessonId === lesson.id));
        bindNoteActions();
      }
      showHudToast('Đã lưu ghi chú bài học!', SVG.check);
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

  document.querySelectorAll('#lessonNotesList [data-lightbox-src]').forEach(el => {
    el.addEventListener('click', () => {
      openSlideLightbox(el.getAttribute('data-lightbox-src'), el.getAttribute('data-lightbox-title') || 'Slide');
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
          <a class="cds-btn-outline" href="/api/drive/media/${lesson.video.id}" download="${escapeHtml(lesson.video.name)}">${SVG.download} <span>Download MP4</span></a>
          <a class="cds-btn-outline" href="${lesson.video.viewUrl}" target="_blank" rel="noopener">${SVG.external} <span>Open in Drive</span></a>
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
        <a class="cds-btn-outline" href="${lesson.subtitles.en.viewUrl}" target="_blank" rel="noopener">${SVG.external} <span>Open in Drive</span></a>
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
        <a class="cds-btn-outline" href="${lesson.subtitles.vi.viewUrl}" target="_blank" rel="noopener">${SVG.external} <span>Open in Drive</span></a>
      </div>
    `);
  }

  rows.push(`
    <div class="cds-download-row">
      <div>
        <strong>Google Drive Lesson Folder</strong>
        <div style="font-size:13px; color:var(--cds-text-muted);">Folder ID: <code>${lesson.folderId}</code></div>
      </div>
      <a class="cds-btn-outline" href="${lesson.folderUrl}" target="_blank" rel="noopener">${SVG.external} <span>Open Folder in Drive</span></a>
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

  function bindSafeModalBackdrop(modalEl, onClose) {
    if (!modalEl) return;
    let mouseDownOnBackdrop = false;
    modalEl.addEventListener('mousedown', (e) => {
      mouseDownOnBackdrop = (e.target === modalEl);
    });
    modalEl.addEventListener('click', (e) => {
      if (mouseDownOnBackdrop && e.target === modalEl) {
        onClose();
      }
      mouseDownOnBackdrop = false;
    });
  }

  const shortcutsModal = document.getElementById('shortcutsModal');
  const slideLightboxModal = document.getElementById('slideLightboxModal');
  const bookmarksModal = document.getElementById('bookmarksModal');
  const bookmarksBody = document.getElementById('bookmarksContainer');
  const closeShortcuts = () => shortcutsModal?.classList.add('hidden');
  const closeSlideLightbox = () => slideLightboxModal?.classList.add('hidden');
  const closeBookmarks = () => bookmarksModal?.classList.add('hidden');

  function renderBookmarksModal() {
    if (!bookmarksBody) return;
    const bookmarks = state.user.bookmarks || [];
    if (bookmarks.length === 0) {
      bookmarksBody.innerHTML = `<div class="cds-empty-state">Chưa có bài học nào được đánh dấu (Bookmark). Hãy bấm biểu tượng Ghim cạnh tên bài giảng hoặc nhấn phím <strong>B</strong> khi đang xem bài học để lưu vào kho tra cứu nhanh.</div>`;
      return;
    }
    bookmarksBody.innerHTML = `<div class="cds-downloads-list">${bookmarks.map(lid => {
      const ctx = findLessonContext(lid);
      if (!ctx) return '';
      const { course, module, lesson } = ctx;
      const prog = state.user.progress?.[lesson.id];
      const isDone = prog?.status === 'completed';
      const resumeSec = (!isDone && prog?.currentTime > 5) ? Math.floor(prog.currentTime) : null;
      return `
        <div class="cds-download-row">
          <div class="cds-roadmap-item-left">
            <span class="cds-check-circle ${isDone ? 'completed' : ''}" style="color:var(--cds-blue);">
              ${isDone ? SVG.check : (lesson.type === 'video' ? SVG.play : SVG.reading)}
            </span>
            <div style="min-width:0; flex:1;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:11.5px; font-weight:700; color:var(--cds-blue);">${escapeHtml(course.code)}</span>
                <span style="font-weight:700; font-size:14.5px; color:var(--cds-text-primary);">${escapeHtml(lesson.title)}</span>
                <span class="cds-status-pill ${isDone ? 'cds-status-pill--synced' : 'cds-status-pill--running'}">
                  ${isDone ? `${SVG.check} <span>Completed</span>` : `<span>${lesson.type === 'video' ? 'Video 720p' : 'Reading'} · ${lesson.durationText}</span>`}
                </span>
              </div>
              <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:2px;">
                ${escapeHtml(course.title)} › ${escapeHtml(module.title)}
              </div>
            </div>
          </div>
          <div class="cds-roadmap-item-actions">
            <button type="button" class="cds-btn-outline cds-btn-sm" data-unbookmark-modal="${escapeHtml(lesson.id)}" title="Bỏ ghim khỏi danh sách đã lưu">
              ${SVG.trash}
              <span>Bỏ ghim</span>
            </button>
            <button type="button" class="cds-btn-primary cds-btn-sm" data-open-bookmark-course="${escapeHtml(course.id)}" data-open-bookmark-lesson="${escapeHtml(lesson.id)}" data-open-bookmark-sec="${resumeSec || ''}">
              ${SVG.play}
              <span>${resumeSec ? `Học tiếp (${formatClock(resumeSec)})` : 'Mở bài học'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('')}</div>`;

    bookmarksBody.querySelectorAll('[data-unbookmark-modal]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const lid = btn.getAttribute('data-unbookmark-modal');
        if (lid) {
          await toggleLessonBookmark(lid);
          renderBookmarksModal();
        }
      });
    });

    bookmarksBody.querySelectorAll('[data-open-bookmark-lesson]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-open-bookmark-course');
        const lId = btn.getAttribute('data-open-bookmark-lesson');
        const sec = btn.getAttribute('data-open-bookmark-sec');
        closeBookmarks();
        openLecture(cId, lId, sec ? parseFloat(sec) : null);
      });
    });
  }

  document.getElementById('btnOpenBookmarks')?.addEventListener('click', () => {
    renderBookmarksModal();
    bookmarksModal?.classList.remove('hidden');
  });
  document.getElementById('btnCloseBookmarks')?.addEventListener('click', closeBookmarks);
  bindSafeModalBackdrop(bookmarksModal, closeBookmarks);

  document.getElementById('btnOpenSearch')?.addEventListener('click', openSearch);
  document.getElementById('btnCloseSearch')?.addEventListener('click', closeSearch);
  bindSafeModalBackdrop(searchModal, closeSearch);

  document.getElementById('btnOpenShortcuts')?.addEventListener('click', () => {
    shortcutsModal?.classList.remove('hidden');
  });
  document.getElementById('btnCloseShortcuts')?.addEventListener('click', closeShortcuts);
  bindSafeModalBackdrop(shortcutsModal, closeShortcuts);

  document.getElementById('btnCloseSlideLightbox')?.addEventListener('click', closeSlideLightbox);
  bindSafeModalBackdrop(slideLightboxModal, closeSlideLightbox);

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeShortcuts();
      closeSlideLightbox();
      closeBookmarks();
      document.getElementById('notesModal')?.classList.add('hidden');
      document.getElementById('profileModal')?.classList.add('hidden');
      return;
    }

    // Ignore shortcuts when typing in inputs or when modifier keys are held
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;

    if (e.key === '?') {
      e.preventDefault();
      shortcutsModal?.classList.toggle('hidden');
      return;
    }

    const anyModalOpen = [searchModal, shortcutsModal, slideLightboxModal, bookmarksModal, document.getElementById('notesModal'), document.getElementById('profileModal')]
      .some(m => m && !m.classList.contains('hidden'));
    if (anyModalOpen || state.currentView !== 'lecture') return;

    const key = e.key.toLowerCase();
    const videoEl = document.getElementById('activeVideoPlayer');

    if (key === 't') {
      e.preventDefault();
      toggleTheaterMode();
    } else if (key === 'b') {
      if (state.activeLessonId) {
        e.preventDefault();
        toggleLessonBookmark(state.activeLessonId);
      }
    } else if (key === 'p' && videoEl) {
      e.preventDefault();
      document.getElementById('btnTogglePip')?.click();
    } else if ((e.key === '<' || e.key === ',') && videoEl) {
      e.preventDefault();
      stepVideoPlaybackSpeed(-1);
    } else if ((e.key === '>' || e.key === '.') && videoEl) {
      e.preventDefault();
      stepVideoPlaybackSpeed(1);
    } else if (key === 's') {
      const snapBtn = document.getElementById('btnSnapSlideQuick');
      if (snapBtn && !snapBtn.disabled) {
        e.preventDefault();
        snapBtn.click();
      }
    } else if (key === 'n') {
      e.preventDefault();
      const notesTabBtn = document.querySelector('[data-vtab="notes"]');
      if (notesTabBtn) notesTabBtn.click();
      setTimeout(() => document.getElementById('noteInput')?.focus(), 40);
      showHudToast('Đã mở khung Ghi chú (N)', SVG.note);
    } else if (key === 'c') {
      const subSel = document.getElementById('selectSubtitleLang');
      if (subSel && subSel.options.length > 0) {
        e.preventDefault();
        const nextIdx = (subSel.selectedIndex + 1) % subSel.options.length;
        subSel.selectedIndex = nextIdx;
        subSel.dispatchEvent(new Event('change'));
        showHudToast(`Phụ đề: ${subSel.options[nextIdx].text}`, SVG.translate);
      }
    } else if (key === 'f' && videoEl) {
      e.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        videoEl.requestFullscreen?.();
      }
    } else if (key === 'j' && videoEl) {
      e.preventDefault();
      videoEl.currentTime = Math.max(0, (videoEl.currentTime || 0) - 10);
      showHudToast(`Tua lùi 10s (${formatClock(videoEl.currentTime)})`, SVG.play);
    } else if (key === 'l' && videoEl) {
      e.preventDefault();
      videoEl.currentTime = Math.min(videoEl.duration || Infinity, (videoEl.currentTime || 0) + 10);
      showHudToast(`Tua tới 10s (${formatClock(videoEl.currentTime)})`, SVG.play);
    } else if ((key === 'k' || e.key === ' ') && videoEl && tag !== 'BUTTON' && tag !== 'VIDEO' && tag !== 'A') {
      e.preventDefault();
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
        showHudToast('Đang phát video', SVG.play);
      } else {
        videoEl.pause();
        showHudToast(`Đã tạm dừng tại ${formatClock(videoEl.currentTime)}`, SVG.clock);
      }
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
      const caption = `${ctx ? `${ctx.course.code} · ${ctx.lesson.title}` : ''}${typeof n.timestampSec === 'number' ? ` (${formatClock(n.timestampSec)})` : ''}`;
      return `
        <div class="cds-search-result-item" data-note-course="${n.courseId}" data-note-lesson="${n.lessonId}" data-note-sec="${n.timestampSec ?? ''}">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
            <div style="font-size:13px; font-weight:700; color:var(--cds-blue); display:flex; align-items:center; gap:6px;">
              ${SVG.play}
              <span>${ctx ? `${escapeHtml(ctx.course.code)} · ${escapeHtml(ctx.lesson.title)}` : ''}</span>
              ${typeof n.timestampSec === 'number' ? `<span>(${formatClock(n.timestampSec)})</span>` : ''}
            </div>
            ${n.imageDataUrl ? `
              <button class="cds-btn-outline cds-btn-sm" type="button" data-allnote-zoom="${escapeHtml(n.id)}">
                ${SVG.zoomIn}
                <span>Xem Slide</span>
              </button>
            ` : ''}
          </div>
          ${n.imageDataUrl ? `
            <div class="cds-note-slide-wrap" data-allnote-zoom="${escapeHtml(n.id)}" style="margin-top:8px; max-width:340px;">
              <img src="${n.imageDataUrl}" alt="Slide snapshot" class="cds-note-slide-img" loading="lazy" />
              <span class="cds-note-slide-badge">${SVG.zoomIn} <span>Phóng to Slide</span></span>
            </div>
          ` : ''}
          ${n.content ? `<div style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(n.content)}</div>` : ''}
        </div>
      `;
    }).join('');

    notesBody.querySelectorAll('[data-allnote-zoom]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const noteId = el.getAttribute('data-allnote-zoom');
        const noteObj = state.user.notes.find(x => x.id === noteId);
        if (noteObj?.imageDataUrl) {
          const ctx = findLessonContext(noteObj.lessonId);
          openSlideLightbox(
            noteObj.imageDataUrl,
            `${ctx ? `${ctx.course.code} · ${ctx.lesson.title}` : ''}${typeof noteObj.timestampSec === 'number' ? ` @ ${formatClock(noteObj.timestampSec)}` : ''}`
          );
        }
      });
    });

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
  bindSafeModalBackdrop(notesModal, () => notesModal.classList.add('hidden'));
  document.getElementById('btnExportAllNotesMd')?.addEventListener('click', () => {
    const activeCourse = state.catalog?.courses?.find(c => c.id === state.activeCourseId) || state.catalog?.courses?.[0];
    exportStudyGuideMarkdown(activeCourse, null, null);
  });

  // ── Profile Modal: Thống kê học tập, Gợi ý lộ trình học, Shopping & Get khóa học ─────────
  const profileModal = document.getElementById('profileModal');
  const profileBody = document.getElementById('profileModalBody');
  let activeProfileTab = 'analytics'; // 'analytics' | 'roadmap' | 'discover' | 'crawler'
  let roadmapDataCache = null;
  let lastCheckResult = null;
  let pendingCheckUrl = '';
  let crawlPollTimer = null;

  // Coursera Discovery / Shopping state
  let discoverQuery = 'artificial intelligence';
  let discoverDraftQuery = 'artificial intelligence';
  let discoverExecutedQuery = '';
  let discoverDebounceTimer = null;
  let discoverSearchSeq = 0;
  let discoverPage = 1;
  let discoverHasMore = true;
  let discoverLoadingMore = false;
  let discoverTypeFilter = 'ALL';
  let discoverViOnly = false;
  let discoverItems = [];
  let discoverLoading = false;
  let discoverError = '';
  const inlineCheckMap = {}; // url -> { loading, data }

  const QUICK_TOPICS = [
    { q: 'artificial intelligence', label: 'AI & Generative AI' },
    { q: 'python data science', label: 'Python & Data Science' },
    { q: 'software architecture cloud aws', label: 'Cloud, AWS & Architecture' },
    { q: 'product management', label: 'Product Management' },
    { q: 'business analysis', label: 'Business Analysis' },
    { q: 'project management', label: 'Project Management' },
    { q: 'ux design figma', label: 'UI/UX & Figma' },
    { q: 'sql power bi tableau', label: 'SQL, Power BI & Tableau' },
    { q: 'cybersecurity devops', label: 'Cybersecurity & DevOps' },
    { q: 'financial analysis fintech', label: 'Finance & FinTech' },
    { q: 'digital marketing growth', label: 'Digital Marketing' }
  ];

  async function runCourseraDiscoverSearch(queryStr, appendPage = false, syncInputVal = false) {
    if (discoverDebounceTimer) {
      clearTimeout(discoverDebounceTimer);
      discoverDebounceTimer = null;
    }
    const q = String(queryStr ?? discoverDraftQuery ?? discoverQuery).trim() || 'artificial intelligence';
    const seq = ++discoverSearchSeq;

    if (!appendPage) {
      discoverQuery = q;
      discoverDraftQuery = q;
      discoverPage = 1;
      discoverLoading = true;
      discoverError = '';
      if (syncInputVal) {
        const inp = document.getElementById('discoverSearchInput');
        if (inp && inp.value !== q) inp.value = q;
      }
    } else {
      discoverPage += 1;
      discoverLoadingMore = true;
    }

    if (!profileModal.classList.contains('hidden') && activeProfileTab === 'discover') {
      renderDiscoverResultsOnly();
    }

    try {
      const res = await apiGet(`/api/coursera/discover?q=${encodeURIComponent(discoverQuery)}&page=${discoverPage}`);
      if (seq !== discoverSearchSeq) return; // Ignore stale response if a newer search started
      const newItems = res.items || [];
      discoverExecutedQuery = discoverQuery;
      discoverHasMore = newItems.length >= 10;
      if (!appendPage) {
        discoverItems = newItems;
      } else {
        const existingUrls = new Set(discoverItems.map(x => x.url));
        for (const it of newItems) {
          if (!existingUrls.has(it.url)) {
            existingUrls.add(it.url);
            discoverItems.push(it);
          }
        }
      }
      discoverLoading = false;
      discoverLoadingMore = false;
    } catch (err) {
      if (seq !== discoverSearchSeq) return;
      discoverError = err.message || 'Không thể kết nối danh mục Coursera.';
      discoverLoading = false;
      discoverLoadingMore = false;
    }
    if (!profileModal.classList.contains('hidden') && activeProfileTab === 'discover') {
      renderDiscoverResultsOnly();
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

  function renderDiscoverResultsOnly() {
    const wrapper = document.getElementById('discoverResultsWrapper');
    if (!wrapper) return;

    // Update topic chips active state and type select count without touching #discoverSearchInput
    const discType = document.getElementById('discoverTypeSelect');
    if (discType && discType.options[0]) {
      discType.options[0].textContent = `Tất cả loại (${discoverItems.length})`;
    }
    document.querySelectorAll('[data-discover-topic]').forEach(chip => {
      const tq = chip.getAttribute('data-discover-topic') || '';
      chip.classList.toggle('active', discoverQuery.toLowerCase() === tq.toLowerCase());
    });

    const filteredItems = discoverItems.filter(it => {
      if (discoverTypeFilter !== 'ALL' && it.productType !== discoverTypeFilter) return false;
      if (discoverViOnly && !it.hasViSub) return false;
      return true;
    });

    wrapper.innerHTML = `
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
                        <span class="cds-shop-star" style="display:inline-flex; align-items:center;">${SVG.star}</span>
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

        ${discoverHasMore ? `
          <div style="display:flex; justify-content:center; margin-top:20px;">
            <button class="cds-btn-outline" type="button" id="btnDiscoverLoadMore" ${discoverLoadingMore ? 'disabled' : ''}>
              ${discoverLoadingMore ? `<span class="cds-spinner--sm"></span> <span>Đang tải thêm từ Coursera.org...</span>` : `<span>Xem thêm kết quả từ Coursera.org (Trang tiếp theo)</span>`}
            </button>
          </div>
        ` : ''}
      `}
    `;

    bindOpenCourseButtons(wrapper);

    wrapper.querySelector('#btnDiscoverLoadMore')?.addEventListener('click', () => {
      runCourseraDiscoverSearch(discoverQuery, true, false);
    });

    wrapper.querySelectorAll('[data-shop-check]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetUrl = btn.getAttribute('data-shop-check');
        if (!targetUrl) return;
        inlineCheckMap[targetUrl] = { loading: true };
        renderDiscoverResultsOnly();
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
        renderDiscoverResultsOnly();
      });
    });

    wrapper.querySelectorAll('[data-shop-import]').forEach(btn => {
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

    wrapper.querySelectorAll('[data-shop-detail]').forEach(btn => {
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

    if (activeProfileTab === 'analytics') {
      const progressMap = state.user.progress || {};
      const completedCount = Object.values(progressMap).filter(p => p?.status === 'completed').length;
      const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // Calculate study streak and total study time
      const studyLog = state.user.studyLog || {};
      const totalLoggedSec = Object.values(studyLog).reduce((acc, d) => acc + (Number(d?.secondsWatched) || 0), 0);
      const totalProgressSec = Object.values(progressMap).reduce((acc, p) => acc + (Number(p?.currentTime) || 0), 0);
      const effectiveWatchSec = Math.max(totalLoggedSec, totalProgressSec);
      const watchHours = (effectiveWatchSec / 3600).toFixed(1);

      let streakDays = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const entry = studyLog[key];
        if (entry && (entry.secondsWatched > 0 || entry.lessonsCompleted > 0)) {
          streakDays++;
        } else if (i === 0) {
          continue;
        } else {
          break;
        }
      }
      if (streakDays === 0 && (completedCount > 0 || Object.keys(progressMap).length > 0)) {
        streakDays = 1;
      }

      const todayKey = today.toISOString().slice(0, 10);
      const todaySec = Number(studyLog[todayKey]?.secondsWatched) || 0;
      const todayMin = Math.round(todaySec / 60);
      const goalMin = Number(state.user.preferences?.dailyGoalMinutes) || 30;
      const goalPct = Math.min(100, Math.round((todayMin / Math.max(1, goalMin)) * 100));

      // Build 24-week (168 days) GitHub-style Activity Heatmap
      const heatmapWeeksCount = 24;
      const totalHeatmapDays = heatmapWeeksCount * 7;
      const heatmapCells = [];
      let activeDaysCount = 0;
      for (let i = totalHeatmapDays - 1; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const logEntry = studyLog[key];
        const mins = Math.round((Number(logEntry?.secondsWatched) || 0) / 60);
        const doneItems = Number(logEntry?.lessonsCompleted) || 0;
        if (mins > 0 || doneItems > 0) activeDaysCount++;
        let level = 0;
        if (mins >= 45 || doneItems >= 4) level = 4;
        else if (mins >= 25 || doneItems >= 2) level = 3;
        else if (mins >= 10 || doneItems >= 1) level = 2;
        else if (mins > 0) level = 1;
        heatmapCells.push({
          key,
          mins,
          doneItems,
          level,
          title: `${key}: ${mins} phút học · ${doneItems} bài hoàn thành`
        });
      }

      const notesCount = (state.user.notes || []).length;
      const slidesCount = (state.user.notes || []).filter(n => Boolean(n.imageDataUrl)).length;
      const bookmarksCount = (state.user.bookmarks || []).length;
      const completedCoursesCount = allCourses.filter(c => {
        const st = getCourseStats(c);
        return st.total > 0 && st.completed === st.total;
      }).length;
      const inProgressCoursesCount = allCourses.filter(c => {
        const st = getCourseStats(c);
        return st.completed > 0 && st.completed < st.total;
      }).length;

      // Build list of in-progress lessons for 1-click resume
      const inProgressLessons = [];
      for (const [lessonId, prog] of Object.entries(progressMap)) {
        if (prog && prog.currentTime > 5 && prog.status !== 'completed') {
          const ctx = findLessonContext(lessonId);
          if (ctx) {
            const pct = prog.duration > 0 ? Math.min(99, Math.max(3, Math.round((prog.currentTime / prog.duration) * 100))) : 25;
            inProgressLessons.push({
              course: ctx.course,
              module: ctx.module,
              lesson: ctx.lesson,
              currentTime: prog.currentTime,
              duration: prog.duration || 0,
              pct,
              updatedAt: prog.updatedAt || ''
            });
          }
        }
      }
      inProgressLessons.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

      const stages = roadmapDataCache.stages || [];

      profileBody.innerHTML = `
        <!-- 4 KPI Cards -->
        <div class="cds-analytics-grid">
          <div class="cds-analytics-card">
            <div class="cds-analytics-icon" style="background:#FFF4ED; color:#E04F16;">${SVG.flame}</div>
            <div>
              <div class="cds-analytics-val">${streakDays} ngày liên tiếp</div>
              <div class="cds-analytics-label">Chuỗi ngày học · Đã xem <strong>${watchHours} giờ</strong> video</div>
            </div>
          </div>

          <div class="cds-analytics-card">
            <div class="cds-analytics-icon" style="background:var(--cds-green-bg); color:var(--cds-green);">${SVG.check}</div>
            <div>
              <div class="cds-analytics-val">${completedCount} / ${totalLessons} (${overallPct}%)</div>
              <div class="cds-analytics-label">Bài học đã hoàn thành trên toàn hệ thống</div>
            </div>
          </div>

          <div class="cds-analytics-card">
            <div class="cds-analytics-icon" style="background:var(--cds-blue-light); color:var(--cds-blue);">${SVG.award}</div>
            <div>
              <div class="cds-analytics-val">${completedCoursesCount} hoàn thành · ${inProgressCoursesCount} đang học</div>
              <div class="cds-analytics-label">Tổng số ${allCourses.length} khóa học trên Google Drive</div>
            </div>
          </div>

          <div class="cds-analytics-card">
            <div class="cds-analytics-icon" style="background:#F4F3FF; color:#6938EF;">${SVG.camera}</div>
            <div>
              <div class="cds-analytics-val">${notesCount} ghi chú · ${slidesCount} Slide · ${bookmarksCount} ghim</div>
              <div class="cds-analytics-label">Ghi chú mốc giờ, ảnh chụp Slide &amp; bài học đã ghim</div>
            </div>
          </div>
        </div>

        <!-- Mục tiêu học tập mỗi ngày (Daily Study Goal) & Biểu đồ nhiệt (Activity Heatmap) -->
        <div class="cds-roadmap-stage">
          <div class="cds-roadmap-stage-head" style="margin-bottom:10px;">
            <div>
              <div class="cds-roadmap-stage-title">Mục tiêu Học tập Hàng ngày &amp; Biểu đồ Nhiệt Hoạt động (24 Tuần)</div>
              <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:2px;">
                Hôm nay bạn đã học <strong>${todayMin} / ${goalMin} phút (${goalPct}%)</strong> · Tổng cộng <strong>${activeDaysCount} ngày</strong> có hoạt động học tập.
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:700; color:var(--cds-text-secondary);">Mục tiêu/ngày:</span>
              ${[15, 30, 45, 60].map(g => `
                <button type="button" class="cds-speed-pill ${goalMin === g ? 'active' : ''}" data-set-daily-goal="${g}">${g}p</button>
              `).join('')}
            </div>
          </div>

          <div class="cds-progress-track" style="height:10px; margin-bottom:16px;">
            <div class="cds-progress-fill ${goalPct >= 100 ? 'done' : ''}" style="width:${goalPct}%;"></div>
          </div>

          <div class="cds-heatmap-wrap">
            <div class="cds-heatmap-grid">
              ${heatmapCells.map(c => `
                <div class="cds-heatmap-cell cds-heatmap-cell--l${c.level}" title="${escapeHtml(c.title)}"></div>
              `).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11.5px; color:var(--cds-text-secondary); flex-wrap:wrap; gap:8px;">
              <span>24 tuần gần nhất (di chuột lên từng ô để xem số phút &amp; số bài học trong ngày)</span>
              <div style="display:flex; align-items:center; gap:4px;">
                <span>Ít</span>
                <span class="cds-heatmap-cell cds-heatmap-cell--l0" style="display:inline-block;"></span>
                <span class="cds-heatmap-cell cds-heatmap-cell--l1" style="display:inline-block;"></span>
                <span class="cds-heatmap-cell cds-heatmap-cell--l2" style="display:inline-block;"></span>
                <span class="cds-heatmap-cell cds-heatmap-cell--l3" style="display:inline-block;"></span>
                <span class="cds-heatmap-cell cds-heatmap-cell--l4" style="display:inline-block;"></span>
                <span>Nhiều</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Đang học dở — Học tiếp 1 chạm -->
        <div class="cds-roadmap-stage">
          <div class="cds-roadmap-stage-head" style="margin-bottom:10px;">
            <div>
              <div class="cds-roadmap-stage-title">Đang xem dở — Học tiếp 1 chạm (${inProgressLessons.length})</div>
              <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:2px;">
                Hệ thống tự động lưu vị trí từng giây của mọi bài giảng video bạn đang xem dở. Bấm <strong>Học tiếp</strong> để mở đúng giây đang dừng.
              </div>
            </div>
          </div>

          ${inProgressLessons.length === 0 ? `
            <div style="border:1px solid var(--cds-border-light); border-radius:8px; padding:18px; text-align:center; font-size:13.5px; color:var(--cds-text-muted); background:#FAFBFC;">
              Chưa có video nào đang xem dở. Khi bạn tạm dừng hoặc chuyển bài giữa chừng, bài giảng sẽ xuất hiện tại đây để học tiếp 1 chạm.
            </div>
          ` : `
            <div class="cds-downloads-list">
              ${inProgressLessons.slice(0, 8).map(item => `
                <div class="cds-download-row">
                  <div class="cds-roadmap-item-left">
                    <span class="cds-check-circle" style="color:var(--cds-blue); border-color:var(--cds-blue); background:var(--cds-blue-light);">
                      ${SVG.play}
                    </span>
                    <div style="min-width:0; flex:1;">
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span style="font-size:11.5px; font-weight:700; color:var(--cds-blue);">${escapeHtml(item.course.code)}</span>
                        <span style="font-weight:700; font-size:14.5px; color:var(--cds-text-primary);">${escapeHtml(item.lesson.title)}</span>
                        <span class="cds-status-pill cds-status-pill--running">
                          ${SVG.clock}
                          <span>Đang dừng tại ${formatClock(item.currentTime)}${item.duration > 0 ? ` / ${formatClock(item.duration)}` : ''} (${item.pct}%)</span>
                        </span>
                      </div>
                      <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:2px;">
                        ${escapeHtml(item.course.title)} · ${escapeHtml(item.module.title)}
                      </div>
                      <div class="cds-mini-progress-track" style="max-width:340px; margin-top:6px;">
                        <div class="cds-mini-progress-fill" style="width:${item.pct}%;"></div>
                      </div>
                    </div>
                  </div>
                  <div class="cds-roadmap-item-actions">
                    <button class="cds-btn-primary cds-btn-sm" type="button" data-analytics-resume-course="${item.course.id}" data-analytics-resume-lesson="${item.lesson.id}" data-analytics-resume-sec="${item.currentTime}">
                      ${SVG.play}
                      <span>Học tiếp (${formatClock(item.currentTime)})</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Tiến độ theo 3 Giai đoạn Chuyên môn -->
        <div class="cds-roadmap-stage">
          <div class="cds-roadmap-stage-head" style="margin-bottom:10px;">
            <div>
              <div class="cds-roadmap-stage-title">Tiến độ theo 3 Giai đoạn Chuyên môn (BA · PM · Product)</div>
              <div style="font-size:13px; color:var(--cds-text-secondary); margin-top:2px;">
                Tỷ lệ hoàn thành thực tế trên từng chặng kỹ năng dựa trên các khóa học đã đồng bộ trên Google Drive.
              </div>
            </div>
            <button class="cds-btn-outline cds-btn-sm" type="button" id="btnAnalyticsGoRoadmap">
              ${SVG.compass}
              <span>Xem chi tiết Lộ trình</span>
            </button>
          </div>

          <div class="cds-downloads-list">
            ${stages.map(st => {
              const stageCourses = (st.items || []).map(it => isCourseInCatalog(it.url)).filter(Boolean);
              const uniqueCourses = Array.from(new Map(stageCourses.map(c => [c.id, c])).values());
              let stTotal = 0;
              let stDone = 0;
              uniqueCourses.forEach(c => {
                const cSt = getCourseStats(c);
                stTotal += cSt.total;
                stDone += cSt.completed;
              });
              const stPct = stTotal > 0 ? Math.round((stDone / stTotal) * 100) : 0;
              return `
                <div class="cds-download-row" style="flex-direction:column; align-items:stretch; gap:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                    <div>
                      <div style="font-weight:700; font-size:15px; color:var(--cds-text-primary);">${escapeHtml(st.title)}</div>
                      <div style="font-size:12.5px; color:var(--cds-text-secondary); margin-top:2px;">
                        ${uniqueCourses.length} khóa học trên Drive · Đã hoàn thành <strong>${stDone}/${stTotal}</strong> bài học
                      </div>
                    </div>
                    <span class="cds-status-pill ${stPct === 100 ? 'cds-status-pill--synced' : (stPct > 0 ? 'cds-status-pill--running' : 'cds-status-pill--neutral')}">
                      ${stPct === 100 ? SVG.check : SVG.chart}
                      <span>${stPct}% Completed</span>
                    </span>
                  </div>
                  <div class="cds-progress-track" style="height:8px;">
                    <div class="cds-progress-fill ${stPct === 100 ? 'done' : ''}" style="width:${stPct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      profileBody.querySelectorAll('[data-set-daily-goal]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const g = Number(btn.getAttribute('data-set-daily-goal')) || 30;
          if (!state.user.preferences) state.user.preferences = {};
          state.user.preferences.dailyGoalMinutes = g;
          await apiPost('/api/preferences', { dailyGoalMinutes: g });
          renderHeader();
          renderProfileBody();
          showHudToast(`Đã đặt mục tiêu học tập: ${g} phút/ngày`, SVG.flame);
        });
      });

      profileBody.querySelectorAll('[data-analytics-resume-lesson]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cId = btn.getAttribute('data-analytics-resume-course');
          const lId = btn.getAttribute('data-analytics-resume-lesson');
          const sec = parseFloat(btn.getAttribute('data-analytics-resume-sec') || '0');
          profileModal.classList.add('hidden');
          openLecture(cId, lId, sec > 2 ? sec : null);
        });
      });

      document.getElementById('btnAnalyticsGoRoadmap')?.addEventListener('click', () => {
        activeProfileTab = 'roadmap';
        renderProfileBody();
      });
      return;
    }

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
              ${SVG.eye}
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
            <input type="text" id="discoverSearchInput" class="cds-crawler-input" value="${escapeHtml(discoverDraftQuery || discoverQuery)}" placeholder="Tìm khóa học trên Coursera (VD: business analysis, product management, sql, jira, generative ai...)" autocomplete="off" />
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
              ${SVG.search}
              <span>Search Coursera</span>
            </button>
          </div>

          <div class="cds-topic-chips" id="discoverTopicChipsContainer">
            <span style="font-size:12px; font-weight:700; color:var(--cds-text-secondary);">Chủ đề gợi ý:</span>
            ${QUICK_TOPICS.map(t => `
              <button type="button" class="cds-topic-chip ${discoverQuery.toLowerCase() === t.q.toLowerCase() ? 'active' : ''}" data-discover-topic="${escapeHtml(t.q)}">
                ${escapeHtml(t.label)}
              </button>
            `).join('')}
          </div>

          <div id="crawlJobStatusContainer"></div>
        </div>

        <div id="discoverResultsWrapper" class="cds-roadmap-stage"></div>
      `;

      renderCrawlJobBox(roadmapDataCache.crawlJob);
      if (roadmapDataCache.crawlJob?.running && !crawlPollTimer) {
        startCrawlPolling();
      }

      const discInput = document.getElementById('discoverSearchInput');
      const discBtn = document.getElementById('btnDiscoverSearch');
      const discType = document.getElementById('discoverTypeSelect');
      const discVi = document.getElementById('discoverViCheck');

      // Keep draft query synced on every keystroke and auto-search after 550ms pause without losing focus
      discInput?.addEventListener('input', () => {
        discoverDraftQuery = discInput.value;
        if (discoverDebounceTimer) clearTimeout(discoverDebounceTimer);
        const trimmed = discoverDraftQuery.trim();
        if (trimmed.length >= 2 && trimmed.toLowerCase() !== discoverExecutedQuery.toLowerCase()) {
          discoverDebounceTimer = setTimeout(() => {
            runCourseraDiscoverSearch(trimmed, false, false);
          }, 550);
        }
      });

      discBtn?.addEventListener('click', () => {
        const val = (discInput?.value || '').trim() || discoverQuery;
        runCourseraDiscoverSearch(val, false, false);
      });

      discInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = (discInput.value || '').trim() || discoverQuery;
          runCourseraDiscoverSearch(val, false, false);
        }
      });

      discType?.addEventListener('change', () => {
        discoverTypeFilter = discType.value;
        const typedVal = (discInput?.value || '').trim();
        if (typedVal && typedVal.toLowerCase() !== discoverExecutedQuery.toLowerCase()) {
          runCourseraDiscoverSearch(typedVal, false, false);
        } else {
          renderDiscoverResultsOnly();
        }
      });

      discVi?.addEventListener('change', () => {
        discoverViOnly = Boolean(discVi.checked);
        const typedVal = (discInput?.value || '').trim();
        if (typedVal && typedVal.toLowerCase() !== discoverExecutedQuery.toLowerCase()) {
          runCourseraDiscoverSearch(typedVal, false, false);
        } else {
          renderDiscoverResultsOnly();
        }
      });

      profileBody.querySelectorAll('[data-discover-topic]').forEach(chip => {
        chip.addEventListener('click', () => {
          const topic = chip.getAttribute('data-discover-topic') || '';
          runCourseraDiscoverSearch(topic, false, true);
        });
      });

      renderDiscoverResultsOnly();
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
            ${SVG.search}
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
                      <button class="cds-btn-outline cds-btn-sm" type="button" data-delete-uncrawl="${escapeHtml(u.id)}">${SVG.trash} <span>Remove</span></button>
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

  document.getElementById('btnHeaderDailyGoal')?.addEventListener('click', async () => {
    activeProfileTab = 'analytics';
    profileModal.classList.remove('hidden');
    await loadProfileData();
    renderProfileBody();
  });

  document.getElementById('btnExportBackupJson')?.addEventListener('click', async () => {
    try {
      const data = await apiGet('/api/state/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ducklearn-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showHudToast('Đã xuất tệp sao lưu (.json) thành công!', SVG.download);
    } catch (err) {
      alert('Lỗi xuất sao lưu: ' + err.message);
    }
  });

  const inputRestoreJson = document.getElementById('inputRestoreBackupJson');
  document.getElementById('btnImportBackupJson')?.addEventListener('click', () => {
    inputRestoreJson?.click();
  });
  inputRestoreJson?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const payload = parsed.state || parsed;
      const res = await apiPost('/api/state/import', { state: payload });
      if (res.state) {
        state.user = res.state;
        renderHeader();
        renderProfileBody();
        if (state.currentView === 'course-home') renderCourseHome();
        showHudToast('Đã khôi phục tiến độ, ghi chú & bài ghim từ tệp sao lưu!', SVG.check);
      }
    } catch (err) {
      alert('Tệp sao lưu (.json) không hợp lệ: ' + err.message);
    } finally {
      inputRestoreJson.value = '';
    }
  });

  document.getElementById('btnOpenExplore')?.addEventListener('click', async () => {
    activeProfileTab = 'discover';
    profileModal.classList.remove('hidden');
    await loadProfileData();
    renderProfileBody();
    if (discoverItems.length === 0 && !discoverLoading) {
      runCourseraDiscoverSearch(discoverQuery, false);
    }
  });

  document.getElementById('btnSwitchSearchToCourseraShop')?.addEventListener('click', async () => {
    const qFromSearch = searchInput?.value?.trim() || discoverQuery;
    closeSearch();
    activeProfileTab = 'discover';
    discoverDraftQuery = qFromSearch;
    discoverQuery = qFromSearch;
    profileModal.classList.remove('hidden');
    await loadProfileData();
    renderProfileBody();
    runCourseraDiscoverSearch(qFromSearch, false, true);
  });

  document.querySelectorAll('[data-profile-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeProfileTab = btn.getAttribute('data-profile-tab') || 'roadmap';
      renderProfileBody();
      if (activeProfileTab === 'discover' && discoverItems.length === 0 && !discoverLoading) {
        runCourseraDiscoverSearch(discoverQuery, false, false);
      }
    });
  });

  document.getElementById('btnCloseProfile')?.addEventListener('click', () => profileModal.classList.add('hidden'));
  bindSafeModalBackdrop(profileModal, () => profileModal.classList.add('hidden'));

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
    toggleTheaterMode(true);
  });

  btnShow?.addEventListener('click', () => {
    toggleTheaterMode(false);
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
