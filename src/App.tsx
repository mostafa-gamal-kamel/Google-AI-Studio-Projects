import React, { useState, useEffect } from 'react';
import { AppSettings, MaintenanceReport } from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { NewReportPage } from './pages/NewReportPage';
import { ReportPreviewPage } from './pages/ReportPreviewPage';
import { ArchivePage } from './pages/ArchivePage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'new-report' | 'report-preview' | 'archive' | 'dashboard' | 'settings'
  >('home');

  const [reports, setReports] = useState<MaintenanceReport[]>(() =>
    storageService.getReports()
  );

  const [settings, setSettings] = useState<AppSettings>(() =>
    storageService.getSettings()
  );

  const [selectedReport, setSelectedReport] = useState<MaintenanceReport | null>(null);

  // Sync dark mode class with html element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const toggleDarkMode = (isDark: boolean) => {
    const updated = { ...settings, darkMode: isDark };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  const handleOpenReport = (report: MaintenanceReport) => {
    setSelectedReport(report);
    setActiveTab('report-preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportGenerated = (newReport: MaintenanceReport) => {
    storageService.saveReport(newReport);
    setReports(storageService.getReports());
    setSelectedReport(newReport);
    setActiveTab('report-preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveReport = (updatedReport: MaintenanceReport) => {
    storageService.saveReport(updatedReport);
    setReports(storageService.getReports());
    setSelectedReport(updatedReport);
  };

  const handleDeleteReport = (id: string) => {
    storageService.deleteReport(id);
    setReports(storageService.getReports());
    if (selectedReport?.id === id) {
      setSelectedReport(null);
      setActiveTab('home');
    }
  };

  const handleDuplicateReport = (id: string) => {
    const duplicated = storageService.duplicateReport(id);
    if (duplicated) {
      setReports(storageService.getReports());
      setSelectedReport(duplicated);
      setActiveTab('report-preview');
    }
  };

  const handleClearDemoData = () => {
    storageService.clearDemoReports();
    setReports(storageService.getReports());
    if (selectedReport?.id.startsWith('demo-')) {
      setSelectedReport(null);
      setActiveTab('home');
    }
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    setReports([]);
    setSelectedReport(null);
    setActiveTab('home');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-reports-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string) => {
    const success = storageService.importBackup(jsonStr);
    if (success) {
      setReports(storageService.getReports());
      setSettings(storageService.getSettings());
      alert('تم استيراد النسخة الاحتياطية بنجاح!');
    } else {
      alert('فشل استيراد النسخة الاحتياطية. يرجى التأكد من صحة الملف.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-blue-600 selection:text-white overflow-x-hidden w-full">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab === 'report-preview' ? 'archive' : activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        darkMode={settings.darkMode}
        setDarkMode={toggleDarkMode}
        companyName={settings.companyName}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <HomePage
            reports={reports}
            onOpenReport={handleOpenReport}
            onNewReport={() => {
              setActiveTab('new-report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteReport={handleDeleteReport}
            onClearDemoData={handleClearDemoData}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'new-report' && (
          <NewReportPage
            existingReports={reports}
            defaultTechnicianName={settings.defaultTechnicianName}
            defaultTone={settings.defaultTone}
            companyName={settings.companyName}
            onReportGenerated={handleReportGenerated}
            onCancel={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'report-preview' && selectedReport && (
          <ReportPreviewPage
            report={selectedReport}
            companyName={settings.companyName}
            companyLogoUrl={settings.companyLogoUrl}
            onSaveReport={handleSaveReport}
            onBack={() => {
              setActiveTab('archive');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'archive' && (
          <ArchivePage
            reports={reports}
            onOpenReport={handleOpenReport}
            onDuplicateReport={handleDuplicateReport}
            onDeleteReport={handleDeleteReport}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onNewReport={() => {
              setActiveTab('new-report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'dashboard' && <DashboardPage reports={reports} />}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onClearDemoData={handleClearDemoData}
            onClearAllData={handleClearAllData}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab === 'report-preview' ? 'archive' : activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
