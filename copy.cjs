const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const editorContent = content.replace('export default function App(', 'export function Editor({ initialInvoice, onSave, onCancel }: { initialInvoice: any, onSave: (i: any) => void, onCancel: () => void }) ');
fs.writeFileSync('src/components/Editor.tsx', editorContent);
console.log('Done');
