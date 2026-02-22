const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Backgrounds & Base
    content = content.replace(/#030712/g, '#013220'); // Dark Evergreen
    content = content.replace(/bg-gray-900/g, 'bg-[#013220]');
    content = content.replace(/bg-black/g, 'bg-[#013220]');
    content = content.replace(/bg-gray-800/g, 'bg-[#0B6E4F]'); // Royal Amethyst for cards
    
    // Gradients & Accents (Indigo -> Emerald Green, Purple -> Royal Amethyst)
    content = content.replace(/indigo-600/g, '[#0B6E4F]'); // Royal Amethyst
    content = content.replace(/indigo-500/g, '[#50C878]'); // Emerald Green
    content = content.replace(/indigo-400/g, '[#50C878]'); // Emerald Green
    content = content.replace(/indigo-300/g, '[#D1F2EB]'); // Mint Whisper
    
    content = content.replace(/purple-600/g, '[#0B6E4F]');
    content = content.replace(/purple-500/g, '[#0B6E4F]');
    content = content.replace(/purple-400/g, '[#50C878]');
    
    // Borders & Rings
    content = content.replace(/border-white\/10/g, 'border-[#50C878]/30');
    content = content.replace(/border-white\/5/g, 'border-[#50C878]/20');
    
    // Text
    content = content.replace(/text-gray-400/g, 'text-[#D1F2EB]/70');
    content = content.replace(/text-gray-300/g, 'text-[#D1F2EB]/90');
    content = content.replace(/text-white/g, 'text-[#D1F2EB]'); 

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
console.log('Color replacement complete.');
