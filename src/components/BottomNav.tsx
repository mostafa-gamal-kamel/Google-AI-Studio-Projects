import React from 'react';
import { Home, PlusCircle, Archive, BarChart3, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'new-report' | 'archive' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'home' | 'new-report' | 'archive' | 'dashboard' | 'settings') => void;
}

interface NavItem {
  id: 'home' | 'new-report' | 'archive' | 'dashboard' | 'settings';
  label: string;
  icon: any;
  isPrimary?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems: NavItem[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'archive', label: 'الأرشيف', icon: Archive },
    { id: 'new-report', label: 'تقرير جديد', icon: PlusCircle, isPrimary: true },
    { id: 'dashboard', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center -mt-4 relative group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-blue-700 ring-4 ring-blue-100 dark:ring-blue-950'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] mt-1 font-bold text-blue-600 dark:text-blue-400">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
