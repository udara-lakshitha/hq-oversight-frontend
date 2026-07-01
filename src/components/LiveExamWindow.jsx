import React, { useState } from 'react';

export default function LiveExamWindow({
  activePaper,
  countdownString,
  loadingExams,
  errorMsg,
  MOCK_LIVE_MODE = false,
  qFile,
  setQFile,
  handleAnswerUploadSubmit,
  handleDownloadPaper
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith('.pdf') || droppedFile.type === 'application/pdf') {
        setQFile(droppedFile);
      } else {
        alert("❌ Invalid File: Please drop a valid PDF script document.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-5">
      
      <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className={`border text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${(activePaper || MOCK_LIVE_MODE) ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {(activePaper || MOCK_LIVE_MODE) ? '🔴 Active Exam Session' : '🔒 Portal Locked'}
          </span>
          <h3 className="text-lg font-black text-slate-900 mt-2">Synchronized Examination Gate</h3>
        </div>
        <div className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-black font-mono shadow-xs animate-pulse">
          {countdownString}
        </div>
      </div>

      {loadingExams ? (
        <div className="text-center font-bold text-slate-500 py-12">Synchronizing state tracking routes...</div>
      ) : errorMsg && !MOCK_LIVE_MODE ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm font-black text-slate-700">🔒 Gate Status: {errorMsg}</p>
        </div>
      ) : (activePaper || MOCK_LIVE_MODE) ? (
        <div className="flex flex-col gap-4">

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase font-mono tracking-wider">
                {activePaper?.paper_type || 'Standard Module'}
              </span>
              <h4 className="text-md font-black text-slate-900">
                {activePaper?.paper_number || 'HQ Current'}: {activePaper?.title || 'Active Dynamic Examination Sheet'}
              </h4>
            </div>
            <button 
              onClick={() => handleDownloadPaper(activePaper?.id || 1, activePaper?.title || 'Paper')} 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              📥 Download Question Sheet
            </button>
          </div>

          {/* BOTTOM PANEL: EXPANDED FULL-WIDTH SUBMISSION DROP ZONE */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <form onSubmit={(e) => handleAnswerUploadSubmit(e, activePaper?.id || 1)} className="space-y-4">
              
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 bg-white flex flex-col items-center justify-center min-h-[160px] cursor-pointer block select-none ${
                  isDragging ? 'border-blue-500 bg-blue-50/40 scale-[0.99]' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input 
                  type="file" 
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setQFile(e.target.files[0]); // 🎯 Updated reference
                    }
                  }} 
                  className="hidden" 
                />
                
                <div className="space-y-2 pointer-events-none">
                  <div className="text-2xl">📁</div>
                  <p className="text-xs font-black text-slate-700">
                    Drag & Drop your completed answer script here
                  </p>
                  <p className="text-[11px] font-bold text-slate-400">
                    or click to browse your storage directory
                  </p>
                </div>

                {qFile && (
                  <div 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQFile(null);
                    }}
                    className="mt-4 z-20 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-xs hover:bg-emerald-100/70 transition-colors"
                  >
                    <span>📄 {qFile.name}</span>
                    <span className="text-emerald-600 font-sans font-black ml-1 text-xs">✕</span>
                  </div>
                )}
              </label>

              <button 
                type="submit" 
                disabled={!qFile}
                className={`w-full py-3 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-sm ${
                  qFile
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                🚀 Transmit Answer Sheet For Evaluation
              </button>
            </form>
          </div>

        </div>
      ) : null}
    </div>
  );
}