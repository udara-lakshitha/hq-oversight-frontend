import React, { useState, useMemo, useEffect, useReducer, useCallback, useRef } from 'react';
import api from '../config/api';
import AnalyticsChart from './AnalyticsChart';
import PerformanceTable from './PerformanceTable';
import LiveExamWindow from './LiveExamWindow';

import AdminUploadPaper from './AdminUploadPaper';
import AdminUploadScheme from './AdminUploadScheme';
import AdminSubmissionsQueue from './AdminSubmissionsQueue';
import AdminGradebookRegistry from './AdminGradebookRegistry';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const qFileInputRef = useRef(null);
  const mFileInputRef = useRef(null);

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
      
      setPaperNumber(''); 
      setPaperTitle(''); 
      setQFile(null); 
      setMFile(null);

      if (qFileInputRef.current) qFileInputRef.current.value = "";
      if (mFileInputRef.current) mFileInputRef.current.value = "";

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

  const handleUserLogoutClean = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
    } catch (error) {
      console.error("Backend session teardown failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user_role");
      window.location.href = "/login";
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

        const hours = String(Math.floor((currentSeconds % (3600 * 24)) / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((currentSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(currentSeconds % 60).padStart(2, '0');

        if (isLiveSession) {
          setCountdownString(`You have only ${hours}:${minutes}:${seconds} remaining`);
        } else {
          const days = String(Math.floor(currentSeconds / (3600 * 24))).padStart(2, '0');
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
      const numericId = parseInt(paperDigits, 10);
      const isPure = numericId % 2 !== 0;
      
      return {
        id: item.paper_number,
        numericId: numericId,
        name: `${item.paper_number} Module`,
        type: isPure ? 'Pure Maths' : 'Applied Maths',
        marks: item.marks,
        created_at: item.created_at
      };
    });
    
    let sortedData = processed.sort((a, b) => a.numericId - b.numericId);
    
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

  const filteredGradebook = useMemo(() => {
    return gradebook.filter(record => {
      const matchStudent = record.student_name.toLowerCase().includes(filterStudent.toLowerCase());
      const matchPaper = record.paper_number.toLowerCase().includes(filterPaper.toLowerCase()) || 
                         record.paper_title.toLowerCase().includes(filterPaper.toLowerCase());
      return matchStudent && matchPaper;
    });
  }, [gradebook, filterStudent, filterPaper]);

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
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                {isAdmin ? "ADMIN CONTROL CENTER" : "HQ-OVERSIGHT CONTROL MODULE"}
              </p>
              <span className="text-slate-200 text-xs font-light">|</span>
              <button
                onClick={handleUserLogoutClean}
                className="text-[10px] font-black text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2 py-0.5 rounded-md cursor-pointer transition-all duration-150 flex items-center gap-1 active:scale-95"
              >
                <span>🚪</span>
                <span className="tracking-tight uppercase">Sign Out</span>
              </button>
            </div>
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
              <AdminUploadPaper 
                paperNumber={paperNumber} setPaperNumber={setPaperNumber}
                paperTitle={paperTitle} setPaperTitle={setPaperTitle}
                paperType={paperType} setPaperType={setPaperType}
                qFile={qFile} setQFile={setQFile} qFileInputRef={qFileInputRef}
                onSubmit={handleAdminUploadSubmit}
              />
            )}

            {activeTab === 'upload_schemes' && (
              <AdminUploadScheme 
                paperNumber={paperNumber} setPaperNumber={setPaperNumber}
                paperTitle={paperTitle} setPaperTitle={setPaperTitle}
                mFile={mFile} setMFile={setMFile} mFileInputRef={mFileInputRef}
                onSubmit={handleAdminUploadSubmit}
              />
            )}

            {activeTab === 'submissions' && (
              <AdminSubmissionsQueue 
                pendingSubmissions={pendingSubmissions}
                selectedSubmission={selectedSubmission} setSelectedSubmission={setSelectedSubmission}
                assignedMark={assignedMark} setAssignedMark={setAssignedMark}
                feedbackFile={feedbackFile} setFeedbackFile={setFeedbackFile}
                onDownloadStudentScript={handleDownloadStudentScript}
                onEvaluationSubmit={handleEvaluationSubmit}
              />
            )}

            {activeTab === 'view_marks' && (
              <AdminGradebookRegistry 
                filterStudent={filterStudent} setFilterStudent={setFilterStudent}
                filterPaper={filterPaper} setFilterPaper={setFilterPaper}
                filteredGradebook={filteredGradebook}
              />
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
                  <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-2 py-1 rounded-md font-bold">
                    TOTAL: {pastPapers.length} PAPERS
                  </span>
                </div>
                
                {pastPapers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl">
                    Archival database maps empty.
                  </div>
                ) : (() => {
                  const sortedPapers = [...pastPapers].sort((a, b) => b.id - a.id);
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = sortedPapers.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(sortedPapers.length / itemsPerPage);

                  return (
                    <>
                      <div className="divide-y divide-slate-100">
                        {currentItems.map((paper, index) => {
                          const isMarksAvailable = paper.marks !== null && paper.marks !== undefined;
                          const isLatestPaper = currentPage === 1 && index === 0;

                          return (
                            <div key={paper.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/50 px-2 transition-colors rounded-xl">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono uppercase">
                                    {paper.paper_number}
                                  </span>
                                  <h4 className="text-xs font-black text-slate-800 tracking-tight">
                                    {paper.title}
                                    {isLatestPaper && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase rounded tracking-wider animate-pulse">
                                        Latest Done
                                      </span>
                                    )}
                                  </h4>
                                  {isMarksAvailable && (
                                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded ml-1">
                                      Score: {paper.marks}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {paper.paper_type || 'Unclassified'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {isLatestPaper && (
                                  isMarksAvailable ? (
                                    <button 
                                      onClick={() => handleDownloadScheme(paper.id, paper.title)} 
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                                    >
                                      📥 Feedback Sheet
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-lg font-medium">
                                      Feedback Pending
                                    </span>
                                  )
                                )}

                                <button 
                                  onClick={() => handleDownloadPaper(paper.id, paper.title)} 
                                  className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                                >
                                  📄 Questions
                                </button>
                                
                                {isMarksAvailable ? (
                                  <button 
                                    onClick={() => handleDownloadScheme(paper.id, paper.title)} 
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                                  >
                                    🔑 Scheme
                                  </button>
                                ) : (
                                  <button 
                                    disabled 
                                    className="bg-slate-100 text-slate-300 px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-not-allowed"
                                  >
                                    🔒 Locked
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
                          <span className="text-slate-400 font-medium">
                            Showing Page <strong className="text-slate-700">{currentPage}</strong> of <strong className="text-slate-700">{totalPages}</strong>
                          </span>
                          <div className="flex gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              ◀ Prev
                            </button>
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              Next ▶
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}