export type ReportType =
  | 'صيانة دورية'
  | 'إصلاح عطل'
  | 'تركيب جديد'
  | 'فحص شبكة'
  | 'استلام موقع';

export type ReportTone = 'رسمي للإدارة' | 'مبسط للعميل غير الفني';

export type ChecklistStatus = 'done' | 'not_done' | 'not_applicable';

export interface ChecklistItem {
  id: string;
  text: string;
  status: ChecklistStatus;
  notes?: string;
}

export type SparePartStatus = 'مستخدم' | 'مطلوب';

export interface SparePartItem {
  id: string;
  name: string;
  quantity: number;
  status: SparePartStatus;
}

export type PhotoType = 'قبل' | 'بعد' | 'عام';

export interface ReportPhoto {
  id: string;
  dataUrl: string; // Base64 data URL
  caption: string;
  type: PhotoType;
  timestamp: string;
}

export type ProblemSeverity = 'عاجل' | 'متوسط' | 'منخفض';

export interface DiscoveredProblem {
  problem: string;
  severity: ProblemSeverity;
  probableRootCause: string;
}

export interface GeneratedReportContent {
  summary: string;
  workExecuted: string[];
  discoveredProblems: DiscoveredProblem[];
  actionsTaken: string[];
  recommendations: string[];
  pendingWork: string[];
}

export interface MaintenanceReport {
  id: string;
  reportNumber: string; // e.g. MR-2026-0001
  title: string;
  reportType: ReportType;
  tone: ReportTone;
  clientName: string;
  siteLocation: string;
  technicianName: string;
  visitDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  checklists: ChecklistItem[];
  rawNotes: string;
  quickNotesUsed: string[];
  spareParts: SparePartItem[];
  photos: ReportPhoto[];
  clientSignatureUrl?: string;
  content: GeneratedReportContent;
  translatedContent?: GeneratedReportContent;
  isTranslated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  companyName: string;
  companyLogoUrl?: string;
  defaultTechnicianName: string;
  defaultTone: ReportTone;
  darkMode: boolean;
}
