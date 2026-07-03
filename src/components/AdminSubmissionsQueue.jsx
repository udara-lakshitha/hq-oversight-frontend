import React from 'react';

export default function AdminSubmissionsQueue({
  pendingSubmissions,
  selectedSubmission,
  setSelectedSubmission,
  assignedMark,
  setAssignedMark,
  feedbackFile,
  setFeedbackFile,
  onDownloadStudentScript,
  onEvaluationSubmit
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xl">
        <h3 className="text-md font-black text-slate-900 mb-1">📥 Pending Workspace Directory Queue</h3>
        {pendingSubmissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic border border-slate-200 border-dashed rounded-xl">
            No active un-evaluated answer traces found.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                <th className="py-2">Paper Code</th>
                <th className="py-2">Student Entity Profile</th>
                <th className="py-2 text-right">Evaluation Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pendingSubmissions.map((sub) => (
                <tr key={sub.submission_id}>
                  <td className="py-3 font-black text-blue-600">{sub.paper_number}</td>
                  <td className="py-3 font-medium">{sub.student_name}</td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={() => setSelectedSubmission(sub)} 
                      className="bg-blue-600 text-white px-3 py-1 font-bold rounded-md text-[11px] cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      Grade Script
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="lg:col-span-1">
        {selectedSubmission ? (
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 shadow-xl space-y-4">
            <div>
              <h4 className="text-sm font-black text-slate-900">Grading Node: {selectedSubmission.student_name}</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 break-all">{selectedSubmission.filename}</p>
            </div>

            <button 
              type="button"
              onClick={() => onDownloadStudentScript(selectedSubmission.filename)}
              className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer block"
            >
              📥 Download Student Answer Script
            </button>

            <form onSubmit={onEvaluationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Score Mark Allocation (0-100)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={assignedMark} 
                  onChange={e => setAssignedMark(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none font-bold text-slate-800" 
                />
              </div>

              <div className="border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 text-center">
                <label className="block font-bold text-slate-600 cursor-pointer">
                  📎 Upload Evaluated Feedback PDF
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={e => setFeedbackFile(e.target.files[0])} 
                    required 
                    className="hidden" 
                  />
                  <span className="block text-[10px] text-blue-600 font-mono mt-1.5">
                    {feedbackFile ? `✔️ Ready: ${feedbackFile.name}` : 'Drop verified feedback markup sheet'}
                  </span>
                </label>
              </div>

              <div className="flex gap-1.5 pt-1">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 font-bold rounded-lg cursor-pointer transition-colors">
                  Save Evaluation
                </button>
                <button 
                  type="button" 
                  onClick={() => { setSelectedSubmission(null); setFeedbackFile(null); setAssignedMark(''); }} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            Select an item to evaluate.
          </div>
        )}
      </div>
    </div>
  );
}