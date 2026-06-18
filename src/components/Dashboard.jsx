import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 1. Weekly Active Evaluation Modules (Your 2 fresh weekly releases)
const WEEKLY_PAPERS_DATA = [
  { id: "HQ-008", name: "HQ-008 Module", type: "Pure Maths", uploadedDate: "2026-06-15", deadlineDate: "2026-06-22", marks: null, submittedFile: null },
  { id: "HQ-007", name: "HQ-007 Module", type: "Applied Maths", uploadedDate: "2026-06-12", deadlineDate: "2026-06-19", marks: 78, submittedFile: "applied_answers_v1.pdf" },
];

// 2. Permanent Archival Vault of PREVIOUS Weeks' HQ Papers & Solutions
const PAST_HQ_PAPERS_DATA = [
  { id: "HQ-006", name: "HQ-006 Module", type: "Applied Maths", marks: 82 },
  { id: "HQ-005", name: "HQ-005 Module", type: "Pure Maths", marks: null }, 
  { id: "HQ-004", name: "HQ-004 Module", type: "Applied Maths", marks: 90 },
  { id: "HQ-003", name: "HQ-003 Module", type: "Pure Maths", marks: 64 },
  { id: "HQ-002", name: "HQ-002 Module", type: "Applied Maths", marks: 70 },
  { id: "HQ-001", name: "HQ-001 Module", type: "Pure Maths", marks: 75 },
];

export default function Dashboard({ student }) {
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [rangeFilter, setRangeFilter] = useState('ALL');
  const [visibleRows, setVisibleRows] = useState(5);
  const [weeklyData, setWeeklyData] = useState(WEEKLY_PAPERS_DATA);

  // Dynamic greeting framework based on hours
  const greetingMessage = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Combine all scores chronologically (HQ-001 up to HQ-008) to drive the chart and history table
  const unifiedHistoryData = useMemo(() => {
    const allCombined = [
      ...PAST_HQ_PAPERS_DATA,
      ...weeklyData
    ].sort((a, b) => a.id.localeCompare(b.id)); // Ensures ascending chronological order

    let processed = allCombined.map((item, index) => {
      let trendArrow = null;
      let trendText = '';
      let isPositive = true;

      if (item.marks === null || item.marks === undefined) {
        return { ...item, trendArrow, trendText, isPositive };
      }

      // Look back to find the previous exam of the EXACT same subject classification that has a score
      for (let i = index - 1; i >= 0; i--) {
        if (allCombined[i].type === item.type && allCombined[i].marks !== null) {
          const diff = item.marks - allCombined[i].marks;
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

    // Apply Subject Filters
    if (subjectFilter === 'PURE') {
      processed = processed.filter(p => p.type === 'Pure Maths');
    } else if (subjectFilter === 'APPLIED') {
      processed = processed.filter(p => p.type === 'Applied Maths');
    }

    // Apply Window Range Zoom Filters
    if (rangeFilter === '5') {
      processed = processed.slice(-5);
    }

    return processed;
  }, [subjectFilter, rangeFilter, weeklyData]);

  // Exclude null/unsubmitted items for the clean Area Chart line plot
  const chartValidData = useMemo(() => {
    return unifiedHistoryData.filter(item => item.marks !== null && item.marks !== undefined);
  }, [unifiedHistoryData]);

  const handleFileUpload = (id) => {
    setWeeklyData(prev => prev.map(item => {
      if (item.id === id) {
        alert(`Successfully uploaded answer sheet script for ${item.name}! Awaiting review.`);
        return { ...item, submittedFile: "student_submission.pdf" };
      }
      return item;
    }));
  };

  const checkIsExpired = (deadlineStr) => {
    return new Date() > new Date(deadlineStr);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      
      {/* SYSTEM TOP GLOBAL HEAD NAVIGATION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {greetingMessage}, {student?.name || 'Student'}! 🎓
            </h1>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">
              HQ-Oversight Control Module
            </p>
          </div>

          {/* Three View Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
            <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>Performance Dashboard</button>
            <button onClick={() => setActiveTab('weekly')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'weekly' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>🗓️ Weekly Tasks</button>
            <button onClick={() => setActiveTab('past-papers')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'past-papers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>📚 Past HQ Vault</button>
          </div>
        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* VIEW 1: DYNAMIC ANALYTICS VIEW PORTAL */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* AREA CHART CONTAINER */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Progression Vector Analytics</h3>
                  <p className="text-xs font-medium text-slate-400">Isolate parameters and review climbing score curves</p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                    <button onClick={() => setSubjectFilter('ALL')} className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${subjectFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>All</button>
                    <button onClick={() => setSubjectFilter('PURE')} className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${subjectFilter === 'PURE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}>Pure</button>
                    <button onClick={() => setSubjectFilter('APPLIED')} className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${subjectFilter === 'APPLIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}>Applied</button>
                  </div>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                    <button onClick={() => setRangeFilter('5')} className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${rangeFilter === '5' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>Last 5</button>
                    <button onClick={() => setRangeFilter('ALL')} className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${rangeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>All</button>
                  </div>
                </div>
              </div>

              {/* RECHARTS PLOT GENERATOR */}
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartValidData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="id" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="marks" stroke={subjectFilter === 'APPLIED' ? '#10b981' : '#2563eb'} strokeWidth={2.5} fillOpacity={1} fill="url(#hqGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* INTEGRATED MARKS TABLE RECORD MATRIX */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">Comprehensive Exam Matrix</h3>
                <p className="text-xs font-medium text-slate-400">Live evaluation audit tracking with auto-calculated delta trends</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Delta Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                    {[...unifiedHistoryData].reverse().slice(0, visibleRows).map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-black text-slate-900">{paper.name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${paper.type === 'Pure Maths' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{paper.type}</span>
                        </td>
                        <td className="px-5 py-3.5 font-black text-slate-800">
                          {paper.marks !== null ? `${paper.marks}%` : <span className="text-slate-400 font-medium italic text-[11px]">Pending Submission</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {paper.marks === null ? (
                            <span className="text-[10px] text-amber-600 font-black">Unattempted ❌</span>
                          ) : paper.trendText ? (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-black ${paper.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {paper.trendArrow} {paper.trendText}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">Baseline Entry</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibleRows < unifiedHistoryData.length && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <button onClick={() => setVisibleRows(p => p + 4)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">Load More Data Lines ↓</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEKLY TASKS */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border-l-4 border-blue-600 border-y border-r border-slate-200/80 shadow-xs">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Weekly Assignment Grid</h2>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Submit your custom evaluation sheet scripts inside the 7-day restriction deadline parameters.</p>
            </div>

            <div className="grid gap-3">
              {weeklyData.map((paper) => {
                const isExpired = checkIsExpired(paper.deadlineDate);
                const hasScore = paper.marks !== null;
                const hasUploaded = paper.submittedFile !== null;

                return (
                  <div key={paper.id} className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{paper.name}</h4>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${paper.type === 'Pure Maths' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{paper.type}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">Deadline Anchor Target: <strong className="text-amber-600">{paper.deadlineDate}</strong></p>
                    </div>

                    {/* FIXED WIDTH BUTTON TRACKS */}
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => alert(`Downloading Questions for ${paper.name}`)} className="w-32 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all border border-slate-200 cursor-pointer">📥 Download Paper</button>
                      
                      {!hasUploaded ? (
                        <button disabled={isExpired} onClick={() => handleFileUpload(paper.id)} className={`w-32 py-1.5 text-xs font-black rounded-lg transition-all border border-dashed cursor-pointer ${isExpired ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"}`}>{isExpired ? "🚫 Closed" : "📤 Upload PDF"}</button>
                      ) : (
                        <span className="w-32 py-1.5 text-center text-xs font-bold text-green-600 bg-green-50 border border-green-100 rounded-lg">✓ Uploaded</span>
                      )}

                      {hasScore ? (
                        <button onClick={() => alert(`Downloading Marking Guide`)} className="w-32 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer">📝 Marking ({paper.marks}%)</button>
                      ) : (
                        <button disabled className="w-32 py-1.5 text-center bg-slate-100 text-slate-400 font-bold text-xs rounded-lg border border-slate-200 cursor-not-allowed opacity-60">🔒 Locked</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: PAST HQ ARCHIVES VAULT */}
        {activeTab === 'past-papers' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border-l-4 border-slate-700 border-y border-r border-slate-200/80 shadow-xs">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Historical Evaluation Vault</h2>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Review papers from prior weeks. Marking keys unlock if a verified historical score exists.</p>
            </div>

            <div className="grid gap-3">
              {PAST_HQ_PAPERS_DATA.map((paper) => {
                const hasScore = paper.marks !== null;

                return (
                  <div key={paper.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{paper.name} Archive</h4>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">{paper.type}</p>
                    </div>

                    {/* FIXED-WIDTH ALIGNED INTERACTION BUTTONS (PREMIUM UNIFORM BLUE) */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => alert(`Downloading Archival Questions`)} className="w-36 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 cursor-pointer">📥 Download Paper</button>
                      
                      {hasScore ? (
                        <button onClick={() => alert(`Downloading marking sheet`)} className="w-36 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer">📝 Scheme ({paper.marks}%)</button>
                      ) : (
                        <button disabled className="w-36 py-1.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-lg border border-slate-200 cursor-not-allowed text-center opacity-60" title="Locked because no historical score exists.">🔒 Scheme Locked</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}