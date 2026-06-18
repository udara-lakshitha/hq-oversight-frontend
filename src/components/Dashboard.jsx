import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = 'http://127.0.0.1:8000';

export default function Dashboard({ student }) {
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [rangeFilter, setRangeFilter] = useState('ALL');
  const [visibleRows, setVisibleRows] = useState(5);
  

  const [dbMarks, setDbMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');


  useEffect(() => {
    const fetchStudentMarks = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/marks/student/${student.id}`);
        setDbMarks(response.data);
      } catch (err) {
        console.error("Failed to sync evaluation metrics:", err);
        setErrorMsg('Could not load performance logs from the server.');
      } finally {
        setIsLoading(false);
      }
    };

    if (student?.id) {
      fetchStudentMarks();
    }
  }, [student?.id]);

  const greetingMessage = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const unifiedHistoryData = useMemo(() => {
    const processed = dbMarks.map((item) => {
      const paperDigits = item.paper_number.replace(/^\D+/g, '');
      const isPure = parseInt(paperDigits, 10) % 2 !== 0;

      return {
        id: item.paper_number,
        name: `${item.paper_number} Module`,
        type: isPure ? 'Pure Maths' : 'Applied Maths',
        marks: item.marks,
        created_at: item.created_at
      };
    });

    let sortedData = processed.sort((a, b) => a.id.localeCompare(b.id));

    sortedData = sortedData.map((item, index) => {
      let trendArrow = null;
      let trendText = '';
      let isPositive = true;

      for (let i = index - 1; i >= 0; i--) {
        if (sortedData[i].type === item.type) {
          const diff = item.marks - sortedData[i].marks;
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
      sortedData = sortedData.filter(p => p.type === 'Pure Maths');
    } else if (subjectFilter === 'APPLIED') {
      sortedData = sortedData.filter(p => p.type === 'Applied Maths');
    }

    if (rangeFilter === '5') {
      sortedData = sortedData.slice(-5);
    }

    return sortedData;
  }, [dbMarks, subjectFilter, rangeFilter]);

  const chartValidData = useMemo(() => {
    return unifiedHistoryData.filter(item => item.marks !== null && item.marks !== undefined);
  }, [unifiedHistoryData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      
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

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
            <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>Performance Dashboard</button>
            <button onClick={() => setActiveTab('weekly')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'weekly' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>🗓️ Weekly Tasks</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {isLoading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-400">
                🔄 Syncing comprehensive structural score arrays from database...
              </div>
            ) : errorMsg ? (
              <div className="bg-red-50 p-6 text-center rounded-2xl border border-red-200 text-sm font-bold text-red-700">
                ⚠️ {errorMsg}
              </div>
            ) : dbMarks.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-400">
                📈 No evaluation scores on record yet. Complete your initial exam paper to unlock tracking!
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Progression Vector Analytics</h3>
                      <p className="text-xs font-medium text-slate-400">Isolate parameters and review climbing score curves</p>
                    </div>

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

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartValidData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="hqGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={subjectFilter === 'APPLIED' ? '#10b981' : '#2563eb'} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={subjectFilter === 'APPLIED' ? '#10b981' : '#2563eb'} stopOpacity={0}/>
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
                              {paper.marks}%
                            </td>
                            <td className="px-5 py-3.5">
                              {paper.trendText ? (
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
              </>
            )}
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200/60 shadow-xs">
            <p className="text-sm font-bold text-slate-400">📦 File repository pipelines are paused during active local evaluation sprint testing parameters.</p>
          </div>
        )}
      </main>
    </div>
  );
}