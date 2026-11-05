const fs = require('fs');
const path = require('path');

// Built-in BA / PM / Product Management / Tech Glossary with Vietnamese explanations
const DOMAIN_GLOSSARY = [
  {
    term: 'Business Analysis (BA)',
    patterns: [/\bbusiness analysis\b/i, /\bbusiness analyst\b/i],
    category: 'BA · Core',
    definitionVi: 'Phân tích nghiệp vụ: Hoạt động xác định nhu cầu kinh doanh, phân tích quy trình và đề xuất giải pháp mang lại giá trị cho các bên liên quan (Stakeholders).'
  },
  {
    term: 'BABOK (Business Analysis Body of Knowledge)',
    patterns: [/\bbabok\b/i, /\biiba\b/i],
    category: 'BA · IIBA Standard',
    definitionVi: 'Khung kiến thức chuẩn quốc tế của IIBA cho BA, gồm 6 Knowledge Areas (Planning, Elicitation, Lifecycle Management, Strategy, Requirements Analysis, Solution Evaluation).'
  },
  {
    term: 'Stakeholder (Bên liên quan)',
    patterns: [/\bstakeholders?\b/i],
    category: 'BA / PM · Core',
    definitionVi: 'Cá nhân hoặc nhóm có ảnh hưởng đến dự án/sản phẩm hoặc chịu tác động từ kết quả của dự án (Sponsor, Customer, End-user, Dev Team, Regulator).'
  },
  {
    term: 'Requirements Elicitation (Khơi gợi yêu cầu)',
    patterns: [/\belicitation\b/i, /\bgathering requirements\b/i, /\belicit\b/i],
    category: 'BA · Requirements',
    definitionVi: 'Quá trình thu thập, khám phá và làm rõ yêu cầu thực sự của Stakeholders thông qua phỏng vấn, workshop, quan sát, phân tích tài liệu và prototyping.'
  },
  {
    term: 'Process Modeling / BPMN',
    patterns: [/\bprocess model/i, /\bbpmn\b/i, /\bflowchart\b/i, /\bworkflow\b/i, /\bas-is\b/i, /\bto-be\b/i],
    category: 'BA · Modeling',
    definitionVi: 'Mô hình hóa quy trình nghiệp vụ (hiện trạng As-Is và tương lai To-Be) bằng lưu đồ hoặc chuẩn BPMN để phát hiện điểm nghẽn và tối ưu hóa.'
  },
  {
    term: 'Functional & Non-Functional Requirements',
    patterns: [/\bfunctional requirements?\b/i, /\bnon-functional\b/i, /\bsystem requirements?\b/i],
    category: 'BA / Software',
    definitionVi: 'Functional (Yêu cầu chức năng: hệ thống phải làm gì) và Non-Functional (Yêu cầu phi chức năng: hiệu năng, bảo mật, độ tin cậy, khả năng mở rộng).'
  },
  {
    term: 'Use Case & User Story',
    patterns: [/\buse cases?\b/i, /\buser stor(y|ies)\b/i],
    category: 'BA / Agile Product',
    definitionVi: 'Mô tả cách người dùng tương tác với hệ thống để đạt mục tiêu. User Story thường viết theo mẫu: "As a <role>, I want <goal>, so that <benefit>".'
  },
  {
    term: 'Acceptance Criteria (Tiêu chí nghiệm thu)',
    patterns: [/\bacceptance criteria\b/i, /\bdefinition of done\b/i],
    category: 'Agile / Product',
    definitionVi: 'Các điều kiện cụ thể mà một tính năng hoặc User Story phải thỏa mãn để được Product Owner/QA chấp nhận là hoàn thành (thường viết theo chuẩn Given-When-Then).'
  },
  {
    term: 'Project Charter (Điều lệ dự án)',
    patterns: [/\bproject charter\b/i, /\bcharter\b/i],
    category: 'PM · Initiation',
    definitionVi: 'Tài liệu chính thức khởi tạo dự án, xác định mục tiêu, phạm vi tổng quan, ngân sách, các mốc chính và trao thẩm quyền cho Project Manager.'
  },
  {
    term: 'Scope & Scope Creep (Phạm vi & Trượt phạm vi)',
    patterns: [/\bscope creep\b/i, /\bproject scope\b/i, /\bin-scope\b/i, /\bout-of-scope\b/i],
    category: 'PM · Planning',
    definitionVi: 'Project Scope là ranh giới công việc cần làm; Scope Creep là hiện tượng phạm vi dự án phình to không kiểm soát mà không được bổ sung thời gian/nguồn lực.'
  },
  {
    term: 'WBS (Work Breakdown Structure)',
    patterns: [/\bwork breakdown structure\b/i, /\bwbs\b/i, /\bwork packages?\b/i],
    category: 'PM · Planning',
    definitionVi: 'Cấu trúc phân rã công việc: chia nhỏ toàn bộ kết quả dự án (Deliverables) thành các gói công việc nhỏ (Work Packages) dễ ước lượng, giao việc và theo dõi.'
  },
  {
    term: 'RACI Matrix (Ma trận trách nhiệm)',
    patterns: [/\braci\b/i],
    category: 'PM / BA · Governance',
    definitionVi: 'Ma trận phân quyền gồm 4 vai trò: Responsible (Người thực hiện), Accountable (Người chịu trách nhiệm cuối), Consulted (Người được tham vấn), Informed (Người được thông báo).'
  },
  {
    term: 'Risk Management (Quản trị rủi ro)',
    patterns: [/\brisk management\b/i, /\brisk register\b/i, /\bmitigation\b/i],
    category: 'PM · Execution',
    definitionVi: 'Quy trình nhận diện, đánh giá xác suất - mức độ ảnh hưởng và lập kế hoạch ứng phó (Avoid, Mitigate, Transfer, Accept) các rủi ro dự án.'
  },
  {
    term: 'Agile & Scrum Framework',
    patterns: [/\bagile\b/i, /\bscrum\b/i, /\bsprints?\b/i],
    category: 'Agile / PM',
    definitionVi: 'Phương pháp phát triển lặp và tăng trưởng (Iterative & Incremental), chia dự án thành các chu kỳ ngắn (Sprint 1-4 tuần) để liên tục chuyển giao giá trị và thích ứng thay đổi.'
  },
  {
    term: 'Product Backlog & Prioritization',
    patterns: [/\bbacklog\b/i, /\bprioritiz/i, /\bmoscow\b/i],
    category: 'Agile / Product',
    definitionVi: 'Danh sách toàn bộ tính năng, cải tiến và lỗi cần xử lý được sắp xếp theo mức độ ưu tiên giá trị kinh doanh (do Product Owner quản lý).'
  },
  {
    term: 'Retrospective & Continuous Improvement',
    patterns: [/\bretrospective\b/i, /\bcontinuous improvement\b/i, /\bdaily standup\b/i],
    category: 'Agile · Team',
    definitionVi: 'Buổi họp nhìn lại cuối mỗi Sprint để đội ngũ đánh giá điều đã làm tốt, điểm cần cải thiện và thống nhất hành động tối ưu hóa quy trình.'
  },
  {
    term: 'Design Thinking (Tư duy thiết kế)',
    patterns: [/\bdesign thinking\b/i, /\bempathize\b/i, /\bideate\b/i],
    category: 'Product · Discovery',
    definitionVi: 'Phương pháp giải quyết vấn đề lấy người dùng làm trung tâm qua 5 bước: Thấu cảm (Empathize) -> Xác định vấn đề (Define) -> Ý tưởng (Ideate) -> Nguyên mẫu (Prototype) -> Thử nghiệm (Test).'
  },
  {
    term: 'Persona & Customer Journey',
    patterns: [/\bpersonas?\b/i, /\bcustomer journey\b/i, /\buser journey\b/i],
    category: 'Product · UX',
    definitionVi: 'Chân dung người dùng mục tiêu (Persona) và bản đồ hành trình trải nghiệm của khách hàng qua từng điểm chạm (Touchpoints) với sản phẩm.'
  },
  {
    term: 'Hypothesis-Driven Development & MVP',
    patterns: [/\bhypothesis\b/i, /\bminimum viable product\b/i, /\bmvp\b/i, /\bexperiment/i],
    category: 'Product · Validation',
    definitionVi: 'Phát triển sản phẩm dựa trên giả thuyết và kiểm chứng nhanh bằng sản phẩm khả dụng tối thiểu (MVP) trước khi đầu tư nguồn lực lớn.'
  },
  {
    term: 'Product Analytics, Cohort & A/B Testing',
    patterns: [/\ba\/b test/i, /\bcohort\b/i, /\bfunnel\b/i, /\bretention\b/i, /\bconversion\b/i, /\bmetrics?\b/i, /\bkpis?\b/i, /\bokrs?\b/i],
    category: 'Product · Analytics',
    definitionVi: 'Đo lường hành vi người dùng qua phễu chuyển đổi (Funnel), tỷ lệ giữ chân theo nhóm (Cohort Retention), chỉ số KPI/OKR và thử nghiệm đối chứng A/B Testing.'
  }
];

async function translateBatchTextEnToVi(texts) {
  if (!texts || texts.length === 0) return [];
  // Join cues with a newline delimiter that Google Translate preserves line-by-line
  const joined = texts.map(t => String(t || '').replace(/\r?\n/g, ' ').trim()).join('\n');
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=vi&q=${encodeURIComponent(joined)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`Translate HTTP ${res.status}`);
  }
  const data = await res.json();
  let translatedFull = '';
  if (Array.isArray(data)) {
    if (typeof data[0] === 'string') {
      translatedFull = data[0];
    } else if (Array.isArray(data[0])) {
      translatedFull = data[0].map(part => part?.[0] || '').join('');
    }
  }
  const lines = String(translatedFull || '').split('\n').map(s => s.trim());
  return texts.map((orig, idx) => lines[idx] || orig);
}

async function ensureVietnameseCues(lessonId, cuesEn, textCacheDir) {
  if (!Array.isArray(cuesEn) || cuesEn.length === 0) return [];
  const safeKey = String(lessonId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const cacheFile = path.join(textCacheDir, `auto_vi_${safeKey}.json`);

  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch (e) {
      // Ignore corrupt cache
    }
  }

  // Batch into chunks of 28 cues (~2,000 chars per chunk) and translate in parallel
  const CHUNK_SIZE = 28;
  const chunks = [];
  for (let i = 0; i < cuesEn.length; i += CHUNK_SIZE) {
    chunks.push(cuesEn.slice(i, i + CHUNK_SIZE));
  }

  const translatedChunks = await Promise.all(
    chunks.map(chunk => translateBatchTextEnToVi(chunk.map(c => c.text)))
  );

  const cuesVi = [];
  let chunkIdx = 0;
  for (const chunk of chunks) {
    const viLines = translatedChunks[chunkIdx] || [];
    for (let j = 0; j < chunk.length; j++) {
      const c = chunk[j];
      cuesVi.push({
        start: c.start,
        end: c.end,
        timeStr: c.timeStr,
        text: viLines[j] || c.text
      });
    }
    chunkIdx++;
  }

  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cuesVi), 'utf8');
  } catch (e) {
    // Ignore write error
  }
  return cuesVi;
}

function stripHtmlTags(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateLessonStudyGuide({ course, module, lesson, cuesEn = [], cuesVi = [], htmlContent = '' }) {
  const fullTextEn = cuesEn.length > 0
    ? cuesEn.map(c => c.text).join(' ')
    : stripHtmlTags(htmlContent);

  // 1. Divide transcript / reading into 4-6 structured Key Takeaways sections
  const takeaways = [];
  if (cuesEn.length > 0 || cuesVi.length > 0) {
    const base = cuesEn.length > 0 ? cuesEn : cuesVi;
    const targetSections = Math.min(6, Math.max(3, Math.ceil(base.length / 18)));
    const step = Math.max(1, Math.floor(base.length / targetSections));

    for (let idx = 0; idx < base.length; idx += step) {
      if (takeaways.length >= targetSections) break;
      const sliceEn = cuesEn.slice(idx, idx + Math.min(step, 5));
      const sliceVi = cuesVi.slice(idx, idx + Math.min(step, 5));
      const firstCue = sliceEn[0] || sliceVi[0];
      if (!firstCue) continue;

      const summaryEn = sliceEn.map(c => c.text).join(' ');
      const summaryVi = sliceVi.map(c => c.text).join(' ');

      takeaways.push({
        timeSec: firstCue.start,
        timeStr: firstCue.timeStr,
        en: summaryEn,
        vi: summaryVi
      });
    }
  } else if (htmlContent) {
    const sentences = fullTextEn
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length >= 45 && s.length <= 280);
    const step = Math.max(1, Math.floor(sentences.length / 5));
    for (let i = 0; i < sentences.length && takeaways.length < 5; i += step) {
      takeaways.push({
        timeSec: null,
        timeStr: `Điểm chính #${takeaways.length + 1}`,
        en: sentences[i],
        vi: ''
      });
    }
  }

  // 2. Detect relevant BA / PM / Product terminology in this lesson
  const matchedTerms = [];
  for (const item of DOMAIN_GLOSSARY) {
    if (item.patterns.some(re => re.test(fullTextEn) || re.test(lesson.title || ''))) {
      matchedTerms.push({
        term: item.term,
        category: item.category,
        definitionVi: item.definitionVi
      });
    }
  }

  // Always provide at least 2 core terms for the course stage if the lesson is a short intro
  if (matchedTerms.length === 0) {
    const code = String(course?.code || '').toUpperCase();
    if (code.startsWith('GPM-') || code.startsWith('JIRA')) {
      matchedTerms.push(DOMAIN_GLOSSARY[8], DOMAIN_GLOSSARY[13]);
    } else if (code.startsWith('PROD-')) {
      matchedTerms.push(DOMAIN_GLOSSARY[16], DOMAIN_GLOSSARY[18]);
    } else {
      matchedTerms.push(DOMAIN_GLOSSARY[0], DOMAIN_GLOSSARY[2]);
    }
  }

  // 3. Build self-check flashcards / review questions
  const flashcards = matchedTerms.slice(0, 4).map((t, i) => ({
    id: `fc_${i + 1}`,
    question: `Khái niệm "${t.term}" đóng vai trò gì trong bài học "${lesson.title}"?`,
    answer: t.definitionVi
  }));

  if (takeaways.length > 0) {
    flashcards.unshift({
      id: 'fc_core',
      question: `Nội dung trọng tâm của bài "${lesson.title}" (${module?.title || course?.shortTitle}) là gì?`,
      answer: takeaways
        .slice(0, 3)
        .map(t => `• [${t.timeStr}] ${t.vi || t.en}`)
        .join('\n')
    });
  }

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    courseTitle: course?.title || '',
    moduleTitle: module?.title || '',
    hasVietnamese: cuesVi.length > 0,
    takeaways,
    glossary: matchedTerms,
    flashcards
  };
}

module.exports = {
  ensureVietnameseCues,
  generateLessonStudyGuide
};
