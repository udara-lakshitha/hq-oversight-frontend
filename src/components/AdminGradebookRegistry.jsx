import React from 'react';

export default function AdminGradebookRegistry({
  filterStudent,
  setFilterStudent,
  filterPaper,
  setFilterPaper,
  filteredGradebook
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
      <h3 className="text-md font-black text-slate-900">📊 Global Evaluation Registry Grid Ledger</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <input 
          type="text" 
          placeholder="🔎 Search by student name..." 
          value={filterStudent} 
          onChange={e => setFilterStudent(e.target.value)} 
          className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none" 
        />
        <input 
          type="text" 
          placeholder="📄 Search by paper configuration code..." 
          value={filterPaper} 
          onChange={e => setFilterPaper(e.target.value)} 
          className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none" 
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
              <th className="py-2 px-2">Student Name</th>
              <th className="py-2 px-2">Paper Number</th>
              <th className="py-2 px-2">Operational Title</th>
              <th className="py-2 px-2 text-center">Score Grade</th>
              <th className="py-2 px-2 text-right">Grading Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredGradebook.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-slate-400 italic">
                  No evaluated entries found matching parameters.
                </td>
              </tr>
            ) : (
              filteredGradebook.map((record, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-2 font-bold text-slate-900">{record.student_name}</td>
                  <td className="py-2.5 px-2 text-blue-600 font-bold">{record.paper_number}</td>
                  <td className="py-2.5 px-2 text-slate-600">{record.paper_title}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                      {record.marks}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-400">{record.graded_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}