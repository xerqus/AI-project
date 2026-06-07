const fs = require('fs');
let content = fs.readFileSync('src/components/Editor.tsx', 'utf8');

// Fix signature & initialization
content = content.replace(
  'export function Editor({ initialInvoice, onSave, onCancel }: { initialInvoice: any, onSave: (i: any) => void, onCancel: () => void }) ) {',
  'export function Editor({ initialInvoice, onSave, onCancel }: { initialInvoice: any, onSave: (i: any) => void, onCancel: () => void }) {'
);

// Replace imports since types moved
content = content.replace("import React, { useState, useRef } from 'react';", "import React, { useState, useRef, useEffect } from 'react';\nimport { InvoiceState, InvoiceItem } from '../types';\nimport { getCustomerSuggestions, getItemSuggestions, getSettings } from '../lib/storage';");

// Remove duplicate types that were moved to types.ts
content = content.replace(/type PaymentMethod =[\s\S]*?isSignedDummy: boolean;\n}/, '');

content = content.replace(
  "const [state, setState] = useState<InvoiceState>({ ...DEFAULT_STATE });",
  "const [state, setState] = useState<InvoiceState>(initialInvoice);\n  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);\n  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);\n  const [settings, setSettings] = useState(getSettings());\n\n  useEffect(() => {\n    setCustomerSuggestions(getCustomerSuggestions());\n    setItemSuggestions(getItemSuggestions());\n  }, []);"
);

// We need a datalist for customers!
// Find the customer name input
content = content.replace(
  '<input\n                    type="text"\n                    value={state.customerName}',
  '<input list="customer-list"\n                    type="text"\n                    value={state.customerName}'
);

// Add the datalist block under customer address
content = content.replace(
  /<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*{\/\* Car specifications Group \*\//,
  `</div>
              </div>
              <datalist id="customer-list">
                {customerSuggestions.map(s => <option key={s.name} value={s.name} />)}
              </datalist>
            </div>
            {/* Car specifications Group */`
);

// Autocomplete for items
content = content.replace(
  '<input\n                    type="text"\n                    required\n                    value={newDesc}',
  '<input list="item-list"\n                    type="text"\n                    required\n                    value={newDesc}'
);
content = content.replace(
  'onChange={(e) => setNewDesc(e.target.value)}',
  'onChange={(e) => {\n                      setNewDesc(e.target.value);\n                      const match = itemSuggestions.find(i => i.description === e.target.value);\n                      if(match) {\n                        setNewPriceUsd(match.unitPriceUsd.toString());\n                        setNewPriceAed(match.unitPriceAed.toString());\n                      }\n                    }}'
);

content = content.replace(
  /<form onSubmit=\{handleAddItem\} className="space-y-4">/,
  `<form onSubmit={handleAddItem} className="space-y-4">
              <datalist id="item-list">
                {itemSuggestions.map(s => <option key={s.description} value={s.description} />)}
              </datalist>`
);


// And replace the Header buttons with "Save & Exit"
content = content.replace(
  '<Printer size={16} />\n              <span>خروجی PDF / چاپ فاکتور</span>\n            </button>\n            \n            <button\n              id="btn-reset"\n              onClick={handleReset}',
  '<Printer size={16} />\n              <span>خروجی PDF / چاپ فاکتور</span>\n            </button>\n            \n            <button\n              onClick={() => onSave(state)}\n              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2"\n            >\n              <Check size={16} />\n              <span>ذخیره فاکتور</span>\n            </button>\n\n            <button\n              id="btn-close"\n              onClick={onCancel}'
);
// replace handleReset with onCancel calls where needed or completely

// Logo replacement 
content = content.replace(
  '<div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-200">\n              <span className="text-sm tracking-tighter">OP</span>\n            </div>',
  `{settings.logoBase64 ? (
              <img src={settings.logoBase64} alt="Brand Logo" className="w-10 h-10 object-contain rounded-xl shadow-md border border-slate-200" />
            ) : (
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-200">
                <span className="text-sm tracking-tighter">OP</span>
              </div>
            )}`
);

content = content.replace(
  '<svg className="w-16 h-8 text-brand-accent transform hover:scale-105 transition-transform duration-300"',
  `{settings.logoBase64 ? (
                  <img src={settings.logoBase64} alt="Logo" className="max-h-16 object-contain mb-2" />
                ) : (
                  <svg className="w-16 h-8 text-brand-accent transform hover:scale-105 transition-transform duration-300"`
);

// We must also close the SVG block conditionally!
content = content.replace(
  '<path d="M 50,14 L 35,2 L 65,2 Z" fill="#1e293b" />\n                </svg>',
  '<path d="M 50,14 L 35,2 L 65,2 Z" fill="#1e293b" />\n                </svg>\n                )}'
);

fs.writeFileSync('src/components/Editor.tsx', content);
console.log('Editor patched');
