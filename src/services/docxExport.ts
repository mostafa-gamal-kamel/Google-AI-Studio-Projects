import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { MaintenanceReport } from '../types';
import { formatDurationArabic, formatDateArabic } from '../utils/reportUtils';

// Helper to convert base64 data URL to Uint8Array
function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const base64 = parts[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error('Failed to convert image to Uint8Array', err);
    return null;
  }
}

export async function generateDocxBlob(
  report: MaintenanceReport,
  companyName: string = 'دلتا لحلول الشبكات',
  companyLogoUrl?: string
): Promise<Blob> {
  const isEn = report.isTranslated;
  const content = isEn && report.translatedContent ? report.translatedContent : report.content;

  // Colors
  const PRIMARY_COLOR = '0F3460'; // Deep blue
  const SECONDARY_COLOR = '1E293B'; // Slate dark
  const BORDER_COLOR = 'CBD5E1'; // Slate 300
  const BG_LIGHT = 'F8FAFC'; // Slate 50
  const RED_COLOR = 'DC2626';
  const ORANGE_COLOR = 'D97706';
  const GREEN_COLOR = '16A34A';

  // Helper for RTL Arabic paragraph
  const createRtlParagraph = (
    text: string,
    options?: {
      bold?: boolean;
      size?: number;
      color?: string;
      spaceBefore?: number;
      spaceAfter?: number;
      align?: (typeof AlignmentType)[keyof typeof AlignmentType];
      bullet?: boolean;
    }
  ) => {
    return new Paragraph({
      bidirectional: true,
      alignment: options?.align || AlignmentType.RIGHT,
      spacing: {
        before: options?.spaceBefore ?? 100,
        after: options?.spaceAfter ?? 100,
        line: 280,
      },
      bullet: options?.bullet ? { level: 0 } : undefined,
      children: [
        new TextRun({
          text,
          bold: options?.bold ?? false,
          size: options?.size ?? 22, // 11pt
          color: options?.color ?? SECONDARY_COLOR,
          font: 'Arial',
        }),
      ],
    });
  };

  const createSectionHeading = (title: string) => {
    return new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: `■ ${title}`,
          bold: true,
          size: 26, // 13pt
          color: PRIMARY_COLOR,
          font: 'Arial',
        }),
      ],
    });
  };

  const tableBorderConfig = {
    top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
    right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
  };

  // Header image
  let logoRun: ImageRun | null = null;
  if (companyLogoUrl && companyLogoUrl.startsWith('data:image')) {
    const logoBytes = dataUrlToUint8Array(companyLogoUrl);
    if (logoBytes) {
      logoRun = new ImageRun({
        data: logoBytes,
        transformation: { width: 90, height: 45 },
        type: 'png',
      });
    }
  }

  // Details Table Rows
  const detailsRows = [
    [
      { label: 'رقم التقرير', val: report.reportNumber },
      { label: 'نوع المهمة', val: report.reportType },
    ],
    [
      { label: 'اسم العميل', val: report.clientName || 'غير محدد' },
      { label: 'الموقع / المبنى', val: report.siteLocation || 'غير محدد' },
    ],
    [
      { label: 'مهندس / فني الصيانة', val: report.technicianName || 'غير محدد' },
      { label: 'تاريخ الزيارة', val: `${report.visitDate} (${formatDateArabic(report.visitDate)})` },
    ],
    [
      { label: 'وقت الزيارة', val: `من ${report.startTime || '--:--'} إلى ${report.endTime || '--:--'}` },
      { label: 'المدة الإجمالية', val: formatDurationArabic(report.durationMinutes) },
    ],
  ];

  const detailTableRows = detailsRows.map((row) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: BG_LIGHT },
          borders: tableBorderConfig,
          children: [createRtlParagraph(row[1].val, { bold: false, size: 20 })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          borders: tableBorderConfig,
          children: [createRtlParagraph(row[1].label, { bold: true, size: 20, color: PRIMARY_COLOR })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: BG_LIGHT },
          borders: tableBorderConfig,
          children: [createRtlParagraph(row[0].val, { bold: false, size: 20 })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'E2E8F0' },
          borders: tableBorderConfig,
          children: [createRtlParagraph(row[0].label, { bold: true, size: 20, color: PRIMARY_COLOR })],
        }),
      ],
    });
  });

  // Checklist Table
  const checklistHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('الحالة والملاحظات', { bold: true, size: 20, color: 'FFFFFF', align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 75, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('بند الفحص والتدقيق الفني', { bold: true, size: 20, color: 'FFFFFF' })],
      }),
    ],
  });

  const checklistRows = (report.checklists || []).map((item) => {
    let statusText = 'لم يُنفذ ❌';
    let statusColor = RED_COLOR;
    if (item.status === 'done') {
      statusText = 'تم بنجاح ✔';
      statusColor = GREEN_COLOR;
    } else if (item.status === 'not_applicable') {
      statusText = 'لا ينطبق ➖';
      statusColor = '64748B';
    }

    const noteText = item.notes ? ` (${item.notes})` : '';

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(`${statusText}${noteText}`, { bold: true, size: 18, color: statusColor, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(item.text, { size: 20 })],
        }),
      ],
    });
  });

  // Problems Table
  const problemsHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('الأهمية', { bold: true, size: 20, color: 'FFFFFF', align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('السبب المحتمل', { bold: true, size: 20, color: 'FFFFFF' })],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('المشكلة المكتشفة', { bold: true, size: 20, color: 'FFFFFF' })],
      }),
    ],
  });

  const problemsRows = (content.discoveredProblems || []).map((prob) => {
    let sevColor = GREEN_COLOR;
    if (prob.severity === 'عاجل' || (prob.severity as string) === 'High') sevColor = RED_COLOR;
    else if (prob.severity === 'متوسط' || (prob.severity as string) === 'Medium') sevColor = ORANGE_COLOR;

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(prob.severity, { bold: true, size: 18, color: sevColor, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(prob.probableRootCause || 'لا يوجد', { size: 18, color: '475569' })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(prob.problem, { bold: true, size: 20 })],
        }),
      ],
    });
  });

  // Spare Parts Table
  const partsHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('الحالة', { bold: true, size: 20, color: 'FFFFFF', align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('الكمية', { bold: true, size: 20, color: 'FFFFFF', align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 55, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY_COLOR },
        borders: tableBorderConfig,
        children: [createRtlParagraph('اسم الصنف / القطعة', { bold: true, size: 20, color: 'FFFFFF' })],
      }),
    ],
  });

  const partsRows = (report.spareParts || []).map((part) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [
            createRtlParagraph(part.status === 'مستخدم' ? 'مستخدم بالموقع' : 'مطلوب توريده', {
              bold: true,
              size: 18,
              color: part.status === 'مستخدم' ? GREEN_COLOR : ORANGE_COLOR,
              align: AlignmentType.CENTER,
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(String(part.quantity), { size: 18, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          borders: tableBorderConfig,
          children: [createRtlParagraph(part.name, { bold: true, size: 20 })],
        }),
      ],
    });
  });

  // Photos Table (2-column before / after or general)
  const photoTableRows: TableRow[] = [];
  const photos = report.photos || [];
  for (let i = 0; i < photos.length; i += 2) {
    const photoA = photos[i];
    const photoB = photos[i + 1];

    const cellChildrenA: any[] = [];
    if (photoA) {
      const bytesA = dataUrlToUint8Array(photoA.dataUrl);
      if (bytesA) {
        cellChildrenA.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytesA,
                transformation: { width: 220, height: 165 },
                type: 'png',
              }),
            ],
          })
        );
      }
      cellChildrenA.push(
        createRtlParagraph(`[${photoA.type}] ${photoA.caption || 'صورة توثيقية'}`, {
          size: 18,
          align: AlignmentType.CENTER,
          color: '334155',
        })
      );
    }

    const cellChildrenB: any[] = [];
    if (photoB) {
      const bytesB = dataUrlToUint8Array(photoB.dataUrl);
      if (bytesB) {
        cellChildrenB.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytesB,
                transformation: { width: 220, height: 165 },
                type: 'png',
              }),
            ],
          })
        );
      }
      cellChildrenB.push(
        createRtlParagraph(`[${photoB.type}] ${photoB.caption || 'صورة توثيقية'}`, {
          size: 18,
          align: AlignmentType.CENTER,
          color: '334155',
        })
      );
    }

    photoTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorderConfig,
            children: cellChildrenB.length > 0 ? cellChildrenB : [createRtlParagraph('---', { align: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorderConfig,
            children: cellChildrenA.length > 0 ? cellChildrenA : [createRtlParagraph('---', { align: AlignmentType.CENTER })],
          }),
        ],
      })
    );
  }

  // Signature Section
  let clientSigRun: ImageRun | null = null;
  if (report.clientSignatureUrl && report.clientSignatureUrl.startsWith('data:image')) {
    const sigBytes = dataUrlToUint8Array(report.clientSignatureUrl);
    if (sigBytes) {
      clientSigRun = new ImageRun({
        data: sigBytes,
        transformation: { width: 160, height: 70 },
        type: 'png',
      });
    }
  }

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorderConfig,
            shading: { fill: BG_LIGHT },
            children: [
              createRtlParagraph('اعتماد واستلام العميل', { bold: true, size: 22, color: PRIMARY_COLOR, align: AlignmentType.CENTER }),
              createRtlParagraph(`الاسم: ${report.clientName || '..........................'}`, { size: 20 }),
              clientSigRun
                ? new Paragraph({ alignment: AlignmentType.CENTER, children: [clientSigRun] })
                : createRtlParagraph('التوقيع: ..........................', { size: 20 }),
              createRtlParagraph(`التاريخ: ${report.visitDate}`, { size: 18, color: '64748B' }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorderConfig,
            shading: { fill: BG_LIGHT },
            children: [
              createRtlParagraph('فني / مهندس الصيانة', { bold: true, size: 22, color: PRIMARY_COLOR, align: AlignmentType.CENTER }),
              createRtlParagraph(`الاسم: ${report.technicianName || '..........................'}`, { size: 20 }),
              createRtlParagraph('التوقيع: معتمد وموقع إلكترونياً', { size: 20, color: GREEN_COLOR }),
              createRtlParagraph(`التاريخ: ${report.visitDate}`, { size: 18, color: '64748B' }),
            ],
          }),
        ],
      }),
    ],
  });

  // Assemble full Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                children: [
                  ...(logoRun ? [logoRun, new TextRun({ text: '   ' })] : []),
                  new TextRun({
                    text: `${companyName} | تقرير صيانة تقنية المعلومات والشبكات`,
                    bold: true,
                    size: 18,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `رقم التقرير: ${report.reportNumber}  |  صفحة `,
                    size: 18,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' من ',
                    size: 18,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({
                text: report.title,
                bold: true,
                size: 36, // 18pt
                color: PRIMARY_COLOR,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `كود المرجع: ${report.reportNumber}  •  نغمة التقرير: ${report.tone}`,
                size: 20,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          }),

          // 1. Details Table
          createSectionHeading('1. بيانات المهمة والموقع'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: detailTableRows,
          }),

          // 2. Summary
          createSectionHeading('2. ملخص الزيارة التنفيذي'),
          createRtlParagraph(content.summary || 'لا يوجد ملخص.'),

          // 3. Work Executed
          createSectionHeading('3. الأعمال والمهام المنفذة'),
          ...(content.workExecuted && content.workExecuted.length > 0
            ? content.workExecuted.map((item) => createRtlParagraph(item, { bullet: true }))
            : [createRtlParagraph('لا يوجد أعمال مسجلة.')]),

          // 4. Checklist
          createSectionHeading('4. جدول الفحص الدوري والمطابقة الميدانية'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [checklistHeaderRow, ...checklistRows],
          }),

          // 5. Problems & Root Causes
          createSectionHeading('5. المشاكل المكتشفة والأسباب المحتملة'),
          problemsRows.length > 0
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [problemsHeaderRow, ...problemsRows],
              })
            : createRtlParagraph('لا توجد مشاكل تم رصدها خلال الزيارة (الحالة طبيعية 100%).'),

          // 6. Actions Taken
          createSectionHeading('6. الإجراءات والتدخلات المتخذة'),
          ...(content.actionsTaken && content.actionsTaken.length > 0
            ? content.actionsTaken.map((item) => createRtlParagraph(item, { bullet: true }))
            : [createRtlParagraph('لا يوجد.')]),

          // 7. Spare parts
          createSectionHeading('7. قطع الغيار والمواد المستهلكة'),
          partsRows.length > 0
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [partsHeaderRow, ...partsRows],
              })
            : createRtlParagraph('لم يتم استخدام أو طلب قطع غيار إضافية.'),

          // 8. Recommendations
          createSectionHeading('8. التوصيات والإجراءات الوقائية'),
          ...(content.recommendations && content.recommendations.length > 0
            ? content.recommendations.map((item) => createRtlParagraph(item, { bullet: true }))
            : [createRtlParagraph('لا يوجد.')]),

          // 9. Pending Work
          createSectionHeading('9. الأعمال والمتابعات المتبقية'),
          ...(content.pendingWork && content.pendingWork.length > 0
            ? content.pendingWork.map((item) => createRtlParagraph(item, { bullet: true }))
            : [createRtlParagraph('لا توجد أعمال معلقة، تمت الزيارة بنجاح.')]),

          // 10. Photos
          ...(photoTableRows.length > 0
            ? [
                createSectionHeading('10. التوثيق الفوتوغرافي (قبل / بعد / عام)'),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: photoTableRows,
                }),
              ]
            : []),

          // 11. Signatures
          createSectionHeading('11. التوقيعات والاعتماد النهائي'),
          signatureTable,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
