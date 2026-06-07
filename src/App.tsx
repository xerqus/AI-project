import React, { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2pdf from 'html2pdf.js';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Check,
  CheckCircle2,
  FileText,
  Settings as SettingsIcon,
  List as ListIcon,
  Save,
  Edit as EditIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InvoiceState, InvoiceItem, AppSettings, PAYMENT_METHODS } from './types';
import { getInvoices, saveInvoice, deleteInvoice, getSettings, saveSettings, applyThemeColor, getCustomerSuggestions, getItemSuggestions } from './lib/storage';
import { toPersianDigits, formatPersianCurrency } from './lib/utils';
import InvoiceList from './components/InvoiceList';
import Settings from './components/Settings';

// Letter list for Iranian license plate selection
const PLATE_LETTERS = [
  "الف", "ب", "ج", "د", "س", "ص", "ط", "ع", "ق", "ل", "م", "ن", "و", "ه", "ی", "معلولین"
];

// Pure Persian Digit conversion helper matching Kotlin String.toPersianDigits()
// Moved to lib/utils.ts

const DEFAULT_STATE: InvoiceState = {
  id: `inv-${Date.now()}`,
  invoiceNo: "۱۴۰۵/۴۰۰۲۱",
  date: "۱۴۰۵/۰۳/۱۰",
  time: "۱۹:۳۰",
  contactNo: "۰۹۱۲۳۴۵۶۷۸۹",
  managerName: "آقای محمدی",
  
  // Customer Info
  customerName: "شرکت بازرگانی پارس",
  customerPhone: "۰۲۱-۸۸۸۸۸۸۸۸",
  customerAddress: "تهران، خیابان ولیعصر، برج تجارت، طبقه ۵",
  
  // Car Info
  carModel: "مرسدس بنز C200",
  carYear: "۲۰۲۳",
  carColor: "مشکی متالیک",
  licencePlate: {
    part1: "۸۸",
    letter: "ب",
    part2: "۴۵۶",
    cityCode: "۲۱"
  },
  carVin: "WDD2050421F392810",
  carMileage: "۱۲,۵۰۰",
  
  // Invoice Items
  items: [
    { id: "ID-1", description: "مانیتور اندروید تسلایی فابریک مرسدس بنز", quantity: 1, unitPriceUsd: 1500, unitPriceAed: 5500 },
    { id: "ID-2", description: "دوربین ۳۶۰ درجه سه بعدی با قابلیت ضبط تصاویر", quantity: 1, unitPriceUsd: 800, unitPriceAed: 2900 },
    { id: "ID-3", description: "کیت رادار نقطه کور (بیس فابریک با هشدار صوتی)", quantity: 2, unitPriceUsd: 450, unitPriceAed: 1650 },
    { id: "ID-4", description: "نورپردازی داخل کابین ۶۴ رنگ هوشمند Ambient Light", quantity: 1, unitPriceUsd: 350, unitPriceAed: 1280 }
  ],
  
  // Financials
  discountUsd: 250,
  discountAed: 900,
  vatRatePercent: 9,
  
  // Notes
  notes: "تمام کارهای آپلود شده و کیت‌های نصب شده فابریک می‌باشند و شامل گارانتی ۱۲ ماهه طلایی آپشن پلاس هستند.",
  
  // Payment
  paymentMethod: 'POS',
  isSignedDummy: true
};

export default function App() {
  const [state, setState] = useState<InvoiceState>({ ...DEFAULT_STATE, id: `inv-${Date.now()}` });
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'preview' | 'settings'>('list');
  const [invoices, setInvoices] = useState<InvoiceState[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  
  // Dialog to Add Custom Row
  const [showAddRow, setShowAddRow] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCount, setNewCount] = useState<number>(1);
  const [newPriceUsd, setNewPriceUsd] = useState<string>('');
  const [newPriceAed, setNewPriceAed] = useState<string>('');
  
  // Signature Drawing Refs & State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Auto calculate USD -> AED if one of them changes during add modal
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(getInvoices());
    const settings = getSettings();
    setAppSettings(settings);
    applyThemeColor(settings.themeColor);
  };

  const handleSaveInvoice = () => {
    saveInvoice(state);
    setInvoices(getInvoices());
    alert('فاکتور با موفقیت ذخیره شد.');
  };

  const handleEditInvoice = (invoice: InvoiceState) => {
    setState(invoice);
    setActiveTab('editor');
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
      deleteInvoice(id);
      setInvoices(getInvoices());
      if (state.id === id) {
         handleReset();
      }
    }
  };

  const updateSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    saveSettings(newSettings);
    applyThemeColor(newSettings.themeColor);
  };
  const handleUsdPriceChange = (usdVal: string) => {
    setNewPriceUsd(usdVal);
    const numeric = parseFloat(usdVal);
    if (!isNaN(numeric)) {
      setNewPriceAed(Math.round(numeric * 3.67).toString());
    } else {
      setNewPriceAed('');
    }
  };

  const handleAedPriceChange = (aedVal: string) => {
    setNewPriceAed(aedVal);
    const numeric = parseFloat(aedVal);
    if (!isNaN(numeric)) {
      setNewPriceUsd(Math.round(numeric / 3.67).toString());
    } else {
      setNewPriceUsd('');
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e3a8a'; // ink-blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    
    // Switch client signature checkbox toggle once they draw
    if (state.isSignedDummy) {
      setState(prev => ({ ...prev, isSignedDummy: false }));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, 
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Check if the canvas is empty
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    
    // If not blank, save standard data URL
    if (canvas.toDataURL() !== blank.toDataURL()) {
      setSignatureDataUrl(canvas.toDataURL());
    }
  };

  // Calculations
  const subtotalUsd = state.items.reduce((acc, item) => acc + (item.quantity * item.unitPriceUsd), 0);
  const subtotalAed = state.items.reduce((acc, item) => acc + (item.quantity * item.unitPriceAed), 0);
  
  const vatUsd = (subtotalUsd - state.discountUsd) * (state.vatRatePercent / 100);
  const vatAed = (subtotalAed - state.discountAed) * (state.vatRatePercent / 100);

  const grandTotalUsd = (subtotalUsd - state.discountUsd) + vatUsd;
  const grandTotalAed = (subtotalAed - state.discountAed) + vatAed;

  // Add Item to List
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc) return;

    const rowItem: InvoiceItem = {
      id: `id-${Date.now()}`,
      description: newDesc,
      quantity: newCount,
      unitPriceUsd: parseFloat(newPriceUsd) || 0,
      unitPriceAed: parseFloat(newPriceAed) || 0
    };

    setState(prev => ({
      ...prev,
      items: [...prev.items, rowItem]
    }));

    // Reset fields
    setNewDesc('');
    setNewCount(1);
    setNewPriceUsd('');
    setNewPriceAed('');
    setShowAddRow(false);
  };

  // Delete Item from List
  const handleDeleteItem = (id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Trigger PDF Generation and Download / Native Share Dialog
  const handlePrint = async () => {
    if (activeTab === 'editor' && window.innerWidth < 768) {
      setActiveTab('preview');
      setTimeout(() => {
        handlePrint();
      }, 500); // give time for react rendering
      return;
    }

    // Elegant success confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(async () => {
      try {
        const element = document.getElementById('invoice-preview-container');
        if (!element) {
          window.print();
          return;
        }

        // Temporarily clear any scaled transform applied by Tailwind
        const originalClasses = element.className;
        element.className = element.className.replace(/scale-\[0\.43\]/g, '').replace(/md:scale-100/g, '');

        const opt = {
          margin:       [5, 5, 5, 5] as [number, number, number, number],
          filename:     `invoice-${state.invoiceNo || 'output'}.pdf`,
          image:        { type: 'jpeg' as const, quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
          jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        if (Capacitor.isNativePlatform()) {
          // Generate PDF as base64 string
          const pdfBase64 = await html2pdf().set(opt).from(element).outputPdf('datauristring');
          const base64Data = pdfBase64.split(',')[1];
          
          // Restore original styled scaling
          element.className = originalClasses;

          // Save to filesystem
          const savedFile = await Filesystem.writeFile({
            path: opt.filename,
            data: base64Data,
            directory: Directory.Cache 
          });
          
          // Share / Open the file
          await Share.share({
            title: 'فاکتور آپشن پلاس',
            url: savedFile.uri,
            dialogTitle: 'اشتراک‌گذاری فاکتور'
          });
          
        } else {
          // On web, save the PDF to the user's device
          await html2pdf().set(opt).from(element).save();
          
          // Restore original styled scaling
          element.className = originalClasses;
        }
      } catch (e) {
        console.error('Error generating PDF:', e);
        // Fallback
        window.print();
      }
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm("آیا مایل به ایجاد فاکتور جدید هستید؟")) {
      setState({
        ...DEFAULT_STATE,
        id: `inv-${Date.now()}`,
        items: []
      });
      clearSignature();
      setSignatureDataUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      
      {/* 1. Sleek Navigation App Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Brand title on Right (RTL layout) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-200">
              <span className="text-sm tracking-tighter">OP</span>
            </div>
            <div className="text-right">
              <h1 className="text-base font-black text-slate-900 leading-tight">فاکتورساز آپشن پلاس</h1>
              <p className="text-[10px] text-slate-500 font-medium">اصالت و نصب فابریک خودروهای آلمانی</p>
            </div>
          </div>

          {/* Quick Actions & Desktop view print buttons (RTL order - Left aligned in RTL) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveInvoice}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all shadow-lg flex items-center gap-2"
            >
              <Save size={16} />
              <span className="hidden sm:inline">ذخیره فاکتور</span>
            </button>

            <button
              id="btn-print"
              onClick={handlePrint}
              className="bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all shadow-lg flex items-center gap-2"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">خروجی PDF</span>
            </button>
            
            <button
              id="btn-reset"
              onClick={handleReset}
              className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs sm:text-sm px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
              title="فاکتور جدید"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">جدید</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-t border-slate-100 bg-white shadow overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 min-w-[100px] py-3 text-center text-xs font-bold transition-all border-b-2 flex justify-center items-center gap-2 ${
              activeTab === 'list' 
                ? 'border-brand-primary text-brand-primary bg-blue-50/30' 
                : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ListIcon size={16}/>
            لیست فاکتورها
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 min-w-[100px] py-3 text-center text-xs font-bold transition-all border-b-2 flex justify-center items-center gap-2 ${
              activeTab === 'editor' 
                ? 'border-brand-primary text-brand-primary bg-blue-50/30' 
                : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            <EditIcon size={16}/>
            ویرایش فاکتور
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 min-w-[100px] py-3 text-center text-xs font-bold transition-all border-b-2 flex justify-center items-center gap-2 ${
              activeTab === 'preview' 
                ? 'border-brand-primary text-brand-primary bg-blue-50/30' 
                : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText size={16}/>
            پیش‌نمایش
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-[100px] py-3 text-center text-xs font-bold transition-all border-b-2 flex justify-center items-center gap-2 ${
              activeTab === 'settings' 
                ? 'border-brand-primary text-brand-primary bg-blue-50/30' 
                : 'border-transparent text-slate-500 hover:bg-slate-50'
            }`}
          >
            <SettingsIcon size={16}/>
            تنظیمات
          </button>
        </div>
      </header>

      {/* 2. Main Content Body Wrap */}
      <main className="flex-1 w-full mx-auto pb-24 relative bg-slate-100 flex justify-center items-start">
        <div className={`w-full ${activeTab === 'preview' ? 'max-w-4xl p-2 sm:p-4' : 'max-w-md p-4 sm:p-0 sm:border-x sm:border-slate-300 min-h-screen shadow-xl bg-slate-50'}`}>
        {/* List View */}
        <section className={`w-full ${activeTab === 'list' ? 'block' : 'hidden'}`}>
          <div className="pt-2">
            <InvoiceList invoices={invoices} onEdit={handleEditInvoice} onDelete={handleDeleteInvoice} />
          </div>
        </section>

        {/* Settings View */}
        <section className={`w-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
          <div className="pt-2">
            <Settings settings={appSettings} onSettingsChange={updateSettings} onReloadRequested={loadData} />
          </div>
        </section>

        {/* Editor Form Columns */}
        <section className={`w-full space-y-6 no-print ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
          <div className="bg-white sm:rounded-2xl border-y sm:border border-slate-200 p-5 md:p-6 shadow-sm space-y-6">
            
            <datalist id="customer-names">
              {getCustomerSuggestions().map(cust => (
                 <option key={cust.name} value={cust.name} />
              ))}
            </datalist>
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900">تنظیمات اصلی فاکتور فروش</h2>
              <p className="text-xs text-slate-500 mt-1">مشخصات سند، خریدار، خودرو و اقلام خدمات را در زیر ویرایش فرمایید</p>
            </div>

            {/* General Info Group */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold text-brand-primary flex items-center gap-1">
                <span>اطلاعات عمومی سند</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">شماره سند فاکتور</label>
                  <input
                    type="text"
                    value={state.invoiceNo}
                    onChange={(e) => setState({ ...state, invoiceNo: e.target.value })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">تاریخ فاکتور</label>
                  <input
                    type="text"
                    value={state.date}
                    onChange={(e) => setState({ ...state, date: e.target.value })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">ساعت ثبت شده</label>
                  <input
                    type="text"
                    value={state.time}
                    onChange={(e) => setState({ ...state, time: e.target.value })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">مدیر مجموعه پذیرش کنند</label>
                  <input
                    type="text"
                    value={state.managerName}
                    onChange={(e) => setState({ ...state, managerName: e.target.value })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Customer Info Group */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold text-brand-primary">اطلاعات مشتری (مالک خودرو)</h3>
              <div className="space-y-3">
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 font-sans">نام و نام خانوادگی خریدار</label>
                  <input
                    type="text"
                    list="customer-names"
                    value={state.customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = getCustomerSuggestions().find(c => c.name === val);
                      if (match) {
                        setState({ ...state, customerName: val, customerPhone: match.phone, customerAddress: match.address });
                      } else {
                        setState({ ...state, customerName: val });
                      }
                    }}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">شماره تماس همراه</label>
                  <input
                    type="text"
                    value={state.customerPhone}
                    onChange={(e) => setState({ ...state, customerPhone: e.target.value })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">آدرس پستی خریدار</label>
                  <textarea
                    rows={2}
                    value={state.customerAddress}
                    onChange={(e) => setState({ ...state, customerAddress: e.target.value })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white leading-relaxed resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Car specifications Group */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold text-brand-primary">مشخصات خودروی تحت‌پذیرش</h3>
              <div className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-right">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">مدل و برند خودرو</label>
                    <input
                      type="text"
                      value={state.carModel}
                      onChange={(e) => setState({ ...state, carModel: e.target.value })}
                      className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white/100"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">رنگ بدنه</label>
                    <input
                      type="text"
                      value={state.carColor}
                      onChange={(e) => setState({ ...state, carColor: e.target.value })}
                      className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">سال ساخت (میلادی/شمسی)</label>
                    <input
                      type="text"
                      value={state.carYear}
                      onChange={(e) => setState({ ...state, carYear: e.target.value })}
                      className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 font-sans">کارکرد (کیلومتر)</label>
                    <input
                      type="text"
                      value={state.carMileage}
                      onChange={(e) => setState({ ...state, carMileage: e.target.value })}
                      className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">شماره شاسی خودرو (VIN)</label>
                  <input
                    type="text"
                    value={state.carVin}
                    onChange={(e) => setState({ ...state, carVin: e.target.value.toUpperCase() })}
                    className="w-full text-left font-mono tracking-wider p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>

                {/* Highly Visual Iranian License Plate Editor */}
                <div className="text-right space-y-2 border-t border-slate-200/60 pt-3">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 block">ویرایشگر هوشمند پلاک ایرانی</span>
                  
                  {/* Graphical Interface representing Plate Fields in RTL arrangement */}
                  <div className="flex bg-slate-100 border border-slate-300 p-2.5 rounded-xl justify-between items-center gap-2">
                    
                    {/* City Code (Iran) field */}
                    <div className="flex-1 text-center">
                      <span className="block text-[9px] text-slate-500 font-bold mb-1">کد ایران</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={state.licencePlate.cityCode}
                        onChange={(e) => setState({
                          ...state,
                          licencePlate: { ...state.licencePlate, cityCode: e.target.value }
                        })}
                        className="w-full text-center font-bold p-1 border border-slate-300 text-sm rounded bg-white"
                        placeholder="۲۱"
                      />
                    </div>

                    <div className="text-slate-400 font-bold text-lg">|</div>

                    {/* Part 2 of Plate */}
                    <div className="w-16 text-center">
                      <span className="block text-[9px] text-slate-500 font-bold mb-1">۳ رقم ثانویه</span>
                      <input
                        type="text"
                        maxLength={3}
                        value={state.licencePlate.part2}
                        onChange={(e) => setState({
                          ...state,
                          licencePlate: { ...state.licencePlate, part2: e.target.value }
                        })}
                        className="w-full text-center font-bold p-1 border border-slate-300 text-sm rounded bg-white"
                        placeholder="۴۵۶"
                      />
                    </div>

                    {/* Middle Letter Selector */}
                    <div className="w-20 text-center">
                      <span className="block text-[9px] text-slate-500 font-bold mb-1">حرف میانی</span>
                      <select
                        value={state.licencePlate.letter}
                        onChange={(e) => setState({
                          ...state,
                          licencePlate: { ...state.licencePlate, letter: e.target.value }
                        })}
                        className="w-full text-center py-1 font-bold border border-slate-300 text-xs rounded bg-white"
                      >
                        {PLATE_LETTERS.map(letChar => (
                          <option key={letChar} value={letChar}>{letChar}</option>
                        ))}
                      </select>
                    </div>

                    {/* Part 1 of Plate */}
                    <div className="w-16 text-center">
                      <span className="block text-[9px] text-slate-500 font-bold mb-1 font-sans">۲ رقم ابتدایی</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={state.licencePlate.part1}
                        onChange={(e) => setState({
                          ...state,
                          licencePlate: { ...state.licencePlate, part1: e.target.value }
                        })}
                        className="w-full text-center font-bold p-1 border border-slate-300 text-sm rounded bg-white"
                        placeholder="۸۸"
                      />
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Items and Services Table Group */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg">
                <button
                  id="btn-add-item"
                  onClick={() => setShowAddRow(true)}
                  className="bg-brand-dark hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  <span>افزودن ردیف خدمات</span>
                </button>
                <div className="text-right">
                  <h4 className="text-xs font-extrabold text-slate-800">سیاهه خدمات و اقلام فاکتور</h4>
                  <p className="text-[9px] text-slate-500 font-medium">مجموعاً {state.items.length} ردیف خدمات اضافه شده است</p>
                </div>
              </div>

              {/* Items Cards list with Edit triggers */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {state.items.map(item => (
                  <div 
                    key={item.id} 
                    className="flex bg-white border border-slate-200 rounded-lg p-2.5 items-center justify-between shadow-sm hover:border-slate-300 transition-colors"
                  >
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 rounded p-1.5 transition-colors"
                      title="حذف ردیف"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-right flex-1 pr-3">
                      <span className="text-xs font-bold text-slate-900 block">{item.description}</span>
                      <div className="flex flex-row-reverse gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                        <span>تعداد: {toPersianDigits(item.quantity)} عدد</span>
                        <span className="text-slate-300">•</span>
                        <span>واحد USD: {formatPersianCurrency(item.unitPriceUsd)}</span>
                        <span className="text-slate-300">•</span>
                        <span>واحد AED: {formatPersianCurrency(item.unitPriceAed)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {state.items.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                    هیچ ردیفی اضافه نشده است. کلید «افزودن ردیف خدمات» را بزنید.
                  </div>
                )}
              </div>
            </div>

            {/* Financial Discounts and Payment Methods */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold text-brand-primary">تخفیف و روش‌های مالی فاکتور</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">مبلغ تخفیف نهایی (USD)</label>
                  <input
                    type="number"
                    value={state.discountUsd || ''}
                    onChange={(e) => setState({ ...state, discountUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
                <div className="text-right">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1">مبلغ تخفیف نهایی (AED)</label>
                  <input
                    type="number"
                    value={state.discountAed || ''}
                    onChange={(e) => setState({ ...state, discountAed: parseFloat(e.target.value) || 0 })}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white"
                  />
                </div>
              </div>

              {/* Payment Select checkboxes styled like button groups */}
              <div className="text-right bg-slate-100 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-slate-600 block mb-2 leading-tight">روش پیش‌فرض فعال برای پرداخت صورت‌حساب:</span>
                <div className="grid grid-cols-4 gap-1">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setState({ ...state, paymentMethod: method.id })}
                      className={`text-[10px] sm:text-xs py-2 font-bold px-1 rounded-md transition-all duration-200 ${
                        state.paymentMethod === method.id
                          ? 'bg-brand-primary text-white shadow shadow-blue-200'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Digital Interactive Client Signature Pad Block */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <button
                  onClick={clearSignature}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] px-2 py-1 rounded transition-colors"
                >
                  پاک کردن بوم
                </button>
                <div className="flex items-center gap-1">
                  <label className="text-xs font-bold text-slate-700">ثبت امضای فاکتور رسمی</label>
                  <input
                    type="checkbox"
                    checked={state.isSignedDummy}
                    onChange={(e) => setState({ ...state, isSignedDummy: e.target.checked })}
                    className="w-3.5 h-3.5 accent-brand-primary cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="border border-slate-300 rounded-xl bg-white overflow-hidden shadow-sm relative">
                {/* Pointer Events Canvas */}
                <canvas
                  id="canvas-signature"
                  ref={canvasRef}
                  width={380}
                  height={110}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-28 signature-canvas bg-slate-50"
                />

                {!signatureDataUrl && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] sm:text-xs">
                    انگشت یا نشانگر خود را برای درج امضا در اینجا بکشید
                  </div>
                )}
              </div>
            </div>

            {/* Document Notes Block */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
              <h3 className="text-xs font-extrabold text-brand-primary">بند نکات و شروط اختصاصی فاکتور</h3>
              <textarea
                rows={3}
                value={state.notes}
                onChange={(e) => setState({ ...state, notes: e.target.value })}
                className="w-full text-right p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-white leading-relaxed resize-none"
              />
            </div>

          </div>
        </section>

        {/* Live Premium Preview Panel */}
        <section className={`w-full print-full-width ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
          <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar pb-12 flex justify-start md:justify-center px-4 md:px-0">
          <div style={{ minWidth: "800px", maxWidth: "800px", width: "800px" }} id="invoice-preview-container" className="bg-white border-2 border-slate-400 p-8 rounded-lg shadow-2xl text-slate-900 mx-auto relative font-sans leading-relaxed shrink-0 scale-[0.43] md:scale-100 origin-top-right md:origin-center bg-zinc-50 border-double">

            
            {/* Header Block: Winged Symmetrical Brand Logo and Info */}
            <div className="flex flex-col  border border-slate-300 bg-[#FAF9F6] rounded-md p-4 justify-between items-center gap-4">
              
              {/* Left Column: Client metadata and General properties in RTL layout */}
              <div className="text-right text-[11px]  text-slate-700 space-y-1 w-full ">
                <div>
                  <span className="text-slate-400 font-medium">شماره فاکتور:</span>{' '}
                  <span className="font-extrabold text-slate-900">{state.invoiceNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">تاریخ:</span>{' '}
                  <span className="font-extrabold text-slate-900">{state.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium font-sans">ساعت:</span>{' '}
                  <span className="font-extrabold text-slate-900">{state.time}</span>
                </div>
              </div>

              {/* Center: Winged Logo Badge with Dual English-Persian headers */}
              <div className="text-center flex flex-col items-center">
                {appSettings.logoBase64 ? (
                  <img src={appSettings.logoBase64} alt="Company Logo" className="w-16 max-h-16 object-contain" />
                ) : (
                  <svg className="w-16 h-8 text-brand-accent transform hover:scale-105 transition-transform duration-300" viewBox="0 0 100 40" fill="currentColor">
                    <path d="M 50,34 L 20,6 L 5,6 L 45,38 Z" fill="#dc2626" />
                    <path d="M 50,34 L 80,6 L 95,6 L 55,38 Z" fill="#dc2626" />
                    <path d="M 50,14 L 35,2 L 65,2 Z" fill="#1e293b" />
                  </svg>
                )}
                <span className="font-mono text-sm font-black tracking-wider text-slate-900 mt-1 block">OPTION PLUS</span>
                <span className="text-xs font-black text-slate-900 leading-none">آپشن پلاس</span>
                <span className="text-[8px] text-slate-500 font-bold block mt-1 tracking-tight">نصب آپشن‌های فابـریک خودروهای آلـمانی</span>
              </div>

              {/* Right: Contact properties */}
              <div className="text-right  text-[11px]  text-slate-700 space-y-1 w-full  flex flex-col items-end">
                <div>
                  <span className="text-slate-400 font-medium">مدیر مجموعه:</span>{' '}
                  <span className="font-extrabold text-slate-900">{state.managerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">شماره تماس:</span>{' '}
                  <span className="font-extrabold text-slate-900">{state.contactNo}</span>
                </div>
                <div className="inline-block bg-slate-200 text-slate-800 text-[8px] font-black tracking-tight px-1.5 py-0.5 rounded mt-1">
                  فاکتور فروش لـوازم خـودرویی
                </div>
              </div>

            </div>

            {/* Customer & Car Info card split panels */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4">
              
              {/* Left Side: Car Details Card (Slightly larger layout) */}
              <div className="sm:col-span-7 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
                <div className="bg-brand-dark text-white text-[11px] font-bold py-1 px-2.5 flex items-center justify-between">
                  <span>🚗</span>
                  <span className="text-right">مشخصات خودروی پذیرش شده</span>
                </div>
                <div className="p-3 text-[11px] space-y-2 flex-grow">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-right">
                      <span className="text-slate-400">مدل خودرو:</span>{' '}
                      <span className="font-bold text-slate-900">{state.carModel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">رنگ خودرو:</span>{' '}
                      <span className="font-bold text-slate-900">{state.carColor}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">سال ساخت:</span>{' '}
                      <span className="font-bold text-slate-900 leading-none">{state.carYear}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">کارکرد خودرو:</span>{' '}
                      <span className="font-bold text-slate-900">{state.carMileage}</span>
                    </div>
                  </div>
                  <div className="text-right border-t border-slate-100 pt-1.5">
                    <span className="text-slate-400 font-mono">VIN No:</span>{' '}
                    <span className="font-mono tracking-wider font-extrabold text-slate-900">{state.carVin || '---'}</span>
                  </div>

                  {/* Graphical Render for Iran Corporate License Plate */}
                  <div className="flex justify-end items-center pt-2 border-t border-slate-100 mt-2">
                    <div className="relative flex items-center border-2 border-slate-900 bg-white rounded-md w-44 h-9 overflow-hidden select-none">
                      
                      {/* Left blue strip with IR flag */}
                      <div className="w-5 bg-[#2563eb] h-full flex flex-col items-center justify-between p-0.5">
                        <div className="w-3.5 h-1.5 flex flex-col">
                          <div className="h-0.5 bg-[#16a34a] w-full" />
                          <div className="h-0.5 bg-white w-full" />
                          <div className="h-0.5 bg-[#dc2626] w-full" />
                        </div>
                        <span className="text-[3.5px] leading-none text-white font-sans font-bold text-center">I.R. ORG</span>
                      </div>

                      {/* Regular Number blocks inside plate context */}
                      <div className="flex-1 flex items-center justify-center gap-1 px-1 font-sans">
                        <span className="text-xs  font-extrabold text-slate-900">{toPersianDigits(state.licencePlate.part1)}</span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{state.licencePlate.letter}</span>
                        <span className="text-xs  font-extrabold text-slate-900 leading-none">{toPersianDigits(state.licencePlate.part2)}</span>
                      </div>

                      {/* Vertical line and right city code blocks */}
                      <div className="w-0.5 bg-slate-900 h-full" />
                      <div className="w-8 h-full bg-white flex flex-col items-center justify-center leading-none">
                        <span className="text-[6px] text-slate-900 font-bold leading-none mb-0.5">ايران</span>
                        <span className="text-xs font-black text-slate-900 leading-none">{toPersianDigits(state.licencePlate.cityCode)}</span>
                      </div>

                    </div>
                    <span className="text-[9px] text-[#777] font-bold mr-2">:پلاک خودرو</span>
                  </div>

                </div>
              </div>

              {/* Right Side: Buyer Card */}
              <div className="sm:col-span-5 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
                <div className="bg-brand-dark text-white text-[11px] font-bold py-1 px-2.5 flex items-center justify-between">
                  <span>👤</span>
                  <span className="text-right">مشخصات خریدار (خدمت‌گیرنده)</span>
                </div>
                <div className="p-3 text-[11px] space-y-2 flex-grow">
                  <div className="text-right">
                    <span className="text-slate-400">نام و نام خانوادگی:</span>{' '}
                    <span className="font-bold text-slate-900 block">{state.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">شماره تلفن خریدار:</span>{' '}
                    <span className="font-bold text-slate-900 block font-sans">{state.customerPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">نشانی پستی:</span>{' '}
                    <p className="font-semibold text-slate-700 leading-relaxed mt-0.5">{state.customerAddress}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Service & Items Invoice Tabular Body */}
            <div className="border border-slate-900 rounded overflow-hidden mt-4 bg-white">
              <table className="w-full text-right border-collapse text-[10px]">
                <thead>
                  <tr className="bg-brand-dark text-white font-bold border-b border-slate-900">
                    <th className="p-1.5 w-24 text-center border-l border-slate-100">جمع مبلغ کل</th>
                    <th className="p-1.5 w-24 text-center border-l border-slate-100">قیمت واحد</th>
                    <th className="p-1.5 w-10 text-center border-l border-slate-100">تعداد</th>
                    <th className="p-1.5 text-right border-l border-slate-100">شرح کالا یا خدمات فنی مجاز</th>
                    <th className="p-1.5 w-8 text-center">ردیف</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Map prefilled elements from database items */}
                  {state.items.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors"
                      style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    >
                      <td className="p-1.5 text-center border-l border-slate-200">
                        <div className="font-bold text-slate-900 text-[10px]">{formatPersianCurrency(item.quantity * item.unitPriceUsd)} USD</div>
                        <div className="text-[9px] text-slate-500">{formatPersianCurrency(item.quantity * item.unitPriceAed)} AED</div>
                      </td>
                      <td className="p-1.5 text-center border-l border-slate-200">
                        <div className="text-slate-700">{formatPersianCurrency(item.unitPriceUsd)} USD</div>
                        <div className="text-[9px] text-slate-500">{formatPersianCurrency(item.unitPriceAed)} AED</div>
                      </td>
                      <td className="p-1.5 text-center font-bold text-slate-900 border-l border-slate-200">
                        {toPersianDigits(item.quantity)}
                      </td>
                      <td className="p-1.5 text-right font-medium text-slate-900 border-l border-slate-200 text-xs">
                        {item.description}
                      </td>
                      <td className="p-1.5 text-center text-slate-400 border-r-0">
                        {toPersianDigits(idx + 1)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty Padded Rows up to 8 minimum forpreprinted invoice aesthetic layout */}
                  {state.items.length < 8 && Array.from({ length: 8 - state.items.length }).map((_, emptyIdx) => {
                    const rowIdx = state.items.length + emptyIdx;
                    return (
                      <tr 
                        key={`empty-${rowIdx}`}
                        className="border-b border-slate-200/60"
                        style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                      >
                        <td className="p-1.5 h-7 border-l border-slate-200"></td>
                        <td className="p-1.5 border-l border-slate-200"></td>
                        <td className="p-1.5 border-l border-slate-200"></td>
                        <td className="p-1.5 border-l border-slate-200"></td>
                        <td className="p-1.5 text-center text-slate-300 font-light">
                          {toPersianDigits(rowIdx + 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Split Financial Calculator and Notes Block */}
            <div className="grid grid-cols-1  gap-4 mt-4 items-start">
              
              {/* Financial calculations table (Left) */}
              <div className="border border-slate-900 rounded bg-white overflow-hidden text-[10px] ">
                
                {/* Total Item cost */}
                <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200">
                  <div className="text-left">
                    <span className="font-bold text-slate-900 block">{formatPersianCurrency(subtotalUsd)} USD</span>
                    <span className="text-[10px] text-slate-500">{formatPersianCurrency(subtotalAed)} AED</span>
                  </div>
                  <span className="text-slate-600 font-medium">جمع کل ناخالص ملزومات:</span>
                </div>

                {/* Discounts */}
                <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 text-brand-accent">
                  <div className="text-left font-bold">
                    <span className="block">{formatPersianCurrency(state.discountUsd)} USD</span>
                    <span className="text-[10px] block">{formatPersianCurrency(state.discountAed)} AED</span>
                  </div>
                  <span className="font-medium">کاهش تخفیف نهایی:</span>
                </div>

                {/* VAT Tax */}
                <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200">
                  <div className="text-left">
                    <span className="font-bold text-slate-900 block">{formatPersianCurrency(vatUsd)} USD</span>
                    <span className="text-[10px] text-slate-500">{formatPersianCurrency(vatAed)} AED</span>
                  </div>
                  <span className="text-slate-600 font-medium">مالیات بر ارزش افزوده ({toPersianDigits(state.vatRatePercent)}٪):</span>
                </div>

                {/* Grand Total banner */}
                <div className="flex justify-between items-center px-3 py-2 bg-brand-accent text-white border-t border-slate-600">
                  <div className="text-left font-black">
                    <span className="block text-sm leading-tight">{formatPersianCurrency(grandTotalUsd)} USD</span>
                    <span className="text-[10px] block font-extrabold leading-none">{formatPersianCurrency(grandTotalAed)} AED</span>
                  </div>
                  <span className="text-xs font-black">جمع کل قابل پرداخت:</span>
                </div>

              </div>

              {/* Terms Notes Block (Right) */}
              <div className="border border-slate-300 rounded-lg p-3 bg-[#FAF9F6] h-full flex flex-col justify-between text-[10px]">
                <div>
                  <div className="flex items-center gap-1 justify-end font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                    <span className="font-sans">نکات و شروط فاکتور</span>
                    <span>📝</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-right">{state.notes || '---'}</p>
                </div>
              </div>

            </div>

            {/* Signatures & Official Badges Block */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 border border-slate-300 rounded-lg p-3">
              
              {/* Payment checkbox display on the Right side */}
              <div className="sm:col-span-5 bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] flex flex-col justify-center">
                <span className="font-bold text-slate-800 text-right block mb-1.5 border-b border-slate-200/80 pb-0.5">روش تسویه پرداخت:</span>
                <div className="space-y-1.5 flex flex-col items-end">
                  {PAYMENT_METHODS.map(m => {
                    const active = state.paymentMethod === m.id;
                    return (
                      <div key={m.id} className="flex items-center gap-1.5 flex-row-reverse">
                        <span className={`text-[10px] ${active ? 'font-black text-brand-primary' : 'text-slate-500'}`}>{m.label}</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          active 
                            ? 'bg-brand-primary border-brand-primary text-white' 
                            : 'bg-white border-slate-300'
                        }`}>
                          {active && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Elegant Interactive signatures columns (Left columns) */}
              <div className="sm:col-span-7 grid grid-cols-2 gap-3">
                
                {/* Clean signature section for Client */}
                <div className="flex flex-col items-center justify-between p-2 rounded border border-slate-200/80 bg-white h-24 text-center">
                  <span className="text-[9px] text-slate-400 font-bold">امضاء خریدار (مشتری)</span>
                  
                  <div className="relative w-full flex-grow flex items-center justify-center overflow-hidden">
                    {/* If interactive drawing available, showing canvas snapshot overlay, else elegant dummy SVG */}
                    {signatureDataUrl ? (
                      <img src={signatureDataUrl} className="max-h-12 max-w-full object-contain" alt="امضای مشتری" />
                    ) : state.isSignedDummy ? (
                      <svg className="w-24 h-12 text-[#1e3a8a] select-none pointer-events-none" viewBox="0 0 100 50">
                        {/* Elite realistic ink vector signature line path */}
                        <path 
                          d="M15,35 Q30,5, 45,28 Q60,45, 80,15 M25,25 C45,35 60,35 75,25" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                        />
                      </svg>
                    ) : (
                      <span className="text-[9px] text-slate-300 italic">محل امضاء</span>
                    )}
                  </div>

                  <div className="text-[9px] flex items-center gap-0.5 justify-center text-blue-700 font-bold">
                    <CheckCircle2 size={10} />
                    <span>✓ تایید و امضاء شد</span>
                  </div>
                </div>

                {/* Team static logo official Stamp */}
                <div className="flex flex-col items-center justify-between p-2 rounded border border-slate-200/80 bg-white h-24 text-center">
                  <span className="text-[9px] text-slate-400 font-bold">مهر و امضاء مجموعه</span>
                  
                  {/* Circular visual dashed team office badge stamp */}
                  <div className="relative w-24 h-11 border-2 border-dashed border-red-500 rounded flex items-center justify-center rotate-[-3deg] p-1 bg-red-50/20 shadow-sm">
                    <div className="text-center font-black text-red-500 leading-none">
                      <span className="text-[8px] tracking-tighter block">آپشن پلاس - تهران</span>
                      <span className="text-[6px] tracking-tight block mt-0.5 opacity-90">نصب فابریک با گارانتی</span>
                    </div>
                  </div>

                  <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase">OPTION PLUS SHOP</span>
                </div>

              </div>

            </div>

            {/* Standard preprinted Terms & Conditions bulletins */}
            <div className="border border-slate-300 bg-[#FAF9F6] rounded-lg p-3 text-[8px]  text-slate-500 space-y-1.5 mt-4 text-right">
              <span className="font-extrabold text-slate-800 block">شروط فرعی و مقررات ضمانت خدماتی فنی:</span>
              <div className="space-y-1 pr-1 font-sans font-medium leading-relaxed">
                <p>۱. کلیه قطعات و برندهای ارائه شده اصیل بوده و دارای ضمانت تطابق فابریک خودروی پذیرش شده هستند.</p>
                <p>۲. نصب و راه‌اندازی آپشن‌های برقی شامل گارانتی ۱۲ ماهه طلایی خدمات فنی آپشن پلاس می‌باشند.</p>
                <p>۳. مجموعه هیچگونه تعهدی در قبال لوازم و اشیای قیمتی داخل کابین خودرو در طول انجام کار ندارد.</p>
                <p>۴. این رسید فاقد مهلت تعویض سلیقه‌ای است و گارانتی صرفاً متناسب با کارت ضمانت صادر شده اعتبار دارد.</p>
              </div>
            </div>

            {/* Footer car manufacturers logo inline block representation */}
            <div className="mt-5 text-center text-[7px]  font-black text-slate-300 tracking-widest leading-none no-print">
              PORSCHE  •  MERCEDES-BENZ  •  BMW  •  AUDI  •  VOLKSWAGEN
            </div>

          </div>
          </div>
        </section>
        </div>
      </main>

      {/* 3. Add Custom Service Items Modal dialog */}
      {showAddRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <datalist id="item-descs">
             {getItemSuggestions().map(item => (
                <option key={item.description} value={item.description} />
             ))}
          </datalist>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl text-right">
            
            <HeaderModalTitle onClose={() => setShowAddRow(false)} />
            
            <form onSubmit={handleAddItem} className="space-y-4">
              
              <div className="text-right">
                <label className="text-xs font-bold text-slate-700 block mb-1">شرح کالا یا خدمات فنی پیشنهادی</label>
                <input
                  type="text"
                  required
                  list="item-descs"
                  value={newDesc}
                  onChange={(e) => {
                    const val = e.target.value;
                    const match = getItemSuggestions().find(i => i.description === val);
                    setNewDesc(val);
                    if (match) {
                      setNewPriceUsd(match.unitPriceUsd.toString());
                      setNewPriceAed(match.unitPriceAed.toString());
                    }
                  }}
                  className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary"
                  placeholder="مثال: کلید دکمه‌ای کیت فایبر اگزوز"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-right">
                  <label className="text-xs font-bold text-slate-700 block mb-1">قیمت واحد (AED)</label>
                  <input
                    type="number"
                    value={newPriceAed}
                    onChange={(e) => handleAedPriceChange(e.target.value)}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary"
                    placeholder="واحد درهم امارات"
                  />
                </div>
                <div className="text-right">
                  <label className="text-xs font-bold text-slate-700 block mb-1">قیمت واحد (USD)</label>
                  <input
                    type="number"
                    value={newPriceUsd}
                    onChange={(e) => handleUsdPriceChange(e.target.value)}
                    className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary"
                    placeholder="واحد دلار آمریکا"
                  />
                </div>
              </div>

              <div className="text-right">
                <label className="text-xs font-bold text-slate-700 block mb-1">تعداد اقلام خدمات</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newCount}
                  onChange={(e) => setNewCount(parseInt(e.target.value) || 1)}
                  className="w-full text-right p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRow(false)}
                  className="font-bold border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 text-xs rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-blue-700 text-white font-bold px-5 py-2 text-xs rounded-lg transition-colors"
                >
                  افزودن به لیست
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Inline presentation components
function HeaderModalTitle({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        ✕
      </button>
      <h3 className="text-sm font-black text-slate-900">افزودن ردیف خدمات فاکتور</h3>
    </div>
  );
}
