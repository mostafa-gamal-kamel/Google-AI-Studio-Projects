import { ChecklistItem, MaintenanceReport, ReportType } from '../types';

/**
 * Calculates visit duration in minutes and returns human-readable Arabic string
 * e.g. "ساعتان و30 دقيقة" or "45 دقيقة"
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  // Handle visits crossing midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return Math.max(0, endMinutes - startMinutes);
}

export function formatDurationArabic(minutes: number): string {
  if (minutes <= 0) return '0 دقيقة';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} دقيقة`;
  }
  
  let hoursText = '';
  if (hours === 1) hoursText = 'ساعة واحدة';
  else if (hours === 2) hoursText = 'ساعتان';
  else if (hours >= 3 && hours <= 10) hoursText = `${hours} ساعات`;
  else hoursText = `${hours} ساعة`;

  if (remainingMinutes === 0) {
    return hoursText;
  }

  let minsText = '';
  if (remainingMinutes === 1) minsText = 'دقيقة واحدة';
  else if (remainingMinutes === 2) minsText = 'دقيقتان';
  else if (remainingMinutes >= 3 && remainingMinutes <= 10) minsText = `${remainingMinutes} دقائق`;
  else minsText = `${remainingMinutes} دقيقة`;

  return `${hoursText} و${minsText}`;
}

/**
 * Generates an auto-incremented report number in the format MR-{YEAR}-{4-digit sequence}
 * e.g. MR-2026-0001
 */
export function generateReportNumber(
  existingReports: { reportNumber: string }[],
  year: number = new Date().getFullYear()
): string {
  const prefix = `MR-${year}-`;
  let maxSeq = 0;

  for (const report of existingReports) {
    if (report.reportNumber && report.reportNumber.startsWith(prefix)) {
      const seqStr = report.reportNumber.substring(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Returns preset checklists tailored for network engineering & IT maintenance
 */
export function getChecklistTemplate(type: ReportType): ChecklistItem[] {
  switch (type) {
    case 'صيانة دورية':
      return [
        { id: '1', text: 'فحص مؤشرات الـ LEDs وحالة المنافذ لجميع السويتشات', status: 'not_done' },
        { id: '2', text: 'تنظيف أجهزة الراك وإزالة الأتربة من مراوح التبريد (Fans)', status: 'not_done' },
        { id: '3', text: 'اختبار روابط الـ Uplinks والألياف الضوئية وحساب الـ Throughput', status: 'not_done' },
        { id: '4', text: 'التأكد من سلامة ترقيم وتسمية الكابلات (Cable Labeling)', status: 'not_done' },
        { id: '5', text: 'مراقبة درجات حرارة كبائن السيرفرات والشبكة وحالة الـ UPS', status: 'not_done' },
        { id: '6', text: 'أخذ نسخة احتياطية من إعدادات الأجهزة (Backup Configuration)', status: 'not_done' },
        { id: '7', text: 'فحص ميزانية الطاقة للمنافذ PoE لأجهزة الـ Access Points والكاميرات', status: 'not_done' },
      ];
    case 'إصلاح عطل':
      return [
        { id: '1', text: 'فحص حالة الروابط الفيزيائية (Physical Link State & LEDs)', status: 'not_done' },
        { id: '2', text: 'اختبار الـ Ping وفحص نسبة فقد الحزم (Packet Loss Test)', status: 'not_done' },
        { id: '3', text: 'مراجعة سجلات الأعطال والإنذارات (Syslog / Event Logs)', status: 'not_done' },
        { id: '4', text: 'فحص كابلات التوصيل ومصادر الطاقة ووحدات الـ SFP Transceivers', status: 'not_done' },
        { id: '5', text: 'التحقق من إعدادات الـ VLANs و الـ Default Gateway والـ DNS', status: 'not_done' },
        { id: '6', text: 'التأكد من عودة الخدمة للاستقرار وموافقة العميل', status: 'not_done' },
      ];
    case 'تركيب جديد':
      return [
        { id: '1', text: 'تثبيت الأجهزة في الراك واستخدام Rack Mounts والمسامير المناسبة', status: 'not_done' },
        { id: '2', text: 'توصيل وترقيم كابلات الـ Patch Panels بطريقة منظمة', status: 'not_done' },
        { id: '3', text: 'ربط الـ Uplinks وتكوين منافذ الـ Trunk والـ Port-Channels', status: 'not_done' },
        { id: '4', text: 'ضبط عناوين الـ IP لإدارة الأجهزة وتفعيل SSH/HTTPS', status: 'not_done' },
        { id: '5', text: 'التأكد من التأريض الكهربائي وحماية أجهزة الشبكة من التيارات المفاجئة', status: 'not_done' },
        { id: '6', text: 'توثيق الأجهزة وتحديث سجل الأصول (Asset Inventory & Serial Numbers)', status: 'not_done' },
      ];
    case 'فحص شبكة':
      return [
        { id: '1', text: 'فحص الشبكة بحثاً عن تضارب العناوين (IP Conflicts / Rogue DHCP)', status: 'not_done' },
        { id: '2', text: 'قياس قوة إشارة شبكة الـ Wi-Fi ونسب الإشارة للضوضاء (RSSI & SNR)', status: 'not_done' },
        { id: '3', text: 'فحص الكابلات واختبار استمرارية النحاس (Cable Fluke / Continuity)', status: 'not_done' },
        { id: '4', text: 'قياس استهلاك الباندويث ونسبة الإشغال على منافذ السويتشات', status: 'not_done' },
        { id: '5', text: 'مراجعة وتدقيق إصدارات الـ Firmware وتحديثات الأمان للأجهزة', status: 'not_done' },
      ];
    case 'استلام موقع':
      return [
        { id: '1', text: 'جرد شامل لكافة الأجهزة النشطة والسلبية ومطابقتها مع وثائق المشروع', status: 'not_done' },
        { id: '2', text: 'اختبار منظومة التكرارية وانتقال الأعطال التلقائي (Redundancy / Failover)', status: 'not_done' },
        { id: '3', text: 'استلام مخطط التوصيل الطوبولوجي المحدث (Network Topology Diagram)', status: 'not_done' },
        { id: '4', text: 'استلام بيانات الاعتماد وكلمات المرور الخاصة بالمسؤول (Admin Credentials)', status: 'not_done' },
        { id: '5', text: 'فحص كبائن الراك وأقفال الأمان والتهوية والتأريض النهائي', status: 'not_done' },
        { id: '6', text: 'توقيع محضر الاستلام الميداني الأولي مع مهندس العميل', status: 'not_done' },
      ];
  }
}

/**
 * Check browser localStorage usage
 */
export function getLocalStorageUsage(): {
  usedBytes: number;
  usedFormatted: string;
  isNearFull: boolean;
  percent: number;
} {
  try {
    let total = 0;
    for (let x = 0; x < localStorage.length; x++) {
      const key = localStorage.key(x);
      if (key) {
        total += (localStorage.getItem(key)?.length || 0) * 2; // ~2 bytes per char
      }
    }
    const maxCapacity = 5 * 1024 * 1024; // typical 5MB
    const percent = Math.min(100, Math.round((total / maxCapacity) * 100));
    const usedKB = Math.round(total / 1024);
    const usedFormatted = usedKB > 1024 ? `${(usedKB / 1024).toFixed(1)} ميجابايت` : `${usedKB} كيلوبايت`;

    return {
      usedBytes: total,
      usedFormatted,
      isNearFull: total > 3.8 * 1024 * 1024 || percent > 75,
      percent,
    };
  } catch {
    return { usedBytes: 0, usedFormatted: '0 كيلوبايت', isNearFull: false, percent: 0 };
  }
}

/**
 * Format Arabic date nicely
 */
export function formatDateArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}
