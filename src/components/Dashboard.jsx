import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const INITIAL_PAPERS_DATA = [
  { id: 1, name: "HQ-001", marks: 68, type: "Pure Maths" },
  { id: 2, name: "HQ-002", marks: 72, type: "Applied Maths" },
  { id: 3, name: "HQ-003", marks: 64, type: "Pure Maths" },
  { id: 4, name: "HQ-004", marks: 78, type: "Applied Maths" },
  { id: 5, name: "HQ-005", marks: 85, type: "Pure Maths" },
  { id: 6, name: "HQ-006", marks: 81, type: "Applied Maths" },
  { id: 7, name: "HQ-007", marks: 92, type: "Pure Maths" },
  { id: 8, name: "HQ-008", marks: 88, type: "Applied Maths" },
];

export default function Dashboard({ student }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [rangeFilter, setRangeFilter] = useState('ALL');
  const [visibleRows, setVisibleRows] = useState(5);

  const greetingMessage = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const processedData = useMemo(() => {
    let filtered = INITIAL_PAPERS_DATA.map((item, index) => {
      let trendArrow = null;
      let trendText = '';
      let isPositive = true;

      for (let i = index - 1; i >= 0; i--) {
        if (INITIAL_PAPERS_DATA[i].type === item.type) {
          const diff = item.marks - INITIAL_PAPERS_DATA[i].marks;
          if (diff > 0) {
            trendArrow = '↑';
            trendText = `+${diff}%`;
            isPositive = true;
          } else if (diff < 0) {
            trendArrow = '↓';
            trendText = `${diff}%`;
            isPositive = false;
          } else {
            trendArrow = '→';
            trendText = '0%';
            isPositive = true;
          }
          break;
        }
      }

      return { ...item, trendArrow, trendText, isPositive };
    });

    if (subjectFilter === 'PURE') {
      filtered = filtered.filter(p => p.type === 'Pure Maths');
    } else if (subjectFilter === 'APPLIED') {
      filtered = filtered.filter(p => p.type === 'Applied Maths');
    }

    if (rangeFilter === '10') {
      filtered = filtered.slice(-10);
    }

    return filtered;
  }, [subjectFilter, rangeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {greetingMessage}, {student?.name || 'Student'}! 👋
            </h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              HQ-Oversight Advanced Level Control Center
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Performance Dashboard
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'resources' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resource Bank (Free)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Progression Analysis Matrix</h3>
                  <p className="text-sm font-medium text-slate-500">Track and isolate growth vectors across metrics</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold border border-slate-200">
                    <button onClick={() => setSubjectFilter('ALL')} className={`px-3 py-1 rounded-md cursor-pointer transition-all ${subjectFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>All Papers</button>
                    <button onClick={() => setSubjectFilter('PURE')} className={`px-3 py-1 rounded-md cursor-pointer transition-all ${subjectFilter === 'PURE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}>Pure Maths</button>
                    <button onClick={() => setSubjectFilter('APPLIED')} className={`px-3 py-1 rounded-md cursor-pointer transition-all ${subjectFilter === 'APPLIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}>Applied</button>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold border border-slate-200">
                    <button onClick={() => setRangeFilter('10')} className={`px-3 py-1 rounded-md cursor-pointer transition-all ${rangeFilter === '10' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>Last 10</button>
                    <button onClick={() => setRangeFilter('ALL')} className={`px-3 py-1 rounded-md cursor-pointer transition-all ${rangeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>View All</button>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontFamily: 'sans-serif' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                      labelStyle={{ fontWeight: 'black', color: '#fff', paddingBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="marks" stroke={subjectFilter === 'APPLIED' ? '#10b981' : '#2563eb'} strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">Comprehensive Exam Matrix</h3>
                <p className="text-sm font-medium text-slate-500">Historical marks audit trail with dynamic delta trend tracking</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-500 tracking-wider">Paper Reference</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-500 tracking-wider">Classification</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-500 tracking-wider">Score Obtained</th>
                      <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-500 tracking-wider">Delta Trend Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {processedData.slice(0, visibleRows).map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{paper.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            paper.type === 'Pure Maths' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {paper.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-800">{paper.marks}%</td>
                        <td className="px-6 py-4">
                          {paper.trendText ? (
                            <span className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded-md text-xs ${
                              paper.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              <span>{paper.trendArrow}</span>
                              <span>{paper.trendText}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 italic">Baseline Anchor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleRows < processedData.length && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setVisibleRows(prev => prev + 5)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Load More Evaluation Records ↓
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
              <h2 className="text-xl font-black">Open Evaluation Resource Portal</h2>
              <p className="text-sm opacity-80 mt-1 font-medium">Download complete HQ examination model problem papers and step-by-step descriptive solutions without boundaries.</p>
            </div>

            <div className="grid gap-4">
              {INITIAL_PAPERS_DATA.map((paper) => (
                <div key={paper.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{paper.name} Examination Module</h4>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        paper.type === 'Pure Maths' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {paper.type}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-400">Archival Type: Standard PDF Document Asset Structure</p>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => alert(`Downloading Question Structure Sheet for ${paper.name}`)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 cursor-pointer"
                    >
                      📥 Download Paper
                    </button>
                    <button 
                      onClick={() => alert(`Downloading Scoring Verification Scheme for ${paper.name}`)}
                      className="flex-1 sm:flex-none text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      📝 Marking Scheme
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}