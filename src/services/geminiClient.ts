import { GeneratedReportContent, MaintenanceReport } from '../types';

export interface GenerateReportRequest {
  title: string;
  reportType: string;
  tone: string;
  clientName: string;
  siteLocation: string;
  technicianName: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  checklists: any[];
  notes: string;
  quickNotesUsed: string[];
  spareParts: any[];
  photos: any[];
}

export async function apiGenerateReport(data: GenerateReportRequest): Promise<{
  report: GeneratedReportContent;
  isFallback?: boolean;
  warningMessage?: string;
}> {
  const res = await fetch('/api/gemini/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'فشل في الاتصال بمولد التقارير');
  }

  const json = await res.json();
  return {
    report: json.report,
    isFallback: json.isFallback,
    warningMessage: json.warningMessage,
  };
}

export async function apiDescribePhoto(
  imageBase64: string,
  photoType: string = 'عام'
): Promise<string> {
  const res = await fetch('/api/gemini/describe-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, photoType }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'فشل وصف الصورة');
  }

  const json = await res.json();
  return json.caption || 'صورة توثيقية للأجهزة';
}

export async function apiTranslateReport(
  content: GeneratedReportContent,
  targetLanguage: 'en' | 'ar'
): Promise<GeneratedReportContent> {
  const res = await fetch('/api/gemini/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, targetLanguage }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'فشلت عملية الترجمة');
  }

  const json = await res.json();
  return json.translated;
}

export async function apiGenerateMonthlySummary(
  month: string,
  reports: MaintenanceReport[]
): Promise<string> {
  const res = await fetch('/api/gemini/monthly-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, reports }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'فشل توليد الملخص الشهري');
  }

  const json = await res.json();
  return json.summary;
}
