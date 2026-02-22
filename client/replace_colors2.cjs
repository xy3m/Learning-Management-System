const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Balance backgrounds (Green -> Black/Darker)
    // Replace the main harsh dark green background with a dark gray/black
    content = content.replace(/bg-\[#013220\](\s|")/g, 'bg-[#0a0a0a]$1');
    content = content.replace(/bg-\[#013220\]\/40/g, 'bg-black/40');
    content = content.replace(/bg-\[#013220\]\/50/g, 'bg-black/50');
    content = content.replace(/bg-\[#013220\]\/60/g, 'bg-black/60');
    content = content.replace(/bg-\[#013220\]\/20/g, 'bg-black/20');

    // Replace some glass backgrounds and borders to incorporate yellow accents
    content = content.replace(/border-gray-800/g, 'border-yellow-500/20');
    content = content.replace(/border-gray-700/g, 'border-yellow-500/30');

    // 2. Fix the "grey font" visibility
    // Replace placeholders first so they are distinct
    content = content.replace(/placeholder:text-gray-500/g, 'placeholder:text-yellow-100/50');
    content = content.replace(/placeholder:text-gray-600/g, 'placeholder:text-yellow-100/40');

    // Replace other grey texts with bright yellow or light mint for contrast
    content = content.replace(/text-gray-500/g, 'text-yellow-400');
    content = content.replace(/text-gray-600/g, 'text-yellow-200');
    content = content.replace(/text-gray-400/g, 'text-[#D1F2EB]/90');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            replaceInFile(fullPath);
        }
    }
}

traverse(srcDir);
console.log('Color replacement 2 complete.');
