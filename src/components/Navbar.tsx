import React from 'react';
import {
  FileText,
  PlusCircle,
  Archive,
  BarChart3,
  Settings,
  Moon,
  Sun,
  HardDrive,
  Home,
  AlertTriangle,
} from 'lucide-react';
import { getLocalStorageUsage } from '../utils/reportUtils';

interface NavbarProps {
  activeTab: 'home' | 'new-report' | 'archive' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'home' | 'new-report' | 'archive' | 'dashboard' | 'settings') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  companyName,
}) => {
  const storageInfo = getLocalStorageUsage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-tight">
                مولّد تقارير الصيانة
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">
                {companyName || 'مهندسو الشبكات والدعم الفني'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'home'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </button>

            <button
              onClick={() => setActiveTab('new-report')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'new-report'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              إنشاء تقرير جديد
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'archive'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Archive className="w-4 h-4" />
              الأرشيف
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              لوحة الإحصائيات
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              الإعدادات
            </button>
          </nav>

          {/* Right Controls: Storage indicator & Dark Mode */}
          <div className="flex items-center gap-2">
            {/* Storage indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
                storageInfo.isNearFull
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
              title="سعة التخزين المحلي المستخدمة"
            >
              {storageInfo.isNearFull ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ) : (
                <HardDrive className="w-3.5 h-3.5" />
              )}
              <span>{storageInfo.usedFormatted}</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="تبديل الوضع الليلي"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
