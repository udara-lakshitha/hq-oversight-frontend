import React from 'react';

export default function LiveExamWindow({
  activePaper,
  countdownString,
  loadingExams,
  errorMsg,
  MOCK_LIVE_MODE,
  selectedFile,
  setSelectedFile,
  handleAnswerUploadSubmit,
  handleDownloadPaper
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-4">
      <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
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
        <div className="text-center font-bold text-slate-500 py-8">Synchronizing state tracking routes...</div>
      ) : errorMsg && !MOCK_LIVE_MODE ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-sm font-black text-slate-700">🔒 Gate Status: {errorMsg}</p>
        </div>
      ) : (activePaper || MOCK_LIVE_MODE) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">{activePaper?.paper_type || 'Standard Module'}</span>
              <h4 className="text-md font-bold text-slate-900 mt-2">{activePaper?.paper_number || 'HQ Current'}: {activePaper?.title || 'Active Dynamic Examination Sheet'}</h4>
            </div>
            <button onClick={() => handleDownloadPaper(activePaper?.id || 1, activePaper?.title || 'Paper')} className="mt-4 w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-lg cursor-pointer">📥 Download Question Sheet</button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <form onSubmit={(e) => handleAnswerUploadSubmit(e, activePaper?.id || 1)} className="space-y-3">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-white text-center relative">
                <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <p className="text-xs font-bold text-slate-600">{selectedFile ? `📄 ${selectedFile.name}` : 'Select answer sheet PDF'}</p>
              </div>
              <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer">🚀 Transmit Answer Sheet</button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}