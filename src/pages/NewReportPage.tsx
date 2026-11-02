import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Building,
  User,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Tag,
} from 'lucide-react';
import {
  ChecklistItem,
  ChecklistStatus,
  MaintenanceReport,
  ReportPhoto,
  ReportTone,
  ReportType,
  SparePartItem,
  SparePartStatus,
} from '../types';
import {
  calculateDurationMinutes,
  formatDurationArabic,
  generateReportNumber,
  getChecklistTemplate,
} from '../utils/reportUtils';
import { PhotoUploader } from '../components/PhotoUploader';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { apiGenerateReport } from '../services/geminiClient';

interface NewReportPageProps {
  existingReports: MaintenanceReport[];
  defaultTechnicianName: string;
  defaultTone: ReportTone;
  companyName: string;
  onReportGenerated: (report: MaintenanceReport) => void;
  onCancel: () => void;
}

export const NewReportPage: React.FC<NewReportPageProps> = ({
  existingReports,
  defaultTechnicianName,
  defaultTone,
  companyName,
  onReportGenerated,
  onCancel,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Auto-generate report number
  const autoReportNumber = generateReportNumber(existingReports);

  // Form states
  const [reportNumber] = useState(autoReportNumber);
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<ReportType>('صيانة دورية');
  const [tone, setTone] = useState<ReportTone>(defaultTone || 'رسمي للإدارة');
  const [clientName, setClientName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [technicianName, setTechnicianName] = useState(defaultTechnicianName || '');
  const [visitDate, setVisitDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');

  // Checklist
  const [checklists, setChecklists] = useState<ChecklistItem[]>(() =>
    getChecklistTemplate('صيانة دورية')
  );

  // Quick notes & Notes
  const [notes, setNotes] = useState('');
  const [usedQuickChips, setUsedQuickChips] = useState<string[]>([]);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Spare parts
  const [spareParts, setSpareParts] = useState<SparePartItem[]>([
    { id: '1', name: 'Patch Cord Cat6 UTP 2M', quantity: 2, status: 'مستخدم' },
  ]);

  // Photos
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);

  // Client signature
  const [signatureUrl, setSignatureUrl] = useState<string>('');

  // Generation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update checklist template when report type changes
  const handleReportTypeChange = (newType: ReportType) => {
    setReportType(newType);
    setChecklists(getChecklistTemplate(newType));
    if (!title || title.startsWith('تقرير')) {
      setTitle(`تقرير ${newType} - ${clientName || 'موقع العميل'}`);
    }
  };

  // Auto set title if empty
  useEffect(() => {
    if (!title) {
      setTitle(`تقرير ${reportType} - ${clientName || 'الموقع'}`);
    }
  }, [reportType, clientName]);

  // Duration
  const durationMinutes = calculateDurationMinutes(startTime, endTime);
  const durationFormatted = formatDurationArabic(durationMinutes);

  // Checklist updates
  const handleChecklistStatusChange = (index: number, status: ChecklistStatus) => {
    const updated = [...checklists];
    updated[index] = { ...updated[index], status };
    setChecklists(updated);
  };

  const handleChecklistNoteChange = (index: number, note: string) => {
    const updated = [...checklists];
    updated[index] = { ...updated[index], notes: note };
    setChecklists(updated);
  };

  // Quick Note Chips
  const quickChips = [
    'تم تغيير كابل',
    'تم إعادة تشغيل السويتش',
    'تم تحديث الـ Firmware',
    'تم تنظيف الراك',
    'تم اختبار الـ Uplink',
    'لا توجد مشاكل',
    'تم فحص حرارة الغرفة والـ UPS',
    'تم ترقيم الكابلات',
  ];

  const handleAddChip = (chip: string) => {
    setNotes((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}`));
    if (!usedQuickChips.includes(chip)) {
      setUsedQuickChips([...usedQuickChips, chip]);
    }
  };

  // Voice Dictation (Web Speech API)
  const toggleRecording = () => {
    setSpeechError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('ميزة الإملاء الصوتي غير مدعومة في متصفحك الحالي (يرجى تجربة Chrome على الموبايل أو الكمبيوتر).');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG'; // Egyptian Arabic dialect supported
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ');
        if (transcript) {
          setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('تم رفض إذن استخدام الميكروفون. يرجى السماح به من إعدادات المتصفح.');
        } else {
          setSpeechError(`خطأ في الإملاء الصوتي: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      setSpeechError(`تعذر تشغيل الميكروفون: ${err?.message || ''}`);
      setIsRecording(false);
    }
  };

  // Spare parts management
  const handleAddSparePart = () => {
    setSpareParts([
      ...spareParts,
      {
        id: `sp-${Date.now()}`,
        name: '',
        quantity: 1,
        status: 'مستخدم',
      },
    ]);
  };

  const handleRemoveSparePart = (index: number) => {
    setSpareParts(spareParts.filter((_, i) => i !== index));
  };

  const handleUpdateSparePart = (index: number, field: keyof SparePartItem, val: any) => {
    const updated = [...spareParts];
    updated[index] = { ...updated[index], [field]: val };
    setSpareParts(updated);
  };

  // Submit and Generate Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('يرجى كتابة عنوان التقرير');
      return;
    }
    if (!clientName.trim()) {
      setFormError('يرجى تحديد اسم العميل أو الجهة المستفيدة');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
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
        checklists,
        notes,
        quickNotesUsed: usedQuickChips,
        spareParts: spareParts.filter((p) => p.name.trim() !== ''),
        photos,
      };

      const result = await apiGenerateReport(payload);

      const newFullReport: MaintenanceReport = {
        id: `rep-${Date.now()}`,
        reportNumber,
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
        checklists,
        rawNotes: notes,
        quickNotesUsed: usedQuickChips,
        spareParts: spareParts.filter((p) => p.name.trim() !== ''),
        photos,
        clientSignatureUrl: signatureUrl || undefined,
        content: result.report,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onReportGenerated(newFullReport);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'حدث خطأ أثناء توليد التقرير بالذكاء الاصطناعي');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold">
              {reportNumber}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              رقم التقرير التلقائي
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            إنشاء تقرير صيانة جديد
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            املأ بيانات الزيارة والملاحظات وسيقوم الذكاء الاصطناعي بصياغة التقرير الإداري بدقة
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          إلغاء والعودة
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              1. بيانات المهمة والموقع
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان التقرير <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: صيانة دورية لكابينة الـ Core Switch وفحص روابط الألياف"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                نوع التقرير / المهمة
              </label>
              <select
                value={reportType}
                onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="صيانة دورية">صيانة دورية</option>
                <option value="إصلاح عطل">إصلاح عطل</option>
                <option value="تركيب جديد">تركيب جديد</option>
                <option value="فحص شبكة">فحص شبكة</option>
                <option value="استلام موقع">استلام موقع</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                نغمة التقرير المستهدفة
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTone('رسمي للإدارة')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    tone === 'رسمي للإدارة'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  رسمي للإدارة
                </button>
                <button
                  type="button"
                  onClick={() => setTone('مبسط للعميل غير الفني')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    tone === 'مبسط للعميل غير الفني'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  مبسط للعميل
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم العميل أو المؤسسة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: بنك القاهرة - فرع الدقي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                الموقع / المبنى / الغرفة
              </label>
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                placeholder="مثال: مبنى الإدارة - الدور الثاني - غرفة السيرفرات"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                مهندس / فني الصيانة
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="اسم الفني"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ الزيارة
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Time & Duration */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  وقت بدء الزيارة
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  وقت انتهاء الزيارة
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  المدة المحسوبة تلقائياً:
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4" />
                  {durationFormatted} ({durationMinutes} دقيقة)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Checklist */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                2. قائمة الفحص والمطابقة ({reportType})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              {checklists.filter((c) => c.status === 'done').length} من {checklists.length} مكتمل
            </span>
          </div>

          <div className="space-y-3">
            {checklists.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {item.text}
                  </span>

                  <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleChecklistStatusChange(index, 'done')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        item.status === 'done'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      تم
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChecklistStatusChange(index, 'not_done')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        item.status === 'not_done'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      لم يُنفذ
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChecklistStatusChange(index, 'not_applicable')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        item.status === 'not_applicable'
                          ? 'bg-slate-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      لا ينطبق
                    </button>
                  </div>
                </div>

                {/* Optional note per check item */}
                <input
                  type="text"
                  placeholder="ملاحظة خاصة بهذا البند (اختياري)..."
                  value={item.notes || ''}
                  onChange={(e) => handleChecklistNoteChange(index, e.target.value)}
                  className="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Notes & Voice Dictation & Quick Chips */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                3. ملاحظات الفني الميدانية السريعة
              </h2>
              <p className="text-xs text-slate-500">
                اكتب بحرية (بالعامية أو فصحى أو إنجليزية) وسيقوم الذكاء الاصطناعي بإعادة صياغتها رسمياً
              </p>
            </div>

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span>جاري التسجيل... اضغط للإيقاف</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>إملاء صوتي (ميكروفون ar-EG)</span>
                </>
              )}
            </button>
          </div>

          {speechError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
              {speechError}
            </div>
          )}

          {/* Quick Note Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> عبارات سريعة (اضغط للإضافة بنقرة واحدة):
            </span>
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddChip(chip)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/50 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Large Notes Textarea */}
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظاتك بشكل سريع... (مثال: السويتش في الدور التالت كان فاصل باور بسبب الفيوز، غيرت الكابل واختبرت الـ Uplink وشغال تمام. حرارة الراك عالية محتاجة تنظيف مروحة)"
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
        </div>

        {/* Section 4: Spare Parts Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                4. قطع الغيار والمواد المستهلكة
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddSparePart}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة صنف
            </button>
          </div>

          {spareParts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              لم تتم إضافة أي قطع غيار أو مواد مستهلكة
            </p>
          ) : (
            <div className="space-y-2">
              {spareParts.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <input
                    type="text"
                    placeholder="اسم الصنف (مثال: كابل Patch Cord Cat6 أو موديول SFP)"
                    value={item.name}
                    onChange={(e) => handleUpdateSparePart(index, 'name', e.target.value)}
                    className="flex-1 w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500">الكمية:</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateSparePart(index, 'quantity', parseInt(e.target.value, 10) || 1)
                        }
                        className="w-16 text-center text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleUpdateSparePart(index, 'status', e.target.value as SparePartStatus)
                      }
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="مستخدم">مستخدم بالموقع</option>
                      <option value="مطلوب">مطلوب توريده</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveSparePart(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Photos & Vision AI */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>

        {/* Section 6: Client Signature */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
          <SignatureCanvas
            initialSignature={signatureUrl}
            onSave={(url) => setSignatureUrl(url)}
            onClear={() => setSignatureUrl('')}
          />
        </div>

        {/* Action Button: Generate Report */}
        <div className="sticky bottom-16 md:bottom-4 z-30 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            سيتم استخدام نموذج الذكاء الاصطناعي (Gemini 3.8 Flash) لتحويل بياناتك لتقرير احترافي
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 active:scale-98 transition disabled:opacity-50 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>جاري توليد التقرير بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span>توليد التقرير بالذكاء الاصطناعي</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
