import re

filepath = '/home/gpecxdev/projeto/plataforma-cursos/src/app/dashboard-teacher/courses/new/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

replacements = [
    (r'bg-\[\#F4F7F9\] text-slate-800 p-8 md:p-12 font-exo border-t border-slate-100', r'bg-[var(--background-color)] text-white/90 p-8 md:p-12 font-exo border-t border-white/5'),
    (r'text-black mt-2 text-\[10px\] font-bold', r'text-white/60 mt-2 text-[10px] font-bold'),
    (r'text-black hover:text-slate-800 transition group bg-white border border-slate-100', r'text-white hover:text-[#00C402] transition group bg-white/5 border border-white/10'),
    (r'bg-slate-100 -translate-y-1/2 -z-10', r'bg-white/10 -translate-y-1/2 -z-10'),
    (r"bg-slate-900 text-white border-slate-900", r"bg-white/10 text-white border-white/20"),
    (r"!isActive && !isCompleted \? 'bg-white text-slate-300'", r"!isActive && !isCompleted ? 'bg-white/5 text-white/40'"),
    (r"text-black`}>\n\s*\{step.name", r"text-white/70`}>\n                                    {step.name"),
    (r"bg-white border border-slate-100 rounded-\[48px\]", r"bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-md"),
    (r'text-black px-1">Capa', r'text-white/90 px-1">Capa'),
    (r'border-slate-100 hover:border-\[\#00C402\]/30 transition-all duration-500 bg-slate-50/50', r'border-white/10 hover:border-[#00C402]/50 transition-all duration-500 bg-white/5'),
    (r'bg-white border-white text-slate-900', r'bg-black/50 border-white/20 text-white hover:bg-black/70'),
    (r'text-black animate-pulse">', r'text-white/70 animate-pulse">'),
    (r'text-slate-200 mb-6 group-hover', r'text-white/20 mb-6 group-hover'),
    (r'text-black">Clique para subir a capa', r'text-white/70">Clique para subir a capa'),
    (r'text-slate-600 mt-2 font-bold', r'text-white/40 mt-2 font-bold'),
    (r'text-\[10px\] font-black uppercase tracking-widest text-black px-1', r'text-[10px] font-black uppercase tracking-widest text-white/90 px-1'),
    (r'bg-slate-50 border-slate-100 focus:border-\[\#00C402\] focus:ring-\[\#00C402\] h-14 rounded-2xl text-sm font-medium transition-all text-black', r'bg-white/5 border-white/10 focus:border-[#00C402] focus:ring-[#00C402] h-14 rounded-2xl text-sm font-medium transition-all text-white placeholder:text-white/30'),
    (r'w-full bg-slate-50 border border-slate-100 rounded-2xl', r'w-full bg-white/5 border border-white/10 text-white rounded-2xl'),
    (r'bg-slate-50 border-slate-100 focus:border-\[\#00C402\] h-14 rounded-2xl text-sm font-medium transition-all text-black', r'bg-white/5 border-white/10 focus:border-[#00C402] h-14 rounded-2xl text-sm font-medium transition-all text-white placeholder:text-white/30'),
    (r'bg-slate-50 border border-slate-100 rounded-\[32px\] p-6 min-h-\[180px\] focus:border-\[\#00C402\] focus:ring-4 focus:ring-\[\#00C402\]/5 outline-none text-sm font-medium transition-all leading-relaxed text-black', r'bg-white/5 border border-white/10 rounded-[32px] p-6 min-h-[180px] focus:border-[#00C402] focus:ring-4 focus:ring-[#00C402]/5 outline-none text-sm font-medium transition-all leading-relaxed text-white placeholder:text-white/30'),
    (r'border-b border-slate-100', r'border-b border-white/10'),
    (r'text-slate-500 font-bold', r'text-white/50 font-bold'),
    (r'text-slate-400 px-1', r'text-white/50 px-1'),
    (r'border-slate-100 bg-slate-50/50 hover:border-slate-200', r'border-white/10 bg-white/5 hover:border-white/20 text-white/50'),
    (r'text-slate-400 hover:text-slate-900', r'text-white/40 hover:text-white'),
    (r'text-slate-200 mb-3', r'text-white/20 mb-3'),
    (r'text-black">SUBIR MP4', r'text-white/70">SUBIR MP4'),
    (r'text-slate-400 mt-2', r'text-white/40 mt-2'),
    (r'bg-slate-50/50 border border-slate-100', r'bg-white/5 border border-white/10'),
    (r'bg-white border-slate-100 focus:border-\[\#00C402\] h-12 rounded-xl text-xs', r'bg-black/20 border-white/10 focus:border-[#00C402] h-12 rounded-xl text-xs text-white placeholder:text-white/30'),
    (r'text-slate-400 font-bold', r'text-white/40 font-bold'),
    (r'text-black font-black text-2xl group-focus-within', r'text-white font-black text-2xl group-focus-within'),
    (r'bg-slate-50 border-slate-100 focus:border-\[\#00C402\] focus:ring-\[\#00C402\] focus:ring-8 focus:ring-\[\#00C402\]/5 h-24 pl-16 rounded-\[40px\] text-4xl font-black text-slate-900', r'bg-white/5 border-white/10 focus:border-[#00C402] focus:ring-[#00C402] focus:ring-8 focus:ring-[#00C402]/5 h-24 pl-16 rounded-[40px] text-4xl font-black text-white'),
    (r'text-black font-bold uppercase tracking-widest">Defina o valor', r'text-white/60 font-bold uppercase tracking-widest">Defina o valor'),
    (r'bg-slate-50 p-6 rounded-\[32px\] border border-slate-100', r'bg-white/5 p-6 rounded-[32px] border border-white/10'),
    (r'text-slate-800 leading-none"> Grade', r'text-white leading-none"> Grade'),
    (r'text-black font-bold uppercase tracking-\[2px\] mt-2">Organize', r'text-white/60 font-bold uppercase tracking-[2px] mt-2">Organize'),
    (r'bg-slate-900 hover:bg-slate-800 text-white text-\[10px\] font-black uppercase tracking-widest px-8 rounded-2xl h-12 shadow-lg shadow-slate-200', r'bg-[#00C402] hover:bg-[#00C402]/80 text-black text-[10px] font-black uppercase tracking-widest px-8 rounded-2xl h-12 shadow-lg shadow-[#00C402]/20'),
    (r'text-black font-black uppercase text-\[10px\] tracking-\[3px\]">Nenhuma', r'text-white/70 font-black uppercase text-[10px] tracking-[3px]">Nenhuma'),
    (r'text-black text-\[10px\] mt-2 font-medium">CONSTRUA', r'text-white/50 text-[10px] mt-2 font-medium">CONSTRUA'),
    (r'bg-slate-50/30 border border-slate-100 rounded-\[32px\] p-8 hover:border-\[\#00C402\]/20 hover:bg-white', r'bg-white/5 border border-white/10 rounded-[32px] p-8 hover:border-[#00C402]/30 hover:bg-white/10'),
    (r'text-slate-900">', r'text-white">'),
    (r'text-black">ESTÁGIO', r'text-white/60">ESTÁGIO'),
    (r'text-slate-200 hover:text-red-500 hover:bg-red-50', r'text-white/30 hover:text-red-500 hover:bg-white/10'),
    (r'bg-white border-slate-100 focus:border-\[\#00C402\] h-12 rounded-xl text-sm font-medium', r'bg-white/5 border-white/10 focus:border-[#00C402] h-12 rounded-xl text-sm font-medium text-white placeholder:text-white/30'),
    (r"border-slate-100 bg-white hover:border-slate-200", r"border-white/10 bg-black/20 hover:border-white/20"),
    (r'bg-green-50 rounded-full flex items-center justify-center text-green-500', r'bg-[#00C402]/20 rounded-full flex items-center justify-center text-[#00C402]'),
    (r'text-slate-400 hover:text-slate-900 hover:bg-white', r'text-white/40 hover:text-white hover:bg-white/10'),
    (r'bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-\[10px\] tracking-\[4px\] px-12 h-16 rounded-\[24px\] shadow-xl shadow-slate-100 disabled:opacity-10 group', r'bg-[#00C402] text-black hover:bg-[#00C402]/90 font-black uppercase text-[10px] tracking-[4px] px-12 h-16 rounded-[24px] shadow-xl shadow-[#00C402]/20 disabled:opacity-10 group'),
    (r'bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-\[10px\] tracking-\[4px\] px-16 h-16 rounded-\[24px\] shadow-2xl shadow-slate-200 disabled:opacity-10 group', r'bg-[#00C402] text-black hover:bg-[#00C402]/90 font-black uppercase text-[10px] tracking-[4px] px-16 h-16 rounded-[24px] shadow-2xl shadow-[#00C402]/20 disabled:opacity-10 group'),
    (r'text-\[10px\] font-black uppercase tracking-widest text-black block', r'text-[10px] font-black uppercase tracking-widest text-white/90 block'),
]

for pat, repl in replacements:
    content = re.sub(pat, repl, content)

with open(filepath, 'w') as f:
    f.write(content)
print("File modified.")
