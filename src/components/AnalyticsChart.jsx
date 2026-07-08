import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsChart({ data, subjectFilter, setSubjectFilter }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-black text-slate-900">Progression Vector Analytics</h3>
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
          <button onClick={() => setSubjectFilter('ALL')} className={`px-2.5 py-1 rounded-md cursor-pointer ${subjectFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>All</button>
          <button onClick={() => setSubjectFilter('PURE')} className={`px-2.5 py-1 rounded-md cursor-pointer ${subjectFilter === 'PURE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}>Pure</button>
          <button onClick={() => setSubjectFilter('APPLIED')} className={`px-2.5 py-1 rounded-md cursor-pointer ${subjectFilter === 'APPLIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}>Applied</button>
        </div>
      </div>
      <div className="h-60 w-full overflow-x-auto">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No structural historical marks detected for this profile yet.
          </div>
        ) : (
          <div className="h-full min-w-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.filter(i => i.marks !== null)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="id" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip />
                <Area type="monotone" dataKey="marks" stroke="#2563eb" fillOpacity={0.1} fill="#2563eb" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}