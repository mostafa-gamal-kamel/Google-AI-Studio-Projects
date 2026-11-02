import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { MaintenanceReport, ProblemSeverity, ReportType } from '../types';
import { formatDateArabic, formatDurationArabic } from '../utils/reportUtils';

interface ArchivePageProps {
  reports: MaintenanceReport[];
  onOpenReport: (report: MaintenanceReport) => void;
  onDuplicateReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
  onNewReport: () => void;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({
  reports,
  onOpenReport,
  onDuplicateReport,
  onDeleteReport,
  onExportBackup,
  onImportBackup,
  onNewReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNum = report.reportNumber.toLowerCase().includes(term);
        const matchesTitle = report.title.toLowerCase().includes(term);
        const matchesClient = report.clientName.toLowerCase().includes(term);
        const matchesSite = (report.siteLocation || '').toLowerCase().includes(term);
        const matchesNotes = (report.rawNotes || '').toLowerCase().includes(term);
        const matchesTech = (report.technicianName || '').toLowerCase().includes(term);

        if (!matchesNum && !matchesTitle && !matchesClient && !matchesSite && !matchesNotes && !matchesTech) {
          return false;
        }
      }

      // Type
      if (selectedType !== 'all' && report.reportType !== selectedType) {
        return false;
      }

      // Severity
      if (selectedSeverity !== 'all') {
        const problems = report.content?.discoveredProblems || [];
        if (selectedSeverity === 'عاجل') {
          if (!problems.some((p) => (p.severity as string) === 'عاجل' || (p.severity as string) === 'High')) return false;
        } else if (selectedSeverity === 'متوسط') {
          if (!problems.some((p) => (p.severity as string) === 'متوسط' || (p.severity as string) === 'Medium')) return false;
        } else if (selectedSeverity === 'منخفض') {
          if (problems.length > 0 && !problems.every((p) => (p.severity as string) === 'منخفض' || (p.severity as string) === 'Low')) return false;
        }
      }

      // Date range
      if (fromDate && report.visitDate < fromDate) return false;
      if (toDate && report.visitDate > toDate) return false;

      return true;
    });
  }, [reports, searchTerm, selectedType, selectedSeverity, fromDate, toDate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportBackup(text);
      } catch (err: any) {
        setImportError('الملف المختار غير صالح كنسخة احتياطية JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedSeverity('all');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Backup Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            أرشيف تقارير الصيانة
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            البحث في كافة التقارير السابقة وتصفيتها أو استخراج نسخ احتياطية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Backup */}
          <button
            onClick={onExportBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="تصدير ملف نسخ احتياطي JSON لجميع التقارير"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>تصدير نسخة احتياطية</span>
          </button>

          {/* Import Backup */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>استيراد نسخة</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={onNewReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            + تقرير جديد
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
          {importError}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="ابحث برقم التقرير، اسم العميل، الموقع، أو نص الملاحظات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              نوع المهمة:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">كل الأنواع</option>
              <option value="صيانة دورية">صيانة دورية</option>
              <option value="إصلاح عطل">إصلاح عطل</option>
              <option value="تركيب جديد">تركيب جديد</option>
              <option value="فحص شبكة">فحص شبكة</option>
              <option value="استلام موقع">استلام موقع</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              مستوى الخطورة:
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">كل المستويات</option>
              <option value="عاجل">يحتوي عطل عاجل</option>
              <option value="متوسط">يحتوي ملاحظة متوسطة</option>
              <option value="منخفض">سليم أو منخفض فقط</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              من تاريخ:
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              إلى تاريخ:
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {(searchTerm || selectedType !== 'all' || selectedSeverity !== 'all' || fromDate || toDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>نتائج البحث: ({filteredReports.length} تقرير)</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              لا توجد تقارير مطابقة لمعايير البحث
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const hasUrgent = report.content?.discoveredProblems?.some(
              (p) => (p.severity as string) === 'عاجل' || (p.severity as string) === 'High'
            );
            const hasMedium = report.content?.discoveredProblems?.some(
              (p) => (p.severity as string) === 'متوسط' || (p.severity as string) === 'Medium'
            );

            return (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold">
                      {report.reportNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
                      {report.reportType}
                    </span>
                    {hasUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3" /> عاجل
                      </span>
                    ) : hasMedium ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        متوسط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> طبيعي
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onOpenReport(report)}
                    className="font-bold text-base text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition truncate"
                  >
                    {report.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>العميل: <strong className="text-slate-700 dark:text-slate-300 font-medium">{report.clientName}</strong></span>
                    <span>الموقع: {report.siteLocation || '---'}</span>
                    <span>التاريخ: {report.visitDate} ({formatDateArabic(report.visitDate)})</span>
                    <span>المدة: {formatDurationArabic(report.durationMinutes)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onOpenReport(report)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    فتح التقرير
                  </button>

                  <button
                    onClick={() => onDuplicateReport(report.id)}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                    title="تكرار وإنشاء نسخة جديدة من هذا التقرير"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف التقرير ${report.reportNumber}؟`)) {
                        onDeleteReport(report.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="حذف التقرير"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
