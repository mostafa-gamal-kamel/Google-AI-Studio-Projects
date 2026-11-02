import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Sparkles,
  Calendar,
  Clock,
  Building,
  AlertTriangle,
  TrendingUp,
  FileText,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { MaintenanceReport } from '../types';
import { apiGenerateMonthlySummary } from '../services/geminiClient';
import { formatDurationArabic } from '../utils/reportUtils';

interface DashboardPageProps {
  reports: MaintenanceReport[];
}

const COLORS = ['#2563EB', '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ reports }) => {
  // Current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.visitDate) {
        set.add(r.visitDate.slice(0, 7)); // YYYY-MM
      }
    });
    const arr = Array.from(set).sort().reverse();
    return arr.length > 0 ? arr : [new Date().toISOString().slice(0, 7)];
  }, [reports]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [monthlySummaryText, setMonthlySummaryText] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // 1. Visits per Month Chart Data
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      const m = r.visitDate ? r.visitDate.slice(0, 7) : 'غير محدد';
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));
  }, [reports]);

  // 2. Reports by Type Chart Data
  const typeData = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      map[r.reportType] = (map[r.reportType] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [reports]);

  // 3. Top 5 Visited Sites
  const topSites = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      const site = r.siteLocation || 'موقع عام';
      map[site] = (map[site] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [reports]);

  // 4. Most Frequent Problem Categories
  const problemCategories = useMemo(() => {
    const map: Record<string, number> = {
      'كابلات وتوصيلات': 0,
      'إعدادات وسويتشات': 0,
      'تكييف وتبريد الراك': 0,
      'طاقة وUPS': 0,
      'ألياف ضوئية SFP': 0,
      'أخرى': 0,
    };

    reports.forEach((r) => {
      const problems = r.content?.discoveredProblems || [];
      problems.forEach((p) => {
        const text = `${p.problem} ${p.probableRootCause}`.toLowerCase();
        if (text.includes('كابل') || text.includes('cable') || text.includes('patch')) {
          map['كابلات وتوصيلات']++;
        } else if (text.includes('switch') || text.includes('vlan') || text.includes('firmware') || text.includes('إعداد')) {
          map['إعدادات وسويتشات']++;
        } else if (text.includes('حرار') || text.includes('تكييف') || text.includes('مروح') || text.includes('fan')) {
          map['تكييف وتبريد الراك']++;
        } else if (text.includes('ups') || text.includes('جهد') || text.includes('كهربا') || text.includes('power')) {
          map['طاقة وUPS']++;
        } else if (text.includes('sfp') || text.includes('فايبر') || text.includes('fiber') || text.includes('ضوئ')) {
          map['ألياف ضوئية SFP']++;
        } else {
          map['أخرى']++;
        }
      });
    });

    return Object.entries(map).filter(([_, count]) => count > 0);
  }, [reports]);

  // 5. Average Visit Duration
  const averageDuration = useMemo(() => {
    if (reports.length === 0) return 0;
    const total = reports.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    return Math.round(total / reports.length);
  }, [reports]);

  // Monthly AI Summary Handler
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setMonthlySummaryText(null);
    try {
      const monthReports = reports.filter((r) => r.visitDate.startsWith(selectedMonth));
      const summary = await apiGenerateMonthlySummary(selectedMonth, monthReports);
      setMonthlySummaryText(summary);
    } catch (err: any) {
      alert(err.message || 'فشل توليد الملخص الشهري');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!monthlySummaryText) return;
    navigator.clipboard.writeText(monthlySummaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            لوحة الإحصائيات والتحليلات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مؤشرات أداء مهام الصيانة الميدانية وتكرار الأعطال
          </p>
        </div>

        {/* AI Monthly Summary Trigger */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                شهر {m}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition disabled:opacity-50"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري التحليل...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>ملخص شهري بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Summary Banner if generated */}
      {monthlySummaryText && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>الملخص الإداري التنفيذي لشهر {selectedMonth} (Gemini AI)</span>
            </div>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {monthlySummaryText}
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              إجمالي التقارير الميدانية
            </span>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {reports.length}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              متوسط مدة الزيارة
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatDurationArabic(averageDuration)}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              أكثر المواقع نشاطاً
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate block max-w-[180px]">
              {topSites[0]?.[0] || '---'}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Visits */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            عدد الزيارات شهرياً
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="عدد التقارير" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Reports by Type */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            توزيع التقارير حسب نوع المهمة
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name} (${(((percent ?? 0)) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* List 3: Top 5 Visited Sites */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-600" />
            أكثر 5 مواقع تمت زيارتها
          </h3>

          <div className="space-y-2">
            {topSites.map(([site, count], idx) => (
              <div
                key={site}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {site}
                  </span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {count} زيارة
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* List 4: Most frequent problem categories */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            تصنيف الأعطال والمشاكل المكتشفة
          </h3>

          <div className="space-y-2">
            {problemCategories.map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs border border-slate-100 dark:border-slate-700"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {category}
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {count} عطل مرصود
                </span>
              </div>
            ))}
            {problemCategories.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                لا توجد أعطال مسجلة حتى الآن
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
