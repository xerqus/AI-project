const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startIndex = content.indexOf('id="invoice-preview-container"');
const endIndex = content.indexOf('</section>', startIndex);

let before = content.slice(0, startIndex);
let previewSection = content.slice(startIndex, endIndex);
let after = content.slice(endIndex);

// Force desktop layouts by removing sm: flex-col, etc.

previewSection = previewSection.replace(/flex-col sm:flex-row/g, 'flex-row');
previewSection = previewSection.replace(/grid-cols-1 sm:grid-cols-2/g, 'grid-cols-2');
previewSection = previewSection.replace(/w-full sm:w-auto/g, 'w-auto');
previewSection = previewSection.replace(/text-right sm:text-left/g, 'text-left');
previewSection = previewSection.replace(/flex-col sm:justify-end/g, 'justify-end');
previewSection = previewSection.replace(/justify-center sm:justify-end/g, 'justify-end');

// text sizes and paddings
previewSection = previewSection.replace(/text-\[11px\] sm:text-xs/g, 'text-xs');
previewSection = previewSection.replace(/text-xs sm:text-sm/g, 'text-sm');
previewSection = previewSection.replace(/sm:text-xs text-\[10px\]/g, 'text-xs');
previewSection = previewSection.replace(/py-2 px-2 sm:py-2\.5 sm:px-3/g, 'py-2.5 px-3');
previewSection = previewSection.replace(/py-2 px-2 sm:py-3 sm:px-3/g, 'py-3 px-3');

// column widths
previewSection = previewSection.replace(/w-10 sm:w-12/g, 'w-12');
previewSection = previewSection.replace(/w-12 sm:w-16/g, 'w-16');
previewSection = previewSection.replace(/w-20 sm:w-24/g, 'w-24');
previewSection = previewSection.replace(/w-24 sm:w-28/g, 'w-28');
previewSection = previewSection.replace(/w-full sm:w-64/g, 'w-64');

content = before + previewSection + after;

// Replace main container class
content = content.replace(
  'id="invoice-preview-container" className="bg-white border md:border-2 border-slate-400 p-6 md:p-8 rounded-lg shadow-xl print-full-width text-slate-900 w-full max-w-[850px] relative font-sans leading-relaxed"',
  'id="invoice-preview-container" className="bg-white border-2 border-slate-300 p-8 rounded-lg shadow-xl shrink-0 text-slate-900 mx-auto relative font-sans leading-relaxed print-full-width container-no-scale"'
);

// We should style w-[800px] using an inline style to ensure tailwind parser and html2pdf doesn't strip it
content = content.replace(
  'id="invoice-preview-container"',
  'style={{ minWidth: "800px", width: "800px", maxWidth: "800px" }}\n            id="invoice-preview-container"'
);

// Wrap in overflow-x div
content = content.replace(
  '<div style={{ minWidth',
  '<div className="w-full overflow-x-auto no-scrollbar pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 flex justify-start sm:justify-center"><div style={{ minWidth'
);

content = content.replace(
  '<span className="text-9xl font-black rotate-45 select-none tracking-widest text-[#1e3a8a]">OPTIONPLUS</span>\n            </div>\n\n          </div>',
  '<span className="text-9xl font-black rotate-45 select-none tracking-widest text-[#1e3a8a]">OPTIONPLUS</span>\n            </div>\n\n          </div></div>'
);

fs.writeFileSync('src/App.tsx', content);
