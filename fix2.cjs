const fs = require('fs');
let content = fs.readFileSync('src/components/Editor.tsx', 'utf8');

// remove old DEFAULT_STATE because we already passed initialInvoice
// But if it's there... wait, let's fix it:
content = content.replace('const DEFAULT_STATE: InvoiceState = {', 'const DEFAULT_STATE: any = {');

// import PAYMENT_METHODS
content = content.replace(
  "import { InvoiceState, InvoiceItem } from '../types';",
  "import { InvoiceState, InvoiceItem, PAYMENT_METHODS } from '../types';"
);

fs.writeFileSync('src/components/Editor.tsx', content);
