const fs = require('fs');
const path = require('path');

const targetDirs = [
    'src/app/(app)/dashboard-student',
    'src/app/(app)/dashboard-teacher',
    'src/app/admin',
    'src/app/(app)/classroom'
];

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // We want to find className="..."
    // Inside className, if we find 'bg-white', we check if it is a page/section wrapper.
    // Heuristic:
    // IF it has 'min-h-', 'h-screen', 'h-[calc', 'flex-1', 'flex-grow', 'py-16', 'py-24', 'pb-20' etc AND NO 'shadow' or 'rounded' (except maybe rounded-none) -> it's a wrapper.
    // Since Next.js pages often use `min-h-screen`, `h-screen`, `min-h-full`, `h-[calc`, `flex-1` let's target those specifically.
    
    // Simpler heuristic: find bg-white. Replace with bg-[#F5F5F7] ONLY IF it also has min-h-screen, h-screen, min-h-full, h-[calc, flex-1, AND does not have shadow (except shadow-none or shadow-sm)
    // Actually, user said: "Verificar todos os page.tsx e componentes dentro desta pasta. Substituir: bg-white -> bg-[#F5F5F7] (fundo de página)".
    // Let's replace 'bg-white' with 'bg-[#F5F5F7]' if it contains "min-h-" or "h-screen" or "flex-1" or "h-[calc" or "p-8" or "py-".
    // AND NOT "rounded" or "shadow" (unless it's the main page container).
    
    // Let's use a regex to match className strings
    const classNameRegex = /className=["']([^"']*)["']/g;
    const templateStringRegex = /className=\{`([^`]*)`\}/g;
    
    const replaceLogic = (match, p1) => {
        if (!p1.includes('bg-white')) return match;
        
        // Page/section indicators
        const isWrapper = p1.match(/min-h-|h-screen|min-h-full|h-\[calc|flex-1|flex-grow|h-full/);
        // Exclude cards
        const isCard = p1.match(/shadow-(md|lg|xl|2xl)|rounded(-md|-lg|-xl|-2xl|-3xl|-\[|\b)/) && !isWrapper;
        
        // A specific case mentioned: <div className="rounded-xl shadow-md bg-white p-6"> keep bg-white
        if (isCard) return match;
        
        // If it's a wrapper, replace bg-white with bg-[#F5F5F7]
        if (isWrapper || p1.includes('p-4 sm:p-8 md:p-12') || p1.includes('pb-20') || p1.includes('py-16') || p1.includes('py-24') || p1.includes('flex flex-col')) {
            const newClass = p1.replace(/\bbg-white\b/g, 'bg-[#F5F5F7]');
            return match.replace(p1, newClass);
        }
        
        return match;
    };
    
    content = content.replace(classNameRegex, replaceLogic);
    content = content.replace(templateStringRegex, replaceLogic);
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

targetDirs.forEach(dir => traverse(path.join(process.cwd(), dir)));
