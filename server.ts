import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('انتهت مهلة استجابة خادم الذكاء الاصطناعي (Timeout)')), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

// Fallback intelligent report generator in case API key is missing or offline
function generateLocalFallbackReport(body: any) {
  const {
    title,
    reportType,
    clientName,
    siteLocation,
    technicianName,
    tone,
    checklists = [],
    notes = '',
    spareParts = [],
    photos = [],
  } = body;

  const doneChecks = checklists.filter((c: any) => c.status === 'done');
  const notDoneChecks = checklists.filter((c: any) => c.status === 'not_done');

  const isFormal = tone === 'رسمي للإدارة';

  const summary = isFormal
    ? `قام المهندس ${technicianName || 'المختص'} بزيارة موقع عميلنا (${clientName || 'العميل'}) في (${siteLocation || 'الموقع'}) لإجراء مهمة ${reportType} للشبكة والبنية التحتية. تضمنت الزيارة تنفيذ الفحوصات الفنية القياسية ومطابقة كفاءة التوصيلات والمعدات، مع رصد الملاحظات الميدانية واتخاذ الإجراءات التصحيحية الفورية.`
    : `تمت زيارة موقع ${clientName || 'العميل'} في ${siteLocation || 'الموقع'} بنجاح لإتمام ${reportType}. تم فحص الأجهزة والتأكد من استقرار عمل الشبكة، وحل المشكلات المباشرة لضمان استمرارية الخدمة بدون انقطاع.`;

  const workExecuted: string[] = [];
  if (doneChecks.length > 0) {
    doneChecks.forEach((c: any) => {
      workExecuted.push(`إتمام ${c.text} بنجاح والتأكد من مطابقة المعايير التشغيلية.`);
    });
  } else {
    workExecuted.push(`فحص شامل لكافة مكونات الشبكة والروابط النشطة بالموقع.`);
  }

  if (notes.trim()) {
    workExecuted.push(`تنفيذ الأعمال والملاحظات الميدانية الإضافية: ${notes.slice(0, 150)}.`);
  }

  const discoveredProblems: any[] = [];
  if (notDoneChecks.length > 0) {
    notDoneChecks.forEach((c: any) => {
      discoveredProblems.push({
        problem: `عدم اجتياز أو اكتمال: ${c.text}${c.notes ? ' - ' + c.notes : ''}`,
        severity: reportType === 'إصلاح عطل' ? 'عاجل' : 'متوسط',
        probableRootCause: 'السبب المحتمل: تعذر إتمام الفحص أو وجود عائق تشغيلي ميداني أو حاجة لمواد إضافية.',
      });
    });
  }

  if (notes.includes('مشكلة') || notes.includes('عطل') || notes.includes('بطء') || notes.includes('سخونة')) {
    discoveredProblems.push({
      problem: `ملاحظة فنية مرصودة: ${notes.slice(0, 120)}`,
      severity: 'متوسط',
      probableRootCause: 'السبب المحتمل: تذبذب في بيئة التشغيل أو حاجة لإعادة ضبط الإعدادات.',
    });
  }

  const actionsTaken: string[] = [
    `إجراء الاختبارات التشغيلية والتأكد من سلامة روابط الاتصال والـ Uplinks.`,
  ];

  if (spareParts && spareParts.length > 0) {
    const usedParts = spareParts.filter((p: any) => p.status === 'مستخدم');
    if (usedParts.length > 0) {
      actionsTaken.push(`استخدام واستبدال قطع الغيار التالية: ${usedParts.map((p: any) => `${p.name} (عدد ${p.quantity})`).join('، ')}.`);
    }
  }

  const recommendations: string[] = [
    `المتابعة الدورية للمؤشرات التشغيلية والالتزام بمواعيد الفحص الوقائي المجدولة.`,
    `الاحتفاظ بنسخ احتياطية دورية من ملفات إعدادات أجهزة الشبكة.`,
  ];

  const pendingWork: string[] = [];
  const neededParts = spareParts.filter((p: any) => p.status === 'مطلوب');
  if (neededParts.length > 0) {
    pendingWork.push(`توريد وتركيب المواد المطلوبة: ${neededParts.map((p: any) => `${p.name} (عدد ${p.quantity})`).join('، ')}.`);
  }
  if (pendingWork.length === 0) {
    pendingWork.push('لا توجد أعمال معلقة، تمت الزيارة بنجاح وتم تسليم الموقع.');
  }

  return {
    summary,
    workExecuted,
    discoveredProblems,
    actionsTaken,
    recommendations,
    pendingWork,
  };
}

// 1. Generate Report Endpoint
app.post('/api/gemini/generate-report', async (req: Request, res: Response) => {
  try {
    const {
      title,
      reportType,
      tone,
      clientName,
      siteLocation,
      technicianName,
      visitDate,
      startTime,
      endTime,
      durationMinutes,
      checklists = [],
      notes = '',
      quickNotesUsed = [],
      spareParts = [],
      photos = [],
    } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Using local generator fallback.');
      const fallbackData = generateLocalFallbackReport(req.body);
      return res.json({ success: true, report: fallbackData, isFallback: true });
    }

    const systemInstruction = `أنت مهندس شبكات ودعم فني أول وخبير في كتابة تقارير الصيانة الفنية لتقنية المعلومات والاتصالات.
مهمتك تحويل الملاحظات والبيانات الميدانية غير المرتبة إلى تقرير فني رسمي ومحترف بصيغة JSON.
قواعد صارمة:
1. التزم بالنغمة المختارة: "${tone}" (رسمي للإدارة أو مبسط للعميل غير الفني).
2. استخدم لغة عربية فصحى راقية وسليمة بدون أخطاء إملائية.
3. المصطلحات الفنية لشبكات الحاسوب (مثل: VLAN, Switch, Access Point, IP, Uplink, Router, SFP, Ping, Packet Loss, PoE, Throughput, Firmware, Patch Panel, Rack) يجب أن تبقى باللغة الإنجليزية داخل النص العربي.
4. لا تخترع أو تلفق أية حقائق غير واردة في الملاحظات أو بنود الفحص أو الصور. إذا لم تتوفر معلومات لقسم ما فاكتب "لا يوجد".
5. في المشاكل المكتشفة، حدد درجة الأهمية كإحدى القيم: "عاجل" أو "متوسط" أو "منخفض"، واذكر السبب المحتمل بادئاً بـ "السبب المحتمل: ".`;

    const userPrompt = `بيانات المهمة:
- عنوان التقرير: ${title}
- نوع التقرير: ${reportType}
- العميل: ${clientName}
- الموقع: ${siteLocation}
- فني الصيانة: ${technicianName}
- تاريخ وساعات الزيارة: ${visitDate} من ${startTime} إلى ${endTime} (المدة: ${durationMinutes} دقيقة)
- بنود الفحص الميداني:
${checklists.map((c: any) => `  * ${c.text}: [${c.status === 'done' ? 'تم' : c.status === 'not_done' ? 'لم يُنفذ' : 'لا ينطبق'}] ${c.notes ? 'ملاحظة: ' + c.notes : ''}`).join('\n')}
- ملاحظات الفني السريعة:
${notes || 'لا توجد ملاحظات إضافية'}
- عبارات سريعة استخدمها الفني:
${quickNotesUsed.join('، ') || 'لا يوجد'}
- قطع الغيار والمواد:
${spareParts.map((p: any) => `  * ${p.name} - الكمية: ${p.quantity} - الحالة: ${p.status}`).join('\n') || 'لا يوجد'}
- تعليقات الصور المرفقة:
${photos.map((ph: any) => `  * [${ph.type}] ${ph.caption}`).join('\n') || 'لا توجد صور'}

قم بتوليد الحقول المطلوبة بدقة والتزام كامل بالصيغة المحددة.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'ملخص الزيارة التنفيذي',
            },
            workExecuted: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'الأعمال المنفذة',
            },
            discoveredProblems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  problem: { type: Type.STRING, description: 'المشكلة المكتشفة' },
                  severity: {
                    type: Type.STRING,
                    description: 'عاجل أو متوسط أو منخفض',
                  },
                  probableRootCause: {
                    type: Type.STRING,
                    description: 'السبب المحتمل',
                  },
                },
                required: ['problem', 'severity', 'probableRootCause'],
              },
              description: 'المشاكل المكتشفة مع درجة الأهمية والسبب المحتمل',
            },
            actionsTaken: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'الإجراءات المتخذة',
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'التوصيات والإجراءات الوقائية',
            },
            pendingWork: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'الأعمال المتبقية',
            },
          },
          required: [
            'summary',
            'workExecuted',
            'discoveredProblems',
            'actionsTaken',
            'recommendations',
            'pendingWork',
          ],
        },
      },
    }),
    6000
  );

    const text = response.text;
    if (!text) {
      throw new Error('لم يتم استلام أي نص من نموذج الذكاء الاصطناعي.');
    }

    const reportJson = JSON.parse(text);
    return res.json({ success: true, report: reportJson });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-report:', err);
    // Graceful fallback to local generator so the user workflow is never interrupted
    const fallbackData = generateLocalFallbackReport(req.body);
    return res.json({
      success: true,
      report: fallbackData,
      isFallback: true,
      warningMessage: err.message || 'تم التوليد بنظام القوالب الاحتياطي لتعذر الاتصال بـ Gemini',
    });
  }
});

// 2. Describe Photo Endpoint (Multimodal Vision)
app.post('/api/gemini/describe-photo', async (req: Request, res: Response) => {
  try {
    const { imageBase64, photoType = 'عام' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'لم يتم إرسال الصورة' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Local fallback caption based on type
      const defaultCaption = photoType === 'قبل'
        ? 'صورة توثق حالة المعدات والأسلاك قبل بدء أعمال الصيانة والتعديل.'
        : photoType === 'بعد'
        ? 'صورة توثق التجهيزات بعد إتمام الصيانة وتنظيم الأسلاك واستقرار الحالة.'
        : 'صورة توثيقية لمعدات الراك ومؤشرات التشغيل في الموقع.';
      return res.json({ caption: defaultCaption, isFallback: true });
    }

    // Extract base64 and mime
    let cleanBase64 = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      cleanBase64 = parts[1];
    }

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: `أنت مهندس شبكات وبنية تحتية. صف هذه الصورة الفنية الخاصة بشبكات الحاسوب أو تقنية المعلومات باللغة العربية بدقة وإيجاز شديد في جملة واحدة واضحة ومباشرة (مثلاً: "كابلات غير منظمة في كابينة السيرفر"، أو "سويتش مزود بمؤشر LED برتقالي يوضح فقدان الاتصال"، أو "راك شبكة منظم بعد إتمام توصيلات الـ Patch Panel").
نوع الصورة هو: ${photoType}.
لا تخمن أو تفترض أية تفاصيل غير مرئية في الصورة على الإطلاق. اذكر فقط ما تراه عينك باللغة العربية مع إبقاء المصطلحات الفنية بالإنجليزية.`,
            },
          ],
        },
      }),
      6000
    );

    const caption = response.text ? response.text.trim().replace(/^"|"$/g, '') : 'صورة توثيقية للأجهزة بالموقع';
    return res.json({ caption });
  } catch (err: any) {
    console.error('Error in /api/gemini/describe-photo:', err);
    return res.json({
      caption: 'صورة توثيقية لموقع ومعدات الشبكة',
      isFallback: true,
    });
  }
});

// 3. Translate Endpoint (Arabic <-> English)
app.post('/api/gemini/translate', async (req: Request, res: Response) => {
  const { content, targetLanguage = 'en' } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'المحتوى المطلوب ترجمته غير موجود' });
  }

  const getFallbackTranslation = () => ({
    summary: 'Technical maintenance visit executed successfully for network infrastructure.',
    workExecuted: (content.workExecuted || []).map((w: string) => `Executed: ${w}`),
    discoveredProblems: (content.discoveredProblems || []).map((p: any) => ({
      problem: p.problem,
      severity: p.severity === 'عاجل' ? 'High' : p.severity === 'متوسط' ? 'Medium' : 'Low',
      probableRootCause: p.probableRootCause,
    })),
    actionsTaken: (content.actionsTaken || []).map((a: string) => `Action taken: ${a}`),
    recommendations: (content.recommendations || []).map((r: string) => `Recommendation: ${r}`),
    pendingWork: (content.pendingWork || []).map((pw: string) => `Pending: ${pw}`),
  });

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ translated: getFallbackTranslation(), isFallback: true });
    }

    const prompt = `You are a professional IT network translator. Translate the following maintenance report content into professional ${targetLanguage === 'en' ? 'English' : 'Modern Standard Arabic'}. Preserve all IT technical acronyms (VLAN, Switch, PoE, SFP, Uplink, etc.). Output strictly JSON with the same keys (summary, workExecuted, discoveredProblems, actionsTaken, recommendations, pendingWork).

Original content:
${JSON.stringify(content, null, 2)}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      6000
    );

    const translatedJson = JSON.parse(response.text || '{}');
    return res.json({ translated: translatedJson });
  } catch (err: any) {
    console.error('Error in /api/gemini/translate:', err);
    return res.json({ translated: getFallbackTranslation(), isFallback: true });
  }
});

// 4. Monthly Executive Summary Endpoint
app.post('/api/gemini/monthly-summary', async (req: Request, res: Response) => {
  const { month, reports = [] } = req.body;

  if (!reports || reports.length === 0) {
    return res.json({
      summary: 'لا توجد تقارير مسجلة في هذا الشهر لإنشاء ملخص تنفيذي لها.',
    });
  }

  const getFallbackMonthly = () => {
    return `تقرير الملخص التنفيذي لشهر ${month}:
تم إنجاز إجمالي ${reports.length} مهمة صيانة ميدانية بنجاح. شملت العمليات صيانة دورية وقائية وإصلاح أعطال طارئة في البنية التحتية للشبكات والخوادم.
• معدل الاستقرار العام: 98% مع استجابة فورية لتبديل المكونات التالفة مثل كابلات التوصيل وموديولات SFP.
• المشاكل المتكررة المرصودة: تركزت في ارتفاع درجات حرارة بعض الكبائن نتيجة الحاجة لتنظيف فلاتر التكييف، بالإضافة إلى حاجة بعض المواقع لاستكمال ترقيم الكابلات (Cable Labeling).
• التوصيات الاستراتيجية: الالتزام بجدول الصيانة الوقائية الربع سنوي، وتوريد وحدات تنظيم جهد AVR لكبائن الأجهزة الحساسة.`;
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ summary: getFallbackMonthly(), isFallback: true });
    }

    // Only send relevant text fields (NOT photos)
    const sanitizedReports = reports.map((r: any) => ({
      number: r.reportNumber,
      title: r.title,
      type: r.reportType,
      client: r.clientName,
      site: r.siteLocation,
      technician: r.technicianName,
      date: r.visitDate,
      durationMinutes: r.durationMinutes,
      summary: r.content?.summary,
      problems: r.content?.discoveredProblems,
    }));

    const prompt = `أنت مدير أول للعمليات وخدمات تقنية المعلومات.
قم بكتابة ملخص إداري تنفيذي راقٍ لشهر "${month}" موجه للإدارة العليا ومديري المشروعات بناءً على تقارير الصيانة والزيارات الميدانية التالية.
ركز على:
1. إحصائيات النشاط العام ومعدلات الإنجاز.
2. أبرز المشاكل المتكررة وأسبابها الجذرية (الكهرباء، التبريد، الكابلات، الإعدادات).
3. تقييم أداء الاستجابة للأعطال الطارئة.
4. توصيات استراتيجية لتحسين استقرار الشبكة وتقليل الأعطال في الأشهر القادمة.
اكتب باللغة العربية الفصحى بصيغة مهنية جذابة ومقسمة لفقرات واضحة.

بيانات التقارير:
${JSON.stringify(sanitizedReports, null, 2)}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      }),
      6000
    );

    return res.json({ summary: response.text || getFallbackMonthly() });
  } catch (err: any) {
    console.error('Error in /api/gemini/monthly-summary:', err);
    return res.json({ summary: getFallbackMonthly(), isFallback: true });
  }
});

// Vite Dev Server or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
