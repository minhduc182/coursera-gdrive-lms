const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { runGdrive, getProjectConfig, PROJECT_ROOT } = require('./gdrive');

const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const TEXT_CACHE_DIR = path.join(DATA_DIR, 'cache', 'text');

const ROADMAP_STAGES = [
  {
    id: 'stage-1',
    title: 'Giai đoạn 1: Business Analyst (BA)',
    duration: 'Khoảng 42 giờ + Khóa nhập môn',
    description: 'Nền tảng phân tích nghiệp vụ cho người mới bắt đầu, mô hình hóa quy trình, thu thập yêu cầu và bộ chuyên ngành CBAP.',
    items: [
      {
        title: 'Introduction to Business Analysis (Mở khóa đầu chứng chỉ IBM BA)',
        provider: 'IBM',
        duration: '1–4 tuần (4.6★)',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/introduction-to-business-analysis',
        specUrl: 'https://www.coursera.org/professional-certificates/ibm-business-analyst-professional-certificate',
        note: 'Khóa dành cho người mới, không cần kiến thức nền.'
      },
      {
        title: 'Business Analysis: Process Modeling & Requirements Gathering',
        provider: 'IBM / SkillUp',
        duration: '16 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/business-analysis-process-modeling-requirements-gathering',
        note: 'Mức người mới, có bài Lab thực hành và dự án.'
      },
      {
        title: 'Chuyên ngành CBAP (Certified Business Analysis Professional)',
        provider: 'Starweaver',
        duration: '26 giờ (4 khóa)',
        level: 'Intermediate',
        url: 'https://www.coursera.org/specializations/certified-business-analysis-professional-cbap',
        note: 'Không yêu cầu kiến thức nền. Đã có sẵn 4 khóa trong hệ thống LMS.'
      }
    ]
  },
  {
    id: 'stage-2',
    title: 'Giai đoạn 2: Project Manager & Cầu nối BA sang Product',
    duration: 'PM (~96 giờ) + Cầu nối BA-Product (~28 giờ)',
    description: 'Chuyên ngành Google Project Management (học đủ khóa 1–5, khóa 6 tùy chọn, bỏ qua khóa 7), kết hợp Jira và quản lý yêu cầu phần mềm.',
    items: [
      {
        title: 'Khóa 1: Foundations of Project Management',
        provider: 'Google',
        duration: '13 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/project-management-foundations',
        specUrl: 'https://www.coursera.org/professional-certificates/google-project-management',
        note: 'Khóa 1/5 bắt buộc trong Google Project Management.'
      },
      {
        title: 'Khóa 2: Project Initiation: Starting a Successful Project',
        provider: 'Google',
        duration: '15 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/project-initiation-google',
        note: 'Khóa 2/5 bắt buộc (Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Khóa 3: Project Planning: Putting It All Together',
        provider: 'Google',
        duration: '23 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/project-planning-google',
        note: 'Khóa 3/5 bắt buộc trong Google Project Management.'
      },
      {
        title: 'Khóa 4: Project Execution: Running the Project',
        provider: 'Google',
        duration: '25 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/project-execution-google',
        note: 'Khóa 4/5 bắt buộc (Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Khóa 5: Agile Project Management',
        provider: 'Google',
        duration: '20 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/agile-project-management',
        note: 'Khóa 5/5 bắt buộc trong Google Project Management.'
      },
      {
        title: 'Khóa 6 (Capstone - Tùy chọn): Applying Project Management in the Real World',
        provider: 'Google',
        duration: '40 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/applying-project-management',
        note: 'Tùy chọn thực hành tổng hợp, khóa 7 bỏ qua.'
      },
      {
        title: 'Agile with Atlassian Jira',
        provider: 'Atlassian',
        duration: '~1 tuần',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/agile-atlassian-jira',
        note: 'Bổ sung nếu đội ngũ sử dụng Jira (Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Client Needs and Software Requirements (Cầu nối BA sang Product)',
        provider: 'University of Alberta',
        duration: '12 giờ',
        level: 'Intermediate',
        url: 'https://www.coursera.org/learn/client-needs-and-software-requirements',
        note: 'Viết yêu cầu phần mềm và xử lý thay đổi (Có sẵn phụ đề Tiếng Việt).'
      }
    ]
  },
  {
    id: 'stage-3',
    title: 'Giai đoạn 3: Digital Product Management (Product)',
    duration: 'Khoảng 57 giờ (5 khóa)',
    description: 'Chuyên ngành Digital Product Management của Đại học Virginia (UVA Darden) — học khóa 1–3 trước, khóa 4–5 nếu cần. Sau cùng có thể thi chứng chỉ IIBA (ECBA/CCBA/CBAP) hoặc PMI (CAPM/PMP).',
    items: [
      {
        title: 'Khóa 1: Digital Product Management: Modern Fundamentals',
        provider: 'University of Virginia (UVA Darden)',
        duration: '11 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/uva-darden-digital-product-management',
        specUrl: 'https://www.coursera.org/specializations/uva-darden-digital-product-management',
        note: 'Ưu tiên học (Khóa 1/3 cốt lõi — Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Khóa 2: Agile Meets Design Thinking',
        provider: 'University of Virginia (UVA Darden)',
        duration: '9 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/uva-darden-getting-started-agile',
        note: 'Ưu tiên học (Khóa 2/3 cốt lõi — Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Khóa 3: Hypothesis-Driven Development',
        provider: 'University of Virginia (UVA Darden)',
        duration: '11 giờ',
        level: 'Beginner',
        url: 'https://www.coursera.org/learn/uva-darden-agile-testing',
        note: 'Ưu tiên học (Khóa 3/3 cốt lõi — Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Khóa 4: Product Analytics and AI',
        provider: 'University of Virginia (UVA Darden)',
        duration: '15 giờ',
        level: 'Intermediate',
        url: 'https://www.coursera.org/learn/uva-darden-agile-analytics',
        note: 'Học mở rộng nếu cần (Khóa 4/5 — Có sẵn phụ đề Tiếng Việt).'
      },
      {
        title: 'Khóa 5: Managing an Agile Team',
        provider: 'University of Virginia (UVA Darden)',
        duration: '11 giờ',
        level: 'Intermediate',
        url: 'https://www.coursera.org/learn/uva-darden-agile-team-management',
        note: 'Học mở rộng nếu cần (Khóa 5/5 — Có sẵn phụ đề Tiếng Việt).'
      }
    ]
  }
];

let activeCrawlJob = {
  running: false,
  courseSlug: null,
  courseTitle: null,
  statusText: 'Idle',
  completedItems: 0,
  totalItems: 0,
  startedAt: null,
  finishedAt: null,
  error: null,
  logs: []
};

function addJobLog(msg) {
  const line = `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}`;
  activeCrawlJob.logs.unshift(line);
  if (activeCrawlJob.logs.length > 60) activeCrawlJob.logs.pop();
  activeCrawlJob.statusText = msg;
  console.log('[CourseraCrawler]', msg);
}

function parseCourseraUrl(rawInput) {
  const input = String(rawInput || '').trim();
  if (!input) return null;

  // Match /learn/<slug>, /specializations/<slug>, /professional-certificates/<slug>
  const learnMatch = input.match(/coursera\.org\/learn\/([a-zA-Z0-9_-]+)/i);
  if (learnMatch) {
    return {
      kind: 'course',
      slug: learnMatch[1].toLowerCase(),
      url: `https://www.coursera.org/learn/${learnMatch[1].toLowerCase()}`
    };
  }

  const specMatch = input.match(/coursera\.org\/(specializations|professional-certificates)\/([a-zA-Z0-9_-]+)/i);
  if (specMatch) {
    return {
      kind: 'specialization',
      slug: specMatch[2].toLowerCase(),
      url: `https://www.coursera.org/${specMatch[1].toLowerCase()}/${specMatch[2].toLowerCase()}`
    };
  }

  // Fallback if user pasted a bare slug
  if (/^[a-zA-Z0-9_-]{3,100}$/.test(input)) {
    return {
      kind: 'course',
      slug: input.toLowerCase(),
      url: `https://www.coursera.org/learn/${input.toLowerCase()}`
    };
  }

  return null;
}

async function checkSingleCourseSlug(slug) {
  const cleanSlug = slug.replace(/^coursera-learn-/, '');
  const url = `https://www.coursera.org/learn/${cleanSlug}`;

  try {
    const metaRes = await fetch(`https://www.coursera.org/api/courses.v1?q=slug&slug=${encodeURIComponent(cleanSlug)}&fields=name,description`);
    let courseTitle = cleanSlug;
    let description = '';
    if (metaRes.ok) {
      const metaJson = await metaRes.json();
      if (metaJson.elements?.[0]) {
        courseTitle = metaJson.elements[0].name || cleanSlug;
        description = metaJson.elements[0].description || '';
      }
    }

    const mUrl = `https://www.coursera.org/api/onDemandCourseMaterials.v2/?q=slug&slug=${encodeURIComponent(cleanSlug)}&includes=modules,lessons,items&fields=onDemandCourseMaterialModules.v1(name,slug,lessonIds),onDemandCourseMaterialLessons.v1(name,slug,itemIds),onDemandCourseMaterialItems.v2(name,slug,contentSummary,isLocked)`;
    const mRes = await fetch(mUrl);
    if (!mRes.ok) {
      return {
        slug: cleanSlug,
        title: courseTitle,
        url,
        crawlable: false,
        reason: `Coursera API trả về HTTP ${mRes.status} (Khóa học khóa quyền truy cập public hoặc không tồn tại).`
      };
    }

    const mData = await mRes.json();
    const courseId = mData.elements?.[0]?.id;
    const mods = mData.linked?.['onDemandCourseMaterialModules.v1'] || [];
    const items = mData.linked?.['onDemandCourseMaterialItems.v2'] || [];
    const lectures = items.filter(x => x.contentSummary?.typeName === 'lecture');
    const readings = items.filter(x => x.contentSummary?.typeName === 'supplement');
    const unlockedLectures = lectures.filter(x => !x.isLocked);

    if (!courseId || lectures.length === 0) {
      return {
        slug: cleanSlug,
        title: courseTitle,
        url,
        crawlable: false,
        reason: 'Không tìm thấy bài giảng video nào trong cấu trúc khóa học.'
      };
    }

    if (unlockedLectures.length === 0) {
      return {
        slug: cleanSlug,
        title: courseTitle,
        url,
        crawlable: false,
        reason: `Toàn bộ ${lectures.length} video đều bị khóa (isLocked: true) trên API public.`
      };
    }

    // Check actual video stream on a middle lecture to be 100% certain
    const probeIdx = Math.min(3, unlockedLectures.length - 1);
    const probeItem = unlockedLectures[probeIdx];
    const vUrl = `https://www.coursera.org/api/onDemandLectureVideos.v1/${courseId}~${probeItem.id}?includes=video&fields=onDemandVideos.v1(sources,subtitles)`;
    const vRes = await fetch(vUrl);
    if (!vRes.ok) {
      return {
        slug: cleanSlug,
        title: courseTitle,
        url,
        crawlable: false,
        reason: `Endpoint luồng video trả về HTTP ${vRes.status}.`
      };
    }

    const vData = await vRes.json();
    const vid = vData.linked?.['onDemandVideos.v1']?.[0];
    const byRes = vid?.sources?.byResolution || {};
    const resolutions = Object.keys(byRes);
    const bestRes = byRes['720p'] || byRes['540p'] || byRes['360p'];
    if (!bestRes || !bestRes.mp4VideoUrl) {
      return {
        slug: cleanSlug,
        title: courseTitle,
        url,
        crawlable: false,
        reason: 'Không lấy được link stream MP4 trực tiếp từ CDN CloudFront.'
      };
    }

    const subLangs = Object.keys(vid?.subtitles || {});
    return {
      slug: cleanSlug,
      courseId,
      title: courseTitle,
      description: description.slice(0, 260),
      url,
      crawlable: true,
      modulesCount: mods.length,
      totalLectures: lectures.length,
      unlockedLectures: unlockedLectures.length,
      readingsCount: readings.length,
      resolutions,
      hasEnSub: subLangs.includes('en'),
      hasViSub: subLangs.includes('vi'),
      reason: `Mở khóa ${unlockedLectures.length}/${lectures.length} video (${resolutions.join(', ')}) + ${readings.length} bài đọc.`
    };
  } catch (err) {
    return {
      slug: cleanSlug,
      title: cleanSlug,
      url,
      crawlable: false,
      reason: `Lỗi kết nối khi kiểm tra: ${err.message}`
    };
  }
}

async function checkCourseraUrl(rawInput) {
  const parsed = parseCourseraUrl(rawInput);
  if (!parsed) {
    return {
      inputUrl: rawInput,
      crawlable: false,
      kind: 'invalid',
      title: rawInput,
      reason: 'Đường dẫn không đúng định dạng Coursera (/learn/..., /specializations/..., /professional-certificates/...).',
      courses: []
    };
  }

  if (parsed.kind === 'specialization') {
    const sUrl = `https://www.coursera.org/api/onDemandSpecializations.v1?q=slug&slug=${encodeURIComponent(parsed.slug)}&fields=courseIds,name,description&includes=courseIds`;
    const sRes = await fetch(sUrl);
    if (!sRes.ok) {
      // Try checking as a single course just in case
      const fallback = await checkSingleCourseSlug(parsed.slug);
      return {
        inputUrl: parsed.url,
        crawlable: fallback.crawlable,
        kind: 'course',
        title: fallback.title,
        reason: fallback.reason,
        courses: [fallback]
      };
    }

    const sData = await sRes.json();
    const specElem = sData.elements?.[0];
    const linkedCourses = sData.linked?.['courses.v1'] || [];
    if (!specElem || linkedCourses.length === 0) {
      return {
        inputUrl: parsed.url,
        crawlable: false,
        kind: 'specialization',
        title: parsed.slug,
        reason: 'Không tìm thấy danh sách khóa học trong Specialization này.',
        courses: []
      };
    }

    // Preserve course order from specElem.courseIds
    const courseMap = new Map(linkedCourses.map(c => [c.id, c]));
    const orderedCourses = (specElem.courseIds || [])
      .map(id => courseMap.get(id))
      .filter(Boolean);

    const results = [];
    for (const c of orderedCourses) {
      const r = await checkSingleCourseSlug(c.slug);
      results.push(r);
    }

    const crawlableCourses = results.filter(r => r.crawlable);
    return {
      inputUrl: parsed.url,
      crawlable: crawlableCourses.length > 0,
      kind: 'specialization',
      title: specElem.name || parsed.slug,
      reason: crawlableCourses.length > 0
        ? `Chuyên ngành gồm ${results.length} khóa học: lấy được trực tiếp ${crawlableCourses.length}/${results.length} khóa.`
        : `Toàn bộ ${results.length} khóa trong chuyên ngành này đều bị khóa API public.`,
      courses: results
    };
  }

  const single = await checkSingleCourseSlug(parsed.slug);
  return {
    inputUrl: parsed.url,
    crawlable: single.crawlable,
    kind: 'course',
    title: single.title,
    reason: single.reason,
    courses: [single]
  };
}

async function listDriveFolder(folderId) {
  const out = await runGdrive(['readonly', 'ls', folderId, '--json']);
  const trimmed = out.trim();
  if (!trimmed || trimmed === 'null') return [];
  return JSON.parse(trimmed);
}

async function ensureDriveFolder(parentId, folderName, cachedItems = null) {
  const items = cachedItems || await listDriveFolder(parentId);
  const found = items.find(i => i.name === folderName && i.mimeType === 'application/vnd.google-apps.folder');
  if (found) return found.id;

  const out = await runGdrive(['mutate', 'mkdir', folderName, '--parent', parentId]);
  const idMatch = out.match(/\(ID:\s*([^)]+)\)/i);
  if (idMatch) return idMatch[1].trim();

  const refreshed = await listDriveFolder(parentId);
  const after = refreshed.find(i => i.name === folderName && i.mimeType === 'application/vnd.google-apps.folder');
  if (!after) throw new Error(`Không thể tạo thư mục ${folderName} trên Drive`);
  return after.id;
}

async function downloadUrlToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Download HTTP ${res.status} for ${url}`);
  }
  const fileStream = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(res.body), fileStream);
}

function sanitizeSlug(str) {
  return String(str || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

async function crawlAndUploadCourse(slug) {
  const cleanSlug = slug.replace(/^coursera-learn-/, '');
  const cfg = getProjectConfig();
  const rootFolderId = cfg.rootFolderId;

  const mUrl = `https://www.coursera.org/api/onDemandCourseMaterials.v2/?q=slug&slug=${encodeURIComponent(cleanSlug)}&includes=modules,lessons,items&fields=onDemandCourseMaterialModules.v1(name,slug,lessonIds),onDemandCourseMaterialLessons.v1(name,slug,itemIds),onDemandCourseMaterialItems.v2(name,slug,contentSummary,isLocked)`;
  const mRes = await fetch(mUrl);
  if (!mRes.ok) throw new Error(`Coursera materials HTTP ${mRes.status}`);
  const mData = await mRes.json();

  const courseElem = mData.elements?.[0];
  const courseId = courseElem?.id;
  const moduleIds = courseElem?.moduleIds || [];
  const modulesMap = new Map((mData.linked?.['onDemandCourseMaterialModules.v1'] || []).map(m => [m.id, m]));
  const lessonsMap = new Map((mData.linked?.['onDemandCourseMaterialLessons.v1'] || []).map(l => [l.id, l]));
  const itemsMap = new Map((mData.linked?.['onDemandCourseMaterialItems.v2'] || []).map(i => [i.id, i]));

  // Count total downloadable items (lectures + supplements)
  const structuredModules = [];
  let totalTargetItems = 0;

  for (let mIdx = 0; mIdx < moduleIds.length; mIdx++) {
    const mod = modulesMap.get(moduleIds[mIdx]);
    if (!mod) continue;
    const mPrefix = String(mIdx + 1).padStart(2, '0');
    const modFolderName = `${mPrefix}_${sanitizeSlug(mod.slug || mod.name)}`;
    const structuredLessons = [];

    const lessonIds = mod.lessonIds || [];
    for (let lIdx = 0; lIdx < lessonIds.length; lIdx++) {
      const les = lessonsMap.get(lessonIds[lIdx]);
      if (!les) continue;
      const lPrefix = String(lIdx + 1).padStart(2, '0');
      const lesFolderName = `${lPrefix}_${sanitizeSlug(les.slug || les.name)}`;

      const validItems = [];
      let itemCounter = 1;
      for (const itemId of (les.itemIds || [])) {
        const item = itemsMap.get(itemId);
        if (!item || item.isLocked) continue;
        const tName = item.contentSummary?.typeName;
        if (tName === 'lecture' || tName === 'supplement') {
          validItems.push({
            ...item,
            prefix: String(itemCounter++).padStart(2, '0'),
            cleanItemSlug: sanitizeSlug(item.slug || item.name),
            typeName: tName
          });
          totalTargetItems++;
        }
      }
      if (validItems.length > 0) {
        structuredLessons.push({ folderName: lesFolderName, items: validItems });
      }
    }
    if (structuredLessons.length > 0) {
      structuredModules.push({ folderName: modFolderName, lessons: structuredLessons });
    }
  }

  activeCrawlJob.totalItems += totalTargetItems;
  const courseFolderName = `coursera-learn-${cleanSlug}`;
  addJobLog(`Tạo/kiểm tra thư mục khóa học "${courseFolderName}" trên Google Drive...`);
  const courseFolderId = await ensureDriveFolder(rootFolderId, courseFolderName);
  const courseChildren = await listDriveFolder(courseFolderId);

  const tmpBase = path.join(os.tmpdir(), `coursera_crawl_${cleanSlug}_${Date.now()}`);
  fs.mkdirSync(tmpBase, { recursive: true });

  try {
    const itemTasks = [];
    for (const mod of structuredModules) {
      const modFolderId = await ensureDriveFolder(courseFolderId, mod.folderName, courseChildren);
      const modChildren = await listDriveFolder(modFolderId);

      for (const sec of mod.lessons) {
        const secFolderId = await ensureDriveFolder(modFolderId, sec.folderName, modChildren);
        const secChildren = await listDriveFolder(secFolderId);
        const existingNames = new Set(secChildren.map(f => f.name));

        for (const item of sec.items) {
          itemTasks.push({ secFolderId, existingNames, item });
        }
      }
    }

    let taskCursor = 0;
    const concurrency = 4;
    async function worker(workerId) {
      while (taskCursor < itemTasks.length) {
        const idx = taskCursor++;
        const { secFolderId, existingNames, item } = itemTasks[idx];
        const baseName = `${item.prefix}_${item.cleanItemSlug}`;
        const itemTmpDir = path.join(tmpBase, `w${workerId}_${idx}`);
        fs.mkdirSync(itemTmpDir, { recursive: true });

        try {
          if (item.typeName === 'lecture') {
            const mp4Name = `${baseName}.mp4`;
            const enSrtName = `${baseName}.en.srt`;
            const viSrtName = `${baseName}.vi.srt`;

            if (existingNames.has(mp4Name)) {
              activeCrawlJob.completedItems++;
              continue;
            }

            const vUrl = `https://www.coursera.org/api/onDemandLectureVideos.v1/${courseId}~${item.id}?includes=video&fields=onDemandVideos.v1(sources,subtitles)`;
            const vRes = await fetch(vUrl);
            if (vRes.ok) {
              const vData = await vRes.json();
              const vid = vData.linked?.['onDemandVideos.v1']?.[0];
              const byRes = vid?.sources?.byResolution || {};
              const best = byRes['720p'] || byRes['540p'] || byRes['360p'] || Object.values(byRes)[0];

              if (vid?.subtitles?.en && !existingNames.has(enSrtName)) {
                const enPath = path.join(itemTmpDir, enSrtName);
                try {
                  await downloadUrlToFile(`https://www.coursera.org${vid.subtitles.en}`, enPath);
                  const upEn = await runGdrive(['mutate', 'upload', enPath, '--parent', secFolderId]);
                  const mId = upEn.match(/\(ID:\s*([^)]+)\)/i);
                  if (mId) fs.copyFileSync(enPath, path.join(TEXT_CACHE_DIR, `${mId[1].trim()}.txt`));
                } catch (e) {} finally {
                  if (fs.existsSync(enPath)) fs.unlinkSync(enPath);
                }
              }

              if (vid?.subtitles?.vi && !existingNames.has(viSrtName)) {
                const viPath = path.join(itemTmpDir, viSrtName);
                try {
                  await downloadUrlToFile(`https://www.coursera.org${vid.subtitles.vi}`, viPath);
                  const upVi = await runGdrive(['mutate', 'upload', viPath, '--parent', secFolderId]);
                  const mId = upVi.match(/\(ID:\s*([^)]+)\)/i);
                  if (mId) fs.copyFileSync(viPath, path.join(TEXT_CACHE_DIR, `${mId[1].trim()}.txt`));
                } catch (e) {} finally {
                  if (fs.existsSync(viPath)) fs.unlinkSync(viPath);
                }
              }

              if (best?.mp4VideoUrl) {
                const mp4Path = path.join(itemTmpDir, mp4Name);
                try {
                  addJobLog(`[${cleanSlug}] Đang tải (${activeCrawlJob.completedItems + 1}/${activeCrawlJob.totalItems}): ${item.name}`);
                  await downloadUrlToFile(best.mp4VideoUrl, mp4Path);
                  await runGdrive(['mutate', 'upload', mp4Path, '--parent', secFolderId]);
                } finally {
                  if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
                }
              }
            }
            activeCrawlJob.completedItems++;
          } else if (item.typeName === 'supplement') {
            const htmlName = `${baseName}_instructions.html`;
            if (existingNames.has(htmlName)) {
              activeCrawlJob.completedItems++;
              continue;
            }

            const sUrl = `https://www.coursera.org/api/onDemandSupplements.v1/${courseId}~${item.id}?includes=asset&fields=openCourseAssets.v1(typeName,definition)`;
            const sRes = await fetch(sUrl);
            if (sRes.ok) {
              const sData = await sRes.json();
              const asset = sData.linked?.['openCourseAssets.v1']?.[0];
              const rawVal = asset?.definition?.value || `<p>${item.name}</p>`;
              const fullHtml = `<meta charset="utf-8"/>\n<co-content>\n${rawVal}\n</co-content>`;
              const htmlPath = path.join(itemTmpDir, htmlName);
              try {
                fs.writeFileSync(htmlPath, fullHtml, 'utf8');
                const upHtml = await runGdrive(['mutate', 'upload', htmlPath, '--parent', secFolderId]);
                const mId = upHtml.match(/\(ID:\s*([^)]+)\)/i);
                if (mId) fs.copyFileSync(htmlPath, path.join(TEXT_CACHE_DIR, `${mId[1].trim()}.txt`));
              } finally {
                if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
              }
            }
            activeCrawlJob.completedItems++;
          }
        } finally {
          try {
            fs.rmSync(itemTmpDir, { recursive: true, force: true });
          } catch (e) {}
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, itemTasks.length) }, (_, i) => worker(i + 1)));
  } finally {
    try {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    } catch (e) {}
  }
}

function startCrawlJob(courseSlugs, onComplete) {
  if (activeCrawlJob.running) {
    throw new Error('Đang có một tiến trình tải khóa học khác chạy. Vui lòng đợi hoàn tất.');
  }

  const slugs = Array.isArray(courseSlugs) ? courseSlugs.filter(Boolean) : [courseSlugs].filter(Boolean);
  if (slugs.length === 0) {
    throw new Error('Cần ít nhất 1 slug khóa học để triển khai.');
  }

  activeCrawlJob = {
    running: true,
    courseSlug: slugs.join(', '),
    courseTitle: `${slugs.length} khóa học`,
    statusText: 'Khởi tạo tiến trình tải khóa học từ Coursera...',
    completedItems: 0,
    totalItems: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
    logs: []
  };

  (async () => {
    try {
      for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        addJobLog(`(${i + 1}/${slugs.length}) Bắt đầu lấy khóa học: ${slug}`);
        await crawlAndUploadCourse(slug);
        addJobLog(`(${i + 1}/${slugs.length}) Đã đẩy xong khóa ${slug} lên Google Drive! Đang cập nhật Catalog...`);
        await new Promise((resolve, reject) => {
          execFile('node', [path.join(PROJECT_ROOT, 'scripts', 'sync-drive.js')], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
        if (typeof onComplete === 'function') onComplete();
      }
      addJobLog('Hoàn tất 100%! Toàn bộ khóa học đã sẵn sàng trong LMS.');
      activeCrawlJob.running = false;
      activeCrawlJob.finishedAt = new Date().toISOString();
      if (typeof onComplete === 'function') onComplete();
    } catch (err) {
      addJobLog(`Lỗi: ${err.message}`);
      activeCrawlJob.error = err.message;
      activeCrawlJob.running = false;
      activeCrawlJob.finishedAt = new Date().toISOString();
    }
  })();

  return activeCrawlJob;
}

function getCrawlJobStatus() {
  return activeCrawlJob;
}

module.exports = {
  ROADMAP_STAGES,
  parseCourseraUrl,
  checkCourseraUrl,
  startCrawlJob,
  getCrawlJobStatus
};
