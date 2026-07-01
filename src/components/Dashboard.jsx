import React, { useState, useMemo, useEffect, useReducer, useCallback } from 'react';
import api from '../config/api';
import AnalyticsChart from './AnalyticsChart';
import PerformanceTable from './PerformanceTable';
import LiveExamWindow from './LiveExamWindow';

const STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR'
};

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return { ...state, status: STATUS.LOADING, errorMsg: '' };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        status: STATUS.READY,
        pastPapers: action.payload.pastPapers,
        dbMarks: action.payload.dbMarks,
        errorMsg: ''
      };
    case 'FETCH_FAILURE':
      return { ...state, status: STATUS.ERROR, errorMsg: action.payload };
    case 'UPDATE_PAST_PAPERS':
      return { ...state, pastPapers: action.payload };
    case 'UPDATE_LIVE_PAPER':
      return { ...state, activePaper: action.payload };
    default:
      return state;
    }
};

const INITIAL_STATE = {
  status: STATUS.IDLE,
  pastPapers: [],
  dbMarks: [],
  activePaper: null,
  errorMsg: ''
};

export default function Dashboard({ student }) {
  const isAdmin = !student || student.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'upload_papers' : 'analytics');
  
  const [state, dispatch] = useReducer(dashboardReducer, INITIAL_STATE);
  const { status, pastPapers, dbMarks, activePaper, errorMsg } = state;

  const [loadingExams, setLoadingExams] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [gradebook, setGradebook] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [rangeFilter, setRangeFilter] = useState('ALL');
  const [visibleRows, setVisibleRows] = useState(5);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterPaper, setFilterPaper] = useState('');

  const [paperNumber, setPaperNumber] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [paperType, setPaperType] = useState('Pure Maths');
  const [qFile, setQFile] = useState(null);
  const [mFile, setMFile] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [assignedMark, setAssignedMark] = useState('');
  const [feedbackFile, setFeedbackFile] = useState(null);

  const [countdownString, setCountdownString] = useState('');
  const [localSecondsLeft, setLocalSecondsLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getDeviceHeaders = useCallback(() => {
    const token = localStorage.getItem('device_token') || '';
    return { 'X-Device-Token': token };
  }, []);

  const showNotification = useCallback((msg, errorStatus = false) => {
    setMessage(msg);
    setIsError(errorStatus);
    setShowToast(true);
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const toastTimer = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(toastTimer);
  }, [showToast]);

  const loadCoreMetrics = useCallback(async () => {
    dispatch({ type: 'FETCH_INIT' });
    try {
      const pastPapersPromise = api.get('/api/marks/past-papers');
      const studentMarksPromise = (!isAdmin && student?.id)
        ? api.get(`/api/marks/student/${student.id}`)
        : Promise.resolve({ data: [] });

      const [pastResults, marksResults] = await Promise.allSettled([
        pastPapersPromise,
        studentMarksPromise
      ]);

      let directPapers = [];
      let directMarks = [];

      if (pastResults.status === 'fulfilled' && pastResults.value?.data) {
        directPapers = pastResults.value.data;
      }

      if (marksResults.status === 'fulfilled' && marksResults.value?.data) {
        directMarks = marksResults.value.data;
      }

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: { pastPapers: directPapers, dbMarks: directMarks }
      });
    } catch (err) {
      dispatch({ type: 'FETCH_FAILURE', payload: 'Could not resolve backend arrays.' });
    }
  }, [student?.id, isAdmin]);

  useEffect(() => {
    loadCoreMetrics();
  }, [loadCoreMetrics]);

  useEffect(() => {
    const fetchTabSpecificData = async () => {
      setLoadingExams(true);
      try {
        if (!isAdmin) {
          if (activeTab === 'weekly') {
            setQFile(null);
            try {
              const activeRes = await api.get('/api/exams/live-session', { headers: getDeviceHeaders() });
              dispatch({ type: 'UPDATE_LIVE_PAPER', payload: activeRes.data });
            } catch (err) {
              dispatch({ type: 'UPDATE_LIVE_PAPER', payload: null });
            }
          }
        } else {
          if (activeTab === 'submissions') {
            const res = await api.get('/api/marks/admin/pending-submissions');
            setPendingSubmissions(res.data);
          }
          if (activeTab === 'view_marks') {
            const res = await api.get('/api/marks/admin/gradebook');
            setGradebook(res.data);
          }
        }
      } catch (err) {
        console.error("Tab Synchronization Fault:", err);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchTabSpecificData();
  }, [activeTab, isAdmin, getDeviceHeaders]);

  const handleAdminUploadSubmit = async (e, mode) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("paper_number", paperNumber);
    formData.append("title", paperTitle);
    formData.append("paper_type", paperType);
    if (mode === 'paper' && qFile) formData.append("question_file", qFile);
    if (mode === 'scheme' && mFile) formData.append("marking_scheme_file", mFile);

    try {
      await api.post('/api/marks/admin/upload-exam', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification("Assets successfully processed and committed!", false);
      setPaperNumber(''); setPaperTitle(''); setQFile(null); setMFile(null);
      const pastRes = await api.get('/api/marks/past-papers');
      dispatch({ type: 'UPDATE_PAST_PAPERS', payload: pastRes.data || [] });
    } catch (err) {
      showNotification("Asset upload failed.", true);
    }
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission || !feedbackFile) return;

    const formData = new FormData();
    formData.append("student_id", selectedSubmission.student_id);
    formData.append("exam_id", selectedSubmission.exam_id);
    formData.append("marks", assignedMark);
    formData.append("feedback_file", feedbackFile);

    try {
      await api.post('/api/marks/admin/submit-evaluation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showNotification("Evaluation scores successfully processed and committed!", false);
      
      setSelectedSubmission(null);
      setAssignedMark('');
      setFeedbackFile(null);
      
      const pendingRes = await api.get('/api/marks/admin/pending-submissions');
      setPendingSubmissions(pendingRes.data || []);
    } catch (err) {
      showNotification("Failed to save evaluation matrix data.", true);
    }
  };

  const handleDownloadPaper = async (examId, title) => {
    try {
      showNotification(`Initializing download for ${title}...`, false);
      const response = await api.get(`/api/exams/stream-paper/${examId}?file_type=paper`, { responseType: 'blob' });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `${title}_Questions.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      showNotification('❌ Unable to download target resource.', true);
    }
  };

  const handleDownloadStudentScript = async (filename) => {
    try {
      const response = await api.get(`/api/marks/admin/download-submission/${filename}`, {
        responseType: 'blob'
      });
      
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      downloadAnchor.parentNode.removeChild(downloadAnchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      showNotification("Failed to retrieve the answer file asset.", true);
    }
  };

  const handleDownloadScheme = async (examId, title) => {
    try {
      showNotification(`Extracting marking matrix for ${title}...`, false);
      const response = await api.get(`/api/exams/stream-paper/${examId}?file_type=scheme`, { responseType: 'blob' });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `${title}_Marking_Scheme.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      showNotification(`🔒 Scheme access trace missing or rejected.`, true);
    }
  };

  const handleAnswerUploadSubmit = async (e, examId) => {
    e.preventDefault();
    if (!qFile) return showNotification('PDF matrix file needed.', true);
    const formPayload = new FormData();
    formPayload.append('file', qFile);
    try {
      await api.post(`/api/exams/submit-live/${examId}`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data', ...getDeviceHeaders() }
      });
      showNotification('🚀 Answer script uploaded successfully!', false);
      setQFile(null);
    } catch (err) {
      showNotification(`❌ Upload Failed: ${err.response?.data?.detail}`, true);
    }
  };

  const nextExamPrediction = useMemo(() => {
    let maxNum = 0;
    const combinedList = [...pastPapers];
    if (activePaper && activePaper.is_live && activePaper.exam) combinedList.push(activePaper.exam);
    combinedList.forEach(p => {
      if (p.paper_number) {
        const extractedDigits = p.paper_number.replace(/^\D+/g, '');
        const parsed = parseInt(extractedDigits, 10);
        if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
      }
    });
    return { code: `HQ ${maxNum + 1}` };
  }, [pastPapers, activePaper]);

  useEffect(() => {
    if (activePaper && typeof activePaper.seconds_remaining === 'number') {
      setLocalSecondsLeft(activePaper.seconds_remaining);
    }
  }, [activePaper]);

  useEffect(() => {
    if (isAdmin) return;

    const updateSystemClock = () => {
      if (status !== STATUS.READY || !activePaper) {
        setCountdownString("Synchronizing global calendar matrices...");
        return;
      }

      const isLiveSession = activePaper.is_live;
      const currentPaperCode = activePaper.target_paper_code || nextExamPrediction.code;

      setLocalSecondsLeft((prevSeconds) => {
        const currentSeconds = prevSeconds - 1;
        
        if (currentSeconds <= 0) {
          if (isLiveSession) {
            setCountdownString("⏱️ TIME EXPIRED: Live transmission gateway closed.");
          } else {
            setCountdownString("⏳ Window boundary reached. Refreshing session view...");
          }
          return 0;
        }

        const days = String(Math.floor(currentSeconds / (3600 * 24))).padStart(2, '0');
        const hours = String(Math.floor((currentSeconds % (3600 * 24)) / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((currentSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(currentSeconds % 60).padStart(2, '0');

        if (isLiveSession) {
          setCountdownString(`You have only ${hours}:${minutes}:${seconds} remaining`);
        } else {
          setCountdownString(`${currentPaperCode} will be enabled after ${days}d : ${hours}h : ${minutes}m : ${seconds}s`);
        }

        return currentSeconds;
      });
    };

    const clockInterval = setInterval(updateSystemClock, 1000);
    return () => clearInterval(clockInterval);
  }, [activePaper, nextExamPrediction, isAdmin, status]);

  const greetingMessage = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

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
      let trendArrow = null; let trendText = '';
      for (let i = index - 1; i >= 0; i--) {
        if (sortedData[i].type === item.type) {
          const diff = item.marks - sortedData[i].marks;
          if (diff > 0) { trendArrow = '↑'; trendText = `+${diff}%`; }
          else if (diff < 0) { trendArrow = '↓'; trendText = `${diff}%`; }
          else { trendArrow = '→'; trendText = '0%'; }
          break;
        }
      }
      return { ...item, trendArrow, trendText };
    });

    if (subjectFilter === 'PURE') sortedData = sortedData.filter(p => p.type === 'Pure Maths');
    if (subjectFilter === 'APPLIED') sortedData = sortedData.filter(p => p.type === 'Applied Maths');
    if (rangeFilter === '5') sortedData = sortedData.slice(-5);
    return sortedData;
  }, [dbMarks, subjectFilter, rangeFilter]);

  const filteredGradebook = gradebook.filter(record => {
    const matchStudent = record.student_name.toLowerCase().includes(filterStudent.toLowerCase());
    const matchPaper = record.paper_number.toLowerCase().includes(filterPaper.toLowerCase()) || 
                       record.paper_title.toLowerCase().includes(filterPaper.toLowerCase());
    return matchStudent && matchPaper;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 w-full font-sans antialiased relative overflow-hidden">
      <div className={`fixed top-6 right-6 z-50 transform transition-all duration-300 max-w-sm w-full ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
        <div className={`p-4 rounded-lg shadow-2xl border flex items-start gap-3 ${isError ? 'bg-red-50 border-red-200 text-red-950' : 'bg-[#EBF7EE] border-[#1BA94C] text-[#194D26]'}`}>
          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white ${isError ? 'bg-red-600' : 'bg-[#1BA94C]'}`}>{isError ? '!' : '✓'}</div>
          <div className="flex-1 space-y-0.5">
            <h4 className={`text-xs font-black tracking-wider uppercase ${isError ? 'text-red-800' : 'text-[#1AA148]'}`}>{isError ? 'System Error' : 'Success'}</h4>
            <p className="text-xs font-bold leading-relaxed opacity-95">{message}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-slate-400 text-xs cursor-pointer">✕</button>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? `Control Desk Matrix 🛠️` : `${greetingMessage}, ${student?.name || 'Student'}! 🎓`}
            </h1>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">
              {isAdmin ? "ADMIN CONTROL CENTER" : "HQ-OVERSIGHT CONTROL MODULE"}
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
            {isAdmin ? (
              <>
                <button onClick={() => setActiveTab('upload_papers')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'upload_papers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>1. Upload Papers</button>
                <button onClick={() => setActiveTab('upload_schemes')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'upload_schemes' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>2. Upload Schemes</button>
                <button onClick={() => setActiveTab('submissions')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'submissions' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>3. Submissions Queue</button>
                <button onClick={() => setActiveTab('view_marks')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'view_marks' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>4. View Marks Table</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>Performance Dashboard</button>
                <button onClick={() => setActiveTab('weekly')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'weekly' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>🗓️ Live Exam Window</button>
                <button onClick={() => setActiveTab('past-papers')} className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${activeTab === 'past-papers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>📚 Past Papers Archive</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {isAdmin ? (
          <div className="space-y-6">
            {activeTab === 'upload_papers' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-2xl mx-auto">
                <h3 className="text-lg font-black text-slate-900 mb-1">📄 Deploy Target Question Repository</h3>
                <form onSubmit={(e) => handleAdminUploadSubmit(e, 'paper')} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Paper Code</label>
                      <input type="text" placeholder="e.g. HQ 1" value={paperNumber} onChange={e => setPaperNumber(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Core Paper Title</label>
                      <input type="text" placeholder="e.g. Pure Vectors Complex Equation" value={paperTitle} onChange={e => setPaperTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Classification Category</label>
                    <select value={paperType} onChange={e => setPaperType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none">
                      <option>Pure Maths</option>
                      <option>Applied Maths</option>
                    </select>
                  </div>
                  <div className="border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center">
                    <label className="block text-xs font-bold text-slate-600 cursor-pointer">
                      📁 Select Question Paper PDF
                      <input type="file" accept=".pdf" onChange={e => setQFile(e.target.files[0])} required className="hidden" />
                      <span className="block text-[11px] text-blue-600 font-mono mt-1">{qFile ? `✔️ Ready: ${qFile.name}` : 'Drop target question sheet'}</span>
                    </label>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors">Commit Question Paper File</button>
                </form>
              </div>
            )}

            {activeTab === 'upload_schemes' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-2xl mx-auto">
                <h3 className="text-lg font-black text-slate-900 mb-1">🔑 Deploy Secure Reference Marking Scheme</h3>
                <form onSubmit={(e) => handleAdminUploadSubmit(e, 'scheme')} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Target Code</label>
                      <input type="text" placeholder="e.g. HQ 1" value={paperNumber} onChange={e => setPaperNumber(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Core Paper Title</label>
                      <input type="text" placeholder="e.g. Pure Vectors Complex Equation Layout" value={paperTitle} onChange={e => setPaperTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                    </div>
                  </div>
                  <div className="border border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 text-center">
                    <label className="block text-xs font-bold text-slate-600 cursor-pointer">
                      🔑 Select Marking Scheme PDF
                      <input type="file" accept=".pdf" onChange={e => setMFile(e.target.files[0])} required className="hidden" />
                      <span className="block text-[11px] text-blue-600 font-mono mt-1">{mFile ? `✔️ Ready: ${mFile.name}` : 'Drop target validation layout'}</span>
                    </label>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors">Commit Marking Scheme File</button>
                </form>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT PANEL: PENDING LIST DIRECTORY */}
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
                        onClick={() => handleDownloadStudentScript(selectedSubmission.filename)}
                        className="w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer block"
                      >
                        📥 Download Student Answer Script
                      </button>

                      <form onSubmit={handleEvaluationSubmit} className="space-y-3 text-xs">
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

                        {/* 📁 Drag & Drop Layout matching Upload Papers tab */}
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
            )}

            {activeTab === 'view_marks' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
                <h3 className="text-md font-black text-slate-900">📊 Global Evaluation Registry Grid Ledger</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <input type="text" placeholder="🔎 Search by student name..." value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none" />
                  <input type="text" placeholder="📄 Search by paper configuration code..." value={filterPaper} onChange={e => setFilterPaper(e.target.value)} className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none" />
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
                        <tr><td colSpan="5" className="text-center py-6 text-slate-400 italic">No evaluated entries found matching parameters.</td></tr>
                      ) : (
                        filteredGradebook.map((record, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-2 font-bold text-slate-900">{record.student_name}</td>
                            <td className="py-2.5 px-2 text-blue-600 font-bold">{record.paper_number}</td>
                            <td className="py-2.5 px-2 text-slate-600">{record.paper_title}</td>
                            <td className="py-2.5 px-2 text-center"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">{record.marks}%</span></td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-400">{record.graded_at}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {status === STATUS.LOADING ? (
                  <div className="bg-white p-12 text-center rounded-2xl text-sm font-bold text-slate-400">🔄 Syncing performance metrics...</div>
                ) : (
                  <>
                    <AnalyticsChart data={unifiedHistoryData} subjectFilter={subjectFilter} setSubjectFilter={setSubjectFilter} />
                    <PerformanceTable data={unifiedHistoryData} visibleRows={visibleRows} />
                  </>
                )}
              </div>
            )}

            {activeTab === 'weekly' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl">
                <LiveExamWindow 
                  activePaper={activePaper?.is_live ? activePaper.exam : null} 
                  countdownString={countdownString} 
                  loadingExams={loadingExams}
                  qFile={qFile}
                  setQFile={setQFile}
                  handleAnswerUploadSubmit={handleAnswerUploadSubmit}
                  handleDownloadPaper={handleDownloadPaper}
                />
              </div>
            )}

            {activeTab === 'past-papers' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-md font-black text-slate-900">📚 Released Archive Matrix</h3>
                  <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-2 py-1 rounded-md font-bold">COUNT: {pastPapers.length} PAPERS</span>
                </div>
                {pastPapers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl">Archival database maps empty.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pastPapers.map((paper) => (
                      <div key={paper.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/50 px-2 transition-colors rounded-xl">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono uppercase">{paper.paper_number}</span>
                            <h4 className="text-xs font-black text-slate-800 tracking-tight">{paper.title}</h4>
                            {paper.marks !== null && (
                              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded ml-1">Score: {paper.marks}%</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{paper.paper_type || 'Unclassified'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownloadPaper(paper.id, paper.title)} className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-colors">📥 Questions</button>
                          
                          {paper.scheme_available ? (
                            <button onClick={() => handleDownloadScheme(paper.id, paper.title)} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-colors">🔑 Scheme</button>
                          ) : (
                            <button disabled className="bg-slate-100 text-slate-300 px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-not-allowed">🔒 Locked</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}