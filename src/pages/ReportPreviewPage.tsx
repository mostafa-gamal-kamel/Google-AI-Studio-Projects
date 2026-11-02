import React, { useState } from 'react';
import {
  Download,
  Share2,
  Languages,
  RotateCw,
  Save,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  User,
  Edit3,
  Check,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  DiscoveredProblem,
  GeneratedReportContent,
  MaintenanceReport,
  ProblemSeverity,
} from '../types';
import { generateDocxBlob } from '../services/docxExport';
import { apiGenerateReport, apiTranslateReport } from '../services/geminiClient';
import { formatDateArabic, formatDurationArabic } from '../utils/reportUtils';

interface ReportPreviewPageProps {
  report: MaintenanceReport;
  companyName: string;
  companyLogoUrl?: string;
  onSaveReport: (updatedReport: MaintenanceReport) => void;
  onBack: () => void;
}

export const ReportPreviewPage: React.FC<ReportPreviewPageProps> = ({
  report: initialReport,
  companyName,
  companyLogoUrl,
  onSaveReport,
  onBack,
}) => {
  const [report, setReport] = useState<MaintenanceReport>(initialReport);
  const [isEditing, setIsEditing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Active language view (Arabic or English)
  const isEn = Boolean(report.isTranslated);
  const currentContent: GeneratedReportContent =
    isEn && report.translatedContent ? report.translatedContent : report.content;

  // Editable content buffer
  const [editableContent, setEditableContent] = useState<GeneratedReportContent>(currentContent);

  // Sync when language or report changes
  const handleToggleLanguage = async () => {
    if (report.isTranslated) {
      // Toggle back to Arabic
      const updated = { ...report, isTranslated: false };
      setReport(updated);
      setEditableContent(updated.content);
      onSaveReport(updated);
    } else {
      // If already has translated content, just toggle
      if (report.translatedContent) {
        const updated = { ...report, isTranslated: true };
        setReport(updated);
        setEditableContent(report.translatedContent);
        onSaveReport(updated);
        return;
      }

      // Translate via Gemini API
      setIsTranslating(true);
      try {
        const translated = await apiTranslateReport(report.content, 'en');
        const updated: MaintenanceReport = {
          ...report,
          isTranslated: true,
          translatedContent: translated,
        };
        setReport(updated);
        setEditableContent(translated);
        onSaveReport(updated);
      } catch (err: any) {
        alert(err.message || 'فشلت عملية الترجمة');
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Re-generate report
  const handleRegenerate = async () => {
    if (!confirm('هل تريد إعادة صياغة التقرير بالذكاء الاصطناعي؟ سيتم تحديث النصوص المحررة.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      const result = await apiGenerateReport({
        title: report.title,
        reportType: report.reportType,
        tone: report.tone,
        clientName: report.clientName,
        siteLocation: report.siteLocation,
        technicianName: report.technicianName,
        visitDate: report.visitDate,
        startTime: report.startTime,
        endTime: report.endTime,
        durationMinutes: report.durationMinutes,
        checklists: report.checklists,
        notes: report.rawNotes,
        quickNotesUsed: report.quickNotesUsed,
        spareParts: report.spareParts,
        photos: report.photos,
      });

      const updated: MaintenanceReport = {
        ...report,
        content: result.report,
        isTranslated: false,
        translatedContent: undefined,
      };
      setReport(updated);
      setEditableContent(result.report);
      onSaveReport(updated);
      showSaveSuccess();
    } catch (err: any) {
      alert(err.message || 'تعذر إعادة التوليد');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Save changes
  const handleSaveContent = () => {
    let updated: MaintenanceReport;
    if (isEn) {
      updated = {
        ...report,
        translatedContent: editableContent,
      };
    } else {
      updated = {
        ...report,
        content: editableContent,
      };
    }
    setReport(updated);
    setIsEditing(false);
    onSaveReport(updated);
    showSaveSuccess();
  };

  const showSaveSuccess = () => {
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 3000);
  };

  // Export DOCX
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      const blob = await generateDocxBlob(report, companyName, companyLogoUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.reportNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير ملف Word: ' + (err.message || ''));
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const summary = currentContent.summary;
    const problemsCount = currentContent.discoveredProblems?.length || 0;
    const text = encodeURIComponent(
      `*تقرير صيانة شبكات وتقنية معلومات*\n` +
        `• *رقم التقرير:* ${report.reportNumber}\n` +
        `• *المهمة:* ${report.title}\n` +
        `• *العميل:* ${report.clientName}\n` +
        `• *الموقع:* ${report.siteLocation}\n` +
        `• *التاريخ:* ${report.visitDate} (${formatDurationArabic(report.durationMinutes)})\n` +
        `• *الفني المختص:* ${report.technicianName}\n\n` +
        `*ملخص الزيارة:*\n${summary}\n\n` +
        `*عدد المشاكل المرصودة:* ${problemsCount}\n` +
        `تم حفظ وتحميل ملف التقرير الكامل بصيغة Word (.docx).`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Before & After Photos filter
  const beforePhotos = (report.photos || []).filter((p) => p.type === 'قبل');
  const afterPhotos = (report.photos || []).filter((p) => p.type === 'بعد');
  const generalPhotos = (report.photos || []).filter((p) => p.type === 'عام');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30 backdrop-blur">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit / Save toggle */}
          {isEditing ? (
            <button
              onClick={handleSaveContent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>حفظ التعديلات</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>تعديل النصوص</span>
            </button>
          )}

          {/* Regenerate */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition disabled:opacity-50"
            title="إعادة الصياغة بالذكاء الاصطناعي"
          >
            <RotateCw className={`w-3.5 h-3.5 text-indigo-600 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>إعادة التوليد</span>
          </button>

          {/* Translate toggle */}
          <button
            onClick={handleToggleLanguage}
            disabled={isTranslating}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
              isEn
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'
            }`}
          >
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
            )}
            <span>{isEn ? 'عرض بالعربية' : 'ترجمة للإنجليزية'}</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة واتساب</span>
          </button>

          {/* Download Word */}
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isExportingDocx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>تحميل Word (.docx)</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ التقرير والتعديلات بنجاح!</span>
        </div>
      )}

      {/* Formal Document Sheet */}
      <article
        dir={isEn ? 'ltr' : 'rtl'}
        className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md p-6 sm:p-10 space-y-8"
      >
        {/* Document Header */}
        <header className="border-b border-slate-200 dark:border-slate-700 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {companyName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {report.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold">
                {report.reportNumber}
              </span>
              <span>•</span>
              <span>{report.reportType}</span>
              <span>•</span>
              <span>نغمة: {report.tone}</span>
            </div>
          </div>

          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt="شعار الشركة"
              className="h-12 max-w-[140px] object-contain rounded"
            />
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
              {companyName}
            </div>
          )}
        </header>

        {/* 1. Meta Details Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">العميل</span>
            <strong className="text-slate-800 dark:text-slate-200 block truncate">
              {report.clientName || '---'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">الموقع</span>
            <strong className="text-slate-800 dark:text-slate-200 block truncate">
              {report.siteLocation || '---'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">فني الصيانة</span>
            <strong className="text-slate-800 dark:text-slate-200 block truncate">
              {report.technicianName || '---'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">تاريخ والمدة</span>
            <strong className="text-slate-800 dark:text-slate-200 block">
              {report.visitDate} ({formatDurationArabic(report.durationMinutes)})
            </strong>
          </div>
        </section>

        {/* 2. Executive Summary */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              {isEn ? 'Executive Summary' : 'ملخص الزيارة التنفيذي'}
            </h2>
          </div>

          {isEditing ? (
            <textarea
              rows={3}
              value={editableContent.summary}
              onChange={(e) =>
                setEditableContent({ ...editableContent, summary: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/20 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none"
            />
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              {currentContent.summary || 'لا يوجد'}
            </p>
          )}
        </section>

        {/* 3. Work Executed */}
        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            {isEn ? 'Work Executed' : 'الأعمال المنفذة'}
          </h2>

          {isEditing ? (
            <textarea
              rows={4}
              value={(editableContent.workExecuted || []).join('\n')}
              onChange={(e) =>
                setEditableContent({
                  ...editableContent,
                  workExecuted: e.target.value.split('\n').filter((l) => l.trim()),
                })
              }
              placeholder="اكتب كل عمل في سطر مستقل..."
              className="w-full p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/20 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none"
            />
          ) : (
            <ul className="space-y-2">
              {(currentContent.workExecuted || []).map((work, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{work}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. Checklist Results */}
        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            {isEn ? 'Checklist Verification' : 'جدول الفحص والمطابقة الميدانية'}
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">بند الفحص الفني</th>
                  <th className="py-2.5 px-3 w-32 text-center">الحالة</th>
                  <th className="py-2.5 px-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {report.checklists.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {c.text}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {c.status === 'done' ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">
                          تم بنجاح ✔
                        </span>
                      ) : c.status === 'not_done' ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 font-bold">
                          لم يُنفذ ❌
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          لا ينطبق ➖
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{c.notes || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Discovered Problems & Probable Root Causes */}
        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            {isEn ? 'Discovered Problems & Probable Root Causes' : 'المشاكل المكتشفة والأسباب المحتملة'}
          </h2>

          {(currentContent.discoveredProblems || []).length === 0 ? (
            <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              لا توجد مشاكل تم رصدها خلال الزيارة (الحالة طبيعية ومستقرة تماماً).
            </p>
          ) : (
            <div className="space-y-3">
              {currentContent.discoveredProblems.map((prob, idx) => {
                const isUrgent = (prob.severity as string) === 'عاجل' || (prob.severity as string) === 'High';
                const isMedium = (prob.severity as string) === 'متوسط' || (prob.severity as string) === 'Medium';

                const borderClass = isUrgent
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                  : isMedium
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                  : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20';

                const badgeClass = isUrgent
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                  : isMedium
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300';

                return (
                  <div key={idx} className={`p-4 rounded-xl border ${borderClass} space-y-2`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`} />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {prob.problem}
                        </h4>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {prob.severity}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      <strong>{isEn ? 'Probable Root Cause: ' : 'السبب المحتمل: '}</strong>
                      <span>{prob.probableRootCause.replace(/^السبب المحتمل:?\s*/, '')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. Actions Taken */}
        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            {isEn ? 'Actions Taken' : 'الإجراءات المتخذة'}
          </h2>

          {isEditing ? (
            <textarea
              rows={3}
              value={(editableContent.actionsTaken || []).join('\n')}
              onChange={(e) =>
                setEditableContent({
                  ...editableContent,
                  actionsTaken: e.target.value.split('\n').filter((l) => l.trim()),
                })
              }
              className="w-full p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/20 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none"
            />
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {(currentContent.actionsTaken || []).map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 7. Spare parts / Materials */}
        {report.spareParts && report.spareParts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              {isEn ? 'Spare Parts & Materials' : 'قطع الغيار والمواد'}
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">اسم الصنف</th>
                    <th className="py-2 px-3 text-center">الكمية</th>
                    <th className="py-2 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {report.spareParts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {p.name}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{p.quantity}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.status === 'مستخدم'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 8. Recommendations & Pending Work */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {isEn ? 'Recommendations' : 'التوصيات والإجراءات الوقائية'}
            </h3>
            {isEditing ? (
              <textarea
                rows={3}
                value={(editableContent.recommendations || []).join('\n')}
                onChange={(e) =>
                  setEditableContent({
                    ...editableContent,
                    recommendations: e.target.value.split('\n').filter((l) => l.trim()),
                  })
                }
                className="w-full p-2 text-xs rounded border border-blue-300"
              />
            ) : (
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {(currentContent.recommendations || []).map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {isEn ? 'Pending Work' : 'الأعمال والمتابعات المتبقية'}
            </h3>
            {isEditing ? (
              <textarea
                rows={3}
                value={(editableContent.pendingWork || []).join('\n')}
                onChange={(e) =>
                  setEditableContent({
                    ...editableContent,
                    pendingWork: e.target.value.split('\n').filter((l) => l.trim()),
                  })
                }
                className="w-full p-2 text-xs rounded border border-blue-300"
              />
            ) : (
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {(currentContent.pendingWork || []).map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 9. Photos: Before & After Side by Side */}
        {report.photos && report.photos.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              {isEn ? 'Photo Documentation (Before & After)' : 'التوثيق الفوتوغرافي (قبل وبعد والصور العامة)'}
            </h2>

            {/* Before / After Columns */}
            {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-600 block">قبل الصيانة:</span>
                  {beforePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800 bg-amber-50/20 p-2 space-y-1.5"
                    >
                      <img
                        src={photo.dataUrl}
                        alt="قبل الصيانة"
                        className="w-full h-44 object-cover rounded-lg"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {photo.caption || 'حالة الأجهزة قبل الصيانة'}
                      </p>
                    </div>
                  ))}
                  {beforePhotos.length === 0 && (
                    <p className="text-xs text-slate-400">لا توجد صور قبل الصيانة</p>
                  )}
                </div>

                {/* After */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-600 block">بعد الصيانة:</span>
                  {afterPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 p-2 space-y-1.5"
                    >
                      <img
                        src={photo.dataUrl}
                        alt="بعد الصيانة"
                        className="w-full h-44 object-cover rounded-lg"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {photo.caption || 'حالة الأجهزة بعد الصيانة'}
                      </p>
                    </div>
                  ))}
                  {afterPhotos.length === 0 && (
                    <p className="text-xs text-slate-400">لا توجد صور بعد الصيانة</p>
                  )}
                </div>
              </div>
            )}

            {/* General photos */}
            {generalPhotos.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                  صور عامة أخرى:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {generalPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-2 space-y-1"
                    >
                      <img
                        src={photo.dataUrl}
                        alt="صورة عامة"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        {photo.caption || 'توثيق عام'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 10. Signature Section */}
        <section className="pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              فني / مهندس الصيانة:
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              الاسم: <strong>{report.technicianName || '---'}</strong>
            </p>
            <div className="h-16 flex items-center justify-center text-emerald-600 font-bold border border-dashed border-emerald-300 rounded-lg bg-emerald-50/50">
              معتمد وموثق إلكترونياً ✔
            </div>
            <span className="text-[10px] text-slate-400 block">التاريخ: {report.visitDate}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              اعتماد واستلام العميل:
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              الاسم: <strong>{report.clientName || '---'}</strong>
            </p>
            <div className="h-16 flex items-center justify-center border border-dashed border-slate-300 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              {report.clientSignatureUrl ? (
                <img
                  src={report.clientSignatureUrl}
                  alt="توقيع العميل"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-slate-400 text-[11px]">لا يوجد توقيع مسجل</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">التاريخ: {report.visitDate}</span>
          </div>
        </section>
      </article>
    </div>
  );
};
