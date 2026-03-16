import re

files_to_update = [
    {
        'filepath': '/home/gpecxdev/projeto/plataforma-cursos/src/app/dashboard-teacher/students/page.tsx',
        'replacements': [
            (r'bg-\[\#F4F7F9\] min-h-screen text-slate-800 border-t border-slate-100', r'bg-[var(--background-color)] min-h-screen text-white/90 border-t border-white/5'),
            (r'text-slate-800 uppercase', r'text-white uppercase'),
            (r'text-slate-800">', r'text-white">'),
            (r'text-slate-500 mt-1', r'text-white/60 mt-1'),
            (r'bg-slate-50 border border-slate-100', r'bg-white/5 border border-white/10'),
            (r'text-slate-700 focus:border-\[\#00C402\]', r'text-white focus:border-[#00C402] placeholder:text-white/30'),
            (r'bg-white border border-slate-100', r'bg-white/5 border border-white/10'),
            (r'border-b border-slate-50 text-\[10px\] font-black uppercase tracking-\[0.2em\] text-slate-400', r'border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/50'),
            (r'border-b border-slate-50 hover:bg-slate-50/50', r'border-b border-white/5 hover:bg-white/5'),
            (r'bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200', r'bg-white/10 flex items-center justify-center font-bold text-white border border-white/20'),
            (r'text-slate-900', r'text-white'),
            (r'text-slate-500 text-xs font-medium', r'text-white/60 text-xs font-medium'),
            (r'bg-slate-50 rounded-full text-\[9px\] font-black border border-slate-100 text-\[\#00C402\]', r'bg-[#00C402]/10 rounded-full text-[9px] font-black border border-[#00C402]/20 text-[#00C402]'),
            (r'text-slate-400 uppercase font-bold', r'text-white/40 uppercase font-bold'),
            (r'border border-slate-100 bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50', r'border border-white/10 bg-black/20 text-white/40 hover:text-white hover:bg-white/10'),
            (r'text-slate-300 italic font-medium', r'text-white/30 italic font-medium'),
            (r'text-slate-400', r'text-white/40'),
            (r'bg-white border border-slate-100 rounded-2xl p-20 text-center shadow-sm', r'bg-white/5 border border-white/10 rounded-2xl p-20 text-center shadow-sm backdrop-blur-md'),
        ]
    },
    {
        'filepath': '/home/gpecxdev/projeto/plataforma-cursos/src/app/dashboard-teacher/chat/page.tsx',
        'replacements': [
            (r'bg-\[\#F8FAFC\]', r'bg-[var(--background-color)]'),
            (r'bg-white border-2 border-slate-100 rounded-2xl hover:border-black text-black', r'bg-white/5 border-2 border-white/10 rounded-2xl hover:border-[#00C402] text-white hover:text-[#00C402]'),
            (r'text-black">', r'text-white">'),
            (r'text-black mt-0.5', r'text-white/60 mt-0.5'),
            (r'text-black px-2 mb-1', r'text-white/80 px-2 mb-1'),
            (r'bg-white border-black shadow-md ring-1 ring-black/5', r'bg-white/10 border-[#00C402] shadow-md ring-1 ring-[#00C402]/20'),
            (r'bg-white/50 border-slate-100 hover:border-black/20', r'bg-transparent border-white/5 hover:border-white/20'),
            (r'bg-black text-white', r'bg-[#00C402] text-black'),
            (r'bg-slate-100 text-black', r'bg-white/10 text-white border border-white/10'),
            (r'text-slate-900', r'text-white/80'),
            (r'text-slate-500 truncate mt-1 italic', r'text-white/50 truncate mt-1 italic'),
            (r'bg-white border-2 border-slate-100 rounded-\[32px\]', r'bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md'),
            (r'border-b-2 border-slate-50 bg-slate-50/10', r'border-b border-white/10 bg-black/20'),
            (r'bg-black flex items-center justify-center text-white', r'bg-[#00C402] flex items-center justify-center text-black'),
            (r'text-slate-400', r'text-white/40'),
            (r'border-2 border-black/5', r'border border-white/10'),
            (r'bg-white/50 custom-scrollbar', r'bg-transparent custom-scrollbar'),
            (r'bg-slate-100 text-black border border-slate-200', r'bg-white/10 text-white border border-white/20'),
            (r'bg-slate-50 border-2 border-slate-100 text-black rounded-tl-none', r'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'),
            (r'bg-black text-white rounded-tr-none', r'bg-[#00C402] text-black rounded-tr-none shadow-[#00C402]/20'),
            (r'text-slate-500 px-2', r'text-white/40 px-2'),
            (r'border-t-2 border-slate-50 bg-slate-50/30', r'border-t border-white/10 bg-black/20'),
            (r'text-black hover:scale-110', r'text-white/70 hover:text-white hover:scale-110'),
            (r'bg-white border-2 border-slate-100 focus-within:border-black', r'bg-white/5 border border-white/10 focus-within:border-[#00C402]'),
            (r'text-black placeholder:text-slate-300', r'text-white placeholder:text-white/30'),
            (r'bg-black text-white rounded-2xl flex items-center justify-center hover:bg-\[\#00C402\]', r'bg-[#00C402] text-black rounded-2xl flex items-center justify-center hover:bg-[#00C402]/80'),
            (r'background: #E2E8F0', r'background: rgba(255,255,255,0.1)'),
            (r'background: #CBD5E0', r'background: rgba(255,255,255,0.2)'),
        ]
    }
]

for file_info in files_to_update:
    filepath: str = str(file_info['filepath'])
    with open(filepath, 'r') as f:
        content = f.read()
    
    for pat, repl in file_info['replacements']:
        content = re.sub(pat, repl, content)
        
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Multiple files modified.")
