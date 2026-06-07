import { InvoiceState, AppSettings, DEFAULT_SETTINGS, InvoiceItem } from '../types';

const INVOICES_KEY = 'invoices_db';
const SETTINGS_KEY = 'app_settings_db';

export function getInvoices(): InvoiceState[] {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading invoices', e);
  }
  return [];
}

export function saveInvoice(invoice: InvoiceState) {
  const invoices = getInvoices();
  const index = invoices.findIndex((i) => i.id === invoice.id);
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function deleteInvoice(id: string) {
  const invoices = getInvoices().filter((i) => i.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function applyThemeColor(color: string) {
  document.documentElement.style.setProperty('--brand-primary', color);
}

// Auto-Complete Suggestions Helpers
export function getCustomerSuggestions() {
  const invoices = getInvoices();
  const map = new Map<string, { phone: string, address: string }>();
  invoices.forEach(inv => {
    if (inv.customerName && !map.has(inv.customerName)) {
      map.set(inv.customerName, { phone: inv.customerPhone, address: inv.customerAddress });
    }
  });
  return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
}

export function getItemSuggestions() {
  const invoices = getInvoices();
  const map = new Map<string, InvoiceItem>();
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (item.description && !map.has(item.description)) {
        map.set(item.description, item);
      }
    });
  });
  return Array.from(map.values());
}

export function exportBackup() {
  const backup = {
    invoices: getInvoices(),
    settings: getSettings(),
    timestamp: new Date().toISOString()
  };
  const str = JSON.stringify(backup, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `option-plus-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backup = JSON.parse(text);
        if (backup.invoices) {
          localStorage.setItem(INVOICES_KEY, JSON.stringify(backup.invoices));
        }
        if (backup.settings) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(backup.settings));
        }
        resolve(true);
      } catch (err) {
        console.error('Backup import error', err);
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
}
