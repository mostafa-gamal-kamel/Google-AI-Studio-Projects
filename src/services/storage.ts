import { AppSettings, MaintenanceReport } from '../types';

const STORAGE_KEYS = {
  REPORTS: 'maintenance_reports_v1',
  SETTINGS: 'maintenance_settings_v1',
  HAS_INITIALIZED: 'maintenance_seeded_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'دلتا لحلول الشبكات والاتصالات',
  companyLogoUrl: '',
  defaultTechnicianName: 'م. أحمد عبد العزيز',
  defaultTone: 'رسمي للإدارة',
  darkMode: false,
};

// Seed demo reports with realistic IT & network support content
export const DEMO_REPORTS: MaintenanceReport[] = [
  {
    id: 'demo-report-01',
    reportNumber: 'MR-2026-0001',
    title: 'صيانة وقائية دورية لغرفة الخوادم والـ Core Switch',
    reportType: 'صيانة دورية',
    tone: 'رسمي للإدارة',
    clientName: 'شركة النيل للخدمات اللوجستية',
    siteLocation: 'المقر الرئيسي - مبنى B - غرفة الداتا سنتر',
    technicianName: 'م. أحمد عبد العزيز',
    visitDate: '2026-10-24',
    startTime: '09:00',
    endTime: '12:30',
    durationMinutes: 210,
    checklists: [
      { id: '1', text: 'فحص مؤشرات الـ LEDs وحالة المنافذ لجميع السويتشات', status: 'done' },
      { id: '2', text: 'تنظيف أجهزة الراك وإزالة الأتربة من مراوح التبريد (Fans)', status: 'done' },
      { id: '3', text: 'اختبار روابط الـ Uplinks والألياف الضوئية وحساب الـ Throughput', status: 'done' },
      { id: '4', text: 'التأكد من سلامة ترقيم وتسمية الكابلات (Cable Labeling)', status: 'not_done', notes: 'يوجد 6 كابلات بدون Labeling في الراك 2' },
      { id: '5', text: 'مراقبة درجات حرارة كبائن السيرفرات والشبكة وحالة الـ UPS', status: 'done' },
      { id: '6', text: 'أخذ نسخة احتياطية من إعدادات الأجهزة (Backup Configuration)', status: 'done' },
      { id: '7', text: 'فحص ميزانية الطاقة للمنافذ PoE لأجهزة الـ Access Points والكاميرات', status: 'done' },
    ],
    rawNotes: 'تمت الصيانة بنجاح لجميع السويتشات في راك الإدارة. حرارة الغرفة مستقرة 21 درجة. تم تنظيف مروحة السويتش الرئيسي وأخذ Backup كامل بصيغة .cfg لكل من Core-SW01 و Dist-SW02. تم استبدال 2 كابل UTP Cat6 مهترئين.',
    quickNotesUsed: ['تم تنظيف الراك', 'تم اختبار الـ Uplink', 'تم أخذ Backup للإعدادات'],
    spareParts: [
      { id: 'sp-1', name: 'Patch Cord Cat6 UTP 2M', quantity: 2, status: 'مستخدم' },
      { id: 'sp-2', name: 'Cable Label Rolls (حلقات ترقيم)', quantity: 1, status: 'مطلوب' },
    ],
    photos: [],
    content: {
      summary: 'تم إجراء الصيانة الوقائية الربع سنوية المجدولة لكابينة الشبكة الرئيسية وغرفة الخوادم، وشملت الأعمال تنظيف المراوح، فحص استقرار الروابط الضوئية، والتحقق من كفاءة وحدات التبريد ومصدر الطاقة غير المنقطعة UPS.',
      workExecuted: [
        'تنظيف الأتربة المتراكمة على مداخل التبريد والمراوح لسويتشات Core-SW01 و Dist-SW02 باستخدام منفاخ هواء إلكتروني مخصص.',
        'إجراء اختبارات الـ Throughput وقياس نسبة الـ Jitter والـ Latency على روابط الـ Uplinks التابعة للألياف الضوئية مع عدم تسجيل أي فقد حزم (0% Packet Loss).',
        'تصدير وحفظ نسخ احتياطية حديثة من ملفات التكوين (Startup-Config) لجميع أجهزة السويتش وتخزينها في السيرفر الآمن.',
        'استبدال عدد 2 كابل توصيل Cat6 تالفي المشابك في لوحة الـ Patch Panel.',
      ],
      discoveredProblems: [
        {
          problem: 'غياب الترقيم والملصقات التعريفية عن 6 كابلات توصيل في الراك الفرعي رقم 2 مما يعيق عمليات التتبع السريع.',
          severity: 'منخفض',
          probableRootCause: 'السبب المحتمل: توصيلات طارئة سابقة تمت بدون إتمام التوثيق والترقيم الميداني.',
        },
        {
          problem: 'ارتفاع نسبي في قراءات الحرارة بمحيط سويتش التوزيع Dist-SW02 بنهاية ساعات الذروة.',
          severity: 'متوسط',
          probableRootCause: 'السبب المحتمل: تراكم الأتربة على فلتر الهواء الخارجي لوحدة التكييف الدقيقة (Precision AC) الخاصة بالغرفة.',
        },
      ],
      actionsTaken: [
        'تنظيف وتطهير مراوح السويتشات ومجاري تدفق الهواء بالكامل.',
        'تركيب كابلات Cat6 بديلة جديدة واختبارها عبر جهاز فحص الكابلات والتأكد من دعمها للسرعة الكاملة 1Gbps.',
        'إعادة ضبط مسارات التهوية داخل الكابينة باستخدام Blind Panels لمنع ارتداد الهواء الساخن.',
      ],
      recommendations: [
        'التنسيق مع فريق الصيانة العامة لتنظيف وتغيير فلاتر تكييف غرفة الخوادم أسبوعياً.',
        'توفير طابعة ملصقات كابلات احترافية لإتمام ترقيم الكابلات المتبقية في الزيارة القادمة.',
        'مراقبة استهلاك طاقة الـ PoE مع إضافة أي وحدات Access Point جديدة مستقبلاً.',
      ],
      pendingWork: [
        'إتمام ترقيم كابلات الراك رقم 2 فور وصول لفائف الترقيم المطلوبة.',
      ],
    },
    createdAt: '2026-10-24T12:35:00.000Z',
    updatedAt: '2026-10-24T12:35:00.000Z',
  },
  {
    id: 'demo-report-02',
    reportNumber: 'MR-2026-0002',
    title: 'إصلاح عطل توقف شبكة الـ Wi-Fi وكاميرات المراقبة في قسم الطوارئ',
    reportType: 'إصلاح عطل',
    tone: 'رسمي للإدارة',
    clientName: 'مستشفى الشروق التخصصي',
    siteLocation: 'مبنى الطوارئ - الطابق الأرضي - كابينة ER-Rack-01',
    technicianName: 'م. خالد المنشاوي',
    visitDate: '2026-10-28',
    startTime: '14:00',
    endTime: '16:45',
    durationMinutes: 165,
    checklists: [
      { id: '1', text: 'فحص حالة الروابط الفيزيائية (Physical Link State & LEDs)', status: 'done' },
      { id: '2', text: 'اختبار الـ Ping وفحص نسبة فقد الحزم (Packet Loss Test)', status: 'done' },
      { id: '3', text: 'مراجعة سجلات الأعطال والإنذارات (Syslog / Event Logs)', status: 'done' },
      { id: '4', text: 'فحص كابلات التوصيل ومصادر الطاقة ووحدات الـ SFP Transceivers', status: 'done' },
      { id: '5', text: 'التحقق من إعدادات الـ VLANs و الـ Default Gateway والـ DNS', status: 'done' },
      { id: '6', text: 'التأكد من عودة الخدمة للاستقرار وموافقة العميل', status: 'done' },
    ],
    rawNotes: 'تم استلام بلاغ عاجل بانقطاع شبكة الوايرلس وكاميرات الدور الأرضي. بالفحص تبين احتراق وحدة الـ SFP Transceiver 10G الخاصة برابط الألياف بين مبنى الطوارئ والمبنى الرئيسي بسبب تذبذب كهربائي. تم تركيب موديول SFP احتياطي وإعادة تشغيل سويتش الـ PoE واختبار جميع الـ APs والكاميرات وجميعها تعمل بكفاءة.',
    quickNotesUsed: ['تم إعادة تشغيل السويتش', 'تم اختبار الـ Uplink', 'لا توجد مشاكل'],
    spareParts: [
      { id: 'sp-3', name: 'SFP+ Transceiver Module 10G-SR Multi-mode', quantity: 1, status: 'مستخدم' },
      { id: 'sp-4', name: 'Fiber Patch Cord LC-LC Duplex 3M', quantity: 1, status: 'مستخدم' },
      { id: 'sp-5', name: 'وحدة منظم جهد كهربائي AVR إضافية للراك', quantity: 1, status: 'مطلوب' },
    ],
    photos: [],
    content: {
      summary: 'تمت الاستجابة الفورية لبلاغ العطل الطارئ الخاص بتوقف شبكة الاتصال اللاسلكي وكاميرات المراقبة في قسم الطوارئ. تم تشخيص العطل وحصره في وحدة الإرسال والاستقبال الضوئية (SFP+)، وجرى استبدالها واستعادة الخدمة بنجاح تام وبشكل فوري.',
      workExecuted: [
        'فحص السويتش الميداني سويتش ER-PoE-SW01 وتبين وميض مؤشر الـ Uplink باللون البرتقالي وغياب الإشارة الضوئية المستقبلة.',
        'اختبار خط الفايبر الضوئي بواسطة Optical Power Meter للتأكد من سلامة شعيرات الألياف الواصلة من غرفة السيرفرات الرئيسية.',
        'استبدال وحدة SFP+ Transceiver 10G-SR التالفة بوحدة جديدة متوافقة بالكامل.',
        'تغيير كابل الألياف الضوئية المزدوج (LC-LC Fiber Patch Cord) لضمان أعلى جودة إرسال.',
        'التحقق من اتصال وتغذية جميع نقاط الوصول (Access Points) البالغ عددها 12 نقطة وكاميرات المراقبة الثمانية.',
      ],
      discoveredProblems: [
        {
          problem: 'احتراق وحدة الـ SFP+ الضوئية على منفذ الـ Uplink 10G وتوقف كامل للاتصال عن قسم الطوارئ.',
          severity: 'عاجل',
          probableRootCause: 'السبب المحتمل: تذبذب مفاجئ في الجهد الكهربائي للتيار المغذي للراك قبل وصوله لمنظم الـ UPS.',
        },
      ],
      actionsTaken: [
        'تركيب وحدة SFP+ بديلة وتشغيل رابط الـ 10G Uplink واستقرار الـ Port-Channel فورياً.',
        'إجراء اختبار Ping متواصل لـ 500 حزمة والتأكد من انعدام الفقد واستجابة زمنية أقل من 1ms.',
        'تأكيد استعادة عمل كافة الخدمات اللاسلكية واستلام إقرار مهندس العمليات بالقسم.',
      ],
      recommendations: [
        'تركيب وحدة منظم جهد تلقائي (AVR) مخصصة لكابينة الطوارئ لحماية الأجهزة الحساسة من اضطرابات الشبكة الكهربائية.',
        'الاحتفاظ بوحدات SFP+ وكابلات فايبر احتياطية داخل خزانة الصيانة بالموقع للاستبدال الفوري مستقبلاً.',
      ],
      pendingWork: [
        'توريد وحدة AVR إضافية للراك لضمان الحماية من تقلبات الكهرباء.',
      ],
    },
    createdAt: '2026-10-28T16:50:00.000Z',
    updatedAt: '2026-10-28T16:50:00.000Z',
  },
];

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  constructor() {
    this.initDemoDataIfNeeded();
  }

  private initDemoDataIfNeeded() {
    if (!this.isBrowser()) return;
    const initialized = localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED);
    if (!initialized) {
      this.saveReports(DEMO_REPORTS);
      this.saveSettings(DEFAULT_SETTINGS);
      localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, 'true');
    }
  }

  getReports(): MaintenanceReport[] {
    if (!this.isBrowser()) return DEMO_REPORTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  getReportById(id: string): MaintenanceReport | undefined {
    const reports = this.getReports();
    return reports.find((r) => r.id === id);
  }

  saveReport(report: MaintenanceReport): void {
    if (!this.isBrowser()) return;
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === report.id);
    if (index >= 0) {
      reports[index] = { ...report, updatedAt: new Date().toISOString() };
    } else {
      reports.unshift({
        ...report,
        createdAt: report.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveReports(reports);
  }

  deleteReport(id: string): void {
    if (!this.isBrowser()) return;
    const reports = this.getReports().filter((r) => r.id !== id);
    this.saveReports(reports);
  }

  duplicateReport(id: string): MaintenanceReport | null {
    const existing = this.getReportById(id);
    if (!existing) return null;

    const allReports = this.getReports();
    const currentYear = new Date().getFullYear();
    const prefix = `MR-${currentYear}-`;
    let maxSeq = 0;
    for (const r of allReports) {
      if (r.reportNumber && r.reportNumber.startsWith(prefix)) {
        const seq = parseInt(r.reportNumber.substring(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    }
    const newNumber = `${prefix}${(maxSeq + 1).toString().padStart(4, '0')}`;

    const newReport: MaintenanceReport = {
      ...existing,
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reportNumber: newNumber,
      title: `${existing.title} (نسخة مكررة)`,
      visitDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveReport(newReport);
    return newReport;
  }

  private saveReports(reports: MaintenanceReport[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }

  clearDemoReports(): void {
    if (!this.isBrowser()) return;
    const reports = this.getReports().filter((r) => !r.id.startsWith('demo-'));
    this.saveReports(reports);
  }

  clearAllData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, 'true');
  }

  getSettings(): AppSettings {
    if (!this.isBrowser()) return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: AppSettings): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  exportBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      reports: this.getReports(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.reports)) {
        this.saveReports(parsed.reports);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
