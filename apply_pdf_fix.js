import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const startIndex = content.indexOf('id="invoice-preview-container"');
// Find the closing div of invoice-preview-container
// "PORSCHE  •  MERCEDES-BENZ  •  BMW  •  AUDI  •  VOLKSWAGEN\n            </div>\n\n          </div>"
const endIndex = content.indexOf('</section>', startIndex);

let before = content.slice(0, startIndex);
let previewSection = content.slice(startIndex, endIndex);
let after = content.slice(endIndex);

// Strip all responsive breakpoints to force a desktop layout structure exactly at 800px width.
previewSection = previewSection.replace(/sm:flex-row/g, '');
previewSection = previewSection.replace(/sm:grid-cols-2/g, '');
previewSection = previewSection.replace(/sm:w-auto/g, '');
previewSection = previewSection.replace(/sm:text-left/g, '');
previewSection = previewSection.replace(/sm:justify-end/g, '');
previewSection = previewSection.replace(/sm:text-xs/g, '');
previewSection = previewSection.replace(/sm:text-sm/g, '');
previewSection = previewSection.replace(/sm:py-2\.5/g, '');
previewSection = previewSection.replace(/sm:px-3/g, '');
previewSection = previewSection.replace(/sm:py-3/g, '');
previewSection = previewSection.replace(/sm:w-12/g, '');
previewSection = previewSection.replace(/sm:w-16/g, '');
previewSection = previewSection.replace(/sm:w-24/g, '');
previewSection = previewSection.replace(/sm:w-28/g, '');
previewSection = previewSection.replace(/sm:w-64/g, '');
previewSection = previewSection.replace(/sm:text-\[9px\]/g, '');
previewSection = previewSection.replace(/sm:text-\[8px\]/g, '');

content = before + previewSection + after;

// Replace main container class
content = content.replace(
  'id="invoice-preview-container" className="bg-white border md:border-2 border-slate-400 p-6 md:p-8 rounded-lg shadow-xl print-full-width text-slate-900 w-full max-w-[850px] relative font-sans leading-relaxed"',
  'style={{ minWidth: "800px", maxWidth: "800px", width: "800px" }} id="invoice-preview-container" className="bg-white border md:border-2 border-slate-400 p-8 rounded-lg shadow-xl text-slate-900 mx-auto relative font-sans leading-relaxed shrink-0 scale-[0.45] origin-top md:scale-100"'
);

// Wrap in overflow handling container to allow mobile panning if they don't want scale
// Actually I'll use scale on mobile so it looks like a preview thumbnail, but when printed, it's captured at exactly 800px!

content = content.replace(
  '<section className={`w-full flex flex-col items-center print-full-width ${activeTab === \'preview\' || (activeTab === \'editor\' && window.innerWidth >= 768) ? \'block\' : \'hidden\'}`}>',
  '<section className={`w-full print-full-width ${activeTab === \'preview\' || (activeTab === \'editor\' && window.innerWidth >= 768) ? \'block\' : \'hidden\'}`}>\n          <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar pb-12 flex justify-start md:justify-center px-4 md:px-0">'
);

content = content.replace(
  'PORSCHE  •  MERCEDES-BENZ  •  BMW  •  AUDI  •  VOLKSWAGEN\n            </div>\n\n          </div>\n        </section>',
  'PORSCHE  •  MERCEDES-BENZ  •  BMW  •  AUDI  •  VOLKSWAGEN\n            </div>\n\n          </div>\n          </div>\n        </section>'
);


fs.writeFileSync('src/App.tsx', content);
console.log('Fixed PDF CSS');
