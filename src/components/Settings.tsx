import React, { useRef } from 'react';
import { AppSettings } from '../types';
import { exportBackup, importBackup } from '../lib/storage';
import { Upload, Download, Image as ImageIcon } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onReloadRequested: () => void;
}

export default function Settings({ settings, onSettingsChange, onReloadRequested }: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onSettingsChange({ ...settings, logoBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    onSettingsChange({ ...settings, logoBase64: null });
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('آیا از بازگردانی بکاپ اطمینان دارید؟ داده‌های فعلی شما جایگزین خواهند شد.')) {
      const success = await importBackup(file);
      if (success) {
        alert('بکاپ با موفقیت بازگردانی شد.');
        onReloadRequested(); // Tell parent to reload state from storage
      } else {
        alert('خطا در بازگردانی بکاپ.');
      }
    }
    // reset input
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-extrabold text-slate-900 text-right">تنظیمات سیستم و شخصی‌سازی</h2>
      </div>

      <div className="space-y-4">
        {/* Branding section */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4 text-right">
          <h3 className="text-xs font-extrabold text-brand-primary">هویت بصری و برندینگ</h3>
          
          <div className="flex flex-col items-end space-y-2 text-right">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block">رنگ سازمانی فاکتور</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.themeColor}
                onChange={e => onSettingsChange({ ...settings, themeColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-xs font-mono">{settings.themeColor}</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 text-right">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block">لوگوی مجموعه (نمایش در هدر فاکتور)</label>
            <div className="flex items-center justify-end gap-3">
              {settings.logoBase64 && (
                <button
                  onClick={handleClearLogo}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  حذف لوگو
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <span>انتخاب تصویر</span>
                <ImageIcon size={14} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            {settings.logoBase64 && (
              <div className="mt-2 text-right">
                <img src={settings.logoBase64} alt="Logo Preview" className="h-16 object-contain inline-block border border-slate-200 rounded p-1 bg-white" />
              </div>
            )}
          </div>
        </div>

        {/* Data section */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4 text-right">
          <h3 className="text-xs font-extrabold text-brand-primary">پشتیبان‌گیری و داده‌ها</h3>
          <p className="text-xs text-slate-500">برای جلوگیری از دست رفتن اطلاعات، به صورت دوره‌ای از بانک اطلاعاتی خود بکاپ بگیرید.</p>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => backupInputRef.current?.click()}
              className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 bg-white text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              <span>بازیابی از فایل</span>
              <Upload size={16} />
            </button>
            <input
              type="file"
              ref={backupInputRef}
              accept=".json"
              className="hidden"
              onChange={handleRestore}
            />
            
            <button
              onClick={exportBackup}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              <span>دریافت فایل پشتیبان</span>
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
