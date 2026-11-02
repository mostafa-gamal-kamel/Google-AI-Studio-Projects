import React, { useState } from 'react';
import { Camera, Sparkles, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { PhotoType, ReportPhoto } from '../types';
import { apiDescribePhoto } from '../services/geminiClient';

interface PhotoUploaderProps {
  photos: ReportPhoto[];
  onChange: (photos: ReportPhoto[]) => void;
}

// Client-side image compression
async function compressImageToDataUrl(file: File, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photos, onChange }) => {
  const [isDescribingAll, setIsDescribingAll] = useState(false);
  const [describingIndex, setDescribingIndex] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: ReportPhoto[] = [];

    for (const file of filesToProcess) {
      try {
        const compressedDataUrl = await compressImageToDataUrl(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl: compressedDataUrl,
          caption: '',
          type: 'عام',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    onChange([...photos, ...newPhotos]);
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleTypeChange = (index: number, newType: PhotoType) => {
    const updated = [...photos];
    updated[index] = { ...updated[index], type: newType };
    onChange(updated);
  };

  const handleCaptionChange = (index: number, newCaption: string) => {
    const updated = [...photos];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  };

  const handleDescribeSingle = async (index: number) => {
    const photo = photos[index];
    if (!photo) return;
    setDescribingIndex(index);
    try {
      const caption = await apiDescribePhoto(photo.dataUrl, photo.type);
      handleCaptionChange(index, caption);
    } catch (err) {
      console.error(err);
    } finally {
      setDescribingIndex(null);
    }
  };

  const handleDescribeAll = async () => {
    if (photos.length === 0) return;
    setIsDescribingAll(true);
    try {
      const updated = [...photos];
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].caption || updated[i].caption.trim() === '') {
          setDescribingIndex(i);
          const caption = await apiDescribePhoto(updated[i].dataUrl, updated[i].type);
          updated[i] = { ...updated[i], caption };
          onChange([...updated]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDescribingAll(false);
      setDescribingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            الصور والتوثيق الميداني ({photos.length} من 6 صور كحد أقصى)
          </h3>
        </div>

        {photos.length > 0 && (
          <button
            type="button"
            onClick={handleDescribeAll}
            disabled={isDescribingAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isDescribingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                جاري وصف الصور بالذكاء الاصطناعي...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                وصف الصور بالذكاء الاصطناعي
              </>
            )}
          </button>
        )}
      </div>

      {/* Grid of uploaded photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => {
          const isCurrentDescribing = describingIndex === index;
          return (
            <div
              key={photo.id}
              className="group relative border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow transition flex flex-col gap-2"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={photo.dataUrl}
                  alt={`صورة ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-2 right-2">
                  <select
                    value={photo.type}
                    onChange={(e) => handleTypeChange(index, e.target.value as PhotoType)}
                    className="text-xs bg-slate-900/80 backdrop-blur text-white px-2 py-1 rounded-md border border-white/20 focus:outline-none"
                  >
                    <option value="قبل">قبل الصيانة</option>
                    <option value="بعد">بعد الصيانة</option>
                    <option value="عام">توثيق عام</option>
                  </select>
                </div>
              </div>

              {/* Caption field */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="اكتب وصفاً للصورة أو اضغط ذكاء اصطناعي..."
                  value={photo.caption}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleDescribeSingle(index)}
                  disabled={isCurrentDescribing}
                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                  title="وصف هذه الصورة بـ Gemini"
                >
                  {isCurrentDescribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Upload box if slots available */}
        {photos.length < 6 && (
          <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 transition min-h-[160px]">
            <ImagePlus className="w-8 h-8 text-blue-500/70" />
            <span className="text-xs font-medium text-center">
              اضغط لرفع أو التقاط صورة
            </span>
            <span className="text-[10px] text-slate-400 text-center">
              (يتم ضغط الصور تلقائياً لحفظ مساحة التخزين)
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};
