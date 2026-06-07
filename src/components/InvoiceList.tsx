import { useState } from 'react';
import { InvoiceState } from '../types';
import { Trash2, Edit, Search } from 'lucide-react';

interface InvoiceListProps {
  invoices: InvoiceState[];
  onEdit: (invoice: InvoiceState) => void;
  onDelete: (id: string) => void;
}

export default function InvoiceList({ invoices, onEdit, onDelete }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = invoices.filter(inv => 
    inv.customerName?.includes(searchTerm) ||
    inv.invoiceNo?.includes(searchTerm) ||
    inv.carModel?.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <h2 className="text-base font-extrabold text-slate-900">لیست فاکتورهای ذخیره شده</h2>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="جستجو (نام، شماره، خودرو)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-right p-2 pr-8 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary bg-slate-50"
          />
          <Search size={14} className="absolute right-2 top-2.5 text-slate-400" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">هیچ فاکتوری یافت نشد.</div>
        ) : (
          filtered.map(inv => (
            <div key={inv.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg shadow-sm hover:border-slate-300 transition-all bg-slate-50/50">
              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(inv.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => onEdit(inv)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition-colors"
                >
                  <Edit size={16} />
                </button>
              </div>

              <div className="text-right flex-1 pr-4">
                <div className="font-bold text-sm text-slate-900">{inv.customerName || 'مشتری نامشخص'}</div>
                <div className="text-xs text-slate-500 mt-1 flex justify-end gap-2">
                  <span>{inv.carModel}</span>
                  <span className="text-slate-300">|</span>
                  <span>فاکتور: {inv.invoiceNo}</span>
                  <span className="text-slate-300">|</span>
                  <span>{inv.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
