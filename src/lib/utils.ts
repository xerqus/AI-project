export function toPersianDigits(str: string | number): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, (w) => farsiDigits[parseInt(w)]);
}

export function formatPersianCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', { 
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount);
  return toPersianDigits(formatted);
}
