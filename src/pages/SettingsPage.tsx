import React, { useState } from 'react';
import {
  Building2,
  User,
  Image,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  HardDrive,
  Download,
  Upload,
} from 'lucide-react';
import { AppSettings, ReportTone } from '../types';
import { getLocalStorageUsage } from '../utils/reportUtils';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClearDemoData: () => void;
  onClearAllData: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings: initialSettings,
  onSaveSettings,
  onClearDemoData,
  onClearAllData,
  onExportBackup,
  onImportBackup,
}) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isSaved, setIsSaved] = useState(false);
  const storageInfo = getLocalStorageUsage();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSettings((prev) => ({ ...prev, companyLogoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, companyLogoUrl: '' }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onImportBackup(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إعدادات التطبيق والشركة</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          تخصيص هوية الشركة وبيانات الفني الافتراضية وحفظ التفضيلات
        </p>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ الإعدادات بنجاح وسيتم تطبيقها على كافة التقارير القادمة.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            بيانات الشركة والهوية الفنية
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم الشركة أو المؤسسة (يظهر في ترويسة تقارير Word)
              </label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="مثال: دلتا لحلول الشبكات وتقنية المعلومات"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                شعار الشركة (Company Logo)
              </label>
              <div className="flex items-center gap-4">
                {settings.companyLogoUrl ? (
                  <div className="relative p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center">
                    <img
                      src={settings.companyLogoUrl}
                      alt="شعار الشركة"
                      className="h-14 max-w-[160px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -left-2 p-1 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700 transition"
                      title="إزالة الشعار"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-4 flex items-center gap-3 cursor-pointer text-xs text-slate-500 hover:text-blue-600 transition">
                    <Image className="w-5 h-5 text-slate-400" />
                    <span>اضغط لرفع صورة الشعار (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Default Technician */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم المهندس / الفني الافتراضي
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={settings.defaultTechnicianName}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultTechnicianName: e.target.value })
                  }
                  placeholder="مثال: م. أحمد عبد العزيز"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Default Tone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                نغمة الصياغة الافتراضية
              </label>
              <select
                value={settings.defaultTone}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTone: e.target.value as ReportTone })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="رسمي للإدارة">رسمي للإدارة</option>
                <option value="مبسط للعميل غير الفني">مبسط للعميل غير الفني</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </div>
      </form>

      {/* Storage and Maintenance */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <HardDrive className="w-4 h-4 text-indigo-600" />
          حالة التخزين المحلي (localStorage) والنسخ الاحتياطي
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">سعة التخزين المستخدمة:</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {storageInfo.usedFormatted} ({storageInfo.percent}% من السعة التقريبية)
              </strong>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  storageInfo.isNearFull ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${storageInfo.percent}%` }}
              />
            </div>

            {storageInfo.isNearFull && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  تنبيه: مساحة التخزين تقترب من الامتلاء، يوصى بتصدير نسخة احتياطية وحذف التقارير القديمة.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 transition"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>تصدير نسخة احتياطية كاملة (JSON)</span>
            </button>

            <label className="inline-flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 transition cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>استيراد واستعادة نسخة احتياطية</span>
              <input
                type="file"
                accept=".json"
                onChange={handleBackupUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <span className="text-xs font-bold text-rose-600 block">إجراءات الحذف والتنظيف:</span>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClearDemoData}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition"
            >
              حذف البيانات التجريبية فقط
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'تحذير: هل أنت متأكد من مسح جميع التقارير والإعدادات المخزنة محلياً بالكامل؟ هذا الإجراء لا يمكن التراجع عنه.'
                  )
                ) {
                  onClearAllData();
                }
              }}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              مسح جميع البيانات بالكامل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
