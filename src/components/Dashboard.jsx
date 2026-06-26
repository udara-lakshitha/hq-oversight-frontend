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

  const [activePaper, setActivePaper] = useState(null);
  const [pastPapers, setPastPapers] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ success: null, message: '' });

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchStudentMarks = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/marks/student/${student.id}`, {
          headers: getAuthHeader()
        });
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

  useEffect(() => {
    if (activeTab === 'analytics') return;

    const fetchExamData = async () => {
      setLoadingExams(true);
      setErrorMsg('');
      try {
        if (activeTab === 'weekly') {
          setUploadStatus({ success: null, message: '' });
          setSelectedFile(null);
          try {
            const activeRes = await axios.get(`${BACKEND_URL}/api/exams/live-session`, {
              headers: getAuthHeader()
            });
            setActivePaper(activeRes.data);
          } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
              setErrorMsg(err.response.data.detail);
            } else {
              setErrorMsg("Failed to synchronize with live exam stream configuration.");
            }
            setActivePaper(null);
          }
        }

        if (activeTab === 'past-papers') {
          const pastRes = await axios.get(`${BACKEND_URL}/api/marks/past-papers`, {
            headers: getAuthHeader()
          });
          setPastPapers(pastRes.data);
        }
      } catch (err) {
        console.error("Failed to query exam system registries:", err);
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExamData();
  }, [activeTab]);

  const greetingMessage = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const handleDownloadPaper = async (examId, paperTitle) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/exams/stream-paper/${examId}`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `${paperTitle}_Questions.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      alert("Unable to download target question paper resource file. Ensure server asset path settings are valid.");
    }
  };

  const handleDownloadScheme = async (examId, paperTitle) => {
    const hasSubmitted = dbMarks.some(submission => submission.exam_id === examId || submission.id === examId);
    
    if (!hasSubmitted) {
      alert("Access Denied: Marking schemes are reserved exclusively for students who completed and submitted their answer script version first.");
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/marks/stream-scheme/${examId}`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `${paperTitle}_Marking_Scheme.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      alert(err.response?.data?.detail || "Access Denied: Unable to clear verification protocols for this scheme asset.");
    }
  };

  const handleAnswerUploadSubmit = async (e, examId) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ success: false, message: 'Please select a clean PDF file matrix to upload.' });
      return;
    }

    const formPayload = new FormData();
    formPayload.append('file', selectedFile);

    try {
      setUploadStatus({ success: null, message: 'Uploading answer configuration trace...' });
      await axios.post(`${BACKEND_URL}/api/exams/submit-live/${examId}`, formPayload, {
        headers: { 
          ...getAuthHeader(), 
          'Content-Type': 'multipart/form-data' 
        }
      });
      setUploadStatus({ success: true, message: '✅ Submission transmitted successfully! Your marking scheme will unlock once grading parameters clear.' });
      setSelectedFile(null);
      
      const response = await axios.get(`${BACKEND_URL}/api/marks/student/${student.id}`, {
        headers: getAuthHeader()
      });
      setDbMarks(response.data);
    } catch (err) {
      setUploadStatus({
        success: false,
        message: err.response?.data?.detail || 'Transmission failed. Ensure you are within the valid window.'
      });
    }
  };

  const nextExamPrediction = useMemo(() => {
    let maxNum = 0;
    
    const combinedList = [...dbMarks, ...pastPapers];
    if (activePaper) combinedList.push(activePaper);

    combinedList.forEach(p => {
      if (p.paper_number) {
        const extractedDigits = p.paper_number.replace(/^\D+/g, '');
        const parsed = parseInt(extractedDigits, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });

    const nextPaperNum = maxNum > 0 ? maxNum + 1 : 1;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    let targetStream = 'PURE';
    let dayLabel = 'Tuesday';

    if (currentDay === 3 || currentDay === 4 || (currentDay === 5 && currentHour < 24)) {
      targetStream = 'APPLIED';
      dayLabel = 'Friday';
    } else {
      targetStream = 'PURE';
      dayLabel = 'Tuesday';
    }

    return {
      day: dayLabel,
      type: targetStream === 'PURE' ? 'Pure Maths' : 'Applied Maths',
      code: `HQ ${nextPaperNum}`
    };
  }, [dbMarks, pastPapers, activePaper]);

  const unifiedHistoryData = useMemo(() => {
    const processed = dbMarks.map((item) => {
      const paperDigits = item.paper_number?.replace(/^\D+/g, '') || '1';
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
            trendArrow = '↑'; trendText = `+${diff}%`; isPositive = true;
          } else if (diff < 0) {
            trendArrow = '↓'; trendText = `${diff}%`; isPositive = false;
          } else {
            trendArrow = '→'; trendText = '0%'; isPositive = true;
          }
          break;
        }
      }
      return { ...item, trendArrow, trendText, isPositive };
    });

    if (subjectFilter === 'PURE') sortedData = sortedData.filter(p => p.type === 'Pure Maths');
    if (subjectFilter === 'APPLIED') sortedData = sortedData.filter(p => p.type === 'Applied Maths');
    if (rangeFilter === '5') sortedData = sortedData.slice(-5);

    return sortedData;
  }, [dbMarks, subjectFilter, rangeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 w-full">
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {greetingMessage}, {student?.name || 'Student'}! 🎓
            </h1>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">HQ-Oversight Control Module</p>
          </div>

          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Performance Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('weekly')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'weekly' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              🗓️ Live Exam Window
            </button>
            <button 
              onClick={() => setActiveTab('past-papers')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'past-papers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              📚 Past Papers Archive
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-400">🔄 Syncing scores...</div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Progression Vector Analytics</h3>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                        <button onClick={() => setSubjectFilter('ALL')} className={`px-2.5 py-1 rounded-md cursor-pointer ${subjectFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>All</button>
                        <button onClick={() => setSubjectFilter('PURE')} className={`px-2.5 py-1 rounded-md cursor-pointer ${subjectFilter === 'PURE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}>Pure</button>
                        <button onClick={() => setSubjectFilter('APPLIED')} className={`px-2.5 py-1 rounded-md cursor-pointer ${subjectFilter === 'APPLIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'}`}>Applied</button>
                      </div>
                    </div>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={unifiedHistoryData.filter(i => i.marks !== null)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="id" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="marks" stroke="#2563eb" fillOpacity={0.1} fill="#2563eb" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase">
                          <th className="px-5 py-3">Reference</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3">Score</th>
                          <th className="px-5 py-3">Delta Growth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                        {[...unifiedHistoryData].reverse().slice(0, visibleRows).map((paper) => (
                          <tr key={paper.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 font-black text-slate-900">{paper.name}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${paper.type === 'Pure Maths' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{paper.type}</span>
                            </td>
                            <td className="px-5 py-3.5 font-black">{paper.marks}%</td>
                            <td className="px-5 py-3.5">
                              {paper.trendText ? (
                                <span className={`px-1.5 py-0.5 rounded ${paper.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{paper.trendArrow} {paper.trendText}</span>
                              ) : <span className="text-slate-400 italic">Baseline Entry</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                  🔴 Synchronized Live Window
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">Active Examination Gate</h3>
              </div>

              {loadingExams ? (
                <div className="text-center font-bold text-slate-500 py-8">Synchronizing portal metrics...</div>
              ) : errorMsg ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-sm font-black text-slate-700">🔒 System locked. {errorMsg}</p>
                  <p className="text-xs text-blue-600 font-bold bg-blue-50/60 inline-block px-4 py-1.5 rounded-lg border border-blue-100">
                    💡 The next exam will be available on <span className="underline">{nextExamPrediction.day}</span>: <span className="font-black font-mono">{nextExamPrediction.code}</span> ({nextExamPrediction.type})
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium block pt-1">Please report to the portal according to your class time-frame parameters (9:00 PM - 12:00 AM strictly).</p>
                </div>
              ) : activePaper ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">{activePaper.paper_type}</span>
                      <h4 className="text-md font-bold text-slate-900 mt-2">{activePaper.paper_number}: {activePaper.title}</h4>
                    </div>
                    <button onClick={() => handleDownloadPaper(activePaper.id, activePaper.title)} className="mt-4 w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-lg cursor-pointer">📥 Download Question Sheet</button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <form onSubmit={(e) => handleAnswerUploadSubmit(e, activePaper.id)} className="space-y-3">
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-white text-center relative">
                        <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        <p className="text-xs font-bold text-slate-600">{selectedFile ? `📄 ${selectedFile.name}` : 'Select answer sheet PDF'}</p>
                      </div>
                      <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer">🚀 Transmit Answer Sheet</button>

                      {uploadStatus.message && (
                        <div className={`mt-2 p-3 rounded-lg text-[11px] font-bold border ${
                          uploadStatus.success === true ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                          uploadStatus.success === false ? 'bg-rose-50 text-rose-900 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {uploadStatus.message}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm font-bold text-slate-500">No open streams recorded.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'past-papers' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Concluded Archive Library</h3>
              <p className="text-xs font-medium text-slate-400">Review historical compilations. Marking schemes require active completion status signatures.</p>
            </div>

            {loadingExams ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">🔄 Loading full past papers compilation index...</div>
            ) : pastPapers.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50/50">📚 No past archives recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 uppercase">
                      <th className="px-5 py-3">Module Code</th>
                      <th className="px-5 py-3">Paper Title</th>
                      <th className="px-5 py-3">Stream</th>
                      <th className="px-5 py-3 text-right">Resource Downloads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                    {pastPapers.map((paper) => (
                      <tr key={paper.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-black text-slate-900">{paper.paper_number}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">{paper.title}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${paper.paper_type === 'Pure Maths' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{paper.paper_type}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button onClick={() => handleDownloadPaper(paper.id, paper.title)} className="px-2.5 py-1.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-md cursor-pointer">📄 Questions</button>
                          <button onClick={() => handleDownloadScheme(paper.id, paper.title)} className="px-2.5 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md cursor-pointer">🔑 Scheme</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}