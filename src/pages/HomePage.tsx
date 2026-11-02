import React from 'react';
import {
  PlusCircle,
  FileText,
  Sparkles,
  Download,
  Building2,
  Calendar,
  Clock,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MaintenanceReport } from '../types';
import { formatDateArabic } from '../utils/reportUtils';

interface HomePageProps {
  reports: MaintenanceReport[];
  onOpenReport: (report: MaintenanceReport) => void;
  onNewReport: () => void;
  onDeleteReport: (id: string) => void;
  onClearDemoData: () => void;
  onNavigateTab: (tab: 'home' | 'new-report' | 'archive' | 'dashboard' | 'settings') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  reports,
  onOpenReport,
  onNewReport,
  onDeleteReport,
  onClearDemoData,
  onNavigateTab,
}) => {
  // Stats
  const totalReports = reports.length;
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const reportsThisMonth = reports.filter((r) => r.visitDate.startsWith(currentMonthPrefix)).length;

  // Most visited site
  const siteCounts: Record<string, number> = {};
  reports.forEach((r) => {
    if (r.siteLocation) {
      siteCounts[r.siteLocation] = (siteCounts[r.siteLocation] || 0) + 1;
    }
  });
  let mostVisitedSite = 'لا يوجد';
  let maxCount = 0;
  for (const [site, count] of Object.entries(siteCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostVisitedSite = site;
    }
  }

  const hasDemoReports = reports.some((r) => r.id.startsWith('demo-'));
  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-blue-700/30">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>نظام ميداني متقدم لمهندسي الشبكات وفنيي الـ IT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            مولّد تقارير الصيانة الذكي
          </h1>

          <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed font-normal">
            حوّل ملاحظاتك الميدانية وصورك السريعة إلى تقرير فني رسمي متكامل بالذكاء الاصطناعي وصيغة Word جاهز للتسليم في ثوانٍ معدودة.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNewReport}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-blue-900 hover:bg-blue-50 active:scale-95 font-bold rounded-2xl shadow-lg transition text-base"
            >
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>إنشاء تقرير جديد</span>
              <ArrowLeft className="w-4 h-4 mr-1 text-blue-600" />
            </button>

            <button
              onClick={() => onNavigateTab('archive')}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-blue-700/50 hover:bg-blue-700/80 text-white border border-blue-400/30 font-semibold rounded-2xl transition text-sm backdrop-blur"
            >
              استعراض الأرشيف ({totalReports})
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
            ملاحظات سريعة وإملاء صوتي
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            اكتب بالعامية أو الإنجليزية أو استخدم الميكروفون الميداني مع عبارات سريعة لإنجاز التدوين دون إضاعة وقت بالموقع.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
            تقرير رسمي بالذكاء الاصطناعي
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            يقوم Gemini بصياغة التقرير واكتشاف الأسباب المحتملة للأعطال وتصنيف الخطورة مع الحفاظ على مصطلحات الشبكات الدقيقة.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
            تحميل بصيغة Word حقيقية
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            تصدير ملف .docx متوافق تماماً مع الاتجاه من اليمين لليسار RTL، بتنسيق جداول احترافي وتضمين صور وتوقيع العميل.
          </p>
        </div>
      </section>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              تقارير هذا الشهر ({new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(new Date())})
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {reportsThisMonth}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              إجمالي التقارير المسجلة
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalReports}
            </span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
          <div className="truncate pl-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              أكثر موقع تمت زيارته
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white block truncate" title={mostVisitedSite}>
              {mostVisitedSite}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Last Reports Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">آخر التقارير</h2>
          </div>

          <div className="flex items-center gap-3">
            {hasDemoReports && (
              <button
                onClick={onClearDemoData}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف البيانات التجريبية
              </button>
            )}
            <button
              onClick={() => onNavigateTab('archive')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {recentReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">لا توجد تقارير حالياً</p>
            <button
              onClick={onNewReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              ابدأ بإنشاء أول تقرير الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentReports.map((report) => {
              // Find max severity in problems
              const hasUrgent = report.content?.discoveredProblems?.some((p) => p.severity === 'عاجل');
              const hasMedium = report.content?.discoveredProblems?.some((p) => p.severity === 'متوسط');
              const severityBadge = hasUrgent ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-3 h-3" /> مشكلة عاجلة
                </span>
              ) : hasMedium ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  متوسط
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> سليم / مكتمل
                </span>
              );

              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full overflow-hidden"
                >
                  <div className="space-y-1.5 w-full sm:flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold">
                        {report.reportNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {report.reportType}
                      </span>
                      {severityBadge}
                    </div>

                    <h4
                      onClick={() => onOpenReport(report)}
                      className="font-bold text-base text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition truncate"
                    >
                      {report.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>العميل: <strong className="font-medium text-slate-700 dark:text-slate-300">{report.clientName || 'غير محدد'}</strong></span>
                      <span>الموقع: <strong className="font-medium text-slate-700 dark:text-slate-300">{report.siteLocation || 'غير محدد'}</strong></span>
                      <span>التاريخ: {report.visitDate} ({formatDateArabic(report.visitDate)})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenReport(report)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl transition"
                    >
                      فتح ومعاينة
                    </button>
                    <button
                      onClick={() => onDeleteReport(report.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="حذف التقرير"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
