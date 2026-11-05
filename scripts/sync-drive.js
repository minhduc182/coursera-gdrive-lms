const fs = require('fs');
const path = require('path');
const { runGdrive, getProjectConfig } = require('../lib/gdrive');

const localConfig = getProjectConfig();
const ROOT_FOLDER_ID = process.env.GDRIVE_ROOT_FOLDER_ID || localConfig.rootFolderId;
if (!ROOT_FOLDER_ID || ROOT_FOLDER_ID === 'YOUR_GOOGLE_DRIVE_FOLDER_ID') {
  console.error('Error: Missing rootFolderId. Please configure config.local.json (copy from config.example.json).');
  process.exit(1);
}
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEXT_CACHE_DIR = path.join(DATA_DIR, 'cache', 'text');
const MEDIA_CACHE_DIR = path.join(DATA_DIR, 'cache', 'media');

fs.mkdirSync(TEXT_CACHE_DIR, { recursive: true });
fs.mkdirSync(MEDIA_CACHE_DIR, { recursive: true });

async function listFolder(folderId) {
  const out = await runGdrive(['readonly', 'ls', folderId, '--json']);
  const trimmed = out.trim();
  if (!trimmed || trimmed === 'null') return [];
  return JSON.parse(trimmed);
}

function formatTitle(slug) {
  // Remove leading number prefix like "01_"
  const clean = slug.replace(/^\d+_/, '');
  const acronyms = new Set(['ba', 'babok', 'cbap', 'swot', 'kpi', 'kpis', 'nfr', 'nfrs', 'bi', 'it', 'bpm', 'ii', 'iii', 'iv', 'jira', 'iiba']);
  return clean
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      if (idx > 0 && ['a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'and', 'or', 'with'].includes(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function parseSrtDurationAndText(srtContent) {
  const blocks = srtContent.replace(/\r\n/g, '\n').trim().split(/\n\n+/);
  const cues = [];
  let maxEndSec = 0;

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const timeLineIdx = lines[0].includes('-->') ? 0 : 1;
    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) continue;

    const startSec = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
    const endSec = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
    if (endSec > maxEndSec) maxEndSec = endSec;

    const text = lines.slice(timeLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) {
      cues.push({
        start: Math.round(startSec * 100) / 100,
        end: Math.round(endSec * 100) / 100,
        text
      });
    }
  }

  return { durationSec: Math.round(maxEndSec), cues };
}

function extractCleanHtml(rawHtml) {
  const match = rawHtml.match(/<co-content>([\s\S]*?)<\/co-content>/i);
  const inner = match ? match[1].trim() : rawHtml.replace(/<style[\s\S]*?<\/style>/gi, '').trim();
  const plainText = inner
    .replace(/<div class="asset-card[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { innerHtml: inner, plainText };
}

async function ensureTextFile(fileId) {
  const cachePath = path.join(TEXT_CACHE_DIR, `${fileId}.txt`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    return fs.readFileSync(cachePath, 'utf8');
  }
  await runGdrive(['readonly', 'download', fileId, '--out', cachePath]);
  return fs.readFileSync(cachePath, 'utf8');
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current], current);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const COURSE_METADATA = {
  // Giai đoạn 1: Business Analyst (BA)
  'coursera-learn-introduction-to-business-analysis': {
    order: 1,
    code: 'BA-1',
    title: 'Introduction to Business Analysis (IBM)',
    shortTitle: '[GĐ1] 1. Intro to Business Analysis (IBM)',
    description: 'Khóa nhập môn Phân tích Nghiệp vụ của IBM dành cho người mới bắt đầu: vai trò BA, quy trình thu thập yêu cầu và phân tích các bên liên quan.'
  },
  'coursera-learn-business-analysis-process-modeling-requirements-gathering': {
    order: 2,
    code: 'BA-2',
    title: 'Business Analysis: Process Modeling & Requirements Gathering (IBM)',
    shortTitle: '[GĐ1] 2. Process Modeling & Requirements (IBM)',
    description: 'Mô hình hóa quy trình nghiệp vụ (BPMN, Flowchart), thu thập và tài liệu hóa yêu cầu thực tế qua Lab và dự án.'
  },
  'coursera-learn-business-analysis-mastery': {
    order: 3,
    code: 'CBAP-1',
    title: 'Business Analysis Mastery: Foundation & Strategy Analysis',
    shortTitle: '[GĐ1] 3. CBAP 1: BA Mastery & Strategy',
    description: 'Nền tảng Phân tích Nghiệp vụ (BABOK), mô hình khái niệm cốt lõi (BACCM) và Phân tích Chiến lược (SWOT, BMC, KPIs, Balanced Scorecard, Quản trị rủi ro).'
  },
  'coursera-learn-advanced-business-analysis-elicitation-analysis': {
    order: 4,
    code: 'CBAP-2',
    title: 'Advanced Business Analysis: Elicitation & Requirements Analysis',
    shortTitle: '[GĐ1] 4. CBAP 2: Elicitation & Analysis',
    description: 'Kỹ thuật Khơi gợi yêu cầu (Interviews, Focus Groups, Workshops, Mindmapping) & Phân tích Thiết kế Yêu cầu (User Stories, Use Cases, Process/Data/State Modelling, NFRs).'
  },
  'coursera-learn-advanced-requirements-management-solution-evaluation': {
    order: 5,
    code: 'CBAP-3',
    title: 'Advanced Requirements Lifecycle Management & Solution Evaluation',
    shortTitle: '[GĐ1] 5. CBAP 3: Lifecycle & Evaluation',
    description: 'Quản lý vòng đời yêu cầu (Tracing, Prioritisation, Backlog Management với Jira) và Đánh giá Giải pháp (Root Cause Analysis, Data Mining, Lessons Learned).'
  },
  'coursera-learn-business-analysis-mastery-planning-skills-and-perspective': {
    order: 6,
    code: 'CBAP-4',
    title: 'Business Analysis Planning, Soft Skills & Perspectives',
    shortTitle: '[GĐ1] 6. CBAP 4: Planning & Perspectives',
    description: 'Lập kế hoạch & Giám sát BA, Kỹ năng mềm (Design Sprint), và 5 góc nhìn chuyên sâu (Agile, Business Intelligence, IT, Business Architecture, BPM).'
  },

  // Giai đoạn 2: Project Manager (Google PM + Jira + Cầu nối BA-Product)
  'coursera-learn-project-management-foundations': {
    order: 11,
    code: 'PM-1',
    title: 'Foundations of Project Management (Google PM 1)',
    shortTitle: '[GĐ2] 1. Foundations of Project Mgmt',
    description: 'Khóa 1 thuộc Google Project Management: nền tảng quản trị dự án, vòng đời dự án, phương pháp Waterfall vs Agile và cơ cấu tổ chức.'
  },
  'coursera-learn-project-initiation-google': {
    order: 12,
    code: 'PM-2',
    title: 'Project Initiation: Starting a Successful Project (Google PM 2)',
    shortTitle: '[GĐ2] 2. Project Initiation (Google)',
    description: 'Khóa 2 thuộc Google Project Management: xác định mục tiêu, phạm vi (Scope), OKRs, phân tích Stakeholder, RACI chart và lập Project Charter.'
  },
  'coursera-learn-project-planning-google': {
    order: 13,
    code: 'PM-3',
    title: 'Project Planning: Putting It All Together (Google PM 3)',
    shortTitle: '[GĐ2] 3. Project Planning (Google)',
    description: 'Khóa 3 thuộc Google Project Management: lập WBS, ước lượng thời gian, lập ngân sách, quản trị rủi ro và kế hoạch truyền thông dự án.'
  },
  'coursera-learn-project-execution-google': {
    order: 14,
    code: 'PM-4',
    title: 'Project Execution: Running the Project (Google PM 4)',
    shortTitle: '[GĐ2] 4. Project Execution (Google)',
    description: 'Khóa 4 thuộc Google Project Management: theo dõi tiến độ, quản lý thay đổi, kiểm soát chất lượng, dẫn dắt đội ngũ và đóng dự án.'
  },
  'coursera-learn-agile-project-management': {
    order: 15,
    code: 'PM-5',
    title: 'Agile Project Management (Google PM 5)',
    shortTitle: '[GĐ2] 5. Agile Project Mgmt (Google)',
    description: 'Khóa 5 thuộc Google Project Management: triết lý Agile, khung Scrum (Product Backlog, Sprint Planning, Daily Scrum, Retrospective) và coaching đội nhóm.'
  },
  'coursera-learn-applying-project-management': {
    order: 16,
    code: 'PM-6',
    title: 'Capstone: Applying Project Management in the Real World (Google PM 6)',
    shortTitle: '[GĐ2] 6. PM Capstone (Google)',
    description: 'Khóa 6 Thực hành tổng hợp (Capstone): xây dựng bộ tài liệu quản lý dự án hoàn chỉnh từ Charter, WBS đến báo cáo tiến độ thực tế.'
  },
  'coursera-learn-agile-atlassian-jira': {
    order: 17,
    code: 'JIRA',
    title: 'Agile with Atlassian Jira',
    shortTitle: '[GĐ2] 7. Agile with Atlassian Jira',
    description: 'Làm chủ công cụ Atlassian Jira cho các dự án Scrum và Kanban: cấu hình bảng, bộ lọc JQL, quản lý Epic/Story và theo dõi tiến độ.'
  },
  'coursera-learn-client-needs-and-software-requirements': {
    order: 18,
    code: 'BA-REQ',
    title: 'Client Needs and Software Requirements (University of Alberta)',
    shortTitle: '[GĐ2] 8. Client Needs & SW Requirements',
    description: 'Cầu nối BA sang Product: làm rõ nhu cầu khách hàng, viết User Stories, Use Cases, Wireframes/Storyboards và xử lý thay đổi yêu cầu phần mềm.'
  },

  // Giai đoạn 3: Digital Product Management (UVA Darden)
  'coursera-learn-uva-darden-digital-product-management': {
    order: 21,
    code: 'PROD-1',
    title: 'Digital Product Management: Modern Fundamentals (UVA Darden 1)',
    shortTitle: '[GĐ3] 1. Digital Product Mgmt Fundamentals',
    description: 'Khóa 1 chuyên ngành Digital Product Management (ĐH Virginia): vai trò Product Manager hiện đại, khám phá vấn đề khách hàng và thiết kế lộ trình sản phẩm.'
  },
  'coursera-learn-uva-darden-getting-started-agile': {
    order: 22,
    code: 'PROD-2',
    title: 'Agile Meets Design Thinking (UVA Darden 2)',
    shortTitle: '[GĐ3] 2. Agile Meets Design Thinking',
    description: 'Khóa 2 chuyên ngành Digital Product Management: kết hợp Design Thinking và Agile, xây dựng Personas, Problem Scenarios và User Stories lấy người dùng làm trung tâm.'
  },
  'coursera-learn-uva-darden-agile-testing': {
    order: 23,
    code: 'PROD-3',
    title: 'Hypothesis-Driven Development (UVA Darden 3)',
    shortTitle: '[GĐ3] 3. Hypothesis-Driven Development',
    description: 'Khóa 3 chuyên ngành Digital Product Management: phát triển sản phẩm dựa trên giả thuyết, thiết kế thực nghiệm MVP, phỏng vấn khách hàng và kiểm thử A/B.'
  },
  'coursera-learn-uva-darden-agile-analytics': {
    order: 24,
    code: 'PROD-4',
    title: 'Product Analytics and AI (UVA Darden 4)',
    shortTitle: '[GĐ3] 4. Product Analytics & AI',
    description: 'Khóa 4 chuyên ngành Digital Product Management: đo lường hành vi người dùng (Pirate Metrics AARRR, Cohort Analysis), kinh tế đơn vị (LTV/CAC) và ứng dụng AI.'
  },
  'coursera-learn-uva-darden-agile-team-management': {
    order: 25,
    code: 'PROD-5',
    title: 'Managing an Agile Team (UVA Darden 5)',
    shortTitle: '[GĐ3] 5. Managing an Agile Team',
    description: 'Khóa 5 chuyên ngành Digital Product Management: xây dựng văn hóa đội ngũ Agile hiệu suất cao, điều phối cộng tác liên chức năng và cải tiến liên tục.'
  }
};

async function main() {
  console.log('1. Listing root specialization folder...');
  const courseFolders = await listFolder(ROOT_FOLDER_ID);
  courseFolders.sort((a, b) => {
    const oa = COURSE_METADATA[a.name]?.order || 99;
    const ob = COURSE_METADATA[b.name]?.order || 99;
    return oa - ob;
  });

  const courses = [];
  const textDownloadTasks = [];

  for (const cFolder of courseFolders) {
    if (cFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
    const cleanFolderTitle = formatTitle(cFolder.name.replace(/^coursera-learn-/, ''));
    const meta = COURSE_METADATA[cFolder.name] || {
      order: 99,
      code: 'COURSERA',
      title: cleanFolderTitle,
      shortTitle: `[Mở rộng] ${cleanFolderTitle}`,
      description: 'Khóa học được tìm kiếm và đồng bộ trực tiếp từ danh mục Coursera gốc về Google Drive.'
    };

    console.log(`Scanning Course: ${cFolder.name} (${cFolder.id})...`);
    const moduleFolders = await listFolder(cFolder.id);
    moduleFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const modules = [];

    for (const mFolder of moduleFolders) {
      if (mFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
      const sectionFolders = await listFolder(mFolder.id);
      sectionFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      const sections = [];

      for (const sFolder of sectionFolders) {
        if (sFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
        const files = await listFolder(sFolder.id);
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        // Group files into lessons by prefix number (e.g. "01_", "02_")
        const lessonGroups = new Map();

        for (const f of files) {
          if (f.mimeType === 'application/vnd.google-apps.folder') continue;
          const prefixMatch = f.name.match(/^(\d+)_(.+)$/);
          const prefixNum = prefixMatch ? prefixMatch[1] : '00';
          const restName = prefixMatch ? prefixMatch[2] : f.name;

          if (!lessonGroups.has(prefixNum)) {
            lessonGroups.set(prefixNum, {
              prefixNum,
              rawSlug: '',
              files: []
            });
          }
          const group = lessonGroups.get(prefixNum);
          group.files.push({
            id: f.id,
            name: f.name,
            restName,
            mimeType: f.mimeType,
            size: parseInt(f.size || '0', 10),
            modifiedTime: f.modifiedTime,
            viewUrl: `https://drive.google.com/file/d/${f.id}/view`,
            previewUrl: `https://drive.google.com/file/d/${f.id}/preview`
          });
        }

        const lessons = [];
        const sortedPrefixes = Array.from(lessonGroups.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        for (const prefixNum of sortedPrefixes) {
          const group = lessonGroups.get(prefixNum);
          let videoFile = null;
          let enSrtFile = null;
          let viSrtFile = null;
          let htmlFile = null;
          const pdfFiles = [];
          const otherFiles = [];

          for (const file of group.files) {
            const lower = file.name.toLowerCase();
            if (lower.endsWith('.mp4')) {
              videoFile = file;
            } else if (lower.endsWith('.en.srt')) {
              enSrtFile = file;
            } else if (lower.endsWith('.vi.srt')) {
              viSrtFile = file;
            } else if (lower.endsWith('_instructions.html') || lower.endsWith('.html')) {
              htmlFile = file;
            } else if (lower.endsWith('.pdf')) {
              pdfFiles.push(file);
            } else {
              otherFiles.push(file);
            }
          }

          // Determine base slug for title
          let baseSlug = '';
          if (videoFile) {
            baseSlug = videoFile.restName.replace(/\.mp4$/i, '');
          } else if (htmlFile) {
            baseSlug = htmlFile.restName.replace(/_instructions\.html$/i, '').replace(/\.html$/i, '');
          } else if (pdfFiles.length > 0) {
            baseSlug = pdfFiles[0].restName.replace(/\.pdf$/i, '');
          } else if (group.files.length > 0) {
            baseSlug = group.files[0].restName.replace(/\.[^.]+$/, '');
          }

          const lessonId = `${cFolder.id}_${sFolder.id}_${prefixNum}`;
          const type = videoFile ? 'video' : 'reading';

          const lessonObj = {
            id: lessonId,
            courseId: cFolder.id,
            moduleId: mFolder.id,
            sectionId: sFolder.id,
            folderId: sFolder.id,
            folderUrl: `https://drive.google.com/drive/folders/${sFolder.id}`,
            index: parseInt(prefixNum, 10),
            prefix: prefixNum,
            slug: baseSlug,
            title: formatTitle(baseSlug),
            type, // 'video' | 'reading'
            durationSec: 0,
            video: videoFile,
            subtitles: {
              en: enSrtFile,
              vi: viSrtFile
            },
            instructions: htmlFile,
            pdfs: pdfFiles,
            otherFiles
          };

          lessons.push(lessonObj);

          if (htmlFile) {
            textDownloadTasks.push({ type: 'html', fileId: htmlFile.id, lessonObj });
          }
          if (enSrtFile) {
            textDownloadTasks.push({ type: 'srt_en', fileId: enSrtFile.id, lessonObj });
          }
          if (viSrtFile) {
            textDownloadTasks.push({ type: 'srt_vi', fileId: viSrtFile.id, lessonObj });
          }
        }

        sections.push({
          id: sFolder.id,
          name: sFolder.name,
          title: formatTitle(sFolder.name),
          folderUrl: `https://drive.google.com/drive/folders/${sFolder.id}`,
          lessons
        });
      }

      modules.push({
        id: mFolder.id,
        name: mFolder.name,
        index: parseInt(mFolder.name.match(/^(\d+)/)?.[1] || '1', 10),
        title: formatTitle(mFolder.name),
        folderUrl: `https://drive.google.com/drive/folders/${mFolder.id}`,
        sections
      });
    }

    courses.push({
      id: cFolder.id,
      slug: cFolder.name,
      order: meta.order,
      code: meta.code,
      title: meta.title,
      shortTitle: meta.shortTitle,
      description: meta.description,
      folderUrl: `https://drive.google.com/drive/folders/${cFolder.id}`,
      modules
    });
  }

  console.log(`Found ${courses.length} courses. Downloading ${textDownloadTasks.length} text/subtitle files for search & duration indexing...`);
  let done = 0;
  await mapPool(textDownloadTasks, 6, async (task) => {
    try {
      const content = await ensureTextFile(task.fileId);
      if (task.type === 'srt_en') {
        const { durationSec } = parseSrtDurationAndText(content);
        if (durationSec > 0) {
          task.lessonObj.durationSec = durationSec;
        }
      } else if (task.type === 'html') {
        const { plainText } = extractCleanHtml(content);
        const wordCount = plainText.split(/\s+/).filter(Boolean).length;
        // Estimate reading time: ~200 words/min + 3 mins per PDF attachment
        const pdfMinutes = (task.lessonObj.pdfs?.length || 0) * 5;
        const readMinutes = Math.max(2, Math.ceil(wordCount / 180) + pdfMinutes);
        task.lessonObj.durationSec = readMinutes * 60;
      }
    } catch (err) {
      console.error(`Warning: failed to download ${task.fileId}:`, err.message);
    }
    done++;
    if (done % 25 === 0 || done === textDownloadTasks.length) {
      console.log(`Progress: ${done}/${textDownloadTasks.length} text files cached`);
    }
  });

  // Compute totals per course & module
  let totalLessons = 0;
  let totalVideos = 0;
  let totalReadings = 0;
  let totalDurationSec = 0;

  for (const course of courses) {
    let cLessons = 0;
    let cVideos = 0;
    let cReadings = 0;
    let cDuration = 0;

    for (const mod of course.modules) {
      let mLessons = 0;
      let mDuration = 0;
      for (const sec of mod.sections) {
        for (const les of sec.lessons) {
          mLessons++;
          cLessons++;
          totalLessons++;
          if (les.type === 'video') {
            cVideos++;
            totalVideos++;
          } else {
            cReadings++;
            totalReadings++;
          }
          mDuration += les.durationSec || 0;
          cDuration += les.durationSec || 0;
          totalDurationSec += les.durationSec || 0;
        }
      }
      mod.totalLessons = mLessons;
      mod.totalDurationSec = mDuration;
    }

    course.totalLessons = cLessons;
    course.totalVideos = cVideos;
    course.totalReadings = cReadings;
    course.totalDurationSec = cDuration;
  }

  const catalog = {
    specialization: {
      id: ROOT_FOLDER_ID,
      title: 'Certified Business Analysis Professional (CBAP) Specialization',
      folderUrl: `https://drive.google.com/drive/folders/${ROOT_FOLDER_ID}`,
      syncedAt: new Date().toISOString(),
      totalCourses: courses.length,
      totalLessons,
      totalVideos,
      totalReadings,
      totalDurationSec
    },
    courses
  };

  const catalogPath = path.join(DATA_DIR, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Saved catalog to ${catalogPath} (${totalLessons} lessons: ${totalVideos} videos, ${totalReadings} readings).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
