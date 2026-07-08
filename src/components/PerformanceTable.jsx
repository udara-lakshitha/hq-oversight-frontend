import React from 'react';

export default function PerformanceTable({ data, visibleRows }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase">
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Delta Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
            {data.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-5 py-8 text-center font-bold text-slate-400 italic">No score records found on database traces.</td>
              </tr>
            ) : (
              [...data].reverse().slice(0, visibleRows).map((paper) => (
                <tr key={paper.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-black text-slate-900">{paper.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${paper.type === 'Pure Maths' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{paper.type}</span>
                  </td>
                  <td className="px-5 py-3.5 font-black">{paper.marks}%</td>
                  <td className="px-5 py-3.5">
                    {paper.trendText ? (
                      <span className={`px-1.5 py-0.5 rounded ${paper.trendText[0] == "+" ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{paper.trendArrow} {paper.trendText}</span>
                    ) : <span className="text-slate-400 italic">Baseline Entry</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}