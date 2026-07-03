import React from 'react';

export default function AdminUploadScheme({
  paperNumber,
  setPaperNumber,
  paperTitle,
  setPaperTitle,
  mFile,
  setMFile,
  mFileInputRef,
  onSubmit
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-2xl mx-auto">
      <h3 className="text-lg font-black text-slate-900 mb-1">🔑 Deploy Secure Reference Marking Scheme</h3>
      <form onSubmit={(e) => onSubmit(e, 'scheme')} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Target Code</label>
            <input 
              type="text" 
              placeholder="e.g. HQ 1" 
              value={paperNumber} 
              onChange={e => setPaperNumber(e.target.value)} 
              required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" 
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Core Paper Title</label>
            <input 
              type="text" 
              placeholder="e.g. Pure Vectors Complex Equation Layout" 
              value={paperTitle} 
              onChange={e => setPaperTitle(e.target.value)} 
              required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" 
            />
          </div>
        </div>
        <div className="border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center">
          <label className="block text-xs font-bold text-slate-600 cursor-pointer">
            🔑 Select Marking Scheme PDF
            <input 
              type="file" 
              accept=".pdf" 
              ref={mFileInputRef} 
              onChange={e => setMFile(e.target.files[0])} 
              required 
              className="hidden" 
            />
            <span className="block text-[11px] text-blue-600 font-mono mt-1">
              {mFile ? `✔️ Ready: ${mFile.name}` : 'Drop target validation layout'}
            </span>
          </label>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors">
          Commit Marking Scheme File
        </button>
      </form>
    </div>
  );
}