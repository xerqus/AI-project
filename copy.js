const fs = require('fs');
fs.copyFileSync('src/App.tsx', 'src/components/Editor.tsx');
console.log('Copied successfully');
