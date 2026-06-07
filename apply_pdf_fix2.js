const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        // Add temporary styles to ensure A4 proportions during capture
        const originalMaxWidth = element.style.maxWidth;
        element.style.maxWidth = '800px';
        element.style.width = '800px';`;

const replacement = `        // Temporarily clear any scaled transform applied by Tailwind
        const originalClasses = element.className;
        element.className = element.className.replace(/scale-\\[0\\.43\\]/g, '').replace(/md:scale-100/g, '');`;

const target2 = `          // Restore original styles
          element.style.maxWidth = originalMaxWidth;
          element.style.width = '';`;

const replacement2 = `          // Restore original styled scaling
          element.className = originalClasses;`;

code = code.replace(target, replacement);
code = code.replace(target2, replacement2);
code = code.replace(target2, replacement2); // it's in there twice

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed js in App.tsx');
